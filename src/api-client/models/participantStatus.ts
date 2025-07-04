/**
 * Generated by orval v7.10.0 🍺
 * Do not edit manually.
 * Meetball API
 * API for Meetball - The Summeet's event networking platform
 * OpenAPI spec version: 0.1.0
 */

export type ParticipantStatus = typeof ParticipantStatus[keyof typeof ParticipantStatus];


// eslint-disable-next-line @typescript-eslint/no-redeclare
export const ParticipantStatus = {
  want_to_join: 'want_to_join',
  invited: 'invited',
  confirmed: 'confirmed',
  declined: 'declined',
  waitlisted: 'waitlisted',
} as const;
