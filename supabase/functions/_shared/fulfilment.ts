type FulfilmentContent = {
  title?: string | null;
  keyword?: string | null;
  seo_title?: string | null;
  meta_description?: string | null;
  draft_content?: string | null;
  schema_types?: string[] | null;
  structured_data?: unknown;
};

export type FulfilmentResult = {
  passed: boolean;
  details: string;
};

const FAQ_HEADING_PATTERN = /(^|\n)##\s+(faq|frequently asked questions|common questions)\b/im;
const SOURCES_HEADING_PATTERN = /(^|\n)##\s+(sources|references|citations)\b/im;
const QUESTION_HEADING_PATTERN = /(^|\n)#{2,4}\s+.+\?/gim;
const INTERNAL_LINK_PATTERN = /(?<!!)\[([^\]]+)\]\(([^)]+)\)/g;
const IMAGE_PATTERN = /!\[([^\]]*)\]\(([^)]+)\)/g;
const ABSOLUTE_URL_PATTERN = /^https?:\/\//i;

const normalizeDomain = (domain?: string | null) => {
  if (!domain) return "";

  return domain
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
    .trim();
};

const normalizeText = (value?: string | null) => (value || "").trim();

const countWords = (value?: string | null) => {
  const text = normalizeText(value);
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
};

const getIntroParagraph = (markdown?: string | null) => {
  const lines = (markdown || "").split(/\r?\n/);
  const paragraphLines: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      if (paragraphLines.length > 0) break;
      continue;
    }

    if (line.startsWith("#")) {
      if (paragraphLines.length > 0) break;
      continue;
    }

    if (/^[-*]\s/.test(line) || /^>/.test(line)) {
      if (paragraphLines.length > 0) break;
      continue;
    }

    paragraphLines.push(line);
  }

  return paragraphLines.join(" ").trim();
};

const getInternalLinks = (markdown?: string | null, brandDomain?: string | null) => {
  const content = markdown || "";
  const normalizedDomain = normalizeDomain(brandDomain);
  const matches = content.matchAll(INTERNAL_LINK_PATTERN);
  const urls = new Set<string>();

  for (const match of matches) {
    const url = (match[2] || "").trim();
    if (!url) continue;

    const normalizedUrl = url.toLowerCase();
    const isRelative = normalizedUrl.startsWith("/") && !normalizedUrl.startsWith("//");
    const isSameDomain = normalizedDomain ? normalizeDomain(normalizedUrl).includes(normalizedDomain) : false;

    if (isRelative || isSameDomain) {
      urls.add(url);
    }
  }

  return [...urls];
};

const getExternalLinks = (markdown?: string | null, brandDomain?: string | null) => {
  const content = markdown || "";
  const normalizedDomain = normalizeDomain(brandDomain);
  const matches = content.matchAll(INTERNAL_LINK_PATTERN);
  const urls = new Set<string>();

  for (const match of matches) {
    const url = (match[2] || "").trim();
    if (!ABSOLUTE_URL_PATTERN.test(url)) continue;

    const urlDomain = normalizeDomain(url);
    if (normalizedDomain && urlDomain.includes(normalizedDomain)) continue;

    urls.add(url);
  }

  return [...urls];
};

const getImages = (markdown?: string | null) => [...(markdown || "").matchAll(IMAGE_PATTERN)];

const truncate = (value: string, max = 160) => value.length > max ? `${value.slice(0, max - 1)}…` : value;

export const evaluateFulfilment = (
  content: FulfilmentContent,
  brandDomain?: string | null,
): Record<string, FulfilmentResult> => {
  const draft = content.draft_content || "";
  const seoTitle = normalizeText(content.seo_title);
  const metaDescription = normalizeText(content.meta_description);
  const schemaTypes = Array.isArray(content.schema_types) ? content.schema_types.filter(Boolean) : [];
  const wordCount = countWords(draft);
  const introParagraph = getIntroParagraph(draft);
  const introWords = countWords(introParagraph);
  const internalLinks = getInternalLinks(draft, brandDomain);
  const externalLinks = getExternalLinks(draft, brandDomain);
  const images = getImages(draft);
  const questionHeadings = draft.match(QUESTION_HEADING_PATTERN) || [];
  const keywordTokens = (content.keyword || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3);
  const introLower = introParagraph.toLowerCase();
  const introMentionsKeyword = keywordTokens.length === 0 || keywordTokens.some((token) => introLower.includes(token));
  const hasSchema = schemaTypes.length > 0 || Boolean(content.structured_data);
  const hasFaq = FAQ_HEADING_PATTERN.test(draft) || questionHeadings.length >= 4;
  const hasSources = SOURCES_HEADING_PATTERN.test(draft) || externalLinks.length >= 2;
  const hasH1 = /^#\s+.+/m.test(draft);
  const hasDirectAnswer = introWords >= 24 && introWords <= 140 && introMentionsKeyword;
  const allImagesHaveAlt = images.length > 0 && images.every((image) => (image[1] || "").trim().length > 0);

  return {
    "Meta title set": seoTitle
      ? { passed: true, details: `SEO title is saved: \"${truncate(seoTitle, 90)}\".` }
      : { passed: false, details: "SEO title is still empty on the saved content item." },
    "Meta description set": metaDescription
      ? { passed: true, details: "Meta description is saved on the content item." }
      : { passed: false, details: "Meta description is still empty on the saved content item." },
    "Schema markup added": hasSchema
      ? { passed: true, details: `Saved schema types: ${schemaTypes.join(", ") || "structured data present"}.` }
      : { passed: false, details: "No saved schema types or structured data were found." },
    "FAQ section present": hasFaq
      ? {
          passed: true,
          details: FAQ_HEADING_PATTERN.test(draft)
            ? "A saved FAQ heading was found in the article body."
            : `Saved content includes ${questionHeadings.length} question-style headings.`,
        }
      : { passed: false, details: "No saved FAQ section was found in the article body." },
    "Direct answer paragraph": hasDirectAnswer
      ? { passed: true, details: `The saved intro contains a direct answer paragraph (${introWords} words).` }
      : { passed: false, details: "The saved intro does not contain a clear direct-answer paragraph yet." },
    "Internal links added (≥3)": internalLinks.length >= 3
      ? { passed: true, details: `${internalLinks.length} saved internal markdown links were found.` }
      : { passed: false, details: `${internalLinks.length} saved internal markdown links were found; at least 3 are required.` },
    "H1 tag present": hasH1
      ? { passed: true, details: "A saved H1 heading was found at the top of the draft." }
      : { passed: false, details: "No saved H1 heading was found in the draft." },
    "Image alt attributes": allImagesHaveAlt
      ? { passed: true, details: `${images.length} saved image(s) include alt text.` }
      : {
          passed: false,
          details: images.length === 0 ? "No saved images were found in the draft." : "At least one saved image is missing alt text.",
        },
    "Word count ≥ 800": wordCount >= 800
      ? { passed: true, details: `Saved draft word count is ${wordCount}.` }
      : { passed: false, details: `Saved draft word count is ${wordCount}; at least 800 words are required.` },
    "Cited sources present": hasSources
      ? {
          passed: true,
          details: SOURCES_HEADING_PATTERN.test(draft)
            ? "A saved Sources/References section was found."
            : `${externalLinks.length} saved external source links were found.`,
        }
      : { passed: false, details: "No saved source section or enough external citations were found." },
  };
};
