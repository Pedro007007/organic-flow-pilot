import ReactMarkdown from "react-markdown";
import { Badge } from "@/components/ui/badge";

interface ContentPreviewProps {
  title: string;
  seoTitle: string;
  metaDescription: string;
  author: string;
  keyword: string;
  heroImageUrl?: string | null;
  draftContent: string;
  updatedAt?: string;
}

const ContentPreview = ({
  title,
  seoTitle,
  metaDescription,
  author,
  keyword,
  heroImageUrl,
  draftContent,
  updatedAt,
}: ContentPreviewProps) => {
  const displayTitle = seoTitle || title;
  const date = updatedAt ? new Date(updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "";

  return (
    <article className="max-w-3xl mx-auto bg-card rounded-xl border border-border overflow-hidden">
      {/* Hero image */}
      {heroImageUrl && (
        <div className="w-full aspect-video overflow-hidden">
          <img
            src={heroImageUrl}
            alt={displayTitle}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Article header */}
      <div className="px-8 pt-8 pb-4 space-y-4">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-semibold">
            {keyword}
          </Badge>
          {date && <span>{date}</span>}
          <span>·</span>
          <span>By {author}</span>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
          {displayTitle}
        </h1>

        {metaDescription && (
          <p className="text-base text-muted-foreground leading-relaxed italic border-l-2 border-primary/30 pl-4">
            {metaDescription}
          </p>
        )}

        <hr className="border-border" />
      </div>

      {/* Article body */}
      <div className="px-8 pb-10 prose prose-sm md:prose-base dark:prose-invert max-w-none
        prose-headings:text-foreground prose-headings:font-bold prose-headings:mt-8 prose-headings:mb-3
        prose-h2:text-xl prose-h2:border-b prose-h2:border-border/50 prose-h2:pb-2
        prose-h3:text-lg
        prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-4
        prose-strong:text-foreground prose-strong:font-semibold
        prose-ul:text-muted-foreground prose-ul:space-y-1
        prose-ol:text-muted-foreground prose-ol:space-y-1
        prose-li:leading-relaxed
        prose-a:text-primary prose-a:no-underline hover:prose-a:underline
        prose-blockquote:border-primary/30 prose-blockquote:text-muted-foreground prose-blockquote:italic
        prose-code:text-primary prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
        prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-lg
        prose-img:rounded-lg prose-img:border prose-img:border-border prose-img:shadow-sm
        prose-hr:border-border
      ">
        {draftContent ? (
          <ReactMarkdown>{draftContent}</ReactMarkdown>
        ) : (
          <p className="text-center text-muted-foreground py-12">
            No content yet. Generate or write content to see the preview.
          </p>
        )}
      </div>
    </article>
  );
};

export default ContentPreview;
