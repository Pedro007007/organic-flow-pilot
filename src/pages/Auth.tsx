import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, ArrowLeft, Star } from "lucide-react";
import searcheraLogo from "@/assets/searchera-logo.png";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (forgotMode) {
      if (!email.trim()) return;
      setLoading(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        toast({ title: "Reset link sent", description: "Check your email for the password reset link." });
        setForgotMode(false);
      } catch (err: any) {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!email.trim() || !password.trim()) return;
    if (password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        navigate("/dashboard");
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { display_name: displayName.trim() || undefined },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast({ title: "Check your email", description: "We've sent you a confirmation link." });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Marketing */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-10" style={{ background: "hsl(0 0% 100%)" }}>
        <div>
          <div className="flex items-center gap-3 mb-24">
            <img src={searcheraLogo} alt="Searchera" className="h-[160px] object-contain" />
          </div>

          <h1 className="text-4xl font-bold text-foreground leading-tight mb-4">
            Turn any website into a{" "}
            <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              winning strategy
            </span>
          </h1>
          <p className="text-muted-foreground text-base mb-10 max-w-md">
            Scan, optimise, and publish — grow your organic traffic with AI-powered SEO content.
          </p>

          <ul className="space-y-3 mb-12">
            {[
              "AI-powered content generation in seconds",
              "Beautiful, shareable SEO reports",
              "Track rankings and AI citations",
              "Automated content pipeline",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-blue-100/80 text-sm">
                <span className="h-2 w-2 rounded-full bg-purple-400 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Testimonial */}
        <div className="rounded-xl p-5" style={{ background: "hsl(235 55% 20%)" }}>
          <p className="text-blue-100/80 text-sm italic mb-4">
            "Searchera helped me rank 3 new pages in my first month. The AI content tools are incredibly fast and always produce quality results."
          </p>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
              JM
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white text-sm font-medium">James Mitchell</span>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>
              <span className="text-blue-200/60 text-xs">Digital Marketing Manager</span>
            </div>
          </div>
        </div>

        <p className="text-blue-200/40 text-xs mt-6">© 2026 Searchera</p>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center bg-background px-6 relative">
        <button
          onClick={() => navigate("/")}
          className="absolute top-6 left-6 text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 text-sm"
          aria-label="Back to home"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to home</span>
        </button>

        <div className="w-full max-w-sm space-y-8">
          {/* Header */}
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {forgotMode ? "Reset password" : isLogin ? "Welcome back" : "Create account"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {forgotMode
                ? "Enter your email to reset password"
                : isLogin
                ? "Sign in to your Searchera account"
                : "Get started with Searchera"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && !forgotMode && (
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  maxLength={100}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                maxLength={255}
              />
            </div>
            {!forgotMode && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => setForgotMode(true)}
                      className="text-xs text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    maxLength={128}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}
            <Button
              type="submit"
              className="w-full btn-3d border-0 h-11"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {forgotMode ? "Send Reset Link" : isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {forgotMode ? (
              <button type="button" onClick={() => setForgotMode(false)} className="text-primary hover:underline font-medium">
                Back to sign in
              </button>
            ) : (
              <>
                {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-primary hover:underline font-medium"
                >
                  {isLogin ? "Sign Up" : "Sign In"}
                </button>
              </>
            )}
          </p>

          <div className="flex justify-center gap-4 text-xs text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms & Conditions</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
