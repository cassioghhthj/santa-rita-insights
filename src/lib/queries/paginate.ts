export const PAGE_SIZE = 1000;

/**
 * PostgREST returns at most ~1000 rows per request. This helper keeps issuing
 * `.range()` requests until a short page comes back, so aggregations always run
 * over the full result set.
 */
export async function fetchAllPages<T>(
  build: (fromIdx: number, toIdx: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
  maxRows = 200000,
): Promise<T[]> {
  const out: T[] = [];
  for (let start = 0; start < maxRows; start += PAGE_SIZE) {
    const { data, error } = await build(start, start + PAGE_SIZE - 1);
    if (error) throw error;
    const rows = data ?? [];
    out.push(...rows);
    if (rows.length < PAGE_SIZE) break;
  }
  return out;
}
