"use client";

import { useEffect, useState, useCallback } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar as CalendarIcon, Clock, GraduationCap, ChevronLeft, ChevronRight, Check } from "lucide-react";
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
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

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
            date: typeof s.date === "string" ? s.date.split("T")[0] : format(new Date(s.date), "yyyy-MM-dd"),
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
            date: typeof e.date === "string" ? e.date.split("T")[0] : format(new Date(e.date), "yyyy-MM-dd"),
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

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  // Calendar Grid calculation for current selected month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const daysGrid = eachDayOfInterval({ start: startDate, end: endDate });

  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
  const selectedDateEvents = events.filter((e) => e.date === selectedDateStr);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Calendar & Timetable</h1>
          <p className="text-sm text-muted-foreground">
            Unified view of your scheduled study sessions, upcoming exams, and deadlines.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday} className="gap-1.5 text-xs font-semibold">
            <CalendarIcon className="h-3.5 w-3.5 text-primary" /> Today ({format(new Date(), "MMM d")})
          </Button>
        </div>
      </div>

      <Tabs defaultValue="month" className="space-y-6">
        <TabsList className="grid w-full sm:w-[300px] grid-cols-2">
          <TabsTrigger value="month">Month Overview</TabsTrigger>
          <TabsTrigger value="agenda">Agenda / List</TabsTrigger>
        </TabsList>

        <TabsContent value="month" className="space-y-4">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                {format(currentMonth, "MMMM yyyy")}
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" onClick={prevMonth} className="h-8 w-8">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToToday} className="h-8 text-xs px-2.5 font-medium">
                  Today
                </Button>
                <Button variant="outline" size="icon" onClick={nextMonth} className="h-8 w-8">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {/* Days of week header */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-muted-foreground pb-2 border-b">
                <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1.5 pt-2 text-xs">
                {daysGrid.map((dayItem) => {
                  const dayStr = format(dayItem, "yyyy-MM-dd");
                  const dayEvents = events.filter((e) => e.date === dayStr);
                  const isCurrentMonthDay = isSameMonth(dayItem, currentMonth);
                  const isTodayDay = isToday(dayItem);
                  const isSelectedDay = isSameDay(dayItem, selectedDate);

                  return (
                    <div
                      key={dayStr}
                      onClick={() => setSelectedDate(dayItem)}
                      className={`min-h-24 border rounded-xl p-1.5 flex flex-col justify-between cursor-pointer transition-all ${
                        !isCurrentMonthDay ? "bg-muted/20 text-muted-foreground/40 border-transparent" : "bg-card hover:border-primary/50"
                      } ${
                        isSelectedDay ? "ring-2 ring-primary border-primary bg-primary/5" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-semibold text-xs h-6 w-6 rounded-full flex items-center justify-center ${
                            isTodayDay
                              ? "bg-primary text-primary-foreground font-bold shadow-sm ring-2 ring-primary/30"
                              : isCurrentMonthDay
                              ? "text-foreground"
                              : "text-muted-foreground/40"
                          }`}
                        >
                          {format(dayItem, "d")}
                        </span>
                        {dayEvents.length > 0 && (
                          <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 font-bold">
                            {dayEvents.length}
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-1 my-1 overflow-hidden max-h-14">
                        {dayEvents.slice(0, 2).map((e, eIdx) => (
                          <div
                            key={eIdx}
                            onClick={(evt) => {
                              evt.stopPropagation();
                              setSelectedEvent(e);
                            }}
                            className={`truncate text-[9px] px-1.5 py-0.5 rounded font-medium transition-opacity hover:opacity-80 ${
                              e.type === "exam"
                                ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                                : e.status === "COMPLETED"
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 line-through"
                                : "bg-primary/15 text-primary border border-primary/20"
                            }`}
                          >
                            {e.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <p className="text-[9px] text-muted-foreground font-medium pl-1">
                            +{dayEvents.length - 2} more
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Events breakdown for selected date */}
          <Card className="border shadow-sm">
            <CardHeader className="py-3 px-4 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Schedule for {format(selectedDate, "EEEE, MMMM d, yyyy")}
                {isToday(selectedDate) && <Badge className="ml-1 text-[10px]">Today</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {selectedDateEvents.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  No sessions or exams scheduled for this date.
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedDateEvents.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className="flex items-center justify-between p-3 rounded-lg border bg-accent/30 hover:bg-accent/60 transition-colors cursor-pointer text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                            event.type === "exam" ? "bg-amber-500/20 text-amber-600" : "bg-primary/20 text-primary"
                          }`}
                        >
                          {event.type === "exam" ? <GraduationCap className="h-4 w-4" /> : <CalendarIcon className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{event.title}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {event.subjectName ?? "General"} {event.time ? `• ${event.time}` : ""}
                          </p>
                        </div>
                      </div>
                      <Badge variant={event.type === "exam" ? "destructive" : event.status === "COMPLETED" ? "secondary" : "outline"}>
                        {event.type === "exam" ? "Exam / Deadline" : event.status ?? "Scheduled"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

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
                      <div
                        className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                          event.type === "exam" ? "bg-amber-500/10 text-amber-500" : "bg-primary/10 text-primary"
                        }`}
                      >
                        {event.type === "exam" ? <GraduationCap className="h-5 w-5" /> : <CalendarIcon className="h-5 w-5" />}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm">{event.title}</h4>
                          {event.badge && <Badge variant="outline" className="text-[10px]">{event.badge}</Badge>}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {event.subjectName ?? "General"} • {event.date} {event.time ? `(${event.time})` : ""}
                        </div>
                      </div>
                    </div>

                    <Badge
                      variant={event.type === "exam" ? "destructive" : event.status === "COMPLETED" ? "secondary" : "outline"}
                      className="text-[10px]"
                    >
                      {event.type === "exam" ? "Exam / Deadline" : event.status ?? "Scheduled"}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Event Detail Modal */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        {selectedEvent && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedEvent.type === "exam" ? (
                  <GraduationCap className="h-5 w-5 text-amber-500" />
                ) : (
                  <CalendarIcon className="h-5 w-5 text-primary" />
                )}
                {selectedEvent.title}
              </DialogTitle>
              <DialogDescription>
                {selectedEvent.subjectName ?? "General"} • {selectedEvent.date} ({selectedEvent.time})
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-2">
              <div className="text-xs text-muted-foreground">
                Type: <Badge variant="secondary" className="ml-1 text-[10px]">{selectedEvent.badge}</Badge>
              </div>
              {selectedEvent.status && (
                <div className="text-xs text-muted-foreground">
                  Status: <strong className="text-foreground">{selectedEvent.status}</strong>
                </div>
              )}
            </div>

            <DialogFooter className="flex justify-between gap-2">
              <Button variant="outline" onClick={() => setSelectedEvent(null)}>
                Close
              </Button>
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
