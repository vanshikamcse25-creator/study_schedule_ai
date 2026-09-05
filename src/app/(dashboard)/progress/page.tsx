"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { BarChart3, TrendingUp, Clock, CheckCircle2, Flame, Award, Calendar } from "lucide-react";
import { toast } from "sonner";

interface AnalyticsData {
  summary: {
    totalStudyHours: number;
    completedSessionsCount: number;
    missedSessionsCount: number;
    completionRate: number;
    currentStreak: number;
    longestStreak: number;
    xp: number;
    level: number;
  };
  subjectProgress: Array<{
    id: string;
    name: string;
    color: string;
    progress: number;
  }>;
  dailyData: Array<{
    date: string;
    minutes: number;
    completed: number;
    missed: number;
  }>;
}

export default function ProgressPage() {
  const [days, setDays] = useState<string>("7");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/progress?days=${days}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch {
      toast.error("Failed to load progress analytics");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const COLORS = ["#6366f1", "#ec4899", "#10b981", "#f59e0b", "#8b5cf6", "#3b82f6"];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Progress & Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Track your study velocity, completion rates, subject mastery, and study streaks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-96 w-full rounded-2xl" />
      ) : !data ? (
        <Card className="p-8 text-center text-muted-foreground">No analytics data available.</Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground font-medium">Total Study Time</span>
                  <div className="text-2xl font-bold">{data.summary.totalStudyHours} Hours</div>
                  <p className="text-[11px] text-muted-foreground">Over the last {days} days</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Clock className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground font-medium">Completion Rate</span>
                  <div className="text-2xl font-bold">{data.summary.completionRate}%</div>
                  <p className="text-[11px] text-emerald-500 font-medium">{data.summary.completedSessionsCount} sessions finished</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground font-medium">Current Streak</span>
                  <div className="text-2xl font-bold">{data.summary.currentStreak} Days 🔥</div>
                  <p className="text-[11px] text-muted-foreground">Best: {data.summary.longestStreak} days</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Flame className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground font-medium">Level & XP</span>
                  <div className="text-2xl font-bold">Lvl {data.summary.level}</div>
                  <p className="text-[11px] text-primary font-medium">{data.summary.xp} Total XP</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                  <Award className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Daily Study Minutes Bar Chart */}
            <Card className="lg:col-span-2 border shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" /> Daily Study Duration (Minutes)
                </CardTitle>
                <CardDescription>Daily focused study time logged in sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.dailyData}>
                      <XAxis dataKey="date" tickLine={false} axisLine={false} className="text-xs" />
                      <YAxis tickLine={false} axisLine={false} className="text-xs" />
                      <Tooltip
                        contentStyle={{ backgroundColor: "var(--card)", borderRadius: "8px", borderColor: "var(--border)" }}
                      />
                      <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Subject Mastery Progress */}
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Subject Mastery</CardTitle>
                <CardDescription>Syllabus completion percentage per course</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.subjectProgress.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">No subjects added yet.</p>
                ) : (
                  data.subjectProgress.map((subj, idx) => (
                    <div key={subj.id} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span>{subj.name}</span>
                        <span>{Math.round(subj.progress)}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${subj.progress}%`,
                            backgroundColor: subj.color || COLORS[idx % COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
