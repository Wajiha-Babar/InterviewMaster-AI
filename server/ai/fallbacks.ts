import { AnswerPreparation, CVProfile, InterviewFeedback, InterviewQuestion, QuestionCategory } from "../types/domain";

const domainSignals: Array<{ domain: string; role: string; signals: string[] }> = [
  { domain: "Frontend Development", role: "Frontend Developer", signals: ["react", "vue", "angular", "css", "frontend", "accessibility"] },
  { domain: "Backend Engineering", role: "Backend Engineer", signals: ["node", "express", "api", "postgres", "microservice", "backend", "redis"] },
  { domain: "Data Science", role: "Data Scientist", signals: ["pandas", "statistics", "sql", "experiment", "data science"] },
  { domain: "AI/ML Engineering", role: "AI/ML Engineer", signals: ["machine learning", "tensorflow", "pytorch", "llm", "nlp", "model"] },
  { domain: "DevOps / Cloud", role: "DevOps Engineer", signals: ["aws", "azure", "gcp", "kubernetes", "docker", "terraform", "ci/cd"] },
  { domain: "Product Management", role: "Product Manager", signals: ["roadmap", "product", "scrum", "stakeholder", "retention"] },
  { domain: "UI/UX Design", role: "Product Designer", signals: ["figma", "wireframe", "ux", "research", "prototype"] },
  { domain: "Cybersecurity", role: "Security Analyst", signals: ["security", "threat", "siem", "vulnerability", "incident"] },
  { domain: "QA / Testing", role: "QA Engineer", signals: ["testing", "qa", "selenium", "playwright", "automation"] },
  { domain: "Mobile App Development", role: "Mobile Developer", signals: ["ios", "android", "react native", "flutter", "swift", "kotlin"] },
  { domain: "Medical / Healthcare", role: "Healthcare Professional", signals: ["clinical", "patient", "medical", "healthcare", "hospital"] },
  { domain: "Finance / Accounting", role: "Finance Analyst", signals: ["finance", "accounting", "audit", "ledger", "portfolio"] },
  { domain: "Marketing / Sales", role: "Marketing Manager", signals: ["marketing", "sales", "campaign", "pipeline", "conversion"] },
];

export function fallbackCVParser(cvContent: string): CVProfile {
  const normalized = cvContent.toLowerCase();
  const matched = domainSignals
    .map((entry) => ({ ...entry, score: entry.signals.filter((signal) => normalized.includes(signal)).length }))
    .sort((a, b) => b.score - a.score)[0];

  const detectedDomain = matched?.score ? matched.domain : "General / Unknown";
  const detectedRole = matched?.score ? matched.role : "General Candidate";
  const years = Number(cvContent.match(/(\d+)\+?\s*years?/i)?.[1] || 0);
  const technicalSkills = extractKeywords(normalized, [
    "React", "TypeScript", "JavaScript", "Node.js", "Express", "Python", "SQL", "PostgreSQL",
    "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Terraform", "Pandas", "TensorFlow", "PyTorch",
    "Figma", "Playwright", "Redis", "MongoDB",
  ]);
  const softSkills = extractKeywords(normalized, ["Leadership", "Communication", "Mentoring", "Stakeholder Management", "Collaboration"]);
  const lines = cvContent.split(/[.\n]/).map((line) => line.trim()).filter(Boolean);
  const achievements = lines.filter((line) => /\d+%|\$\d+|\d+\s*(users|patients|requests|teams|revenue|latency)/i.test(line)).slice(0, 4);
  const projects = lines.filter((line) => /(built|designed|implemented|launched|created|led)/i.test(line) && line.length > 30).slice(0, 4);

  return {
    detectedDomain,
    detectedRole,
    confidenceScore: matched?.score ? Math.min(0.95, 0.45 + matched.score * 0.12) : 0.35,
    experienceLevel: years >= 6 ? "Senior" : years >= 3 ? "Mid" : "Early career",
    yearsOfExperience: years,
    technicalSkills: technicalSkills.length ? technicalSkills : ["Communication", "Problem Solving"],
    softSkills: softSkills.length ? softSkills : ["Collaboration"],
    tools: technicalSkills.filter((skill) => ["Docker", "Kubernetes", "AWS", "Azure", "GCP", "Figma", "Playwright"].includes(skill)),
    projects: projects.length ? projects : ["No clear project descriptions were detected."],
    achievements: achievements.length ? achievements : ["No quantified achievements were detected."],
    education: lines.filter((line) => /(university|college|bachelor|master|degree|certification)/i.test(line)).slice(0, 3),
    weaknessesOrGaps: ["Add more quantified impact metrics.", "Prepare deeper examples for your most important project claims."],
    suggestedInterviewTracks: ["behavioral", "technical", "cv_deep_dive"],
    customQuestions: [
      `Walk me through the most complex ${detectedDomain} project on your CV and the tradeoffs you personally owned.`,
      "Which metric best proves your impact, and how did you measure the baseline?",
      "What would you improve if you rebuilt one listed project today?",
    ],
    summary: `Detected ${detectedDomain} profile with ${years || "unclear"} years of experience.`,
    isFallback: true,
  };
}

export function fallbackQuestions(input: { targetRole?: string; experienceLevel?: string; mode?: string; cvProfile?: CVProfile | null }): InterviewQuestion[] {
  const role = input.cvProfile?.detectedRole || input.targetRole || "General Candidate";
  const domain = input.cvProfile?.detectedDomain || role;
  const skills = input.cvProfile?.technicalSkills?.slice(0, 4).join(", ") || "your core skills";
  const base: InterviewQuestion[] = [
    {
      id: "q_technical_1",
      text: `For a ${role} role, explain a difficult technical decision you made using ${skills}. What alternatives did you reject?`,
      category: "technical",
      difficulty: "hard",
      expectedSignals: ["tradeoffs", "specific ownership", "clear constraints"],
      hint: "Name the constraint, options, decision, and measurable outcome.",
      whyAsked: `Interviewers ask this to verify that your ${skills} experience is practical, not just keyword-level.`,
      whatInterviewerWants: ["A real decision", "Clear alternatives", "Tradeoffs", "Evidence of impact"],
      keyPointsToCover: ["Context and constraint", "Options considered", "Your recommendation", "Measured result"],
      commonMistakes: ["Speaking generally", "Not naming rejected alternatives", "Skipping the business impact"],
      idealAnswerStructure: ["Problem", "Options", "Decision", "Result", "Learning"],
      sampleStrongAnswer: `In my ${role} work, I would frame the answer around one real project, name the constraint, compare two alternatives, explain why I chose one, and close with the measured operational or user impact.`,
      personalizedHints: [`Anchor the answer in ${domain}.`, `Use one of these skills if truthful: ${skills}.`],
      prepTime: 45,
      answerTime: 150,
      followUpQuestions: ["What changed after implementation?", "How did you validate the decision?"],
      scoringRubric: {
        clarity: "Explains the decision in a simple sequence.",
        relevance: `Connects directly to ${role} responsibilities.`,
        depth: "Covers alternatives, tradeoffs, and validation.",
        examples: "Uses a concrete project and measurable outcome.",
      },
    },
    {
      id: "q_cv_1",
      text: `Choose one project from your CV and defend the impact claim as if the interviewer is skeptical.`,
      category: "cv_deep_dive",
      difficulty: "medium",
      expectedSignals: ["baseline", "metrics", "personal contribution"],
      hint: "Use STAR and include numbers where possible.",
      whyAsked: "CV deep-dive questions test whether your resume claims are defensible under follow-up.",
      whatInterviewerWants: ["Project ownership", "Baseline metric", "Technical or business depth", "Honesty about limits"],
      keyPointsToCover: ["Project context", "Your role", "Hardest decision", "Impact proof"],
      commonMistakes: ["Repeating the resume bullet", "Saying only what the team did", "No metric or before/after"],
      idealAnswerStructure: ["Situation", "Task", "Action", "Result", "Reflection"],
      sampleStrongAnswer: "A strong answer chooses one project, explains the original problem, states the candidate's exact responsibility, describes two or three high-leverage actions, and ends with a measurable result plus a lesson learned.",
      personalizedHints: input.cvProfile?.projects?.slice(0, 2) || ["Pick your strongest project claim."],
      prepTime: 45,
      answerTime: 150,
      followUpQuestions: ["What was hardest to debug?", "What did you learn?"],
      scoringRubric: {
        clarity: "The story is easy to follow.",
        relevance: "The project maps to the target role.",
        depth: "Explains technical and execution detail.",
        examples: "Includes numbers, artifacts, or concrete outcomes.",
      },
    },
    {
      id: "q_role_1",
      text: `What are the most important risks in a ${domain} role at your experience level, and how do you reduce them?`,
      category: "role_specific",
      difficulty: "medium",
      expectedSignals: ["domain awareness", "risk management", "prioritization"],
      hint: "Connect role risks to practical mitigations.",
      whyAsked: "Role-specific risk questions test judgment and seniority calibration.",
      whatInterviewerWants: ["Domain awareness", "Prioritization", "Practical mitigations"],
      keyPointsToCover: ["Top risks", "Why they matter", "How you reduce them", "How you monitor outcomes"],
      commonMistakes: ["Listing too many risks", "Ignoring tradeoffs", "No prevention plan"],
      idealAnswerStructure: ["Risk", "Impact", "Mitigation", "Measurement"],
      sampleStrongAnswer: `For a ${domain} role, I would identify the highest customer or system risk first, explain the failure mode, describe preventive controls, and show how I would measure whether the mitigation worked.`,
      personalizedHints: input.cvProfile?.weaknessesOrGaps?.slice(0, 3) || ["Use a gap you are actively improving."],
      prepTime: 45,
      answerTime: 120,
      followUpQuestions: ["Which risk is easiest to underestimate?"],
      scoringRubric: {
        clarity: "Ranks risks clearly.",
        relevance: `Uses risks that matter in ${domain}.`,
        depth: "Includes prevention and monitoring.",
        examples: "Uses a real example if possible.",
      },
    },
  ];
  return [...(input.cvProfile?.customQuestions || []).slice(0, 2).map((text, index) => ({
    id: `q_custom_${index + 1}`,
    text,
    category: "cv_deep_dive" as QuestionCategory,
    difficulty: "hard" as const,
    expectedSignals: ["specific evidence", "depth", "honesty about limits"],
    hint: "Answer with context, your action, and proof.",
    whyAsked: "This question comes from your CV and checks whether you can explain the claim deeply.",
    whatInterviewerWants: ["Evidence", "Ownership", "Depth", "Learning"],
    keyPointsToCover: ["Context", "Your action", "Proof", "Reflection"],
    commonMistakes: ["Being vague", "Overstating ownership", "Skipping constraints"],
    idealAnswerStructure: ["Claim", "Evidence", "Action", "Result"],
    sampleStrongAnswer: "A strong answer gives context, identifies your personal contribution, includes evidence, and acknowledges tradeoffs or limitations.",
    personalizedHints: ["Use only truthful evidence from your CV."],
    prepTime: 60,
    answerTime: 150,
    followUpQuestions: ["What evidence supports that claim?"],
    scoringRubric: {
      clarity: "Directly answers the question.",
      relevance: "Uses a CV claim that matters for the role.",
      depth: "Explains enough detail for follow-up.",
      examples: "Supports claims with evidence.",
    },
  })), ...base];
}

export function fallbackAnswerPreparation(input: { question: string; cvProfile?: CVProfile | null; targetRole?: string; experienceLevel?: string }): AnswerPreparation {
  const role = input.cvProfile?.detectedRole || input.targetRole || "the target role";
  const skills = input.cvProfile?.technicalSkills?.slice(0, 4).join(", ") || "your strongest relevant skills";
  return {
    source: "fallback",
    question: input.question,
    answerStrategy: `Use one concrete example from your CV and connect it to ${role}. Keep the answer specific, truthful, and evidence-based.`,
    starFramework: {
      situation: "Set the context in one sentence.",
      task: "State what you owned or were responsible for.",
      action: "Explain two or three actions you personally took.",
      result: "Close with a measurable or observable result.",
    },
    technicalFramework: {
      conceptExplanation: `Briefly explain the core concept using ${skills} if relevant.`,
      implementationApproach: "Describe the design, implementation steps, and validation method.",
      tradeoffs: ["Mention cost vs speed", "Mention simplicity vs scalability"],
      edgeCases: ["Failure path", "Large input or traffic", "Operational monitoring"],
      performanceConsiderations: ["Latency", "Reliability", "Maintainability"],
    },
    keyPointsToMention: ["Specific example", "Your ownership", "Tradeoff or constraint", "Result or learning"],
    phrasesToUse: ["I owned...", "The constraint was...", "I chose this because...", "The result was..."],
    phrasesToAvoid: ["We just...", "I was involved in...", "It was perfect", "I don't remember"],
    sampleStrongAnswer: "I would answer by naming the project, the constraint, the decision I owned, the alternatives considered, and the measurable result. I would keep it concise and leave room for follow-up.",
    shorterVersion: "Context, ownership, action, result, and learning.",
    seniorLevelVersion: "Add decision-making tradeoffs, stakeholder impact, and how you reduced risk for the team.",
    followUpPrep: ["What alternative did you reject?", "How did you measure success?", "What would you improve now?"],
    confidenceTips: ["Pause before answering", "Use first-person ownership", "End with the result"],
  };
}

export function fallbackFeedback(question: string, answer: string, durationSeconds = 60): InterviewFeedback {
  const words = answer.trim().split(/\s+/).filter(Boolean);
  const fillerWords = ["um", "uh", "like", "basically", "actually"].filter((word) => new RegExp(`\\b${word}\\b`, "i").test(answer));
  const hasMetric = /\d+%|\$\d+|\d+\s*(users|requests|revenue|latency|hours|days)/i.test(answer);
  const wpm = Math.round(words.length / Math.max(durationSeconds / 60, 0.1));
  const structureScore = /situation|task|action|result/i.test(answer) ? 78 : 52;
  const contentScore = hasMetric ? 74 : words.length < 25 ? 38 : 58;
  const overallScore = Math.round((structureScore + contentScore + Math.min(85, Math.max(35, wpm))) / 3);

  return {
    source: "fallback",
    overallScore,
    answerQualityGrade: overallScore >= 85 ? "Excellent" : overallScore >= 70 ? "Good" : overallScore >= 50 ? "Average" : "Weak",
    speechScore: Math.min(100, Math.max(35, 100 - fillerWords.length * 8)),
    contentScore,
    relevanceScore: question && answer.length > 80 ? 72 : 48,
    structureScore,
    technicalDepthScore: answer.length > 180 ? 68 : 45,
    confidenceScore: fillerWords.length > 3 ? 55 : 76,
    starBreakdown: {
      situation: /situation/i.test(answer) ? 75 : 45,
      task: /task/i.test(answer) ? 75 : 45,
      action: /action|built|led|implemented|designed/i.test(answer) ? 72 : 45,
      result: hasMetric ? 78 : 42,
      comments: "Fallback evaluation uses local text heuristics. Add a Gemini key for deeper coaching.",
    },
    strengths: ["Relevant to the question", "Has usable raw material for a stronger answer"],
    weakAreas: hasMetric ? ["Clarify the decision process and tradeoffs."] : ["Missing quantified impact or concrete outcome."],
    missingPoints: hasMetric ? ["Specific tradeoff", "Validation method"] : ["Baseline metric", "Final measured result"],
    improvementTips: ["Use STAR explicitly.", "Add baseline and result metrics.", "Name your personal contribution."],
    betterAnswer: `Situation: Briefly describe the project context.\nTask: State what you owned and the success metric.\nAction: Explain the two or three highest-leverage actions you personally took.\nResult: Close with a measured result and what you learned.`,
    bestAnswerExample: `A stronger answer would directly address: "${question}" with one truthful example, your personal ownership, the tradeoff you considered, and a measurable result.`,
    followUpQuestions: ["What alternative did you consider?", "How did you measure success?", "What would you improve now?"],
    nextPracticeRecommendation: "Practice one CV deep-dive answer with a quantified result.",
  };
}

export function fallbackCodeReview(code: string, language: string) {
  const hasLoop = /\b(for|while|map|reduce)\b/.test(code);
  return {
    correctnessScore: code.trim().length > 30 ? 72 : 40,
    performanceScore: hasLoop ? 70 : 55,
    complexity: { time: hasLoop ? "Likely O(N)" : "Unable to infer", space: "Review-only estimate" },
    feedback: "AI review is temporarily using local heuristics. This does not execute code or verify test cases.",
    suggestions: ["Add explicit edge-case handling.", "Explain complexity in comments before submitting.", "Test empty and single-item inputs manually."],
    optimizedSolution: `// Review-only reference for ${language}. No code execution was performed.\n${code}`,
    isFallback: true,
  };
}

function extractKeywords(normalized: string, keywords: string[]) {
  return keywords.filter((skill) => normalized.includes(skill.toLowerCase()));
}
