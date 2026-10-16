import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';

import { useInfiniteList } from './use-infinite-list';

type Item = { id: string };
type FetchPage = (
  cursor: string | undefined,
  signal?: AbortSignal,
) => Promise<{ items: Item[]; nextCursor: string | null }>;

function Probe({ fetchPage, queryKey }: { fetchPage: FetchPage; queryKey: string[] }) {
  const list = useInfiniteList<Item>({ queryKey, fetchPage, getId: (i) => i.id });
  return (
    <>
      <Text testID="ids">{list.items.map((i) => i.id).join(',')}</Text>
      <Text testID="has-more">{Number(list.hasMore)}</Text>
      <Text testID="has-error">{Number(list.error)}</Text>
      <Pressable testID="load-more" onPress={list.loadMore} />
    </>
  );
}

function renderProbe(fetchPage: FetchPage, queryKey: string[]) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <Probe fetchPage={fetchPage} queryKey={queryKey} />
    </QueryClientProvider>,
  );
}

describe('useInfiniteList', () => {
  it('loads the first page and forwards the abort signal', async () => {
    const fetchPage = jest.fn(async () => ({ items: [{ id: 'a' }], nextCursor: null }));
    renderProbe(fetchPage, ['t1']);
    await waitFor(() => expect(screen.getByTestId('ids')).toHaveTextContent('a'));
    expect(fetchPage).toHaveBeenCalledWith(undefined, expect.anything());
  });

  it('dedupes items across pages by id', async () => {
    const pages = [
      { items: [{ id: 'a' }, { id: 'b' }], nextCursor: 'c2' },
      { items: [{ id: 'b' }, { id: 'c' }], nextCursor: null },
    ];
    let call = 0;
    const fetchPage = jest.fn(async () => pages[call++] ?? { items: [], nextCursor: null });
    renderProbe(fetchPage, ['t2']);
    await waitFor(() => expect(screen.getByTestId('ids')).toHaveTextContent('a,b'));
    fireEvent.press(screen.getByTestId('load-more'));
    await waitFor(() => expect(screen.getByTestId('ids')).toHaveTextContent('a,b,c'));
  });

  it('reports hasMore from nextCursor', async () => {
    const fetchPage = jest.fn(async () => ({ items: [{ id: 'a' }], nextCursor: 'next' }));
    renderProbe(fetchPage, ['t3']);
    await waitFor(() => expect(screen.getByTestId('has-more')).toHaveTextContent('1'));
  });

  it('surfaces an error only when there are no items', async () => {
    const fetchPage = jest.fn(async () => {
      throw new Error('boom');
    });
    renderProbe(fetchPage, ['t4']);
    await waitFor(() => expect(screen.getByTestId('has-error')).toHaveTextContent('1'));
  });
});
