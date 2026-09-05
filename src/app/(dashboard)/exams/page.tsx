"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap, Plus, Calendar, Clock, AlertTriangle, Trash2, BookOpen, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Exam {
  id: string;
  title: string;
  date: string;
  time: string | null;
  type: "EXAM" | "ASSIGNMENT" | "PROJECT" | "DEADLINE";
  importance: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  topics: string[];
  notes: string | null;
  subject?: { id: string; name: string } | null;
}

interface SubjectOption {
  id: string;
  name: string;
}

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState<string>("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [type, setType] = useState<"EXAM" | "ASSIGNMENT" | "PROJECT" | "DEADLINE">("EXAM");
  const [importance, setImportance] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("HIGH");
  const [notes, setNotes] = useState("");

  const fetchExamsAndSubjects = useCallback(async () => {
    setLoading(true);
    try {
      const [examsRes, subjectsRes] = await Promise.all([
        fetch("/api/exams"),
        fetch("/api/subjects"),
      ]);

      if (examsRes.ok) {
        const eData = await examsRes.json();
        setExams(eData.exams ?? []);
      }

      if (subjectsRes.ok) {
        const sData = await subjectsRes.json();
        const list = Array.isArray(sData) ? sData : (sData.subjects ?? []);
        setSubjects(list.map((s: any) => ({ id: s.id, name: s.name })));
      }
    } catch {
      toast.error("Failed to load exams");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExamsAndSubjects();
  }, [fetchExamsAndSubjects]);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) {
      toast.error("Title and date are required");
      return;
    }

    try {
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subjectId: subjectId || undefined,
          date,
          time: time || undefined,
          type,
          importance,
          notes,
        }),
      });

      if (!res.ok) throw new Error("Failed to create exam");

      toast.success("Exam added to schedule!");
      setIsAddOpen(false);
      setTitle("");
      setDate("");
      setNotes("");
      fetchExamsAndSubjects();
    } catch (err: any) {
      toast.error(err.message ?? "Error creating exam");
    }
  };

  const handleDeleteExam = async (id: string) => {
    if (!confirm("Are you sure you want to delete this exam?")) return;
    try {
      const res = await fetch(`/api/exams/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Exam deleted");
        fetchExamsAndSubjects();
      }
    } catch {
      toast.error("Failed to delete exam");
    }
  };

  const getDaysRemaining = (dateStr: string) => {
    const target = new Date(dateStr);
    const now = new Date();
    return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getDynamicUrgency = (days: number) => {
    if (days <= 2) return { label: "Critical Urgency 🚨", color: "destructive" as const };
    if (days <= 7) return { label: "High Urgency ⚠️", color: "secondary" as const };
    if (days <= 14) return { label: "Moderate Urgency", color: "outline" as const };
    return { label: "Normal Timeline", color: "outline" as const };
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Exams & Deadlines</h1>
          <p className="text-sm text-muted-foreground">
            Track midterm exams, assignment deadlines, and final project dates with dynamic urgency scoring.
          </p>
        </div>

        <Button className="gap-2 font-semibold shrink-0" onClick={() => setIsAddOpen(true)}>
          <Plus className="h-4 w-4" /> Add Exam / Deadline
        </Button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      ) : exams.length === 0 ? (
        <Card className="border border-dashed p-12 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-lg">No Exams or Deadlines Added</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Add upcoming exams or assignment dates so StudyFlow AI can prioritize your study sessions.
            </p>
          </div>
          <Button onClick={() => setIsAddOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Add Exam
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => {
            const daysLeft = getDaysRemaining(exam.date);
            const urgency = getDynamicUrgency(daysLeft);

            return (
              <Card key={exam.id} className="border shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <Badge variant="outline" className="text-[10px] font-semibold tracking-wider">
                        {exam.type}
                      </Badge>
                      <CardTitle className="text-lg font-bold">{exam.title}</CardTitle>
                      <CardDescription className="text-xs">
                        {exam.subject?.name ?? "General Subject"}
                      </CardDescription>
                    </div>

                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteExam(exam.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pb-4">
                  <div className="p-3 border rounded-xl bg-accent/20 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(exam.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                      </div>
                      {exam.time && <div className="text-[11px] text-muted-foreground">{exam.time}</div>}
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-extrabold">
                        {daysLeft <= 0 ? "Today" : `${daysLeft} Days`}
                      </div>
                      <span className="text-[10px] text-muted-foreground">Remaining</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <Badge variant={urgency.color} className="text-[10px]">{urgency.label}</Badge>
                    <span className="text-muted-foreground">Importance: <strong className="text-foreground">{exam.importance}</strong></span>
                  </div>

                  {exam.notes && (
                    <p className="text-xs text-muted-foreground border-t pt-2 italic line-clamp-2">
                      &quot;{exam.notes}&quot;
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Exam Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Exam or Deadline</DialogTitle>
            <DialogDescription>Input upcoming tests or project deadlines for scheduling.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateExam} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input placeholder="e.g. DSA Midterm Examination" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger><SelectValue placeholder="Select subject (optional)" /></SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Time (Optional)</Label>
                <Input placeholder="e.g. 10:00 AM" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={(v: any) => setType(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EXAM">Exam / Quiz</SelectItem>
                    <SelectItem value="ASSIGNMENT">Assignment</SelectItem>
                    <SelectItem value="PROJECT">Project Demo</SelectItem>
                    <SelectItem value="DEADLINE">General Deadline</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Importance</Label>
                <Select value={importance} onValueChange={(v: any) => setImportance(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes / Syllabus Scope</Label>
              <Textarea placeholder="Chapters 1-5, scientific calculator allowed..." value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button type="submit">Save Exam</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
