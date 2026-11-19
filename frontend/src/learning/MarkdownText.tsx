import { Fragment } from 'react';

/** Lightweight safe formatter supporting **bold**, *italic*, `code`, ==highlight==, and \n line breaks. */
export function MarkdownText({ text, className }: { text: string; className?: string }) {
  const lines = text.split('\n');
  return (
    <div className={className}>
      {lines.map((line, i) => (
        <p key={i} className={i > 0 ? 'mt-2' : undefined}>
          {renderInline(line)}
        </p>
      ))}
    </div>
  );
}

function renderInline(line: string) {
  const tokenRe = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|==[^=]+==)/g;
  const parts = line.split(tokenRe);
  return parts.map((p, idx) => {
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={idx} className="font-bold text-ink">{p.slice(2, -2)}</strong>;
    if (p.startsWith('*') && p.endsWith('*')) return <em key={idx} className="italic text-ink/90">{p.slice(1, -1)}</em>;
    if (p.startsWith('`') && p.endsWith('`')) {
      return (
        <code key={idx} className="rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[0.88em] text-cyan">
          {p.slice(1, -1)}
        </code>
      );
    }
    if (p.startsWith('==') && p.endsWith('==')) {
      return (
        <mark key={idx} className="rounded bg-cyan/20 px-1 text-ink">
          {p.slice(2, -2)}
        </mark>
      );
    }
    return <Fragment key={idx}>{p}</Fragment>;
  });
}
