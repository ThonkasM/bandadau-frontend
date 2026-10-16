/** Free-space probe (UC-17 §5.3). Platform impls override this file via `.native.ts` / `.web.ts`. */
export async function availableBytes(): Promise<number | null> {
  return null;
}
