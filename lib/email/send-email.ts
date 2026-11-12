import 'server-only';

export interface EmailTag {
  name: string;
  value: string;
}

export interface SendTransactionalEmailInput {
  toEmail: string;
  subject: string;
  html: string;
  replyTo?: string;
  idempotencyKey?: string;
  tags?: EmailTag[];
}

export interface SendTransactionalEmailResult {
  sent: boolean;
  provider: 'resend';
  id?: string;
  reason?: string;
}

const DEFAULT_FROM_EMAIL = 'Bempedi <contato@bempedi.com>';
const DEFAULT_REPLY_TO = 'contato@bempedi.com';

export async function sendTransactionalEmail(
  input: SendTransactionalEmailInput,
): Promise<SendTransactionalEmailResult> {
  const resendApiKey = process.env.RESEND_API_KEY?.trim();

  if (!resendApiKey) {
    console.warn(
      '[TransactionalEmail] RESEND_API_KEY não configurada; e-mail transacional ignorado.',
    );
    return {
      sent: false,
      provider: 'resend',
      reason: 'RESEND_API_KEY não configurada',
    };
  }

  const from = process.env.RESEND_FROM_EMAIL?.trim() || DEFAULT_FROM_EMAIL;
  const replyTo = input.replyTo?.trim() || DEFAULT_REPLY_TO;

  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    };

    if (input.idempotencyKey) {
      headers['Idempotency-Key'] = input.idempotencyKey;
    }

    const body: Record<string, unknown> = {
      from,
      to: [input.toEmail],
      reply_to: replyTo,
      subject: input.subject,
      html: input.html,
    };

    if (input.tags?.length) {
      body.tags = input.tags;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error(`[TransactionalEmail] Resend HTTP ${response.status}: ${errorText}`);
      return {
        sent: false,
        provider: 'resend',
        reason: `Resend HTTP ${response.status}`,
      };
    }

    const data = (await response.json().catch(() => ({}))) as { id?: string };
    return {
      sent: true,
      provider: 'resend',
      id: data.id,
    };
  } catch (error) {
    console.error('[TransactionalEmail] Resend falhou:', error);
    return {
      sent: false,
      provider: 'resend',
      reason: error instanceof Error ? error.message : 'Erro desconhecido ao enviar via Resend',
    };
  }
}
