"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckSquare, Plus, Trash2, Calendar, CheckCircle2, Circle } from "lucide-react";
import { toast } from "sonner";

interface Task {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: "TODO" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  subject?: { id: string; name: string } | null;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const [tasksRes, subjectsRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/subjects"),
      ]);

      if (tasksRes.ok) {
        const tData = await tasksRes.json();
        setTasks(tData.tasks ?? []);
      }

      if (subjectsRes.ok) {
        const sData = await subjectsRes.json();
        const list = Array.isArray(sData) ? sData : (sData.subjects ?? []);
        setSubjects(list.map((s: any) => ({ id: s.id, name: s.name })));
      }
    } catch {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || undefined,
          subjectId: subjectId || undefined,
          dueDate: dueDate || undefined,
          priority,
        }),
      });

      if (!res.ok) throw new Error("Failed to create task");

      toast.success("Task created!");
      setIsAddOpen(false);
      setTitle("");
      setDescription("");
      fetchTasks();
    } catch (err: any) {
      toast.error(err.message ?? "Error creating task");
    }
  };

  const handleToggleStatus = async (task: Task) => {
    const nextStatus = task.status === "COMPLETED" ? "TODO" : "COMPLETED";
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.ok) {
        toast.success(nextStatus === "COMPLETED" ? "Task completed! 🎉" : "Task marked to do");
        fetchTasks();
      }
    } catch {
      toast.error("Failed to update task");
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Task deleted");
        fetchTasks();
      }
    } catch {
      toast.error("Failed to delete task");
    }
  };

  const todoTasks = tasks.filter((t) => t.status !== "COMPLETED");
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED");

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Study Tasks & To-Dos</h1>
          <p className="text-sm text-muted-foreground">
            Manage your daily problem sets, reading assignments, and study checklist.
          </p>
        </div>

        <Button className="gap-2 font-semibold shrink-0" onClick={() => setIsAddOpen(true)}>
          <Plus className="h-4 w-4" /> Add Task
        </Button>
      </div>

      {loading ? (
        <Skeleton className="h-64 w-full rounded-2xl" />
      ) : tasks.length === 0 ? (
        <Card className="border border-dashed p-12 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <CheckSquare className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-lg">No Study Tasks Found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Add tasks to keep track of problem sets, readings, and homework.
            </p>
          </div>
          <Button onClick={() => setIsAddOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Add Task
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Active Tasks */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Circle className="h-4 w-4 text-amber-500" /> To-Do ({todoTasks.length})
            </h2>
            <div className="space-y-3">
              {todoTasks.map((task) => (
                <Card key={task.id} className="border shadow-sm">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <button onClick={() => handleToggleStatus(task)} className="mt-1 text-muted-foreground hover:text-emerald-500">
                        <Circle className="h-5 w-5" />
                      </button>
                      <div className="space-y-1">
                        <div className="font-semibold text-sm">{task.title}</div>
                        {task.description && <p className="text-xs text-muted-foreground">{task.description}</p>}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                          {task.subject && <Badge variant="secondary" className="text-[10px]">{task.subject.name}</Badge>}
                          {task.dueDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" /> {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                          <Badge variant={task.priority === "CRITICAL" ? "destructive" : "outline"} className="text-[10px]">
                            {task.priority}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteTask(task.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Completed Tasks */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Completed ({completedTasks.length})
            </h2>
            <div className="space-y-3">
              {completedTasks.map((task) => (
                <Card key={task.id} className="border shadow-sm bg-muted/40 opacity-75">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <button onClick={() => handleToggleStatus(task)} className="mt-1 text-emerald-500">
                        <CheckCircle2 className="h-5 w-5 fill-emerald-500 text-background" />
                      </button>
                      <div>
                        <div className="font-semibold text-sm line-through text-muted-foreground">{task.title}</div>
                        {task.subject && <Badge variant="outline" className="text-[10px] mt-1">{task.subject.name}</Badge>}
                      </div>
                    </div>

                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteTask(task.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
            <DialogDescription>Create a study task or homework reminder.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateTask} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Task Title</Label>
              <Input placeholder="e.g. Solve 5 LeetCode DP Problems" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label>Subject (Optional)</Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
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
              <Button type="submit">Save Task</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
