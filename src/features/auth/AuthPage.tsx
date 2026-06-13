import { useState } from "react";
import type { FormEvent } from "react";
import { ArrowRight, CheckCircle2, Eye, EyeOff, Lock, Mail, ShieldCheck, Sparkles, User } from "lucide-react";
import { Alert } from "../../components/ui/Alert";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { api } from "../../services/api";
import { AuthSession } from "../../types";

export function AuthPage({ onAuthSuccess }: { onAuthSuccess: (session: AuthSession) => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const session = mode === "login" ? await api.signIn(email, password) : await api.signUp(name, email, password);
      onAuthSuccess(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-bg min-h-screen overflow-hidden text-zinc-100">
      <div className="mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-4 py-10 md:grid-cols-[1.08fr_0.92fr] lg:px-8">
        <section className="relative">
          <Badge tone="success" className="mb-6"><Sparkles className="mr-1.5 h-3.5 w-3.5" />AI interview coaching workspace</Badge>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white md:text-6xl">
            Practice smarter with CV-aware interview coaching.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-zinc-400 md:text-lg">
            Upload your CV, understand your detected role, and practice with tailored questions plus structured STAR feedback. Built as a local development workspace with a Supabase-ready architecture.
          </p>

          <div className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
            {benefits.map((benefit) => (
              <Card key={benefit.title} className="p-4">
                <benefit.icon className="h-5 w-5 text-emerald-200" />
                <h3 className="mt-4 text-sm font-semibold text-white">{benefit.title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-500">{benefit.body}</p>
              </Card>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3 text-sm text-zinc-400">
            {["OAuth placeholder only", "No code execution claims", "Server-side AI calls"].map((item) => (
              <span key={item} className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                {item}
              </span>
            ))}
          </div>
        </section>

        <Card elevated className="p-6 md:p-8">
          <div className="mb-6">
            <p className="text-sm font-medium text-emerald-200">{mode === "login" ? "Welcome back" : "Create your workspace"}</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">{mode === "login" ? "Sign in to continue practicing" : "Start a focused practice plan"}</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-500">Local development auth is active. Production auth can replace this through the prepared repository layer.</p>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl border border-white/[0.08] bg-white/[0.035] p-1">
            <button type="button" className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${mode === "login" ? "bg-white/[0.08] text-white" : "text-zinc-500 hover:text-zinc-300"}`} onClick={() => setMode("login")}>
              Sign in
            </button>
            <button type="button" className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${mode === "signup" ? "bg-white/[0.08] text-white" : "text-zinc-500 hover:text-zinc-300"}`} onClick={() => setMode("signup")}>
              Sign up
            </button>
          </div>

          {error && <div className="mb-4"><Alert>{error}</Alert></div>}

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <label className="block">
                <span className="mb-1.5 block text-sm text-zinc-400">Name</span>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
                  <Input className="pl-10" value={name} onChange={(event) => setName(event.target.value)} placeholder="Alex Morgan" required autoComplete="name" />
                </div>
              </label>
            )}

            <label className="block">
              <span className="mb-1.5 block text-sm text-zinc-400">Email</span>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
                <Input className="pl-10" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" required autoComplete="email" />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm text-zinc-400">Password</span>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
                <Input className="pl-10 pr-10" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 chars, letter and number" required autoComplete={mode === "login" ? "current-password" : "new-password"} />
                <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-3.5 top-3.5 text-zinc-500 transition hover:text-zinc-200" onClick={() => setShowPassword((value) => !value)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-zinc-600">Use at least 8 characters with one letter and one number.</p>
            </label>

            <Button className="w-full" size="lg" disabled={loading} icon={<ArrowRight className="h-4 w-4" />}>
              {loading ? "Working..." : mode === "login" ? "Sign in" : "Create account"}
            </Button>

            <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.025] px-4 py-3 text-center text-sm text-zinc-500">
              Google OAuth is coming soon. This build uses local development auth only.
            </div>
          </form>
        </Card>
      </div>
    </main>
  );
}

const benefits = [
  { title: "CV-aware practice", body: "Questions adapt to your detected role, skills, and project evidence.", icon: ShieldCheck },
  { title: "STAR feedback", body: "Improve structure, clarity, confidence, and measurable impact.", icon: CheckCircle2 },
  { title: "AI code review", body: "Review complexity and clarity without claiming code execution.", icon: Sparkles },
];
