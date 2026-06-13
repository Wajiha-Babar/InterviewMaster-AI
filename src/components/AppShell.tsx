import { BrainCircuit, Code2, LayoutDashboard, LogOut, UserRoundCheck } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { UserProfile } from "../types";

export function AppShell({ user, onLogout, children }: { user: UserProfile; onLogout: () => void; children: ReactNode }) {
  return (
    <div className="app-bg min-h-screen text-zinc-100">
      <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-zinc-950/78 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-200 to-cyan-200 text-zinc-950 shadow-[0_12px_32px_rgba(45,212,191,0.18)]">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">InterviewMaster AI</p>
              <p className="text-xs text-zinc-500">AI-guided interview coaching</p>
            </div>
          </div>
          <nav className="hidden items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.035] p-1 md:flex" aria-label="Workspace sections">
            <Badge className="border-transparent bg-white/[0.06]"><LayoutDashboard className="mr-1.5 h-3.5 w-3.5" />Dashboard</Badge>
            <Badge className="border-transparent"><UserRoundCheck className="mr-1.5 h-3.5 w-3.5" />Practice</Badge>
            <Badge className="border-transparent"><Code2 className="mr-1.5 h-3.5 w-3.5" />Code review</Badge>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden text-right md:block">
              <p className="text-sm font-medium text-zinc-200">{user.name}</p>
              <p className="max-w-48 truncate text-xs text-zinc-500">{user.email}</p>
            </div>
            <Button variant="secondary" size="sm" onClick={onLogout} icon={<LogOut className="h-4 w-4" />} aria-label="Logout">
              Logout
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
