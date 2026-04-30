export function normalizeVietnamese(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

function buildNormalizedIndexMap(text: string) {
  let normalized = "";
  const indexMap: number[] = [];

  for (let index = 0; index < text.length; index += 1) {
    const normalizedChar = normalizeVietnamese(text[index]);
    normalized += normalizedChar;
    for (
      let normalizedIndex = 0;
      normalizedIndex < normalizedChar.length;
      normalizedIndex += 1
    ) {
      indexMap.push(index);
    }
  }

  return { normalized, indexMap };
}

export function findNormalizedMatchRanges(text: string, query: string) {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return [] as Array<{ start: number; end: number }>;
  }

  const { normalized, indexMap } = buildNormalizedIndexMap(text);
  const normalizedQuery = normalizeVietnamese(trimmedQuery);
  if (!normalizedQuery) {
    return [] as Array<{ start: number; end: number }>;
  }

  const ranges: Array<{ start: number; end: number }> = [];
  let searchFrom = 0;

  while (searchFrom < normalized.length) {
    const foundIndex = normalized.indexOf(normalizedQuery, searchFrom);
    if (foundIndex === -1) {
      break;
    }

    const endIndex = foundIndex + normalizedQuery.length - 1;
    const originalStart = indexMap[foundIndex];
    const originalEnd = (indexMap[endIndex] ?? text.length - 1) + 1;
    ranges.push({ start: originalStart, end: originalEnd });
    searchFrom = foundIndex + normalizedQuery.length;
  }

  return ranges;
}

export function includesNormalized(text: string, query: string): boolean {
  if (!query.trim()) {
    return true;
  }

  return findNormalizedMatchRanges(text, query).length > 0;
}
