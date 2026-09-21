const LOGOS: Record<string, string> = {
  claude: "/logos/claude.svg",
  chatgpt: "/logos/chatgpt.svg",
  codex: "/logos/codex.svg",
  cursor: "/logos/cursor.svg",
  devin: "/logos/devin.ico",
  perplexity: "/logos/perplexity.svg",
  gemini: "/logos/gemini.svg",
  "notion-ai": "/logos/notion-ai.svg",
  midjourney: "/logos/midjourney.png",
  jasper: "/logos/jasper.png",
  runway: "/logos/runway.png",
  pollo: "/logos/pollo.png",
};

export function toolLogo(slug?: string | null): string | undefined {
  return slug ? LOGOS[slug] : undefined;
}
