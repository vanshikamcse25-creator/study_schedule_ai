"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Plus, Search, Trash2, Edit2, CheckCircle2, ChevronRight, Sparkles, Filter } from "lucide-react";
import { toast } from "sonner";

interface Topic {
  id: string;
  name: string;
  difficulty: string;
  estimatedMinutes: number;
  completed: boolean;
  progress: number;
}

interface Subject {
  id: string;
  name: string;
  code: string | null;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  progress: number;
  color: string;
  topics: Topic[];
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("ALL");

  // Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("MEDIUM");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");
  const [topicName, setTopicName] = useState("");

  const fetchSubjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/subjects");
      if (res.ok) {
        const data = await res.json();
        setSubjects(data.subjects ?? []);
      }
    } catch {
      toast.error("Failed to load subjects");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const res = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code, difficulty, priority }),
      });

      if (!res.ok) throw new Error("Failed to create subject");

      toast.success("Subject added successfully!");
      setIsAddOpen(false);
      setName("");
      setCode("");
      fetchSubjects();
    } catch (err: any) {
      toast.error(err.message ?? "Error creating subject");
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (!confirm("Are you sure you want to delete this subject?")) return;
    try {
      const res = await fetch(`/api/subjects/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Subject deleted");
        fetchSubjects();
      }
    } catch {
      toast.error("Failed to delete subject");
    }
  };

  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId || !topicName.trim()) return;

    try {
      const res = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: selectedSubjectId,
          name: topicName,
          difficulty: "MEDIUM",
          estimatedMinutes: 60,
        }),
      });

      if (res.ok) {
        toast.success("Topic added!");
        setTopicName("");
        setIsTopicModalOpen(false);
        fetchSubjects();
      }
    } catch {
      toast.error("Failed to add topic");
    }
  };

  const filteredSubjects = subjects.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.code && s.code.toLowerCase().includes(search.toLowerCase()));
    const matchesDifficulty = filterDifficulty === "ALL" || s.difficulty === filterDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">My Subjects & Syllabus</h1>
          <p className="text-sm text-muted-foreground">
            Manage your course subjects, difficulty levels, priorities, and curriculum topics.
          </p>
        </div>

        <Button className="gap-2 font-semibold shrink-0" onClick={() => setIsAddOpen(true)}>
          <Plus className="h-4 w-4" /> Add New Subject
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search subjects or course codes..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Difficulty" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Difficulties</SelectItem>
              <SelectItem value="EASY">Easy</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HARD">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Subjects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      ) : filteredSubjects.length === 0 ? (
        <Card className="border border-dashed p-12 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <BookOpen className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-lg">No Subjects Found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Add your first subject to let the AI build your customized study schedule.
            </p>
          </div>
          <Button onClick={() => setIsAddOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Add Subject
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubjects.map((subj) => (
            <Card key={subj.id} className="border shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: subj.color }} />
                      <CardTitle className="text-lg font-bold">{subj.name}</CardTitle>
                    </div>
                    {subj.code && <CardDescription className="font-mono text-xs">{subj.code}</CardDescription>}
                  </div>

                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteSubject(subj.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pb-4">
                <div className="flex items-center justify-between text-xs">
                  <Badge variant="outline" className="font-semibold">{subj.difficulty}</Badge>
                  <Badge variant={subj.priority === "CRITICAL" ? "destructive" : "secondary"}>
                    {subj.priority} Priority
                  </Badge>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Overall Syllabus Progress</span>
                    <span>{Math.round(subj.progress)}%</span>
                  </div>
                  <Progress value={subj.progress} className="h-2" />
                </div>

                {/* Topic Breakdown */}
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                    <span>Topics ({subj.topics.length})</span>
                    <button
                      onClick={() => {
                        setSelectedSubjectId(subj.id);
                        setIsTopicModalOpen(true);
                      }}
                      className="text-primary hover:underline flex items-center gap-0.5 text-[11px] font-semibold"
                    >
                      + Add Topic
                    </button>
                  </div>

                  <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                    {subj.topics.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground italic">No topics added yet.</p>
                    ) : (
                      subj.topics.map((t) => (
                        <div key={t.id} className="flex items-center justify-between text-xs p-1.5 rounded bg-muted/40">
                          <span className="truncate max-w-[180px]">{t.name}</span>
                          {t.completed ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[9px]">Completed</Badge>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">{t.estimatedMinutes}m</span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Subject Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Subject</DialogTitle>
            <DialogDescription>Input course details for AI study priority calculation.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubject} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Subject Name</Label>
              <Input placeholder="e.g. Data Structures & Algorithms" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label>Course Code (Optional)</Label>
              <Input placeholder="e.g. CS301" value={code} onChange={(e) => setCode(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select value={difficulty} onValueChange={(v: any) => setDifficulty(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EASY">Easy</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HARD">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
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

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button type="submit">Save Subject</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Topic Modal */}
      <Dialog open={isTopicModalOpen} onOpenChange={setIsTopicModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Topic</DialogTitle>
            <DialogDescription>Add a specific topic to cover under this subject.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddTopic} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Topic Name</Label>
              <Input placeholder="e.g. Graph Traversal (BFS & DFS)" value={topicName} onChange={(e) => setTopicName(e.target.value)} required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsTopicModalOpen(false)}>Cancel</Button>
              <Button type="submit">Add Topic</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
