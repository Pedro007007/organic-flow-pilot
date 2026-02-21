import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Clock, User, Tag, Search, Bot, TrendingUp, FileText } from "lucide-react";
import searcheraLogo from "@/assets/searchera-logo.png";

const blogPosts = [
  {
    slug: "what-is-aeo",
    title: "What Is AEO? The Complete Guide to Answer Engine Optimization in 2026",
    excerpt: "Answer Engine Optimization (AEO) is the practice of optimizing your content to be cited and surfaced by AI-powered search engines like ChatGPT, Perplexity, and Google AI Overviews. Learn how it differs from traditional SEO and why you need both.",
    category: "AEO",
    readTime: "8 min read",
    date: "Feb 18, 2026",
    icon: Bot,
  },
  {
    slug: "seo-vs-aeo",
    title: "SEO vs AEO: What's the Difference and Why You Need Both",
    excerpt: "Traditional SEO focuses on ranking in search results, while AEO focuses on being the answer AI engines cite. Discover how to build a strategy that dominates both Google and AI search.",
    category: "Strategy",
    readTime: "6 min read",
    date: "Feb 15, 2026",
    icon: Search,
  },
  {
    slug: "ai-citations-guide",
    title: "How to Get Cited by ChatGPT, Perplexity & Google AI Overviews",
    excerpt: "AI search engines cite authoritative, well-structured content. Here's the exact framework we use at Searchera to help brands get cited by every major AI answer engine.",
    category: "AEO",
    readTime: "10 min read",
    date: "Feb 12, 2026",
    icon: TrendingUp,
  },
  {
    slug: "content-optimization-seo-aeo",
    title: "How to Optimize Content for Both SEO and AEO Simultaneously",
    excerpt: "You don't need two separate content strategies. Learn how to write content that ranks on Google AND gets surfaced by AI search — using structured data, FAQ schemas, and direct-answer formatting.",
    category: "Content",
    readTime: "7 min read",
    date: "Feb 9, 2026",
    icon: FileText,
  },
  {
    slug: "schema-markup-aeo",
    title: "Schema Markup for AEO: The Structured Data That AI Engines Love",
    excerpt: "JSON-LD structured data isn't just for Google rich results anymore. AI search engines heavily rely on schema markup to understand and cite your content. Here's what to implement.",
    category: "Technical",
    readTime: "9 min read",
    date: "Feb 5, 2026",
    icon: Bot,
  },
  {
    slug: "keyword-research-ai-era",
    title: "Keyword Research in the AI Era: Finding Queries That Trigger AI Answers",
    excerpt: "Traditional keyword research misses a massive opportunity: queries that trigger AI-generated answers. Learn how to find and target these high-value AEO keywords.",
    category: "Keywords",
    readTime: "7 min read",
    date: "Feb 1, 2026",
    icon: Search,
  },
];

const Blog = () => {
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
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {blogPosts.map((post) => (
                <article key={post.slug} className="group rounded-2xl border border-gray-200 bg-white overflow-hidden hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300">
                  {/* Colored header bar */}
                  <div className="h-48 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-800 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(59,130,246,0.2),transparent_70%)]" />
                    <post.icon className="h-16 w-16 text-teal-400/60" />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                        <Tag className="h-3 w-3" />
                        {post.category}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-400 font-semibold">
                        <Clock className="h-3 w-3" />
                        {post.readTime}
                      </span>
                    </div>
                    <h2 className="text-lg font-black text-gray-900 leading-snug group-hover:text-blue-600 transition-colors">
                      {post.title}
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 leading-relaxed line-clamp-3">
                      {post.excerpt}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-xs text-gray-400 font-semibold">
                        <Calendar className="h-3 w-3" />
                        {post.date}
                      </span>
                      <span className="text-sm font-bold text-blue-600 group-hover:underline flex items-center gap-1">
                        Read More <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
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
