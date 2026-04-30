import type { ReactNode } from "react";
import { findNormalizedMatchRanges } from "../lib/searchUtils";

interface HighlightTextProps {
  text: string;
  query: string;
}

export function HighlightText({ text, query }: HighlightTextProps) {
  const ranges = findNormalizedMatchRanges(text, query);
  if (ranges.length === 0) {
    return <>{text}</>;
  }

  const result: ReactNode[] = [];
  let lastIndex = 0;

  ranges.forEach((range, index) => {
    if (range.start > lastIndex) {
      result.push(text.slice(lastIndex, range.start));
    }

    result.push(
      <mark
        key={`${range.start}-${range.end}-${index}`}
        className="bg-yellow-200 text-gray-900 rounded-sm px-0.5 dark:bg-yellow-800/70 dark:text-slate-50"
      >
        {text.slice(range.start, range.end)}
      </mark>,
    );

    lastIndex = range.end;
  });

  if (lastIndex < text.length) {
    result.push(text.slice(lastIndex));
  }

  return <>{result}</>;
}
