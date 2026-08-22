import type { ReactNode } from "react";

// [Texto](url) -> botón; URL suelta -> enlace subrayado. Sirve para cualquier
// body de lección que incluya un enlace, sin tener que tocar el modelo de datos.
const LINK_REGEX = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s]+)/g;

export function LinkifiedText({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  const regex = new RegExp(LINK_REGEX);
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(<span key={key++}>{text.slice(lastIndex, match.index)}</span>);
    }

    if (match[1] && match[2]) {
      nodes.push(
        <a
          key={key++}
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded-full bg-brand-primary px-4 py-1.5 text-sm font-medium text-white no-underline hover:opacity-90"
        >
          {match[1]}
        </a>,
      );
    } else if (match[3]) {
      nodes.push(
        <a
          key={key++}
          href={match[3]}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-brand-primary underline"
        >
          {match[3]}
        </a>,
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(<span key={key++}>{text.slice(lastIndex)}</span>);
  }

  return <p className="whitespace-pre-wrap text-foreground/70">{nodes}</p>;
}
