import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, ArrowLeft, Star, MailCheck } from "lucide-react";
import searcheraLogo from "@/assets/searchera-logo.png";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email: unverifiedEmail });
      if (error) throw error;
      toast({ title: "Verification email sent", description: "Please check your inbox and spam folder." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setResending(false);
    }
  };

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

    if (!isLogin && password !== confirmPassword) {
      toast({ title: "Passwords do not match", description: "Please make sure both passwords are the same.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;

        // Check email verification
        if (data.user && !data.user.email_confirmed_at) {
          await supabase.auth.signOut();
          setUnverifiedEmail(email.trim());
          toast({ title: "Email not verified", description: "Please verify your email before signing in.", variant: "destructive" });
          setLoading(false);
          return;
        }

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

  // Unverified email screen
  if (unverifiedEmail) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6" style={{ background: "linear-gradient(135deg, hsl(210 20% 94%), hsl(220 15% 90%))" }}>
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <MailCheck className="h-8 w-8 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Verify your email</h2>
          <p className="text-sm text-gray-600">
            We sent a verification link to <strong className="text-gray-900">{unverifiedEmail}</strong>. Please check your inbox and spam folder.
          </p>
          <Button
            onClick={handleResendVerification}
            disabled={resending}
            className="w-full btn-3d border-0 h-11"
          >
            {resending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Resend Verification Email
          </Button>
          <button
            type="button"
            onClick={() => setUnverifiedEmail(null)}
            className="text-sm text-primary hover:underline font-semibold"
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Marketing */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-10 border-r border-gray-200 bg-white">
        <div>
          <div className="mb-10">
            <img src={searcheraLogo} alt="Searchera" className="h-[100px] object-contain drop-shadow-md" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-3">
            Turn any website into a{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              winning strategy
            </span>
          </h1>
          <p className="text-gray-600 text-sm mb-8 max-w-md">
            Scan, optimise, and publish — grow your organic traffic with AI-powered SEO content.
          </p>

          <ul className="space-y-2.5">
            {[
              "AI-powered content generation in seconds",
              "Beautiful, shareable SEO reports",
              "Track rankings and AI citations",
              "Automated content pipeline",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-gray-700 text-sm font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="rounded-xl p-5 border border-gray-200 bg-gray-50">
            <p className="text-gray-600 text-sm italic mb-3">
              "Searchera helped me rank 3 new pages in my first month. The AI content tools are incredibly fast and always produce quality results."
            </p>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold">
                JM
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-900 text-sm font-medium">James Mitchell</span>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
                <span className="text-gray-500 text-xs">Digital Marketing Manager</span>
              </div>
            </div>
          </div>
          <p className="text-gray-400 text-xs mt-4">© 2026 Searchera</p>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center px-6 relative" style={{ background: "linear-gradient(135deg, hsl(210 20% 94%), hsl(220 15% 90%))", backdropFilter: "blur(20px)" }}>
        <button
          onClick={() => navigate("/")}
          className="absolute top-6 left-6 text-gray-500 hover:text-gray-800 transition-colors flex items-center gap-1 text-sm font-medium"
          aria-label="Back to home"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to home</span>
        </button>

        <div className="w-full max-w-sm space-y-6">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-2">
            <img src={searcheraLogo} alt="Searchera" className="h-[60px] object-contain" />
          </div>

          {/* Header */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {forgotMode ? "Reset password" : isLogin ? "Welcome back" : "Create account"}
            </h2>
            <p className="text-sm text-gray-600 mt-1 font-medium">
              {forgotMode
                ? "Enter your email to reset password"
                : isLogin
                ? "Sign in to your Searchera account"
                : "Get started with Searchera"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && !forgotMode && (
              <div className="space-y-1.5">
                <Label htmlFor="displayName" className="text-gray-800 font-semibold">Display Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  maxLength={100}
                  className="bg-white/80 border-gray-300 text-gray-900 placeholder:text-gray-400"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-gray-800 font-semibold">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                maxLength={255}
                className="bg-white/80 border-gray-300 text-gray-900 placeholder:text-gray-400"
              />
            </div>
            {!forgotMode && (
              <>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-gray-800 font-semibold">Password</Label>
                    {isLogin && (
                      <button
                        type="button"
                        onClick={() => setForgotMode(true)}
                        className="text-xs text-primary hover:underline font-medium"
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
                      className="pr-10 bg-white/80 border-gray-300 text-gray-900 placeholder:text-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {!isLogin && (
                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword" className="text-gray-800 font-semibold">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                        maxLength={128}
                        className="pr-10 bg-white/80 border-gray-300 text-gray-900 placeholder:text-gray-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-red-600 text-xs font-medium">Passwords do not match</p>
                    )}
                  </div>
                )}
              </>
            )}
            <Button
              type="submit"
              className="w-full btn-3d border-0 h-11"
              disabled={loading || (!isLogin && !forgotMode && password !== confirmPassword)}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {forgotMode ? "Send Reset Link" : isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-600 font-medium">
            {forgotMode ? (
              <button type="button" onClick={() => setForgotMode(false)} className="text-primary hover:underline font-semibold">
                Back to sign in
              </button>
            ) : (
              <>
                {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => { setIsLogin(!isLogin); setConfirmPassword(""); }}
                  className="text-primary hover:underline font-semibold"
                >
                  {isLogin ? "Sign Up" : "Sign In"}
                </button>
              </>
            )}
          </p>

          <div className="flex justify-center gap-4 text-xs text-gray-500 font-medium">
            <Link to="/privacy" className="hover:text-gray-800 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-gray-800 transition-colors">Terms & Conditions</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
