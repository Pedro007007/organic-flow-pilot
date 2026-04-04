import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowRight,
  Target,
  Cpu,
  Globe,
  Users,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Zap,
} from "lucide-react";
import searcheraLogo from "@/assets/searchera-logo.png";
import { useEffect } from "react";

const values = [
  {
    icon: Target,
    title: "Data-Driven Precision",
    desc: "Every recommendation is grounded in real search data — not guesswork. We connect directly to Google Search Console to surface actionable intelligence.",
  },
  {
    icon: Cpu,
    title: "AI-First Automation",
    desc: "Autonomous agents handle keyword research, content generation, and optimisation around the clock so you can focus on strategy.",
  },
  {
    icon: Globe,
    title: "AEO-Native Architecture",
    desc: "Built from the ground up for Answer Engine Optimisation — ensuring your brand is cited by ChatGPT, Perplexity, and Google AI Overviews.",
  },
  {
    icon: ShieldCheck,
    title: "Enterprise-Grade Quality",
    desc: "Every piece of content passes our multi-layer fulfilment engine — covering technical SEO, on-page signals, schema markup, and readability.",
  },
];

const team = [
  {
    icon: Users,
    title: "SEO & AEO Strategists",
    desc: "Our core team blends deep search-engine expertise with cutting-edge AI research to build tools that actually move the needle.",
  },
  {
    icon: Sparkles,
    title: "Product & AI Engineers",
    desc: "We ship weekly. Our engineering team obsesses over speed, reliability, and delivering AI that writes like a senior strategist — not a chatbot.",
  },
  {
    icon: TrendingUp,
    title: "Customer Success",
    desc: "We measure our success by yours. Dedicated onboarding, proactive audits, and a community of growth-focused marketers.",
  },
];

const faqs = [
  {
    q: "What is Searchera and how does it work?",
    a: "Searchera is an AI-powered SEO and AEO (Answer Engine Optimisation) platform. It connects to your Google Search Console data, discovers high-impact keyword opportunities, generates optimised content, and tracks your rankings across both traditional search engines and AI answer platforms like ChatGPT and Perplexity — all from a single dashboard.",
  },
  {
    q: "What is AEO and why does it matter?",
    a: "AEO stands for Answer Engine Optimisation. As AI-powered search engines like ChatGPT, Perplexity, and Google AI Overviews grow, brands need to be structured for citation — not just ranking. Searchera optimises your content with structured data, direct-answer formatting, and FAQ schemas so AI models reference your brand as a trusted source.",
  },
  {
    q: "Who is Searchera designed for?",
    a: "Searchera is built for marketing teams, SEO professionals, content strategists, and agency operators who need to scale organic growth efficiently. Whether you manage a single brand or dozens of client accounts, the platform adapts to your workflow with multi-brand management and team collaboration.",
  },
  {
    q: "How does Searchera generate content?",
    a: "Our AI content pipeline uses a senior-level SEO & AEO copywriter persona. It researches your target keyword, analyses SERP competitors, generates a structured article with H1–H3 hierarchy, embeds internal links, and produces FAQ sections — all optimised for both Google rankings and AI citation. Every article passes through a multi-point fulfilment engine before approval.",
  },
  {
    q: "Does Searchera replace my existing SEO tools?",
    a: "Searchera consolidates keyword research, content creation, technical auditing, rank tracking, and AI citation monitoring into one platform. Many teams use it to replace 3–5 separate tools. However, it also integrates with your existing stack — you can connect Google Search Console and publish directly to your CMS via webhook.",
  },
  {
    q: "How does Searchera track AI citations?",
    a: "Our Rankings & AI Citation Tracker monitors your brand's presence across Google search results and AI answer engines. It detects when your content is cited or referenced by ChatGPT, Perplexity, and Google AI Overviews, and logs the citation alongside your traditional ranking data for a unified visibility score.",
  },
  {
    q: "Is Searchera suitable for agencies managing multiple clients?",
    a: "Absolutely. Searchera supports multi-brand management with individual tone-of-voice profiles, domain configurations, and internal linking rules per brand. Team management features include role-based access (admin, operator, viewer) and collaborative workflows for content review and approval.",
  },
  {
    q: "What kind of results can I expect from using Searchera?",
    a: "Results vary by niche and starting point, but our users typically report 3× organic traffic growth within the first 90 days, 85% time savings on SEO and content tasks, and measurable increases in AI search visibility. The platform's autonomous agents work 24/7, continuously identifying new opportunities and refreshing underperforming content.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Searchera",
  url: "https://organic-flow-pilot.lovable.app",
  logo: "https://organic-flow-pilot.lovable.app/assets/searchera-logo.png",
  description:
    "AI-powered SEO & AEO platform for keyword discovery, content generation, rankings tracking, and AI search optimisation.",
  sameAs: [],
  contactPoint: {
    "@type": "ContactPoint",
    email: "support@searchera.io",
    contactType: "customer support",
  },
};

const About = () => {
  useEffect(() => {
    document.title =
      "About Searchera — AI-Powered SEO & AEO Platform | Our Mission";
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />

      {/* Meta description via helmet-less approach */}
      <meta
        name="description"
        content="Learn about Searchera — the AI-powered SEO & AEO platform helping brands dominate Google and AI search engines with intelligent automation."
      />

      {/* Nav */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-3">
          <Link to="/" className="flex items-center gap-2">
            <img
              src={searcheraLogo}
              alt="Searchera logo"
              className="h-[60px] object-contain"
            />
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-gray-600">
            <Link to="/" className="hover:text-gray-900 transition-colors">
              Home
            </Link>
            <Link to="/blog" className="hover:text-gray-900 transition-colors">
              Blog
            </Link>
            <Link
              to="/about"
              className="text-gray-900 border-b-2 border-blue-500 pb-0.5"
            >
              About
            </Link>
          </nav>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
            asChild
          >
            <Link to="/auth">Get Started</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-blue-50 py-24 sm:py-32">
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)", backgroundSize: "40px 40px" }} />
        </div>
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-200 px-4 py-1.5 text-xs font-bold text-blue-700 mb-6">
            <Zap className="h-3.5 w-3.5" />
            ABOUT SEARCHERA
          </div>
          <h1 className="text-4xl font-black tracking-tight text-gray-900 sm:text-5xl lg:text-6xl leading-[1.1]">
            The AI Platform Built to{" "}
            <span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
              Dominate Search
            </span>
          </h1>
          <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto font-medium leading-relaxed">
            Searchera combines advanced AI with deep search-engine intelligence
            to help brands rank on Google, get cited by AI answer engines, and
            scale organic growth — on autopilot.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-2xl font-black text-gray-900 sm:text-3xl">
                Our Mission
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed font-medium">
                Search is evolving. Google remains the dominant discovery channel,
                but AI-powered answer engines are rapidly changing how users find
                and trust information. Most SEO tools were built for a world that
                no longer exists.
              </p>
              <p className="mt-4 text-gray-600 leading-relaxed font-medium">
                Searchera was built to bridge this gap — a single platform where
                marketers, agencies, and content teams can discover opportunities,
                create authoritative content, and monitor visibility across{" "}
                <strong>both</strong> traditional search and AI answer engines.
              </p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-teal-500 p-8 text-white">
              <h3 className="text-lg font-black">By the Numbers</h3>
              <div className="mt-6 grid grid-cols-2 gap-6">
                <div>
                  <p className="text-3xl font-black">10×</p>
                  <p className="text-sm text-blue-100 font-semibold mt-1">
                    Faster content production
                  </p>
                </div>
                <div>
                  <p className="text-3xl font-black">85%</p>
                  <p className="text-sm text-blue-100 font-semibold mt-1">
                    Time saved on SEO tasks
                  </p>
                </div>
                <div>
                  <p className="text-3xl font-black">3×</p>
                  <p className="text-sm text-blue-100 font-semibold mt-1">
                    Organic traffic growth
                  </p>
                </div>
                <div>
                  <p className="text-3xl font-black">24/7</p>
                  <p className="text-sm text-blue-100 font-semibold mt-1">
                    AI monitoring &amp; automation
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center mb-14">
            <h2 className="text-2xl font-black text-gray-900 sm:text-3xl">
              What Sets Us Apart
            </h2>
            <p className="mt-3 text-gray-500 font-medium max-w-xl mx-auto">
              Built by SEO practitioners, for SEO practitioners — with AI that
              thinks like a senior strategist.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {values.map((v) => (
              <div
                key={v.title}
                className="rounded-xl border border-gray-200 bg-white p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <v.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-gray-900">{v.title}</h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed font-medium">
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center mb-14">
            <h2 className="text-2xl font-black text-gray-900 sm:text-3xl">
              The Team Behind Searchera
            </h2>
            <p className="mt-3 text-gray-500 font-medium max-w-xl mx-auto">
              A multidisciplinary team obsessed with search performance and AI
              innovation.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {team.map((t) => (
              <div
                key={t.title}
                className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 mb-4">
                  <t.icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-gray-900">{t.title}</h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed font-medium">
                  {t.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gray-50" id="faq">
        <div className="mx-auto max-w-3xl px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-black text-gray-900 sm:text-3xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-3 text-gray-500 font-medium">
              Everything you need to know about Searchera, SEO, and AEO.
            </p>
          </div>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="rounded-xl border border-gray-200 bg-white px-6 shadow-sm"
              >
                <AccordionTrigger className="text-left font-bold text-gray-900 hover:no-underline py-5 text-[15px]">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-gray-600 leading-relaxed font-medium pb-5">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-teal-500 py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-black text-white sm:text-4xl">
            Ready to Transform Your Search Visibility?
          </h2>
          <p className="mt-4 text-lg text-blue-100 max-w-xl mx-auto font-medium">
            Join forward-thinking marketers using Searchera to dominate Google
            and AI search engines.
          </p>
          <div className="mt-10">
            <Button
              size="lg"
              className="bg-white text-blue-700 hover:bg-blue-50 border-0 shadow-xl h-12 px-8 text-base font-black"
              asChild
            >
              <Link to="/auth">
                Get Started Free <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-blue-200 font-semibold">
            No credit card required
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Link to="/" className="flex items-center gap-2">
              <img
                src={searcheraLogo}
                alt="Searchera"
                className="h-[90px] object-contain"
              />
            </Link>
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 font-bold">
              <Link
                to="/about"
                className="hover:text-gray-900 transition-colors"
              >
                About
              </Link>
              <Link
                to="/blog"
                className="hover:text-gray-900 transition-colors"
              >
                Blog
              </Link>
              <a
                href="/privacy.html"
                className="hover:text-gray-900 transition-colors"
              >
                Privacy Policy
              </a>
              <Link
                to="/terms"
                className="hover:text-gray-900 transition-colors"
              >
                Terms &amp; Conditions
              </Link>
              <a
                href="mailto:support@searchera.io"
                className="hover:text-gray-900 transition-colors"
              >
                Contact
              </a>
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

export default About;
