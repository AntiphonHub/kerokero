import { describe, it, expect } from 'vitest';
import { evaluateUserAccess } from '@/lib/auth/access-gate';
import { EstablishmentDocument } from '@/lib/appwrite/establishments';

describe('Access Gate (No Free Tier)', () => {
  it('should redirect to /login when user is not authenticated', () => {
    const decision = evaluateUserAccess({
      isAuthenticated: false,
      establishment: null,
      pathname: '/dashboard',
    });

    expect(decision.allowed).toBe(false);
    expect(decision.redirectTo).toBe('/login');
  });

  it('should redirect to /onboarding/loja when authenticated but has no establishment', () => {
    const decision = evaluateUserAccess({
      isAuthenticated: true,
      establishment: null,
      pathname: '/dashboard',
    });

    expect(decision.allowed).toBe(false);
    expect(decision.redirectTo).toBe('/onboarding/loja');
  });

  it('should redirect to specific step when onboarding is incomplete', () => {
    const estStep2 = {
      $id: 'est_1',
      onboardingStep: 2,
      onboardingCompleted: false,
      subscriptionStatus: 'pending',
    } as unknown as EstablishmentDocument;

    const decision2 = evaluateUserAccess({
      isAuthenticated: true,
      establishment: estStep2,
      pathname: '/dashboard',
    });
    expect(decision2.allowed).toBe(false);
    expect(decision2.redirectTo).toBe('/onboarding/operacao');

    const estStep3 = {
      $id: 'est_1',
      onboardingStep: 3,
      onboardingCompleted: false,
      subscriptionStatus: 'pending',
    } as unknown as EstablishmentDocument;

    const decision3 = evaluateUserAccess({
      isAuthenticated: true,
      establishment: estStep3,
      pathname: '/dashboard',
    });
    expect(decision3.allowed).toBe(false);
    expect(decision3.redirectTo).toBe('/onboarding/subconta');
  });

  it('should redirect to /onboarding/conclusao when onboarding is completed but subscription is not active', () => {
    const estPending = {
      $id: 'est_1',
      onboardingStep: 4,
      onboardingCompleted: true,
      subscriptionStatus: 'pending',
    } as unknown as EstablishmentDocument;

    const decision = evaluateUserAccess({
      isAuthenticated: true,
      establishment: estPending,
      pathname: '/dashboard',
    });

    expect(decision.allowed).toBe(false);
    expect(decision.redirectTo).toBe('/onboarding/conclusao');
  });

  it('should allow access to dashboard only when subscriptionStatus is active', () => {
    const estActive = {
      $id: 'est_1',
      onboardingStep: 4,
      onboardingCompleted: true,
      subscriptionStatus: 'active',
    } as unknown as EstablishmentDocument;

    const decision = evaluateUserAccess({
      isAuthenticated: true,
      establishment: estActive,
      pathname: '/dashboard',
    });

    expect(decision.allowed).toBe(true);
    expect(decision.redirectTo).toBeNull();
  });

  it('should allow onboarding pages when on corresponding onboarding step', () => {
    const estStep1 = {
      $id: 'est_1',
      onboardingStep: 1,
      onboardingCompleted: false,
      subscriptionStatus: 'pending',
    } as unknown as EstablishmentDocument;

    const decision = evaluateUserAccess({
      isAuthenticated: true,
      establishment: estStep1,
      pathname: '/onboarding/loja',
    });

    expect(decision.allowed).toBe(true);
  });

  describe('Free Trial (7 Days) & Paywall Gate', () => {
    const baseDate = 1770000000000; // Mock timestamp
    const futureDate = new Date(baseDate + 7 * 24 * 60 * 60 * 1000).toISOString();
    const pastDate = new Date(baseDate - 1000).toISOString();

    it('should allow access to dashboard during valid trial period', () => {
      const estTrialing = {
        $id: 'est_1',
        onboardingStep: 4,
        onboardingCompleted: true,
        subscriptionStatus: 'trialing',
        trialEndsAt: futureDate,
      } as unknown as EstablishmentDocument;

      const decision = evaluateUserAccess({
        isAuthenticated: true,
        establishment: estTrialing,
        pathname: '/dashboard',
        now: baseDate,
      });

      expect(decision.allowed).toBe(true);
      expect(decision.redirectTo).toBeNull();
    });

    it('should redirect to /onboarding/conclusao when trial is expired and attempting to access dashboard', () => {
      const estExpired = {
        $id: 'est_1',
        onboardingStep: 4,
        onboardingCompleted: true,
        subscriptionStatus: 'trialing',
        trialEndsAt: pastDate,
      } as unknown as EstablishmentDocument;

      const decision = evaluateUserAccess({
        isAuthenticated: true,
        establishment: estExpired,
        pathname: '/dashboard',
        now: baseDate,
      });

      expect(decision.allowed).toBe(false);
      expect(decision.redirectTo).toBe('/onboarding/conclusao');
    });

    it('should allow access to /wallet even when trial has expired', () => {
      const estExpired = {
        $id: 'est_1',
        onboardingStep: 4,
        onboardingCompleted: true,
        subscriptionStatus: 'trialing',
        trialEndsAt: pastDate,
      } as unknown as EstablishmentDocument;

      const decision = evaluateUserAccess({
        isAuthenticated: true,
        establishment: estExpired,
        pathname: '/wallet',
        now: baseDate,
      });

      expect(decision.allowed).toBe(true);
      expect(decision.redirectTo).toBeNull();
    });

    it('should allow access to /wallet even when subscription is pending or overdue', () => {
      const estOverdue = {
        $id: 'est_1',
        onboardingStep: 4,
        onboardingCompleted: true,
        subscriptionStatus: 'overdue',
      } as unknown as EstablishmentDocument;

      const decision = evaluateUserAccess({
        isAuthenticated: true,
        establishment: estOverdue,
        pathname: '/wallet',
        now: baseDate,
      });

      expect(decision.allowed).toBe(true);
      expect(decision.redirectTo).toBeNull();
    });

    it('should redirect /login to /dashboard when user has an active trial', () => {
      const estTrialing = {
        $id: 'est_1',
        onboardingStep: 4,
        onboardingCompleted: true,
        subscriptionStatus: 'trialing',
        trialEndsAt: futureDate,
      } as unknown as EstablishmentDocument;

      const decision = evaluateUserAccess({
        isAuthenticated: true,
        establishment: estTrialing,
        pathname: '/login',
        now: baseDate,
      });

      expect(decision.allowed).toBe(false);
      expect(decision.redirectTo).toBe('/dashboard');
    });
  });
});
