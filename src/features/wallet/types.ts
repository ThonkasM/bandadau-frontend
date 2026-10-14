import type { wallet } from '@bandada/contracts-ts';

/** Wallet types aliased from `@bandada/contracts-ts` (openapi/wallet). */
export type Wallet = wallet.components['schemas']['Wallet'];
export type LedgerEntry = wallet.components['schemas']['LedgerEntry'];
export type LedgerEntryType = LedgerEntry['type'];
export type TopUpPackage = wallet.components['schemas']['TopUpPackage'];
export type CreateTopUpResponse = wallet.components['schemas']['CreateTopUpResponse'];

/** `GET /api/v1/wallet/me/entries` → `{ items, nextCursor }`. */
export type LedgerPage = wallet.components['schemas']['CursorPageMeta'] & {
  items: LedgerEntry[];
};

/** Credit packages (ADR-0016: CREDITS_20/50/100 with their price in minor units). */
export const TOPUP_PACKAGES: ReadonlyArray<{ id: TopUpPackage; credits: number; priceMinor: number }> = [
  { id: 'CREDITS_20', credits: 20, priceMinor: 1500 },
  { id: 'CREDITS_50', credits: 50, priceMinor: 3500 },
  { id: 'CREDITS_100', credits: 100, priceMinor: 6500 },
];
