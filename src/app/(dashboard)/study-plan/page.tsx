"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Sparkles, Calendar, Clock, Play, Check, RotateCcw, AlertTriangle, ArrowRight, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface StudySession {
  id: string;
  title: string | null;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  type: string;
  difficulty: string;
  status: string;
  reason: string | null;
  subject?: { name: string; color: string } | null;
  topic?: { name: string } | null;
}

export default function StudyPlanPage() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [aiSummary, setAiSummary] = useState<string>("");

  // Reschedule Modal
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);

  const fetchPlan = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/study-plan/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions ?? []);
      }
    } catch {
      toast.error("Failed to load study plan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  const handleGeneratePlan = async () => {
    setGenerating(true);
    const toastId = toast.loading("🤖 StudyFlow AI is generating your study plan...");
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

      const data = await res.json();
      setAiSummary(data.summary ?? "");
      toast.dismiss(toastId);
      toast.success("✨ Study plan generated successfully!");
      await fetchPlan();
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error(err.message ?? "Error generating study plan");
    } finally {
      setGenerating(false);
    }
  };

  const handleCompleteSession = async (id: string) => {
    try {
      const res = await fetch(`/api/study-plan/sessions/${id}/complete`, { method: "POST" });
      if (res.ok) {
        toast.success("Session completed!");
        fetchPlan();
      }
    } catch {
      toast.error("Failed to complete session");
    }
  };

  const handleRescheduleAction = async (action: "auto" | "tomorrow" | "skip") => {
    if (!selectedSessionId) return;
    try {
      const res = await fetch(`/api/study-plan/sessions/${selectedSessionId}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        toast.success(`Session rescheduled: ${action}`);
        setIsRescheduleOpen(false);
        fetchPlan();
      }
    } catch {
      toast.error("Reschedule failed");
    }
  };

  const handleDeleteSession = async (id: string) => {
    try {
      const res = await fetch(`/api/study-plan/sessions/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Session deleted");
        fetchPlan();
      }
    } catch {
      toast.error("Failed to delete session");
    }
  };

  const now = new Date();
  const todayYMD = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowYMD = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;

  const getSessionYMD = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
  };

  const todaySessions = sessions.filter((s) => getSessionYMD(s.date) === todayYMD);
  const tomorrowSessions = sessions.filter((s) => getSessionYMD(s.date) === tomorrowYMD);
  const weeklySessions = sessions;

  const renderSessionList = (list: StudySession[]) => {
    if (list.length === 0) {
      return (
        <Card className="border border-dashed p-8 text-center space-y-4">
          <Calendar className="h-8 w-8 text-muted-foreground mx-auto" />
          <div className="space-y-1">
            <p className="font-semibold text-sm">No Sessions Scheduled</p>
            <p className="text-xs text-muted-foreground">Click Regenerate Plan to create an optimal schedule.</p>
          </div>
          <Button size="sm" onClick={handleGeneratePlan} disabled={generating}>
            Generate Schedule
          </Button>
        </Card>
      );
    }

    return (
      <div className="space-y-3">
        {list.map((session) => (
          <Card
            key={session.id}
            className={`border shadow-sm transition-all ${
              session.status === "COMPLETED" ? "bg-muted/40 opacity-75" : ""
            }`}
          >
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-20 rounded-lg bg-accent flex flex-col items-center justify-center shrink-0 border">
                  <span className="text-[11px] font-bold text-foreground">{session.startTime}</span>
                  <span className="text-[9px] text-muted-foreground">{session.duration} mins</span>
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-semibold text-sm">{session.title ?? session.subject?.name ?? "Study Session"}</h4>
                    <Badge variant="secondary" className="text-[10px] uppercase font-bold">{session.type}</Badge>
                    <Badge variant="outline" className="text-[10px]">{session.difficulty}</Badge>
                  </div>
                  {session.reason && <p className="text-xs text-muted-foreground">{session.reason}</p>}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                {session.status === "COMPLETED" ? (
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1 text-xs">
                    <Check className="h-3.5 w-3.5" /> Completed
                  </Badge>
                ) : (
                  <>
                    <Link href={`/focus?sessionId=${session.id}`}>
                      <Button size="sm" variant="outline" className="h-8 gap-1 text-xs">
                        <Play className="h-3 w-3 fill-current text-primary" /> Start
                      </Button>
                    </Link>

                    <Button size="sm" className="h-8 gap-1 text-xs" onClick={() => handleCompleteSession(session.id)}>
                      <Check className="h-3.5 w-3.5" /> Done
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        setSelectedSessionId(session.id);
                        setIsRescheduleOpen(true);
                      }}
                      title="Reschedule"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteSession(session.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">AI Study Plan</h1>
          <p className="text-sm text-muted-foreground">
            Intelligent schedule tailored to your available hours, difficulty ratings, and approaching exams.
          </p>
        </div>

        <Button size="default" className="gap-2 font-semibold shadow-sm shrink-0" onClick={handleGeneratePlan} disabled={generating}>
          {generating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-amber-300" />}
          Regenerate AI Plan
        </Button>
      </div>

      {aiSummary && (
        <Card className="border bg-primary/5 border-primary/20 p-4 text-xs text-muted-foreground flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary shrink-0" />
          <span>{aiSummary}</span>
        </Card>
      )}

      {/* Tabs View */}
      <Tabs defaultValue="today" className="space-y-6">
        <TabsList className="grid w-full sm:w-[400px] grid-cols-3">
          <TabsTrigger value="today">Today ({todaySessions.length})</TabsTrigger>
          <TabsTrigger value="tomorrow">Tomorrow ({tomorrowSessions.length})</TabsTrigger>
          <TabsTrigger value="week">This Week ({weeklySessions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          {loading ? <Skeleton className="h-48 w-full rounded-2xl" /> : renderSessionList(todaySessions)}
        </TabsContent>

        <TabsContent value="tomorrow" className="space-y-4">
          {loading ? <Skeleton className="h-48 w-full rounded-2xl" /> : renderSessionList(tomorrowSessions)}
        </TabsContent>

        <TabsContent value="week" className="space-y-4">
          {loading ? <Skeleton className="h-48 w-full rounded-2xl" /> : renderSessionList(weeklySessions)}
        </TabsContent>
      </Tabs>

      {/* Reschedule Modal */}
      <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reschedule Session</DialogTitle>
            <DialogDescription>Choose how you want StudyFlow AI to handle this session slot.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <Button
              variant="outline"
              className="w-full justify-start h-12 text-left gap-3 border-primary/30 hover:border-primary"
              onClick={() => handleRescheduleAction("auto")}
            >
              <Sparkles className="h-5 w-5 text-primary shrink-0" />
              <div>
                <div className="font-semibold text-sm">Reschedule Automatically</div>
                <div className="text-xs text-muted-foreground">Let AI insert it into your next free high-priority slot</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start h-12 text-left gap-3"
              onClick={() => handleRescheduleAction("tomorrow")}
            >
              <Calendar className="h-5 w-5 text-amber-500 shrink-0" />
              <div>
                <div className="font-semibold text-sm">Move to Tomorrow</div>
                <div className="text-xs text-muted-foreground">Push this study block to tomorrow at the same time</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start h-12 text-left gap-3"
              onClick={() => handleRescheduleAction("skip")}
            >
              <RotateCcw className="h-5 w-5 text-muted-foreground shrink-0" />
              <div>
                <div className="font-semibold text-sm">Skip Session</div>
                <div className="text-xs text-muted-foreground">Mark as skipped without adjusting future hours</div>
              </div>
            </Button>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsRescheduleOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
