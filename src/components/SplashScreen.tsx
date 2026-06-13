import { useEffect, useState } from "react";
import { BrainCircuit, CheckCircle2, Loader2 } from "lucide-react";

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [step, setStep] = useState(0);
  const steps = [
    "Preparing interview services",
    "Loading role and CV classifiers",
    "Restoring local development session",
    "Preparing AI code review workspace",
  ];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setStep((current) => {
        if (current >= steps.length - 1) {
          window.clearInterval(timer);
          window.setTimeout(onComplete, 350);
          return current;
        }
        return current + 1;
      });
    }, 300);

    return () => window.clearInterval(timer);
  }, [onComplete, steps.length]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950 px-4 text-zinc-100">
      <div className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-950 p-8 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-400 text-zinc-950">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">InterviewMaster AI</h1>
            <p className="text-sm text-zinc-500">Local SaaS-ready workspace</p>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          {steps.map((label, index) => (
            <div key={label} className={`flex items-center gap-3 text-sm ${index <= step ? "text-zinc-100" : "text-zinc-600"}`}>
              {index < step ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : <Loader2 className={`h-4 w-4 ${index === step ? "animate-spin text-emerald-300" : "text-zinc-700"}`} />}
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
