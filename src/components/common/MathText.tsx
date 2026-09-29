import React, { useEffect, useMemo, useState } from 'react';

type KatexRenderer = typeof import('katex')['default'];
type MathSegment =
  | { value: string; display: boolean; raw: string }
  | { value: string; display?: never; raw?: never };

const DELIMITED_MATH = /(\$\$[\s\S]+?\$\$|\$(?:\\.|[^$\n])+?\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\))/g;

function splitMathSegments(value: string): MathSegment[] {
  const segments: MathSegment[] = [];
  let cursor = 0;

  for (const match of value.matchAll(DELIMITED_MATH)) {
    const token = match[0];
    const start = match.index ?? 0;
    if (start > cursor) segments.push({ value: value.slice(cursor, start) });

    const display = token.startsWith('$$') || token.startsWith('\\[');
    const expression = token.startsWith('$$')
      ? token.slice(2, -2)
      : token.startsWith('\\[')
        ? token.slice(2, -2)
        : token.startsWith('\\(')
          ? token.slice(2, -2)
          : token.slice(1, -1);
    segments.push({ value: expression, display, raw: token });
    cursor = start + token.length;
  }

  if (cursor < value.length) segments.push({ value: value.slice(cursor) });
  return segments.length > 0 ? segments : [{ value }];
}

interface MathTextProps {
  children: string | null | undefined;
  className?: string;
}

/** Renders safe, delimited LaTeX in question text while keeping ordinary text as React text. */
export const MathText: React.FC<MathTextProps> = ({ children, className }) => {
  const source = children ?? '';
  const segments = useMemo(() => splitMathSegments(source), [source]);
  const hasMath = segments.some((segment) => 'display' in segment);
  const [katex, setKatex] = useState<KatexRenderer | null>(null);

  useEffect(() => {
    if (!hasMath || katex) return;
    let active = true;
    void Promise.all([import('katex'), import('katex/dist/katex.min.css')])
      .then(([module]) => {
        if (active) setKatex(() => module.default);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [hasMath, katex]);

  return (
    <span className={className} style={{ whiteSpace: 'pre-wrap' }}>
      {segments.map((segment, index) => {
        if (!('display' in segment) || !katex) {
          return <React.Fragment key={index}>{'display' in segment ? segment.raw : segment.value}</React.Fragment>;
        }

        const html = katex.renderToString(segment.value, {
          displayMode: segment.display,
          throwOnError: false,
          trust: false,
          maxSize: 10,
          maxExpand: 500,
        });
        return (
          <span
            key={index}
            className={segment.display ? 'block overflow-x-auto text-center' : 'inline'}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      })}
    </span>
  );
};
