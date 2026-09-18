interface HighlightedTextProps {
  text: string;
  query: string;
}

/**
 * 검색어와 일치하는 부분만 강조한다. 기존 콘솔은 `v-html`로 태그 문자열에
 * 마크업을 직접 삽입했는데(사용자 입력을 HTML로 해석하는 XSS 지점이었다),
 * 여기서는 문자열을 쪼개 렌더링해 항상 텍스트로만 다룬다.
 */
export function HighlightedText({ text, query }: HighlightedTextProps) {
  if (!query) return <>{text}</>;
  const index = text.indexOf(query);
  if (index === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded bg-orange-200 px-0.5 text-foreground">
        {text.slice(index, index + query.length)}
      </mark>
      {text.slice(index + query.length)}
    </>
  );
}
