import { useState } from "react";
import { ArrowLeft, Code2, Loader2, Send, ShieldAlert } from "lucide-react";
import { Alert } from "../../components/ui/Alert";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { ScoreCard } from "../../components/ui/ScoreCard";
import { SectionCard } from "../../components/ui/SectionCard";
import { Textarea } from "../../components/ui/Textarea";
import { api } from "../../services/api";
import { CodingSessionResult } from "../../types";

const exercises = [
  {
    title: "Two Sum",
    text: "Given nums and target, return indices of two numbers that add to target. Aim for linear time.",
    starter: `function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seen.has(complement)) return [seen.get(complement), i];
    seen.set(nums[i], i);
  }
  return [];
}`,
  },
  {
    title: "Merge Intervals",
    text: "Merge all overlapping intervals and return non-overlapping ranges.",
    starter: `function mergeIntervals(intervals) {
  if (!intervals.length) return [];
  intervals.sort((a, b) => a[0] - b[0]);
  const merged = [intervals[0]];
  for (const interval of intervals.slice(1)) {
    const last = merged[merged.length - 1];
    if (interval[0] <= last[1]) last[1] = Math.max(last[1], interval[1]);
    else merged.push(interval);
  }
  return merged;
}`,
  },
];

export function CodeReviewPage({ onExit }: { onExit: () => void }) {
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(exercises[0].starter);
  const [result, setResult] = useState<CodingSessionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function review() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      setResult(await api.reviewCode({ code, language, questionText: exercises[exerciseIndex].text }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Code review failed.");
    } finally {
      setLoading(false);
    }
  }

  function selectExercise(nextIndex: number) {
    setExerciseIndex(nextIndex);
    setCode(exercises[nextIndex].starter);
    setResult(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <Button variant="ghost" onClick={onExit} icon={<ArrowLeft className="h-4 w-4" />}>Dashboard</Button>
        <Badge tone="info"><ShieldAlert className="mr-1.5 h-3.5 w-3.5" />AI-reviewed, not executed</Badge>
      </div>
      {error && <Alert>{error}</Alert>}

      <Card elevated className="p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <Badge tone="success"><Code2 className="mr-1.5 h-3.5 w-3.5" />AI Code Review</Badge>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Improve code clarity, complexity, and interview explanation.</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">This workspace reviews code with AI. It does not compile, execute, or run hidden test cases.</p>
          </div>
          <Button onClick={review} disabled={loading} icon={loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}>
            {loading ? "Reviewing..." : "Request AI review"}
          </Button>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard title="Practice prompt" body="Select a prompt and review your solution like you would explain it in an interview.">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm text-zinc-400">Exercise</span>
              <select value={exerciseIndex} onChange={(event) => selectExercise(Number(event.target.value))} className="w-full rounded-lg border border-white/10 bg-zinc-950/80 px-3.5 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-300">
                {exercises.map((exercise, index) => <option key={exercise.title} value={index}>{exercise.title}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm text-zinc-400">Language</span>
              <select value={language} onChange={(event) => setLanguage(event.target.value)} className="w-full rounded-lg border border-white/10 bg-zinc-950/80 px-3.5 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-300">
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="typescript">TypeScript</option>
              </select>
            </label>
          </div>
          <div className="mt-5 rounded-xl border border-sky-300/15 bg-sky-300/8 p-4 text-sm leading-6 text-sky-100">{exercises[exerciseIndex].text}</div>
          <Textarea className="mt-5 min-h-96 font-mono text-[13px]" value={code} onChange={(event) => setCode(event.target.value)} aria-label="Code editor" />
        </SectionCard>

        <SectionCard title="Review results" body="Scores are AI review estimates and should be validated with your own tests before relying on code.">
          {!result && !loading && <EmptyState title="No review yet" body="Submit your solution to receive code quality, complexity, and explanation feedback." />}
          {loading && <div className="flex min-h-52 items-center justify-center gap-3 text-zinc-400"><Loader2 className="h-5 w-5 animate-spin text-emerald-300" /> Reviewing code...</div>}
          {result && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <ScoreCard label="Correctness" value={`${result.correctnessScore}/100`} helper="AI review estimate" />
                <ScoreCard label="Performance" value={`${result.performanceScore}/100`} helper="Complexity and approach" />
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 text-sm text-zinc-300">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Complexity</p>
                <p className="mt-2"><strong>Time:</strong> {result.complexity.time}</p>
                <p className="mt-1"><strong>Space:</strong> {result.complexity.space}</p>
              </div>
              {result.executionNotice && <Alert tone="info">{result.executionNotice}</Alert>}
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                <h3 className="text-sm font-semibold text-zinc-200">Reviewer feedback</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{result.feedback}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-200">Suggestions</h3>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-500">
                  {result.suggestions.map((suggestion) => <li key={suggestion}>{suggestion}</li>)}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-200">Reference improvement</h3>
                <pre className="mt-2 max-h-72 overflow-auto rounded-xl border border-white/[0.08] bg-zinc-950/90 p-4 text-xs leading-5 text-emerald-100">{result.optimizedSolution}</pre>
              </div>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
