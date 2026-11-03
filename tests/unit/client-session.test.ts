import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateParticipantToken,
  verifyParticipantToken,
  PARTICIPANT_COOKIE_NAME,
} from '@/lib/security/client-session';
import { clientSessionSchema, type ParticipantSessionPayload } from '@/lib/schemas/client-session';

describe('Client Session Schemas (Zod)', () => {
  it('validates a complete valid participant session payload', () => {
    const payload: ParticipantSessionPayload = {
      participantId: 'part_123',
      participantName: 'Carlos',
      sessionId: 'sess_456',
      tableId: 'tab_789',
      establishmentId: 'est_001',
      createdAt: 1700000000000,
    };

    const result = clientSessionSchema.safeParse(payload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.participantName).toBe('Carlos');
      expect(result.data.participantId).toBe('part_123');
    }
  });

  it('rejects payload with missing or empty required fields', () => {
    expect(
      clientSessionSchema.safeParse({
        participantId: '',
        participantName: 'Carlos',
        sessionId: 'sess_456',
        tableId: 'tab_789',
        establishmentId: 'est_001',
        createdAt: 1700000000000,
      }).success
    ).toBe(false);

    expect(
      clientSessionSchema.safeParse({
        participantId: 'part_123',
        participantName: '',
        sessionId: 'sess_456',
        tableId: 'tab_789',
        establishmentId: 'est_001',
        createdAt: 1700000000000,
      }).success
    ).toBe(false);

    expect(
      clientSessionSchema.safeParse({
        participantId: 'part_123',
        participantName: 'Carlos',
        sessionId: '',
        tableId: 'tab_789',
        establishmentId: 'est_001',
        createdAt: 1700000000000,
      }).success
    ).toBe(false);
  });

  it('rejects payload with invalid createdAt', () => {
    expect(
      clientSessionSchema.safeParse({
        participantId: 'part_123',
        participantName: 'Carlos',
        sessionId: 'sess_456',
        tableId: 'tab_789',
        establishmentId: 'est_001',
        createdAt: -100,
      }).success
    ).toBe(false);

    expect(
      clientSessionSchema.safeParse({
        participantId: 'part_123',
        participantName: 'Carlos',
        sessionId: 'sess_456',
        tableId: 'tab_789',
        establishmentId: 'est_001',
        createdAt: 'invalid-date',
      }).success
    ).toBe(false);
  });
});

describe('Client Session Security & Participant Token', () => {
  const samplePayload: ParticipantSessionPayload = {
    participantId: 'part_abc123',
    participantName: 'Carlos Mendes',
    sessionId: 'sess_xyz789',
    tableId: 'tab_555',
    establishmentId: 'est_999',
    createdAt: Date.now(),
  };

  it('exports PARTICIPANT_COOKIE_NAME as kerokero_participant', () => {
    expect(PARTICIPANT_COOKIE_NAME).toBe('kerokero_participant');
  });

  it('generates a signed token and verifies it back successfully', async () => {
    const token = await generateParticipantToken(samplePayload);
    expect(typeof token).toBe('string');
    expect(token).toContain('.');

    const verified = await verifyParticipantToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.participantId).toBe(samplePayload.participantId);
    expect(verified?.participantName).toBe(samplePayload.participantName);
    expect(verified?.sessionId).toBe(samplePayload.sessionId);
    expect(verified?.tableId).toBe(samplePayload.tableId);
    expect(verified?.establishmentId).toBe(samplePayload.establishmentId);
    expect(verified?.createdAt).toBe(samplePayload.createdAt);
  });

  it('auto-populates createdAt if not supplied during token generation', async () => {
    const before = Date.now();
    const token = await generateParticipantToken({
      participantId: 'part_no_created',
      participantName: 'Marina',
      sessionId: 'sess_1',
      tableId: 'tab_1',
      establishmentId: 'est_1',
    });
    const after = Date.now();

    const verified = await verifyParticipantToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.createdAt).toBeGreaterThanOrEqual(before);
    expect(verified?.createdAt).toBeLessThanOrEqual(after);
  });

  it('rejects tampered token where payload was altered', async () => {
    const token = await generateParticipantToken(samplePayload);
    const [payloadPart, signaturePart] = token.split('.');

    // Tamper with payload part (base64 decode, modify, base64 encode)
    const decoded = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf-8'));
    decoded.participantName = 'Hacker';
    const tamperedPayloadPart = Buffer.from(JSON.stringify(decoded)).toString('base64url');
    const tamperedToken = `${tamperedPayloadPart}.${signaturePart}`;

    const verified = await verifyParticipantToken(tamperedToken);
    expect(verified).toBeNull();
  });

  it('rejects tampered token where signature was altered', async () => {
    const token = await generateParticipantToken(samplePayload);
    const [payloadPart, signaturePart] = token.split('.');

    // Invert the last character of the signature
    const tamperedSig = signaturePart.slice(0, -1) + (signaturePart.slice(-1) === 'a' ? 'b' : 'a');
    const tamperedToken = `${payloadPart}.${tamperedSig}`;

    const verified = await verifyParticipantToken(tamperedToken);
    expect(verified).toBeNull();
  });

  it('rejects malformed tokens', async () => {
    expect(await verifyParticipantToken('')).toBeNull();
    expect(await verifyParticipantToken('random-garbage')).toBeNull();
    expect(await verifyParticipantToken('foo.bar.baz')).toBeNull();
    expect(await verifyParticipantToken('invalid.payload')).toBeNull();
  });

  it('rejects expired token', async () => {
    // Token created 2 hours ago
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
    const expiredPayload: ParticipantSessionPayload = {
      ...samplePayload,
      createdAt: twoHoursAgo,
    };
    const token = await generateParticipantToken(expiredPayload);

    // Verify with maxAge of 1 hour (3600000 ms)
    const verified = await verifyParticipantToken(token, 1 * 60 * 60 * 1000);
    expect(verified).toBeNull();

    // Verify with maxAge of 3 hours (should still be valid)
    const valid = await verifyParticipantToken(token, 3 * 60 * 60 * 1000);
    expect(valid).not.toBeNull();
  });

  it('rejects token with createdAt in the far future (clock skew protection)', async () => {
    const farFuture = Date.now() + 10 * 60 * 1000; // 10 minutes ahead
    const futurePayload: ParticipantSessionPayload = {
      ...samplePayload,
      createdAt: farFuture,
    };
    const token = await generateParticipantToken(futurePayload);

    const verified = await verifyParticipantToken(token);
    expect(verified).toBeNull();
  });
});
