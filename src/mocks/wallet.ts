import type {
  CreateTopUpResponse,
  LedgerPage,
  TopUpPackage,
  Wallet,
} from '@/features/wallet/types';

const USER_ID = '0192f3b0-0000-7000-8000-000000000001';
const WALLET_ID = '0192f3a0-0000-7000-8000-0000000000w1';
const NOW = new Date().toISOString();

export function mockWallet(): Wallet {
  return { userId: USER_ID, balanceCredits: 100, updatedAt: NOW };
}

export function mockLedger(): LedgerPage {
  return {
    items: [
      {
        id: '0192f3a1-0000-7000-8000-000000000001',
        walletId: WALLET_ID,
        type: 'TOPUP',
        amountCredits: 100,
        balanceAfterCredits: 100,
        operationRef: 'TOPUP:0192f3a2-0000-7000-8000-000000000001',
        description: 'Recarga de 100 créditos',
        topUpId: '0192f3a2-0000-7000-8000-000000000001',
        createdAt: NOW,
      },
      {
        id: '0192f3a1-0000-7000-8000-000000000002',
        walletId: WALLET_ID,
        type: 'DEBIT',
        amountCredits: 20,
        balanceAfterCredits: 80,
        operationRef: 'DEBIT:0192f3a3-0000-7000-8000-000000000001',
        description: 'Inscripción a Taller de SAGA',
        registrationId: '0192f3a3-0000-7000-8000-000000000001',
        createdAt: NOW,
      },
    ],
    nextCursor: null,
  };
}

export function mockCreateTopUp(pkg: TopUpPackage): CreateTopUpResponse {
  const credits = pkg === 'CREDITS_20' ? 20 : pkg === 'CREDITS_50' ? 50 : 100;
  return {
    topUpId: '0192f3a4-0000-7000-8000-000000000001',
    package: pkg,
    amountCredits: credits,
    currency: 'BOB',
    priceMinor: credits * 75,
    status: 'PENDING',
    checkoutUrl: 'https://pay.bandada.localhost/simulated',
    expiresAt: new Date(Date.now() + 900_000).toISOString(),
  };
}
