import { useRef, useState } from "react";
import { BriefcaseBusiness, Download, Loader2, LockKeyhole, ShieldCheck, Sparkles, Upload } from "lucide-react";
import { Alert } from "../../components/ui/Alert";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ConfidenceBadge } from "../../components/ui/ConfidenceBadge";
import { CTABlock } from "../../components/ui/CTABlock";
import { Input } from "../../components/ui/Input";
import { PageHeader } from "../../components/ui/PageHeader";
import { Progress } from "../../components/ui/Progress";
import { ScoreCard } from "../../components/ui/ScoreCard";
import { SectionCard } from "../../components/ui/SectionCard";
import { StepIndicator } from "../../components/ui/StepIndicator";
import { Textarea } from "../../components/ui/Textarea";
import { api } from "../../services/api";
import { CVProfile, CvAnalysisResult, ImprovedCv, InterviewMode, JobMatchAnalysis, UserProfile } from "../../types";

const roles = ["Frontend Developer", "Backend Engineer", "Full Stack Developer", "Data Scientist", "AI/ML Engineer", "DevOps Engineer", "Product Manager", "UI/UX Designer", "Cybersecurity Analyst", "QA Engineer", "Mobile Developer", "Healthcare Professional", "Finance Analyst", "Marketing Manager"];
const levels = ["0-2 years (Junior)", "3-5 years (Mid)", "6-9 years (Senior)", "10+ years (Staff/Principal)"];
const domains = ["Frontend Development", "Backend Engineering", "Full Stack Development", "Data Science", "AI/ML Engineering", "DevOps / Cloud", "Product Management", "UI/UX Design", "Cybersecurity", "QA / Testing", "Mobile App Development", "Medical / Healthcare", "Finance / Accounting", "Marketing / Sales", "General / Unknown"];

export function OnboardingPage({ user, onComplete }: { user: UserProfile; onComplete: (user: UserProfile, cvProfile: CVProfile | null) => void }) {
  const [targetRole, setTargetRole] = useState(user.targetRole || "Backend Engineer");
  const [experienceLevel, setExperienceLevel] = useState(user.experienceLevel || "3-5 years (Mid)");
  const [dreamCompany, setDreamCompany] = useState(user.dreamCompany || "");
  const [interviewDate, setInterviewDate] = useState(user.interviewDate || "");
  const [preferredMode, setPreferredMode] = useState<InterviewMode>(user.preferredMode || "daily");
  const [cvText, setCvText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cvProfile, setCvProfile] = useState<CVProfile | null>(null);
  const [analysis, setAnalysis] = useState<CvAnalysisResult | null>(null);
  const [improvedCv, setImprovedCv] = useState<ImprovedCv | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [jobMatch, setJobMatch] = useState<JobMatchAnalysis | null>(null);
  const [jobTailoredCv, setJobTailoredCv] = useState<ImprovedCv | null>(null);
  const [jobMatchError, setJobMatchError] = useState("");
  const [jobMatchLoading, setJobMatchLoading] = useState(false);
  const [tailoredLoading, setTailoredLoading] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const activeStep = analysis ? 2 : selectedFile || cvText.trim().length > 20 ? 1 : 0;

  async function analyzeCV() {
    setLoading(true);
    setError("");
    try {
      const result = await api.uploadAnalyzeCV({ file: selectedFile || undefined, cvText: cvText.trim() || undefined });
      setAnalysis(result.analysis);
      setImprovedCv(result.analysis.improvedCv);
      setCvProfile(result.cvProfile);
      setJobMatch(null);
      setJobTailoredCv(null);
      setJobMatchError("");
      setTargetRole(result.analysis.detectedRole || targetRole);
      setExperienceLevel(result.analysis.experienceLevel || experienceLevel);
    } catch (err) {
      setError(err instanceof Error ? err.message : "CV analysis failed.");
    } finally {
      setLoading(false);
    }
  }

  async function refreshImprovedCV() {
    if (!analysis) return;
    setLoading(true);
    setError("");
    try {
      const result = await api.generateImprovedCV({ analysis, originalCvText: cvText });
      setImprovedCv(result.improvedCv);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate improved CV.");
    } finally {
      setLoading(false);
    }
  }

  async function analyzeJobMatch() {
    if (!analysis) return;
    setJobMatchLoading(true);
    setJobMatchError("");
    try {
      const result = await api.jobMatchCV({ cvText: cvText.trim(), cvAnalysis: analysis, jobDescription: jobDescription.trim() });
      setJobMatch(result.jobMatchAnalysis);
      setJobTailoredCv(null);
    } catch (err) {
      setJobMatchError(err instanceof Error ? err.message : "Could not analyze job match.");
    } finally {
      setJobMatchLoading(false);
    }
  }

  async function generateTailoredCv() {
    if (!analysis || !jobMatch) return;
    setTailoredLoading(true);
    setJobMatchError("");
    try {
      const result = await api.generateJobTailoredCV({
        originalCvText: cvText.trim(),
        improvedCv: jobTailoredCv || improvedCv || undefined,
        cvAnalysis: analysis,
        jobDescription: jobDescription.trim(),
        jobMatchAnalysis: jobMatch,
      });
      setJobTailoredCv(result.improvedCv);
    } catch (err) {
      setJobMatchError(err instanceof Error ? err.message : "Could not generate job-tailored CV.");
    } finally {
      setTailoredLoading(false);
    }
  }

  async function download(format: "docx" | "pdf", variant: "general" | "job-tailored" = "general") {
    const currentCv = variant === "job-tailored" ? jobTailoredCv : improvedCv;
    if (!currentCv) return;
    const blob = format === "docx" ? await api.downloadDocx(currentCv, variant) : await api.downloadPdf(currentCv, variant);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = variant === "job-tailored" ? `job-tailored-ats-cv.${format}` : `ats-friendly-cv.${format}`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function chooseFile(file: File) {
    setError("");
    const extensionOk = /\.(pdf|docx|doc|txt|md)$/i.test(file.name);
    if (!extensionOk) return setError("Upload PDF, DOCX, DOC, TXT, or MD.");
    if (file.size > 10 * 1024 * 1024) return setError("Please keep resume files under 10 MB.");
    setSelectedFile(file);
  }

  async function finish() {
    setLoading(true);
    setError("");
    try {
      const { user: updatedUser } = await api.saveProfile({ targetRole, experienceLevel, dreamCompany, interviewDate, preferredMode });
      onComplete(updatedUser, cvProfile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save profile.");
    } finally {
      setLoading(false);
    }
  }

  function updateImprovedField<K extends keyof ImprovedCv>(key: K, value: ImprovedCv[K]) {
    if (!improvedCv) return;
    setImprovedCv({ ...improvedCv, [key]: value });
  }

  function updateTailoredField<K extends keyof ImprovedCv>(key: K, value: ImprovedCv[K]) {
    if (!jobTailoredCv) return;
    setJobTailoredCv({ ...jobTailoredCv, [key]: value });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <PageHeader eyebrow="CV and interview setup" title="Analyze your CV and build an ATS-friendly draft" body="Upload PDF, DOCX, DOC, TXT, or paste your resume. The server extracts readable text, analyzes ATS structure, and uses the detected role to personalize interview questions." />
        <Badge tone="info" className="w-fit"><LockKeyhole className="mr-1.5 h-3.5 w-3.5" />Server-side AI processing</Badge>
      </div>

      <StepIndicator steps={["Profile", "Analyze CV", "Improve"]} activeIndex={activeStep} />
      {error && <Alert>{error}</Alert>}
      {analysis?.extractionWarnings?.map((warning) => <Alert key={warning} tone="info">{warning}</Alert>)}

      <div className="grid gap-6 lg:grid-cols-[0.78fr_1.22fr]">
        <SectionCard title="Target profile" body="These details anchor your interview plan and recommended practice mode.">
          <div className="space-y-5">
            <label className="block">
              <span className="mb-1.5 block text-sm text-zinc-400">Target role</span>
              <select value={targetRole} onChange={(event) => setTargetRole(event.target.value)} className="w-full rounded-lg border border-white/10 bg-zinc-950/80 px-3.5 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-300">
                {roles.map((role) => <option key={role}>{role}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm text-zinc-400">Experience level</span>
              <select value={experienceLevel} onChange={(event) => setExperienceLevel(event.target.value)} className="w-full rounded-lg border border-white/10 bg-zinc-950/80 px-3.5 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-300">
                {levels.map((level) => <option key={level}>{level}</option>)}
              </select>
            </label>
            <Input value={dreamCompany} onChange={(event) => setDreamCompany(event.target.value)} placeholder="Dream company, optional" aria-label="Dream company" />
            <Input value={interviewDate} onChange={(event) => setInterviewDate(event.target.value)} placeholder="Interview date or deadline, optional" aria-label="Interview date or deadline" />
            <div>
              <p className="mb-2 text-sm text-zinc-400">Preferred practice focus</p>
              <div className="grid grid-cols-2 gap-2">
                {(["daily", "mock", "coding", "behavioral"] as const).map((item) => (
                  <Button key={item} type="button" variant={preferredMode === item ? "primary" : "secondary"} onClick={() => setPreferredMode(item)}>
                    {item}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Upload or paste CV" body="Your CV is processed on the server for AI analysis. Avoid uploading highly confidential information." action={<Badge tone="success"><ShieldCheck className="mr-1.5 h-3.5 w-3.5" />No raw CV logs</Badge>}>
          <div className="space-y-5">
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt,.md" className="hidden" onChange={(event) => event.target.files?.[0] && chooseFile(event.target.files[0])} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              onDragEnter={(event) => { event.preventDefault(); setDragActive(true); }}
              onDragOver={(event) => { event.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragActive(false);
                if (event.dataTransfer.files[0]) chooseFile(event.dataTransfer.files[0]);
              }}
              className={`group flex w-full items-center justify-center gap-3 rounded-xl border border-dashed p-8 text-zinc-300 transition ${dragActive ? "border-emerald-300/70 bg-emerald-300/[0.06]" : "border-white/12 bg-white/[0.025] hover:border-emerald-300/60 hover:bg-emerald-300/[0.04]"}`}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-300/10 text-emerald-200">
                <Upload className="h-5 w-5" />
              </span>
              <span className="text-left">
                <span className="block text-sm font-semibold text-white">{selectedFile ? selectedFile.name : "Drop or upload resume file"}</span>
                <span className="mt-1 block text-xs text-zinc-500">{selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB selected` : "PDF, DOCX, DOC, TXT, or MD under 10 MB"}</span>
              </span>
            </button>

            <Textarea rows={8} value={cvText} onChange={(event) => setCvText(event.target.value)} placeholder="Or paste resume text here..." aria-label="Paste resume text" />
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="secondary" onClick={() => setCvText(sampleResume)}>Use sample resume</Button>
              <Button type="button" onClick={analyzeCV} disabled={loading || (!selectedFile && cvText.trim().length < 20)} icon={loading ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}>
                {loading ? "Analyzing..." : "Analyze CV"}
              </Button>
            </div>
          </div>
        </SectionCard>
      </div>

      {analysis && (
        <div className="space-y-6">
          <SectionCard title="CV analysis results" body="Estimated ATS score is based on general resume best practices unless a job description is provided in a future version.">
            <div className="grid gap-4 md:grid-cols-4">
              <ScoreCard label="Estimated ATS score" value={analysis.atsScore == null ? "Unavailable" : `${analysis.atsScore}/100`} helper={analysis.atsGrade} />
              <ScoreCard label="Detected domain" value={analysis.detectedDomain} helper={analysis.detectedRole} />
              <ScoreCard label="Experience" value={analysis.experienceLevel} helper={analysis.yearsOfExperience == null ? "Years unclear" : `${analysis.yearsOfExperience} years`} />
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.035] p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Domain confidence</p>
                <div className="mt-3"><ConfidenceBadge value={analysis.domainConfidenceScore} fallback={analysis.aiUnavailable} /></div>
              </div>
            </div>
            <p className="mt-5 text-sm leading-6 text-zinc-400">{analysis.summary}</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {Object.entries(analysis.sectionScores).map(([key, value]) => (
                <Progress key={key} value={value} label={key.replace(/([A-Z])/g, " $1")} />
              ))}
            </div>
          </SectionCard>

          <div className="grid gap-6 lg:grid-cols-2">
            <SummaryPanel title="Detected skills" items={[...analysis.technicalSkills, ...analysis.toolsAndTechnologies].slice(0, 12)} />
            <SummaryPanel title="Missing keywords" items={analysis.missingKeywords} />
            <SummaryPanel title="Weaknesses or gaps" items={analysis.weaknessesOrGaps} />
            <SummaryPanel title="Custom interview questions" items={analysis.customInterviewQuestions} />
          </div>

          <SectionCard title="ATS issues and recommendations" body="These are improvement targets for readability, keywords, formatting, and recruiter scanning.">
            <div className="space-y-3">
              {analysis.atsIssues.map((issue) => (
                <div key={`${issue.section}-${issue.issue}`} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={issue.severity === "high" ? "warning" : issue.severity === "medium" ? "info" : "success"}>{issue.severity}</Badge>
                    <p className="font-semibold text-white">{issue.section}: {issue.issue}</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{issue.recommendation}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Match Against a Job Description"
            body="Paste a job description to get a more accurate, role-specific ATS match."
            action={<Badge tone="info"><BriefcaseBusiness className="mr-1.5 h-3.5 w-3.5" />Optional</Badge>}
          >
            <div className="space-y-4">
              <Textarea
                rows={8}
                value={jobDescription}
                onChange={(event) => setJobDescription(event.target.value)}
                placeholder="Paste the target job description here..."
                aria-label="Target job description"
              />
              {jobMatchError && <Alert>{jobMatchError}</Alert>}
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  onClick={analyzeJobMatch}
                  disabled={jobMatchLoading || jobDescription.trim().length < 40}
                  icon={jobMatchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                >
                  {jobMatchLoading ? "Analyzing match..." : "Analyze Job Match"}
                </Button>
                <p className="text-sm text-zinc-500">Estimated ATS Match uses the job description when available and stays server-side.</p>
              </div>
            </div>
          </SectionCard>

          {jobMatch && (
            <SectionCard title="Job-Specific CV Match" body={jobMatch.localAnalysisOnly ? "Basic local keyword overlap only. AI job matching is temporarily unavailable." : "Estimated match based on the CV evidence and target job description."}>
              <div className="grid gap-4 md:grid-cols-4">
                <ScoreCard label="Estimated ATS Match" value={`${jobMatch.matchScore}/100`} helper={jobMatch.matchGrade} />
                <ScoreCard label="Target role" value={jobMatch.targetRoleDetected} helper="Detected from JD" />
                <ScoreCard label="Seniority" value={jobMatch.jobSeniorityDetected} helper="Detected from JD" />
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.035] p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Scoring note</p>
                  <p className="mt-3 text-sm leading-6 text-zinc-300">{jobMatch.localAnalysisOnly ? "Basic overlap" : "AI estimate"}</p>
                </div>
              </div>
              <p className="mt-5 text-sm leading-6 text-zinc-400">{jobMatch.roleAlignmentSummary}</p>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <AlignmentPanel title="Experience alignment" score={jobMatch.experienceAlignment.score} summary={jobMatch.experienceAlignment.summary} />
                <AlignmentPanel title="Skills alignment" score={jobMatch.skillsAlignment.score} summary={jobMatch.skillsAlignment.summary} />
                <AlignmentPanel title="Keyword alignment" score={jobMatch.keywordAlignment.score} summary={jobMatch.keywordAlignment.summary} />
                <AlignmentPanel title="Education alignment" score={jobMatch.educationAlignment.score} summary={jobMatch.educationAlignment.summary} />
              </div>
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <SummaryPanel title="Matched keywords" items={jobMatch.matchedKeywords} />
                <SummaryPanel title="Missing keywords" items={jobMatch.missingKeywords} />
                <SummaryPanel title="Important required skills" items={jobMatch.importantRequiredSkills} />
                <SummaryPanel title="Optional skills" items={jobMatch.optionalSkills} />
              </div>
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-white">Gaps and recommendations</p>
                  {jobMatch.gaps.length ? jobMatch.gaps.map((gap) => (
                    <Card key={`${gap.gap}-${gap.severity}`} className="p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={gap.severity === "high" ? "warning" : gap.severity === "medium" ? "info" : "success"}>{gap.severity}</Badge>
                        <p className="font-semibold text-white">{gap.gap}</p>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-zinc-400">{gap.recommendation}</p>
                    </Card>
                  )) : <p className="text-sm text-zinc-500">No major gaps returned.</p>}
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-white">Tailored CV Suggestions</p>
                  {jobMatch.recommendedCvUpdates.map((update) => (
                    <Card key={`${update.section}-${update.currentIssue}`} className="p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="info">{update.section}</Badge>
                        <p className="font-semibold text-white">{update.currentIssue}</p>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-zinc-400">{update.suggestedUpdate}</p>
                    </Card>
                  ))}
                </div>
              </div>
              <div className="mt-5 rounded-xl border border-emerald-300/15 bg-emerald-300/[0.04] p-4">
                <p className="text-sm font-semibold text-emerald-100">Improve alignment with this role</p>
                <p className="mt-2 text-sm leading-6 text-zinc-300">{jobMatch.tailoredCvStrategy}</p>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button type="button" onClick={generateTailoredCv} disabled={tailoredLoading} icon={tailoredLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}>
                  {tailoredLoading ? "Generating..." : "Generate Job-Tailored CV"}
                </Button>
              </div>
            </SectionCard>
          )}
        </div>
      )}

      {improvedCv && (
        <SectionCard title="Improved ATS-friendly CV" body="Edit the generated structure before downloading. The layout avoids tables, icons, columns, images, and text boxes.">
          <div className="grid gap-4 lg:grid-cols-2">
            <Input value={improvedCv.candidateName || ""} onChange={(event) => updateImprovedField("candidateName", event.target.value)} placeholder="Candidate name" aria-label="Candidate name" />
            <Input value={improvedCv.headline} onChange={(event) => updateImprovedField("headline", event.target.value)} placeholder="Headline" aria-label="CV headline" />
          </div>
          <Textarea className="mt-4" rows={4} value={improvedCv.professionalSummary} onChange={(event) => updateImprovedField("professionalSummary", event.target.value)} aria-label="Professional summary" />
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <EditableList title="Skills" items={improvedCv.skills} onChange={(items) => updateImprovedField("skills", items)} />
            <EditableList title="Experience bullets" items={improvedCv.experienceBullets} onChange={(items) => updateImprovedField("experienceBullets", items)} />
            <EditableList title="Project bullets" items={improvedCv.projectBullets} onChange={(items) => updateImprovedField("projectBullets", items)} />
            <EditableList title="Education" items={improvedCv.education} onChange={(items) => updateImprovedField("education", items)} />
            <EditableList title="Certifications" items={improvedCv.certifications} onChange={(items) => updateImprovedField("certifications", items)} />
            <EditableList title="ATS keywords" items={improvedCv.atsKeywords} onChange={(items) => updateImprovedField("atsKeywords", items)} />
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button type="button" variant="secondary" onClick={refreshImprovedCV} disabled={loading}>Regenerate improved CV</Button>
            <Button type="button" onClick={() => download("docx")} icon={<Download className="h-4 w-4" />}>Download ATS-Friendly DOCX</Button>
            <Button type="button" variant="secondary" onClick={() => download("pdf")} icon={<Download className="h-4 w-4" />}>Download ATS-Friendly PDF</Button>
          </div>
        </SectionCard>
      )}

      {jobTailoredCv && (
        <SectionCard title="Download Job-Tailored ATS-Friendly CV" body="This version is tailored to the pasted job description. Review every suggestion and keep only truthful claims.">
          <div className="grid gap-4 lg:grid-cols-2">
            <Input value={jobTailoredCv.candidateName || ""} onChange={(event) => updateTailoredField("candidateName", event.target.value)} placeholder="Candidate name" aria-label="Job-tailored candidate name" />
            <Input value={jobTailoredCv.headline} onChange={(event) => updateTailoredField("headline", event.target.value)} placeholder="Headline" aria-label="Job-tailored CV headline" />
          </div>
          <Textarea className="mt-4" rows={4} value={jobTailoredCv.professionalSummary} onChange={(event) => updateTailoredField("professionalSummary", event.target.value)} aria-label="Job-tailored professional summary" />
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <EditableList title="Skills" items={jobTailoredCv.skills} onChange={(items) => updateTailoredField("skills", items)} />
            <EditableList title="Experience bullets" items={jobTailoredCv.experienceBullets} onChange={(items) => updateTailoredField("experienceBullets", items)} />
            <EditableList title="Project bullets" items={jobTailoredCv.projectBullets} onChange={(items) => updateTailoredField("projectBullets", items)} />
            <EditableList title="Education" items={jobTailoredCv.education} onChange={(items) => updateTailoredField("education", items)} />
            <EditableList title="Certifications" items={jobTailoredCv.certifications} onChange={(items) => updateTailoredField("certifications", items)} />
            <EditableList title="ATS keywords" items={jobTailoredCv.atsKeywords} onChange={(items) => updateTailoredField("atsKeywords", items)} />
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button type="button" onClick={() => download("docx", "job-tailored")} icon={<Download className="h-4 w-4" />}>Download Job-Tailored DOCX</Button>
            <Button type="button" variant="secondary" onClick={() => download("pdf", "job-tailored")} icon={<Download className="h-4 w-4" />}>Download Job-Tailored PDF</Button>
            <Button type="button" variant="secondary" onClick={finish} disabled={loading}>Continue to Personalized Interview</Button>
          </div>
        </SectionCard>
      )}

      <CTABlock
        title="Continue to personalized interview practice"
        body={analysis ? "Your detected domain, role, and custom interview questions will influence the next question set." : "You can continue without ATS analysis, but analyzing a CV gives stronger personalization."}
        action={<Button onClick={finish} disabled={loading} size="lg">{loading ? "Saving..." : "Continue to dashboard"}</Button>}
      />
    </div>
  );
}

function SummaryPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <Card className="p-5">
      <p className="text-sm font-semibold text-white">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.length ? items.map((item) => <Badge key={item}>{item}</Badge>) : <p className="text-sm text-zinc-500">No items detected.</p>}
      </div>
    </Card>
  );
}

function AlignmentPanel({ title, score, summary }: { title: string; score: number; summary: string }) {
  return (
    <Card className="p-4">
      <Progress value={score} label={title} />
      <p className="mt-3 text-sm leading-6 text-zinc-400">{summary}</p>
    </Card>
  );
}

function EditableList({ title, items, onChange }: { title: string; items: string[]; onChange: (items: string[]) => void }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-zinc-400">{title}</span>
      <Textarea rows={5} value={items.join("\n")} onChange={(event) => onChange(event.target.value.split("\n").map((item) => item.trim()).filter(Boolean))} />
    </label>
  );
}

const sampleResume = `Senior Backend Engineer with 5 years of experience.
Built Node.js and PostgreSQL APIs serving 120K users.
Reduced payment latency by 38% using Redis caching and query indexing.
Skills: TypeScript, Node.js, Express, PostgreSQL, Docker, AWS, Redis.
Led migration from a monolith to microservices and mentored 4 engineers.`;
