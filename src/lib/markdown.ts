const MARKDOWN_LINK_REGEX = /(!?\[[^\]]*\]\()([^)]+)(\))/g;

const sanitizeMarkdownUrl = (url: string) => url.trim().replace(/\s+/g, "");

export const sanitizeMarkdownLinks = (content: string) =>
  content.replace(MARKDOWN_LINK_REGEX, (_match, prefix, url, suffix) => {
    const sanitizedUrl = sanitizeMarkdownUrl(url);
    return `${prefix}${sanitizedUrl}${suffix}`;
  });
