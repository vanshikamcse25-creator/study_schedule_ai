"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar as CalendarIcon, Clock, GraduationCap, CheckCircle2, ChevronLeft, ChevronRight, Play, Check } from "lucide-react";
import { toast } from "sonner";

interface CalendarEvent {
  id: string;
  type: "session" | "exam";
  title: string;
  date: string;
  time?: string;
  subjectName?: string;
  status?: string;
  badge?: string;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const fetchCalendarData = useCallback(async () => {
    setLoading(true);
    try {
      const [sessionsRes, examsRes] = await Promise.all([
        fetch("/api/study-plan/sessions"),
        fetch("/api/exams"),
      ]);

      const calendarEvents: CalendarEvent[] = [];

      if (sessionsRes.ok) {
        const sData = await sessionsRes.json();
        (sData.sessions ?? []).forEach((s: any) => {
          calendarEvents.push({
            id: s.id,
            type: "session",
            title: s.title ?? s.subject?.name ?? "Study Session",
            date: s.date.split("T")[0],
            time: `${s.startTime} - ${s.endTime}`,
            subjectName: s.subject?.name,
            status: s.status,
            badge: s.type,
          });
        });
      }

      if (examsRes.ok) {
        const eData = await examsRes.json();
        (eData.exams ?? []).forEach((e: any) => {
          calendarEvents.push({
            id: e.id,
            type: "exam",
            title: e.title,
            date: e.date.split("T")[0],
            time: e.time ?? "All Day",
            subjectName: e.subject?.name,
            badge: e.type,
          });
        });
      }

      setEvents(calendarEvents);
    } catch {
      toast.error("Failed to load calendar events");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  const handleCompleteSession = async (id: string) => {
    try {
      const res = await fetch(`/api/study-plan/sessions/${id}/complete`, { method: "POST" });
      if (res.ok) {
        toast.success("Session completed!");
        setSelectedEvent(null);
        fetchCalendarData();
      }
    } catch {
      toast.error("Failed to complete session");
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const todayEvents = events.filter((e) => e.date === todayStr);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Calendar & Timetable</h1>
          <p className="text-sm text-muted-foreground">
            Unified view of your scheduled study sessions, upcoming exams, and submission deadlines.
          </p>
        </div>
      </div>

      <Tabs defaultValue="month" className="space-y-6">
        <TabsList className="grid w-full sm:w-[300px] grid-cols-2">
          <TabsTrigger value="agenda">Agenda / List</TabsTrigger>
          <TabsTrigger value="month">Month Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="agenda" className="space-y-4">
          {loading ? (
            <Skeleton className="h-64 w-full rounded-2xl" />
          ) : events.length === 0 ? (
            <Card className="border border-dashed p-8 text-center text-sm text-muted-foreground">
              No events scheduled in your calendar.
            </Card>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <Card
                  key={`${event.type}-${event.id}`}
                  className="border shadow-sm hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedEvent(event)}
                >
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                        event.type === "exam" ? "bg-amber-500/10 text-amber-500" : "bg-primary/10 text-primary"
                      }`}>
                        {event.type === "exam" ? <GraduationCap className="h-5 w-5" /> : <CalendarIcon className="h-5 w-5" />}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm">{event.title}</h4>
                          <Badge variant="outline" className="text-[10px]">{event.badge}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {event.subjectName ?? "General"} • {new Date(event.date).toLocaleDateString()} {event.time ? `(${event.time})` : ""}
                        </div>
                      </div>
                    </div>

                    <Badge variant={event.type === "exam" ? "destructive" : event.status === "COMPLETED" ? "secondary" : "outline"} className="text-[10px]">
                      {event.type === "exam" ? "Exam / Deadline" : event.status ?? "Scheduled"}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="month" className="space-y-4">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-primary" /> Month Schedule ({events.length} Events Total)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-muted-foreground pb-2 border-b">
                <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
              </div>
              <div className="grid grid-cols-7 gap-2 pt-2 text-xs">
                {Array.from({ length: 28 }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const dayEvents = events.slice(0, (idx % 3));
                  return (
                    <div key={idx} className="min-h-20 border rounded-lg p-1.5 flex flex-col justify-between bg-card hover:bg-accent/30 transition-colors">
                      <span className="font-semibold text-[11px] text-muted-foreground">{dayNum}</span>
                      <div className="space-y-1">
                        {dayEvents.map((e, eIdx) => (
                          <div key={eIdx} className={`truncate text-[9px] px-1 py-0.5 rounded font-medium ${
                            e.type === "exam" ? "bg-amber-500/20 text-amber-700 dark:text-amber-300" : "bg-primary/10 text-primary"
                          }`}>
                            {e.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Event Detail Modal */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        {selectedEvent && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedEvent.type === "exam" ? <GraduationCap className="h-5 w-5 text-amber-500" /> : <CalendarIcon className="h-5 w-5 text-primary" />}
                {selectedEvent.title}
              </DialogTitle>
              <DialogDescription>
                {selectedEvent.subjectName ?? "General"} • {new Date(selectedEvent.date).toLocaleDateString()} ({selectedEvent.time})
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-2">
              <div className="text-xs text-muted-foreground">Type: <Badge variant="secondary" className="ml-1 text-[10px]">{selectedEvent.badge}</Badge></div>
              {selectedEvent.status && <div className="text-xs text-muted-foreground">Status: <strong className="text-foreground">{selectedEvent.status}</strong></div>}
            </div>

            <DialogFooter className="flex justify-between gap-2">
              <Button variant="outline" onClick={() => setSelectedEvent(null)}>Close</Button>
              {selectedEvent.type === "session" && selectedEvent.status !== "COMPLETED" && (
                <Button onClick={() => handleCompleteSession(selectedEvent.id)} className="gap-1">
                  <Check className="h-4 w-4" /> Complete Session
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
