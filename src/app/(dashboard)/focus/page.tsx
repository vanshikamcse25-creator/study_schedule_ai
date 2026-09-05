"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, RotateCcw, CheckCircle2, Sparkles, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";

function FocusTimerContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  const [preset, setPreset] = useState<"25_5" | "50_10" | "custom">("25_5");
  const [workMinutes, setWorkMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [mode, setMode] = useState<"work" | "break">("work");

  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionTitle, setSessionTitle] = useState("Focus Study Session");

  const totalTimeSeconds = (mode === "work" ? workMinutes : breakMinutes) * 60;
  const progressPercent = totalTimeSeconds > 0 ? (timeLeft / totalTimeSeconds) * 100 : 100;

  useEffect(() => {
    if (sessionId) {
      fetch(`/api/study-plan/sessions`)
        .then((res) => res.json())
        .then((data) => {
          const found = (data.sessions ?? []).find((s: any) => s.id === sessionId);
          if (found) {
            setSessionTitle(found.title ?? found.subject?.name ?? "Scheduled Session");
            if (found.duration) {
              setWorkMinutes(found.duration);
              setTimeLeft(found.duration * 60);
            }
          }
        })
        .catch(() => {});
    }
  }, [sessionId]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      if (mode === "work") {
        toast.success("Focus block completed! Time for a break 🎉");
        if (sessionId) {
          handleCompleteSession();
        }
        setMode("break");
        setTimeLeft(breakMinutes * 60);
      } else {
        toast.info("Break finished! Ready to lock back in?");
        setMode("work");
        setTimeLeft(workMinutes * 60);
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, mode, breakMinutes, workMinutes, sessionId]);

  const handlePresetChange = (val: "25_5" | "50_10" | "custom") => {
    setPreset(val);
    setIsActive(false);
    if (val === "25_5") {
      setWorkMinutes(25);
      setBreakMinutes(5);
      setTimeLeft(25 * 60);
    } else if (val === "50_10") {
      setWorkMinutes(50);
      setBreakMinutes(10);
      setTimeLeft(50 * 60);
    }
    setMode("work");
  };

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setMode("work");
    setTimeLeft(workMinutes * 60);
  };

  const handleCompleteSession = async () => {
    if (sessionId) {
      try {
        const res = await fetch(`/api/study-plan/sessions/${sessionId}/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ actualMinutes: workMinutes }),
        });
        if (res.ok) {
          toast.success("Study session logged & progress updated! +15 XP 🎯");
        }
      } catch {
        toast.error("Failed to sync session progress");
      }
    } else {
      toast.success("Focus session completed! +15 XP 🎯");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // SVG Circular Ring calculation
  const radius = 130;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-3xl mx-auto space-y-8 py-6 relative"
    >
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-indigo-500/15 blur-[140px]" />

      <div className="text-center space-y-2">
        <Badge className="px-3.5 py-1 text-xs gap-1.5 font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/30">
          <Sparkles className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400 animate-pulse" />
          <span>Deep Work Pomodoro Engine</span>
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">{sessionTitle}</h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Eliminate distractions, maintain flow state, and maximize active recall retention.
        </p>
      </div>

      <Card className="border border-border bg-card shadow-2xl backdrop-blur-xl rounded-3xl text-center p-8 space-y-8 relative overflow-hidden">
        {/* Active phase pills */}
        <div className="flex items-center justify-center gap-3">
          <Button
            size="sm"
            variant={preset === "25_5" ? "default" : "outline"}
            onClick={() => handlePresetChange("25_5")}
            className={`rounded-full px-5 text-xs font-semibold ${
              preset === "25_5"
                ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/20"
                : "bg-background border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            25 / 5 Standard
          </Button>
          <Button
            size="sm"
            variant={preset === "50_10" ? "default" : "outline"}
            onClick={() => handlePresetChange("50_10")}
            className={`rounded-full px-5 text-xs font-semibold ${
              preset === "50_10"
                ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/20"
                : "bg-background border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            50 / 10 Deep Focus
          </Button>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent border border-border text-xs font-bold uppercase tracking-wider text-foreground">
          <span className={`h-2.5 w-2.5 rounded-full ${mode === "work" ? "bg-indigo-500 dark:bg-indigo-400 animate-ping" : "bg-emerald-500 dark:bg-emerald-400"}`} />
          <span>{mode === "work" ? "Focused Study Phase" : "Rest & Break Phase"}</span>
        </div>

        {/* Circular SVG Timer Ring */}
        <div className="relative py-4 flex flex-col items-center justify-center">
          <div className="relative flex items-center justify-center">
            <svg className="h-72 w-72 transform -rotate-90">
              {/* Background circle track */}
              <circle
                cx="144"
                cy="144"
                r={radius}
                className="stroke-muted"
                strokeWidth="10"
                fill="transparent"
              />
              {/* Progress ring */}
              <motion.circle
                cx="144"
                cy="144"
                r={radius}
                className={mode === "work" ? "stroke-indigo-500" : "stroke-emerald-400"}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.5, ease: "linear" }}
              />
            </svg>

            {/* Inner Clock Text */}
            <div className="absolute flex flex-col items-center justify-center text-center">
              <div className="text-6xl sm:text-7xl font-black font-mono tracking-tighter text-foreground drop-shadow-md">
                {formatTime(timeLeft)}
              </div>
              <p className="text-xs text-muted-foreground mt-2 font-medium flex items-center gap-1">
                <Zap className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
                {mode === "work" ? `${workMinutes} min focus target` : `${breakMinutes} min rest interval`}
              </p>
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-5 pt-2">
          <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}>
            <Button
              size="lg"
              variant="outline"
              className="h-13 w-13 rounded-full p-0 bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              onClick={resetTimer}
              title="Reset Timer"
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="lg"
              className={`h-16 w-40 rounded-full font-extrabold text-lg shadow-xl gap-2 text-white border border-indigo-400/30 ${
                isActive
                  ? "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-amber-500/20"
                  : "bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 hover:from-indigo-600 hover:to-purple-600 shadow-indigo-500/25"
              }`}
              onClick={toggleTimer}
            >
              {isActive ? <Pause className="h-6 w-6 fill-current" /> : <Play className="h-6 w-6 fill-current ml-1" />}
              {isActive ? "Pause" : "Start"}
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}>
            <Button
              size="lg"
              variant="secondary"
              className="h-13 w-13 rounded-full p-0 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25"
              onClick={handleCompleteSession}
              title="Complete Session Now"
            >
              <CheckCircle2 className="h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
}

export default function FocusPage() {
  return (
    <Suspense fallback={<Card className="p-12 text-center max-w-3xl mx-auto bg-[#0B1020]/80"><Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-400" /></Card>}>
      <FocusTimerContent />
    </Suspense>
  );
}
