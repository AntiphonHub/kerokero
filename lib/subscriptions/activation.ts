import 'server-only';
import { createAdminClient } from '@/lib/appwrite/server';
import {
  EstablishmentDocument,
  getEstablishmentBySubscriptionId,
  updateSubscriptionStatus,
} from '@/lib/appwrite/establishments';
import { getAsaasSubscriptionPayments } from '@/lib/asaas/subscriptions';
import { buildSubscriptionWelcomeEmail } from '@/lib/email/subscription-welcome-template';
import { sendTransactionalEmail } from '@/lib/email/send-email';

export interface ActivateSubscriptionOptions {
  preloadedPayments?: Array<{ id: string; status: string; value: number }>;
}

export interface ActivateSubscriptionResult {
  establishment: EstablishmentDocument | null;
  welcomeEmailSent: boolean;
}

// Serializes concurrent activation attempts in the same process (e.g. webhook + polling race).
const inFlightActivations = new Map<string, Promise<ActivateSubscriptionResult>>();

function isSettledAsaasPaymentStatus(status?: string): boolean {
  return status === 'RECEIVED' || status === 'CONFIRMED';
}

async function runActivation(
  subscriptionId: string,
  options?: ActivateSubscriptionOptions,
): Promise<ActivateSubscriptionResult> {
  const existing = await getEstablishmentBySubscriptionId(subscriptionId);
  if (!existing) {
    return { establishment: null, welcomeEmailSent: false };
  }

  const previousStatus = existing.subscriptionStatus;
  const updated = await updateSubscriptionStatus(subscriptionId, 'active');

  // Renewals and duplicate callbacks after activation never re-trigger the first-payment email.
  if (previousStatus === 'active') {
    return { establishment: updated, welcomeEmailSent: false };
  }

  let welcomeEmailSent = false;

  try {
    const { users } = createAdminClient();
    const user = await users.get(existing.userId);
    const prefs = (user.prefs || {}) as Record<string, unknown>;

    if (prefs.firstSubscriptionEmailSentAt) {
      return { establishment: updated, welcomeEmailSent: false };
    }

    // Extra guard against re-sending when an overdue cycle from month 2+ is later paid.
    const payments =
      options?.preloadedPayments ??
      (await getAsaasSubscriptionPayments(subscriptionId).catch(() => []));
    const settledCount = payments.filter((p) =>
      isSettledAsaasPaymentStatus(p.status),
    ).length;

    if (settledCount > 1) {
      return { establishment: updated, welcomeEmailSent: false };
    }

    if (!user.email) {
      return { establishment: updated, welcomeEmailSent: false };
    }

    const { subject, html } = buildSubscriptionWelcomeEmail({
      ownerName: user.name,
      establishmentName: existing.name,
    });

    const emailResult = await sendTransactionalEmail({
      toEmail: user.email,
      subject,
      html,
      idempotencyKey: `welcome-subscription-${subscriptionId}`,
      tags: [{ name: 'category', value: 'subscription_welcome' }],
    });

    if (emailResult.sent) {
      welcomeEmailSent = true;
      await users
        .updatePrefs(user.$id, {
          ...prefs,
          firstSubscriptionEmailSentAt: new Date().toISOString(),
          firstSubscriptionEmailSentSubId: subscriptionId,
        })
        .catch((prefErr) => {
          console.warn(
            '[SubscriptionActivation] E-mail enviado, mas falhou ao persistir marcador em prefs:',
            prefErr,
          );
        });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(
      '[SubscriptionActivation] Falha não bloqueante no envio do e-mail de primeiro pagamento:',
      msg,
    );
  }

  return { establishment: updated, welcomeEmailSent };
}

/**
 * Activates a subscription and sends the celebratory welcome email ONLY on its
 * very first confirmed payment. Subsequent renewals or overdue recoveries skip sending.
 */
export async function activateSubscriptionAndNotify(
  subscriptionId: string,
  options?: ActivateSubscriptionOptions,
): Promise<ActivateSubscriptionResult> {
  const inFlight = inFlightActivations.get(subscriptionId);
  if (inFlight) {
    return inFlight;
  }

  const task = runActivation(subscriptionId, options).finally(() => {
    inFlightActivations.delete(subscriptionId);
  });

  inFlightActivations.set(subscriptionId, task);
  return task;
}
