import type { identity } from '@bandada/contracts-ts';

/**
 * Identity types, aliased directly from `@bandada/contracts-ts`
 * (generated from `bandadau-docs/contracts/openapi/identity-service.yaml`).
 */
export type AuthUser = identity.components['schemas']['User'];
export type AuthTokens = identity.components['schemas']['AuthTokens'];
export type LoginRequest = identity.components['schemas']['LoginRequest'];
export type LogoutRequest = identity.components['schemas']['LogoutRequest'];
export type RefreshTokenRequest = identity.components['schemas']['RefreshTokenRequest'];
export type RegisterUserRequest = identity.components['schemas']['RegisterUserRequest'];
export type RegisterUserResponse = identity.components['schemas']['RegisterUserResponse'];
export type VerifyEmailRequest = identity.components['schemas']['VerifyEmailRequest'];
export type ResendVerificationCodeRequest =
  identity.components['schemas']['ResendVerificationCodeRequest'];
export type University = identity.components['schemas']['University'];
export type UniversityPage = identity.components['schemas']['UniversityPage'];
export type UpdatePreferencesRequest = identity.components['schemas']['UpdatePreferencesRequest'];
export type HandoffTargetApp = identity.components['schemas']['HandoffTargetApp'];
export type CreateHandoffCodeRequest = identity.components['schemas']['CreateHandoffCodeRequest'];
export type HandoffCode = identity.components['schemas']['HandoffCode'];
export type ExchangeHandoffCodeRequest = identity.components['schemas']['ExchangeHandoffCodeRequest'];

export { type Role,ROLES } from '@/lib/roles';
