"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { AiLoadingStepper } from "@/components/ui/ai-loading-stepper";
import {
  Sparkles,
  Clock,
  CheckCircle2,
  Flame,
  GraduationCap,
  Play,
  Check,
  Calendar,
  ArrowRight,
  Plus,
  Loader2,
  Zap,
  BookOpen,
  Target,
} from "lucide-react";
import { toast } from "sonner";

interface StudySessionData {
  id: string;
  title: string | null;
  startTime: string;
  endTime: string;
  duration: number;
  type: string;
  status: string;
  reason: string | null;
  subject?: { id: string; name: string; color: string } | null;
  topic?: { id: string; name: string } | null;
}

interface ExamData {
  id: string;
  title: string;
  date: string;
  importance: string;
  subject?: { name: string } | null;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [stepperActive, setStepperActive] = useState(false);
  const [recommendation, setRecommendation] = useState<string>("");
  const [todaySessions, setTodaySessions] = useState<StudySessionData[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<ExamData[]>([]);
  const [stats, setStats] = useState({
    completedMinutes: 0,
    targetMinutes: 240,
    completedSessionsCount: 0,
    totalSessionsCount: 0,
    streak: 0,
    xp: 0,
    level: 1,
  });

  const [greeting, setGreeting] = useState("Good day");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [sessionsRes, progressRes, examsRes] = await Promise.all([
        fetch(`/api/study-plan/sessions`),
        fetch(`/api/progress?days=7`),
        fetch(`/api/exams`),
      ]);

      if (sessionsRes.ok) {
        const data = await sessionsRes.json();
        const allSessions = data.sessions ?? [];
        const now = new Date();
        const todayYMD = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

        const getSessionYMD = (dateStr: string) => {
          const d = new Date(dateStr);
          return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
        };

        const todays = allSessions.filter((s: any) => getSessionYMD(s.date) === todayYMD);
        const activeList = todays.length > 0 ? todays : allSessions.slice(0, 5);
        setTodaySessions(activeList);

        const completed = activeList.filter((s: any) => s.status === "COMPLETED");
        const minutes = completed.reduce((acc: number, s: any) => acc + (s.actualMinutes ?? s.duration), 0);
        setStats((prev) => ({
          ...prev,
          completedMinutes: minutes,
          completedSessionsCount: completed.length,
          totalSessionsCount: activeList.length,
        }));
      }

      if (progressRes.ok) {
        const pData = await progressRes.json();
        setStats((prev) => ({
          ...prev,
          streak: pData.summary?.currentStreak ?? 0,
          xp: pData.summary?.xp ?? 0,
          level: pData.summary?.level ?? 1,
        }));
      }

      if (examsRes.ok) {
        const eData = await examsRes.json();
        setUpcomingExams((eData.exams ?? []).slice(0, 3));
      }

      setRecommendation(
        "Focus on your highest priority subject today. Your study sessions are structured to optimize retention."
      );
    } catch {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleGeneratePlan = async () => {
    setGenerating(true);
    setStepperActive(true);
    try {
      const res = await fetch("/api/study-plan/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: 7 }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to generate plan");
      }

      await fetchDashboardData();
      toast.success("✨ New AI study plan generated!");
    } catch (err: any) {
      toast.error(err.message ?? "Error generating plan");
    } finally {
      setGenerating(false);
    }
  };

  const handleCompleteSession = async (id: string) => {
    try {
      const res = await fetch(`/api/study-plan/sessions/${id}/complete`, { method: "POST" });
      if (res.ok) {
        toast.success("Session marked as completed! +15 XP 🎯");
        fetchDashboardData();
      }
    } catch {
      toast.error("Failed to update session");
    }
  };

  const getDaysRemaining = (dateStr: string) => {
    const target = new Date(dateStr);
    const now = new Date();
    const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff < 0 ? 0 : diff;
  };

  return (
    <>
      <AiLoadingStepper active={stepperActive} onComplete={() => setStepperActive(false)} />

      <motion.div
        className="space-y-8 relative"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Background ambient lighting */}
        <div className="pointer-events-none absolute -top-12 -left-12 h-96 w-96 rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="pointer-events-none absolute top-1/3 -right-12 h-96 w-96 rounded-full bg-violet-500/10 blur-[120px]" />

        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
                StudyFlow AI Active
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              {greeting}, {session?.user?.name?.split(" ")[0] ?? "Student"} 👋
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Here is your AI study schedule and progress summary for today.
            </p>
          </div>

          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              size="default"
              className="gap-2 font-semibold shadow-lg shadow-indigo-500/20 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 hover:from-indigo-600 hover:to-purple-600 text-white shrink-0 border border-indigo-400/30"
              onClick={handleGeneratePlan}
              disabled={generating}
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" /> Generating Plan...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" /> Generate AI Study Plan
                </>
              )}
            </Button>
          </motion.div>
        </motion.div>

        {/* Overview Stat Cards with Spotlight Effect */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SpotlightCard spotlightColor="rgba(99, 102, 241, 0.18)">
            <div className="p-5 flex items-center justify-between">
              <div className="space-y-1.5">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Study Hours Today</span>
                <div className="text-2xl font-extrabold text-foreground">
                  {(stats.completedMinutes / 60).toFixed(1)}{" "}
                  <span className="text-xs font-normal text-muted-foreground">/ {(stats.targetMinutes / 60).toFixed(1)} hrs</span>
                </div>
                <Progress value={Math.min(100, (stats.completedMinutes / stats.targetMinutes) * 100)} className="h-1.5 w-28 bg-muted" />
              </div>
              <div className="h-11 w-11 rounded-2xl bg-indigo-500/15 text-indigo-500 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 shadow-inner">
                <Clock className="h-5 w-5" />
              </div>
            </div>
          </SpotlightCard>

          <SpotlightCard spotlightColor="rgba(16, 185, 129, 0.18)">
            <div className="p-5 flex items-center justify-between">
              <div className="space-y-1.5">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Completed Sessions</span>
                <div className="text-2xl font-extrabold text-foreground">
                  {stats.completedSessionsCount}{" "}
                  <span className="text-xs font-normal text-muted-foreground">/ {stats.totalSessionsCount} sessions</span>
                </div>
                <p className="text-[11px] text-emerald-500 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {stats.totalSessionsCount ? Math.round((stats.completedSessionsCount / stats.totalSessionsCount) * 100) : 0}% target reached
                </p>
              </div>
              <div className="h-11 w-11 rounded-2xl bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-inner">
                <Target className="h-5 w-5" />
              </div>
            </div>
          </SpotlightCard>

          <SpotlightCard spotlightColor="rgba(245, 158, 11, 0.18)">
            <div className="p-5 flex items-center justify-between">
              <div className="space-y-1.5">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Study Streak</span>
                <div className="text-2xl font-extrabold text-foreground flex items-center gap-1.5">
                  {stats.streak} Days <Flame className="h-5 w-5 text-amber-500 fill-amber-500 animate-pulse" />
                </div>
                <p className="text-[11px] text-muted-foreground font-medium">Consistency rank: Top 5% 🔥</p>
              </div>
              <div className="h-11 w-11 rounded-2xl bg-amber-500/15 text-amber-500 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shadow-inner">
                <Zap className="h-5 w-5" />
              </div>
            </div>
          </SpotlightCard>

          <SpotlightCard spotlightColor="rgba(168, 85, 247, 0.18)">
            <div className="p-5 flex items-center justify-between">
              <div className="space-y-1.5">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Level & XP</span>
                <div className="text-2xl font-extrabold text-foreground">Lvl {stats.level}</div>
                <p className="text-[11px] text-purple-500 dark:text-purple-400 font-semibold">{stats.xp} XP total earned</p>
              </div>
              <div className="h-11 w-11 rounded-2xl bg-purple-500/15 text-purple-500 dark:text-purple-400 flex items-center justify-center border border-purple-500/20 shadow-inner">
                <GraduationCap className="h-5 w-5" />
              </div>
            </div>
          </SpotlightCard>
        </motion.div>

        {/* AI Smart Recommendation Banner */}
        <motion.div variants={itemVariants}>
          <div className="relative rounded-2xl p-[1px] bg-gradient-to-r from-indigo-500/40 via-purple-500/30 to-cyan-500/40 shadow-lg shadow-indigo-500/10">
            <div className="rounded-[15px] bg-card border border-border p-5 flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/30">
                <Sparkles className="h-5 w-5 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                  AI Priority Recommendation
                  <Badge className="bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border-indigo-500/30 text-[10px] uppercase font-bold tracking-wider">
                    Live AI
                  </Badge>
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {recommendation}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Grid: Today's Schedule + Upcoming Exams */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Today's Study Timeline */}
          <motion.div variants={itemVariants} className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                <Calendar className="h-5 w-5 text-indigo-500 dark:text-indigo-400" /> Today&apos;s Study Schedule
              </h2>
              <Link href="/study-plan">
                <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground hover:text-foreground">
                  Full Plan <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full rounded-2xl bg-muted" />
                <Skeleton className="h-20 w-full rounded-2xl bg-muted" />
              </div>
            ) : todaySessions.length === 0 ? (
              <Card className="border border-indigo-500/20 bg-card p-8 text-center space-y-4 backdrop-blur-md">
                <div className="h-12 w-12 rounded-2xl bg-indigo-500/15 text-indigo-500 dark:text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-base text-foreground">No Sessions Scheduled Today</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Click below to let StudyFlow AI calculate priorities and generate your optimal study plan.
                  </p>
                </div>
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white" onClick={handleGeneratePlan} disabled={generating}>
                  Generate Today&apos;s Schedule
                </Button>
              </Card>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {todaySessions.map((session, idx) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      whileHover={{ scale: 1.01, transition: { duration: 0.15 } }}
                    >
                      <Card
                        className={`border border-border bg-card shadow-sm backdrop-blur-md transition-all ${
                          session.status === "COMPLETED"
                            ? "opacity-60 bg-muted/40"
                            : "hover:border-indigo-500/40 hover:shadow-indigo-500/5"
                        }`}
                      >
                        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-start gap-3.5">
                            <div className="h-11 w-16 rounded-xl bg-accent border border-border flex flex-col items-center justify-center shrink-0">
                              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">{session.startTime}</span>
                              <span className="text-[9px] text-muted-foreground">{session.duration} min</span>
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-sm text-foreground">
                                  {session.title ?? session.subject?.name ?? "Study Session"}
                                </h4>
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] ${
                                    session.status === "COMPLETED"
                                      ? "bg-muted text-muted-foreground border-border"
                                      : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border-indigo-500/30"
                                  }`}
                                >
                                  {session.type}
                                </Badge>
                              </div>
                              {session.reason && (
                                <p className="text-xs text-muted-foreground leading-relaxed">{session.reason}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            {session.status === "COMPLETED" ? (
                              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1 text-xs py-1 px-3 font-semibold">
                                <Check className="h-3.5 w-3.5" /> Completed
                              </Badge>
                            ) : (
                              <>
                                <Link href={`/focus?sessionId=${session.id}`}>
                                  <Button size="sm" variant="outline" className="h-8.5 gap-1.5 text-xs bg-background border-border text-foreground hover:bg-accent">
                                    <Play className="h-3 w-3 fill-indigo-500 text-indigo-500 dark:text-indigo-400" /> Start
                                  </Button>
                                </Link>
                                <Button
                                  size="sm"
                                  className="h-8.5 gap-1.5 text-xs bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md shadow-indigo-500/20"
                                  onClick={() => handleCompleteSession(session.id)}
                                >
                                  <Check className="h-3.5 w-3.5" /> Done
                                </Button>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>

          {/* Sidebar Widgets: Upcoming Exams & Quick Actions */}
          <motion.div variants={itemVariants} className="space-y-6">
            <Card className="border border-border bg-card shadow-sm backdrop-blur-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-foreground flex items-center gap-2">
                    <GraduationCap className="h-4.5 w-4.5 text-amber-500 dark:text-amber-400" /> Upcoming Exams
                  </CardTitle>
                  <Link href="/exams">
                    <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">View All</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {upcomingExams.length === 0 ? (
                  <div className="text-center py-6 text-xs text-muted-foreground">
                    No upcoming exams added. <Link href="/exams" className="text-indigo-500 dark:text-indigo-400 hover:underline">Add exam</Link>
                  </div>
                ) : (
                  upcomingExams.map((exam) => {
                    const daysLeft = getDaysRemaining(exam.date);
                    return (
                      <div key={exam.id} className="p-3 border border-border rounded-xl bg-accent/40 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="font-semibold text-xs text-foreground">{exam.title}</div>
                          <div className="text-[11px] text-muted-foreground">{exam.subject?.name ?? "General"}</div>
                        </div>
                        <Badge
                          variant={daysLeft <= 3 ? "destructive" : daysLeft <= 7 ? "secondary" : "outline"}
                          className="text-[10px] font-bold"
                        >
                          {daysLeft === 0 ? "Today" : `${daysLeft} days left`}
                        </Badge>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Quick Actions Card */}
            <Card className="border border-border bg-card shadow-sm backdrop-blur-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-foreground">Quick Shortcuts</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2.5">
                <Link href="/subjects">
                  <Button variant="outline" className="w-full justify-start text-xs h-9.5 gap-2 bg-background border-border text-foreground hover:bg-indigo-500/10 hover:border-indigo-500/40">
                    <BookOpen className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" /> Subject
                  </Button>
                </Link>
                <Link href="/exams">
                  <Button variant="outline" className="w-full justify-start text-xs h-9.5 gap-2 bg-background border-border text-foreground hover:bg-amber-500/10 hover:border-amber-500/40">
                    <GraduationCap className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" /> Exam
                  </Button>
                </Link>
                <Link href="/tasks">
                  <Button variant="outline" className="w-full justify-start text-xs h-9.5 gap-2 bg-background border-border text-foreground hover:bg-emerald-500/10 hover:border-emerald-500/40">
                    <Plus className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" /> Task
                  </Button>
                </Link>
                <Link href="/focus">
                  <Button variant="outline" className="w-full justify-start text-xs h-9.5 gap-2 bg-background border-border text-foreground hover:bg-purple-500/10 hover:border-purple-500/40">
                    <Play className="h-3.5 w-3.5 text-purple-500 dark:text-purple-400" /> Pomodoro
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}
