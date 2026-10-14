import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useInfiniteList } from '@/hooks/use-infinite-list';
import { apiRequest } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

import type { CreateTopUpResponse, LedgerEntry, LedgerPage, TopUpPackage, Wallet } from './types';

/** UC-16: my credit balance. */
export function useMyWallet() {
  return useQuery({
    queryKey: queryKeys.wallet.me(),
    queryFn: () => apiRequest<Wallet>('/api/v1/wallet/me'),
  });
}

/** UC-16: paginated ledger (movements). */
export function useLedger() {
  return useInfiniteList<LedgerEntry>({
    queryKey: queryKeys.wallet.entries(),
    fetchPage: (cursor) =>
      apiRequest<LedgerPage>('/api/v1/wallet/me/entries', { query: { cursor, limit: 20 } }),
    getId: (item) => item.id,
  });
}

/** UC-15: start a top-up (♻️): returns the (simulated) checkout URL. */
export function useCreateTopUp() {
  return useMutation<CreateTopUpResponse, Error, { package: TopUpPackage; idempotencyKey: string }>({
    mutationFn: ({ package: pkg, idempotencyKey }) =>
      apiRequest<CreateTopUpResponse>('/api/v1/wallet/topups', {
        method: 'POST',
        body: { package: pkg },
        idempotencyKey,
      }),
  });
}

/** UC-15 dev substitute: confirm the simulated payment. */
export function useSimulatePayment() {
  const client = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (topUpId) =>
      apiRequest<void>(`/api/v1/wallet/topups/${topUpId}/simulate-payment`, { method: 'POST' }),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.wallet.root() }),
  });
}
