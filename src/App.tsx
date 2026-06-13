import { useEffect, useState } from "react";
import SplashScreen from "./components/SplashScreen";
import { AppShell } from "./components/AppShell";
import { AuthPage } from "./features/auth/AuthPage";
import { OnboardingPage } from "./features/onboarding/OnboardingPage";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { InterviewPage } from "./features/interview/InterviewPage";
import { CodeReviewPage } from "./features/code-playground/CodeReviewPage";
import { api, clearStoredSession, getStoredSession, storeSession, updateStoredUser } from "./services/api";
import { AuthSession, CVProfile, InterviewMode, UserProfile } from "./types";

type Page = "splash" | "auth" | "onboarding" | "dashboard" | "interview" | "code";

export default function App() {
  const [page, setPage] = useState<Page>("splash");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [cvProfile, setCvProfile] = useState<CVProfile | null>(() => {
    const saved = localStorage.getItem("interviewmaster_cv_profile");
    return saved ? JSON.parse(saved) : null;
  });
  const [mode, setMode] = useState<InterviewMode>("daily");

  useEffect(() => {
    const session = getStoredSession();
    if (!session) return;
    setUser(session.user);
    api.me()
      .then(({ user: freshUser }) => {
        setUser(freshUser);
        updateStoredUser(freshUser);
      })
      .catch(() => {
        clearStoredSession();
        setUser(null);
      });
  }, []);

  function handleSplashComplete() {
    setPage(user ? (user.targetRole ? "dashboard" : "onboarding") : "auth");
  }

  function handleAuth(session: AuthSession) {
    storeSession(session);
    setUser(session.user);
    setPage(session.user.targetRole ? "dashboard" : "onboarding");
  }

  async function handleLogout() {
    try {
      await api.logout();
    } catch {
      // Local session cleanup still happens if the dev server restarted.
    }
    clearStoredSession();
    setUser(null);
    setCvProfile(null);
    setPage("auth");
  }

  async function handleOnboardingComplete(updatedUser: UserProfile, nextCvProfile: CVProfile | null) {
    setUser(updatedUser);
    updateStoredUser(updatedUser);
    setCvProfile(nextCvProfile);
    if (nextCvProfile) localStorage.setItem("interviewmaster_cv_profile", JSON.stringify(nextCvProfile));
    setPage("dashboard");
  }

  function startSession(nextMode: InterviewMode) {
    setMode(nextMode);
    setPage(nextMode === "coding" ? "code" : "interview");
  }

  if (page === "splash") return <SplashScreen onComplete={handleSplashComplete} />;
  if (!user) return <AuthPage onAuthSuccess={handleAuth} />;

  return (
    <AppShell user={user} onLogout={handleLogout}>
      {page === "onboarding" && <OnboardingPage user={user} onComplete={handleOnboardingComplete} />}
      {page === "dashboard" && <DashboardPage user={user} cvProfile={cvProfile} onStartSession={startSession} onEditProfile={() => setPage("onboarding")} />}
      {page === "interview" && <InterviewPage user={user} cvProfile={cvProfile} mode={mode} onExit={() => setPage("dashboard")} />}
      {page === "code" && <CodeReviewPage onExit={() => setPage("dashboard")} />}
    </AppShell>
  );
}
