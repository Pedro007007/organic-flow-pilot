import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Calendar, Clock, Tag, FileText } from "lucide-react";
import searcheraLogo from "@/assets/searchera-logo.png";

const Blog = () => {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_items")
        .select("slug, title, seo_title, meta_description, updated_at, hero_image_url, keyword")
        .eq("status", "published")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

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
            <Link to="/blog" className="text-gray-900 transition-colors">Blog</Link>
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
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white py-16">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(59,130,246,0.08),transparent_50%)]" />
          <div className="relative mx-auto max-w-6xl px-6 text-center">
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
              The Searchera <span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">SEO & AEO Blog</span>
            </h1>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto font-medium">
              Expert insights on Search Engine Optimization, Answer Engine Optimization, AI search, content strategy, and everything you need to dominate modern search.
            </p>
          </div>
        </section>

        {/* Articles Grid */}
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-6">
            {isLoading && (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-2xl border border-gray-200 overflow-hidden">
                    <Skeleton className="h-48 w-full bg-gray-200" />
                    <div className="p-6 space-y-3">
                      <Skeleton className="h-4 w-20 bg-gray-200" />
                      <Skeleton className="h-6 w-full bg-gray-200" />
                      <Skeleton className="h-4 w-full bg-gray-200" />
                      <Skeleton className="h-4 w-2/3 bg-gray-200" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isLoading && (!posts || posts.length === 0) && (
              <div className="text-center py-20">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-700">No articles published yet</h2>
                <p className="mt-2 text-gray-500">Check back soon for new content.</p>
              </div>
            )}

            {!isLoading && posts && posts.length > 0 && (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                  <Link
                    to={`/blog/${post.slug}`}
                    key={post.slug}
                    className="group rounded-2xl border border-gray-200 bg-white overflow-hidden hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 block"
                  >
                    {/* Header image or fallback */}
                    <div className="h-48 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-800 flex items-center justify-center relative overflow-hidden">
                      {post.hero_image_url ? (
                        <img src={post.hero_image_url} alt={post.seo_title || post.title} className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(59,130,246,0.2),transparent_70%)]" />
                          <FileText className="h-16 w-16 text-teal-400/60" />
                        </>
                      )}
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                          <Tag className="h-3 w-3" />
                          {post.keyword}
                        </span>
                      </div>
                      <h2 className="text-lg font-black text-gray-900 leading-snug group-hover:text-blue-600 transition-colors">
                        {post.seo_title || post.title}
                      </h2>
                      {post.meta_description && (
                        <p className="mt-2 text-sm text-gray-600 leading-relaxed line-clamp-3">
                          {post.meta_description}
                        </p>
                      )}
                      <div className="mt-4 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-xs text-gray-400 font-semibold">
                          <Calendar className="h-3 w-3" />
                          {new Date(post.updated_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                        </span>
                        <span className="text-sm font-bold text-blue-600 group-hover:underline flex items-center gap-1">
                          Read More <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-r from-blue-600 to-teal-500 py-16">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h2 className="text-3xl font-black text-white sm:text-4xl">Start Ranking on Google & AI Search Today</h2>
            <p className="mt-4 text-lg text-blue-100 max-w-xl mx-auto font-medium">Put these SEO & AEO strategies into action with Searchera's AI-powered platform.</p>
            <Button size="lg" className="mt-8 bg-white text-blue-700 hover:bg-blue-50 border-0 shadow-xl h-12 px-8 text-base font-black" asChild>
              <Link to="/auth">
                Get Started Free <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
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

export default Blog;
