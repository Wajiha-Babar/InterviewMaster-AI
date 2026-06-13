import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Clipboard, Clock, Loader2, Send, Sparkles } from "lucide-react";
import { Alert } from "../../components/ui/Alert";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { LoadingState } from "../../components/ui/LoadingState";
import { Progress } from "../../components/ui/Progress";
import { ScoreCard } from "../../components/ui/ScoreCard";
import { ScoreRing } from "../../components/ui/ScoreRing";
import { SectionCard } from "../../components/ui/SectionCard";
import { Textarea } from "../../components/ui/Textarea";
import { api } from "../../services/api";
import { AnswerPreparation, CVProfile, FeedbackResult, InterviewMode, Question, UserProfile } from "../../types";

export function InterviewPage({ user, cvProfile, mode, onExit }: { user: UserProfile; cvProfile: CVProfile | null; mode: InterviewMode; onExit: () => void }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionSource, setQuestionSource] = useState<"gemini" | "fallback">("fallback");
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [preparation, setPreparation] = useState<AnswerPreparation | null>(null);
  const [feedback, setFeedback] = useState<FeedbackResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [preparing, setPreparing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [startedAt, setStartedAt] = useState(Date.now());
  const [activeTab, setActiveTab] = useState<"question" | "prepare" | "answer" | "feedback">("question");

  useEffect(() => {
    setLoading(true);
    api.generateQuestions({ targetRole: user.targetRole, experienceLevel: user.experienceLevel, dreamCompany: user.dreamCompany, mode, cvProfile })
      .then((result) => {
        setQuestions(result.questions);
        setQuestionSource(result.source);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not generate questions."))
      .finally(() => setLoading(false));
  }, [user, mode, cvProfile]);

  async function prepareCurrentAnswer() {
    const question = questions[index];
    setPreparing(true);
    setError("");
    try {
      setPreparation(await api.prepareAnswer({ question, cvProfile, targetRole: user.targetRole, experienceLevel: user.experienceLevel }));
      setActiveTab("prepare");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Answer preparation is temporarily unavailable.");
    } finally {
      setPreparing(false);
    }
  }

  async function submitAnswer() {
    const question = questions[index];
    if (!answer.trim()) return setError("Write or paste your answer before requesting feedback.");
    setSubmitting(true);
    setError("");
    setCopied(false);
    try {
      setFeedback(await api.evaluateAnswer({ question: question.text, answer, durationSeconds: Math.round((Date.now() - startedAt) / 1000), cvProfile, targetRole: user.targetRole, experienceLevel: user.experienceLevel }));
      setActiveTab("feedback");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Feedback is temporarily unavailable.");
    } finally {
      setSubmitting(false);
    }
  }

  function nextQuestion() {
    setFeedback(null);
    setPreparation(null);
    setAnswer("");
    setCopied(false);
    setStartedAt(Date.now());
    setActiveTab("question");
    if (index < questions.length - 1) setIndex((value) => value + 1);
    else onExit();
  }

  async function copyImprovedAnswer() {
    if (!feedback?.betterAnswer) return;
    await navigator.clipboard.writeText(feedback.betterAnswer);
    setCopied(true);
  }

  if (loading) return <LoadingState label="Preparing your tailored interview questions" />;
  if (!questions.length) return <EmptyState title="No questions generated" body="Try updating your profile or CV and start another session." />;

  const question = questions[index];
  const progress = Math.round(((index + 1) / questions.length) * 100);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <Button variant="ghost" onClick={onExit} icon={<ArrowLeft className="h-4 w-4" />}>Dashboard</Button>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="info">{mode} session</Badge>
          <Badge tone={questionSource === "gemini" ? "success" : "warning"}>{questionSource === "gemini" ? "AI Generated" : "Fallback Mode"}</Badge>
          <Badge>{index + 1} of {questions.length}</Badge>
        </div>
      </div>

      <Progress value={progress} label="Session progress" />
      {questionSource === "fallback" && <Alert tone="info">AI coaching is running in limited fallback mode. Add GEMINI_API_KEY for full coaching.</Alert>}
      {error && <Alert>{error}</Alert>}

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {(["question", "prepare", "answer", "feedback"] as const).map((tab) => (
          <Button key={tab} type="button" variant={activeTab === tab ? "primary" : "secondary"} onClick={() => setActiveTab(tab)} disabled={tab === "feedback" && !feedback}>
            {tab}
          </Button>
        ))}
      </div>

      {activeTab === "question" && (
        <Card elevated className="p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="success">{question.category.replace("_", " ")}</Badge>
            <Badge>{question.difficulty}</Badge>
            <span className="ml-auto flex items-center gap-1 text-sm text-zinc-500"><Clock className="h-4 w-4" /> {question.answerTime}s answer target</span>
          </div>
          <h1 className="mt-6 text-2xl font-semibold leading-9 tracking-tight text-white md:text-3xl">{question.text}</h1>
          <div className="mt-5 rounded-xl border border-sky-300/15 bg-sky-300/8 p-4 text-sm leading-6 text-sky-100">
            <div className="mb-1 flex items-center gap-2 font-semibold"><Sparkles className="h-4 w-4" /> Why this is asked</div>
            {question.whyAsked || question.hint}
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Panel title="What interviewer wants" items={question.whatInterviewerWants || question.expectedSignals} tone="good" />
            <Panel title="Key points to cover" items={question.keyPointsToCover || question.expectedSignals} />
            <Panel title="Common mistakes" items={question.commonMistakes || ["Being too generic"]} />
            <Panel title="Follow-up questions" items={question.followUpQuestions || []} tone="good" />
          </div>
          <div className="mt-5 rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
            <p className="text-sm font-semibold text-white">Sample strong answer</p>
            <p className="mt-2 text-sm leading-6 text-zinc-400">{question.sampleStrongAnswer}</p>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button onClick={prepareCurrentAnswer} disabled={preparing} icon={preparing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}>
              {preparing ? "Preparing..." : "How to answer this"}
            </Button>
            <Button variant="secondary" onClick={() => setActiveTab("answer")}>Start answer</Button>
          </div>
        </Card>
      )}

      {activeTab === "prepare" && (
        <SectionCard title="How to answer this" body="Use this prep to structure your response before you submit for evaluation.">
          {!preparation ? (
            <div className="space-y-4">
              <p className="text-sm text-zinc-400">Generate a tailored answer plan for this question.</p>
              <Button onClick={prepareCurrentAnswer} disabled={preparing} icon={preparing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}>
                {preparing ? "Preparing..." : "Prepare answer"}
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              <Badge tone={preparation.source === "gemini" ? "success" : "warning"}>{preparation.source === "gemini" ? "AI Generated" : "Fallback Mode"}</Badge>
              <p className="text-sm leading-6 text-zinc-300">{preparation.answerStrategy}</p>
              <div className="grid gap-4 md:grid-cols-2">
                <Panel title="Key points to mention" items={preparation.keyPointsToMention} tone="good" />
                <Panel title="Phrases to use" items={preparation.phrasesToUse} />
                <Panel title="Phrases to avoid" items={preparation.phrasesToAvoid} />
                <Panel title="Possible follow-up questions" items={preparation.followUpPrep} tone="good" />
              </div>
              {preparation.starFramework && <Framework title="STAR framework" rows={preparation.starFramework} />}
              {preparation.technicalFramework && (
                <div className="grid gap-4 md:grid-cols-2">
                  <Panel title="Tradeoffs" items={preparation.technicalFramework.tradeoffs} />
                  <Panel title="Edge cases" items={preparation.technicalFramework.edgeCases} />
                  <Panel title="Performance considerations" items={preparation.technicalFramework.performanceConsiderations} />
                  <Panel title="Confidence tips" items={preparation.confidenceTips} tone="good" />
                </div>
              )}
              <AnswerBlock title="Sample strong answer" text={preparation.sampleStrongAnswer} />
              <AnswerBlock title="Short version" text={preparation.shorterVersion} />
              {preparation.seniorLevelVersion && <AnswerBlock title="Senior-level version" text={preparation.seniorLevelVersion} />}
            </div>
          )}
        </SectionCard>
      )}

      {activeTab === "answer" && (
        <SectionCard title="Answer" body="Use STAR for behavioral answers and be specific about your personal contribution and measurable result.">
          <Textarea className="min-h-48" value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Situation: ...&#10;Task: ...&#10;Action: ...&#10;Result: ..." aria-label="Interview answer" />
          <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <p className="text-sm text-zinc-500">{answer.trim().split(/\s+/).filter(Boolean).length} words drafted</p>
            <Button onClick={submitAnswer} disabled={submitting} icon={submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}>
              {submitting ? "Evaluating..." : "Get feedback"}
            </Button>
          </div>
        </SectionCard>
      )}

      {activeTab === "feedback" && feedback && (
        <Card elevated className="space-y-6 p-6 md:p-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="success"><CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />Feedback ready</Badge>
                <Badge tone={feedback.source === "gemini" ? "success" : "warning"}>{feedback.source === "gemini" ? "AI Generated" : "Fallback Mode"}</Badge>
              </div>
              <h2 className="mt-3 text-2xl font-semibold text-white">Coaching report: {feedback.answerQualityGrade}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">Use this as a practical revision guide, not a final judgment. The strongest answers improve through one focused iteration at a time.</p>
            </div>
            <ScoreRing value={feedback.overallScore} label="Overall answer score" />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <ScoreCard label="Content" value={`${feedback.contentScore}/100`} helper="Substance and examples" />
            <ScoreCard label="Structure" value={`${feedback.structureScore}/100`} helper="STAR sequencing" />
            <ScoreCard label="Confidence" value={`${feedback.confidenceScore}/100`} helper="Delivery signal" />
            <ScoreCard label="Relevance" value={`${feedback.relevanceScore}/100`} helper="Answers the question" />
            <ScoreCard label="Technical depth" value={`${feedback.technicalDepthScore}/100`} helper="Tradeoffs and edge cases" />
            <ScoreCard label="Speech" value={`${feedback.speechScore}/100`} helper="Text-based estimate" />
          </div>

          <div className="grid gap-4 lg:grid-cols-4">
            {(["situation", "task", "action", "result"] as const).map((part) => (
              <div key={part} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-200">{part}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{feedback.starBreakdown[part]}/100</p>
              </div>
            ))}
          </div>
          <p className="text-sm leading-6 text-zinc-400">{feedback.starBreakdown.comments}</p>

          <div className="grid gap-4 md:grid-cols-2">
            <Panel title="Strengths" items={feedback.strengths} tone="good" />
            <Panel title="Weak areas" items={feedback.weakAreas} />
            <Panel title="Missing points" items={feedback.missingPoints} />
            <Panel title="Improvement tips" items={feedback.improvementTips} />
            <Panel title="Follow-up questions" items={feedback.followUpQuestions} />
            <Panel title="Next practice" items={[feedback.nextPracticeRecommendation]} tone="good" />
          </div>

          <div className="rounded-xl border border-emerald-300/15 bg-emerald-300/[0.045] p-5">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <h3 className="text-base font-semibold text-white">Better answer draft</h3>
              <Button variant="secondary" size="sm" onClick={copyImprovedAnswer} icon={<Clipboard className="h-4 w-4" />}>{copied ? "Copied" : "Copy answer"}</Button>
            </div>
            <pre className="mt-4 whitespace-pre-wrap rounded-lg border border-white/[0.08] bg-zinc-950/80 p-4 text-sm leading-6 text-zinc-300">{feedback.betterAnswer}</pre>
          </div>

          <div className="rounded-xl border border-sky-300/15 bg-sky-300/[0.045] p-5">
            <h3 className="text-base font-semibold text-white">Best answer example</h3>
            <pre className="mt-4 whitespace-pre-wrap rounded-lg border border-white/[0.08] bg-zinc-950/80 p-4 text-sm leading-6 text-zinc-300">{feedback.bestAnswerExample}</pre>
          </div>

          <div className="flex flex-col justify-end gap-3 sm:flex-row">
            <Button variant="secondary" onClick={onExit}>Return to dashboard</Button>
            <Button onClick={nextQuestion}>{index < questions.length - 1 ? "Next question" : "Complete session"}</Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function Panel({ title, items, tone = "neutral" }: { title: string; items: string[]; tone?: "neutral" | "good" }) {
  return (
    <div className={`rounded-xl border p-4 ${tone === "good" ? "border-emerald-300/15 bg-emerald-300/[0.035]" : "border-white/[0.08] bg-white/[0.03]"}`}>
      <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-500">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}

function Framework({ title, rows }: { title: string; rows: Record<string, string> }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
      <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {Object.entries(rows).map(([key, value]) => (
          <div key={key} className="rounded-lg border border-white/[0.08] bg-zinc-950/60 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{key}</p>
            <p className="mt-2 text-sm leading-6 text-zinc-300">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnswerBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
      <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-400">{text}</p>
    </div>
  );
}
