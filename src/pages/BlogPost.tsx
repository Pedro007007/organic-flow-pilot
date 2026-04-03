import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, User } from "lucide-react";
import searcheraLogo from "@/assets/searchera-logo.png";
import { sanitizeMarkdownLinks } from "@/lib/markdown";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const contentRef = useRef<HTMLDivElement>(null);

  const { data: post, isLoading, error } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_items")
        .select("*")
        .eq("slug", slug!)
        .in("status", ["published", "monitoring"])
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const displayTitle = post?.seo_title || post?.title || "";
  const date = post?.updated_at
    ? new Date(post.updated_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "";

  const handleExportDocx = () => {
    if (!post || !contentRef.current) return;
    const bodyHtml = contentRef.current.innerHTML;
    const jsonLd = post.structured_data ? `<script type="application/ld+json">${JSON.stringify(post.structured_data)}</script>` : "";
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>${displayTitle}</title>
${post.meta_description ? `<meta name="description" content="${post.meta_description.replace(/"/g, '&quot;')}"/>` : ""}
${jsonLd}
</head>
<body>
${post.hero_image_url ? `<img src="${post.hero_image_url}" alt="${displayTitle.replace(/"/g, '&quot;')}" style="max-width:100%;"/>` : ""}
<h1>${displayTitle}</h1>
<p><strong>Author:</strong> ${post.author} | <strong>Date:</strong> ${date}</p>
<hr/>
${bodyHtml}
</body>
</html>`;
    const blob = new Blob([html], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${post.slug || "article"}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="light min-h-screen flex flex-col bg-white text-gray-900">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link to="/" className="flex items-center gap-2">
            <img src={searcheraLogo} alt="Searchera" className="h-[100px] object-contain" />
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-gray-600">
            <Link to="/#features" className="hover:text-gray-900 transition-colors">Features</Link>
            <Link to="/#how-it-works" className="hover:text-gray-900 transition-colors">How It Works</Link>
            <Link to="/blog" className="hover:text-gray-900 transition-colors">Blog</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-gray-700 hover:text-gray-900 font-bold" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button size="sm" className="bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white border-0 shadow-lg shadow-blue-500/25 font-bold" asChild>
              <Link to="/auth">Get Started Free</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {isLoading && (
          <div className="mx-auto max-w-3xl px-6 py-16 space-y-6">
            <Skeleton className="h-8 w-3/4 bg-gray-200" />
            <Skeleton className="h-4 w-1/2 bg-gray-200" />
            <Skeleton className="h-64 w-full bg-gray-200" />
            <Skeleton className="h-4 w-full bg-gray-200" />
            <Skeleton className="h-4 w-full bg-gray-200" />
          </div>
        )}

        {!isLoading && !post && (
          <div className="mx-auto max-w-3xl px-6 py-24 text-center">
            <h1 className="text-3xl font-black text-gray-900">Article Not Found</h1>
            <p className="mt-4 text-gray-600">The article you're looking for doesn't exist or hasn't been published yet.</p>
            <Button className="mt-8 bg-gradient-to-r from-blue-600 to-teal-500 text-white border-0 font-bold" asChild>
              <Link to="/blog"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog</Link>
            </Button>
          </div>
        )}

        {post && (
          <article className="mx-auto max-w-3xl px-6 py-12">
            {/* Back link */}
            <Link to="/blog" className="inline-flex items-center gap-1 text-sm font-bold text-blue-600 hover:underline mb-8">
              <ArrowLeft className="h-4 w-4" /> Back to Blog
            </Link>

            {/* Hero image */}
            {post.hero_image_url && (
              <div className="w-full aspect-video rounded-2xl overflow-hidden mb-8">
                <img src={post.hero_image_url} alt={displayTitle} className="w-full h-full object-cover" />
              </div>
            )}

            {/* Header */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-4 text-sm text-gray-500 font-semibold">
                {date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" /> {date}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" /> {post.author}
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight">{displayTitle}</h1>
              {post.meta_description && (
                <p className="text-lg text-gray-600 leading-relaxed italic border-l-4 border-blue-500 pl-4">
                  {post.meta_description}
                </p>
              )}
            </div>

            <hr className="border-gray-200 mb-8" />

            {/* Content */}
            <div ref={contentRef} className="prose prose-lg max-w-none
              prose-headings:text-gray-900 prose-headings:font-bold
              prose-h2:text-2xl prose-h2:border-b prose-h2:border-gray-200 prose-h2:pb-2 prose-h2:mt-10
              prose-h3:text-xl
              prose-p:text-gray-700 prose-p:leading-relaxed
              prose-strong:text-gray-900
              prose-ul:text-gray-700 prose-ol:text-gray-700
              prose-a:text-blue-600 hover:prose-a:underline
              prose-blockquote:border-blue-500 prose-blockquote:text-gray-600 prose-blockquote:italic
              prose-code:text-blue-700 prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
              prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-200 prose-pre:rounded-lg
              prose-img:rounded-lg
            ">
              <ReactMarkdown
                components={{
                  a: ({ href, children, ...props }) => {
                    const isExternal = href?.startsWith("http");
                    return (
                      <a
                        href={href}
                        {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        {...props}
                      >
                        {children}
                      </a>
                    );
                  },
                }}
              >{post.draft_content || ""}</ReactMarkdown>
            </div>

            {/* JSON-LD structured data */}
            {post.structured_data && (
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(post.structured_data) }}
              />
            )}
          </article>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Link to="/" className="flex items-center gap-2">
              <img src={searcheraLogo} alt="Searchera" className="h-[90px] object-contain" />
            </Link>
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 font-bold">
              <Link to="/blog" className="hover:text-gray-900 transition-colors">Blog</Link>
              <Link to="/privacy" className="hover:text-gray-900 transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-gray-900 transition-colors">Terms & Conditions</Link>
              <a href="mailto:support@searchera.io" className="hover:text-gray-900 transition-colors">Contact</a>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-100 text-center text-xs text-gray-400 font-semibold">
            © {new Date().getFullYear()} Searchera. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BlogPost;
