import { BookOpenCheck, CalendarDays, Code2, Edit3, FileSearch, MessageSquareText, Play, Target, Trophy } from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ConfidenceBadge } from "../../components/ui/ConfidenceBadge";
import { CTABlock } from "../../components/ui/CTABlock";
import { PageHeader } from "../../components/ui/PageHeader";
import { Progress } from "../../components/ui/Progress";
import { SectionCard } from "../../components/ui/SectionCard";
import { StatCard } from "../../components/ui/StatCard";
import { CVProfile, InterviewMode, UserProfile } from "../../types";

export function DashboardPage({ user, cvProfile, onStartSession, onEditProfile }: { user: UserProfile; cvProfile: CVProfile | null; onStartSession: (mode: InterviewMode) => void; onEditProfile: () => void }) {
  const readiness = Math.min(92, 48 + user.completedSessionsCount * 6 + (cvProfile ? 18 : 0));

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <PageHeader eyebrow="Command center" title={`Welcome back, ${user.name}`} body={`Your current preparation target is ${user.targetRole || "not set yet"}. Keep each session focused on evidence, structure, and measurable outcomes.`} />
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="secondary" onClick={onEditProfile} icon={<Edit3 className="h-4 w-4" />}>Edit profile</Button>
          <Button onClick={() => onStartSession("daily")} icon={<Play className="h-4 w-4" />}>Start practice</Button>
        </div>
      </div>

      <Card elevated className="overflow-hidden p-6">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <Badge tone="success">Recommended next step</Badge>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white">Practice a CV deep-dive answer with quantified impact.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
              The strongest interview signal is connecting your resume evidence to a clear decision, action, and measurable result.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button onClick={() => onStartSession("behavioral")} icon={<MessageSquareText className="h-4 w-4" />}>Practice STAR</Button>
              <Button variant="secondary" onClick={() => onStartSession("mock")} icon={<CalendarDays className="h-4 w-4" />}>Mock interview</Button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard label="Readiness score" value={`${readiness}%`} helper="Local estimate from profile and sessions" icon={<Target className="h-5 w-5" />} />
            <StatCard label="Sessions" value={user.completedSessionsCount} helper="Temporary local adapter" icon={<BookOpenCheck className="h-5 w-5" />} />
            <StatCard label="ATS score" value={cvProfile?.atsScore == null ? "N/A" : `${cvProfile.atsScore}/100`} helper={cvProfile?.atsGrade || "Analyze CV to estimate"} icon={<Trophy className="h-5 w-5" />} />
            <StatCard label="Target" value={user.targetRole || "Unset"} helper={user.dreamCompany || "Add a dream company"} icon={<FileSearch className="h-5 w-5" />} />
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <SectionCard title="Practice modules" body="Choose the kind of coaching session you want to run next.">
          <div className="grid gap-4 md:grid-cols-2">
            {modules.map((module) => (
              <button key={module.mode} onClick={() => onStartSession(module.mode)} className="group rounded-xl border border-white/[0.08] bg-white/[0.03] p-5 text-left transition hover:border-emerald-300/40 hover:bg-emerald-300/[0.04]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.06] text-emerald-200 transition group-hover:bg-emerald-300/12">
                    <module.icon className="h-5 w-5" />
                  </div>
                  <Badge tone={module.mode === "coding" ? "info" : "neutral"}>{module.tag}</Badge>
                </div>
                <h3 className="mt-4 font-semibold text-white">{module.title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-500">{module.body}</p>
              </button>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Role signal" body="This is the profile context currently used for question generation.">
          {cvProfile ? (
            <div className="space-y-5">
              <div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone="success">Detected</Badge>
                  <ConfidenceBadge value={cvProfile.confidenceScore} fallback={cvProfile.isFallback} />
                </div>
                <p className="mt-4 text-2xl font-semibold text-white">{cvProfile.detectedDomain}</p>
                <p className="mt-1 text-sm text-zinc-400">{cvProfile.detectedRole}</p>
              </div>
              <Progress value={Math.round(cvProfile.confidenceScore * 100)} label="Detection confidence" />
              <div className="flex flex-wrap gap-2">
                {cvProfile.technicalSkills.slice(0, 8).map((skill) => <Badge key={skill}>{skill}</Badge>)}
              </div>
              <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-4">
                <p className="text-sm font-medium text-zinc-300">Next improvement focus</p>
                <p className="mt-2 text-sm leading-6 text-zinc-500">{cvProfile.atsIssues?.[0]?.recommendation || cvProfile.weaknessesOrGaps[0] || "Add more measurable evidence to your answers."}</p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.025] p-6 text-sm leading-6 text-zinc-500">
              Add a CV in onboarding to unlock stronger domain-specific questions. You can still practice with your selected target role.
            </div>
          )}
        </SectionCard>
      </div>

      <CTABlock
        title="Progress history is ready for real persistence later"
        body="Current readiness and sessions are local estimates. The repository layer is prepared for durable Supabase-backed history in a future phase."
        action={<Button variant="secondary" onClick={onEditProfile}>Review profile</Button>}
      />
    </div>
  );
}

const modules: Array<{ mode: InterviewMode; title: string; body: string; tag: string; icon: typeof Target }> = [
  { mode: "behavioral", title: "Behavioral practice", body: "Strengthen STAR structure, clarity, and measurable impact.", tag: "STAR", icon: MessageSquareText },
  { mode: "daily", title: "Technical practice", body: "Answer focused role-specific questions based on your target profile.", tag: "Focused", icon: Target },
  { mode: "mock", title: "Mock interview", body: "Run a broader interview set with technical, behavioral, and CV prompts.", tag: "Full session", icon: CalendarDays },
  { mode: "coding", title: "AI code review", body: "Improve code structure, complexity, and clarity. Review only, no execution.", tag: "Review only", icon: Code2 },
];
