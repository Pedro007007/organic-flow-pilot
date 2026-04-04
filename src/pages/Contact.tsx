import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, ArrowLeft } from "lucide-react";
import searcheraLogo from "@/assets/searchera-logo.png";

const Contact = () => {
  return (
    <div className="light min-h-screen flex flex-col bg-white text-gray-900">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-1">
          <Link to="/" className="flex items-center gap-2">
            <img src={searcheraLogo} alt="Searchera" className="h-[84px] object-contain" />
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-gray-600">
            <Link to="/#features" className="hover:text-gray-900 transition-colors">Features</Link>
            <Link to="/blog" className="hover:text-gray-900 transition-colors">Blog</Link>
            <Link to="/about" className="hover:text-gray-900 transition-colors">About</Link>
            <Link to="/contact" className="text-gray-900 transition-colors">Contact</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-gray-700 hover:text-gray-900 font-bold" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button size="sm" className="bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white border-0 shadow-lg shadow-blue-500/25 font-bold" asChild>
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white py-20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(59,130,246,0.08),transparent_50%)]" />
          <div className="relative mx-auto max-w-4xl px-6 text-center">
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
              Get in <span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">Touch</span>
            </h1>
            <p className="mt-4 text-lg text-gray-600 font-semibold max-w-2xl mx-auto">
              Have questions about Searchera? We'd love to hear from you. Reach out and our team will get back to you promptly.
            </p>
          </div>
        </section>

        {/* Contact Cards */}
        <section className="py-16">
          <div className="mx-auto max-w-4xl px-6">
            <div className="grid gap-8 md:grid-cols-3">
              {/* Phone */}
              <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500 shadow-lg mx-auto mb-6">
                  <Phone className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-lg font-black text-gray-900 mb-2">Phone</h3>
                <p className="text-sm text-gray-500 font-medium mb-4">UK Office</p>
                <a href="tel:+442029225411117" className="text-blue-600 font-bold hover:text-blue-700 transition-colors text-lg">
                  +44 029 2254 1117
                </a>
              </div>

              {/* Email */}
              <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500 shadow-lg mx-auto mb-6">
                  <Mail className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-lg font-black text-gray-900 mb-2">Email</h3>
                <p className="text-sm text-gray-500 font-medium mb-4">General Enquiries</p>
                <a href="mailto:info@searcheraa.com" className="text-blue-600 font-bold hover:text-blue-700 transition-colors text-lg">
                  info@searcheraa.com
                </a>
              </div>

              {/* Location */}
              <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500 shadow-lg mx-auto mb-6">
                  <MapPin className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-lg font-black text-gray-900 mb-2">Location</h3>
                <p className="text-sm text-gray-500 font-medium mb-4">Headquarters</p>
                <p className="text-gray-800 font-bold text-lg">United Kingdom</p>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-16 rounded-2xl bg-gradient-to-r from-blue-600 to-teal-500 p-10 text-center">
              <h2 className="text-2xl font-black text-white sm:text-3xl">Ready to grow your organic traffic?</h2>
              <p className="mt-3 text-blue-100 font-medium max-w-xl mx-auto">Get started today and see results in days, not months.</p>
              <Button size="lg" className="mt-8 bg-white text-blue-700 hover:bg-blue-50 border-0 shadow-xl h-12 px-8 text-base font-black" asChild>
                <Link to="/auth">Get Started</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Link to="/" className="flex items-center gap-2">
              <img src={searcheraLogo} alt="Searchera" className="h-[84px] object-contain" />
            </Link>
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 font-bold">
              <Link to="/about" className="hover:text-gray-900 transition-colors">About</Link>
              <Link to="/blog" className="hover:text-gray-900 transition-colors">Blog</Link>
              <Link to="/contact" className="hover:text-gray-900 transition-colors">Contact</Link>
              <a href="/privacy.html" className="hover:text-gray-900 transition-colors">Privacy Policy</a>
              <Link to="/terms" className="hover:text-gray-900 transition-colors">Terms & Conditions</Link>
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

export default Contact;
