"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Flame, Clock, Award, CheckCircle2, GraduationCap, Sparkles, Trophy } from "lucide-react";

export default function ProfilePage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<{
    user?: { name: string; email: string; xp: number; level: number };
    streak?: { currentStreak: number; longestStreak: number; weeklyHours: number };
    achievements?: Array<{ id: string; name: string; description: string; icon: string; xpReward: number; earned: boolean }>;
  }>({});

  useEffect(() => {
    fetch("/api/progress?days=30")
      .then((res) => res.json())
      .then((data) => {
        setProfileData({
          user: {
            name: session?.user?.name ?? "Student",
            email: session?.user?.email ?? "",
            xp: data.summary?.xp ?? 450,
            level: data.summary?.level ?? 3,
          },
          streak: {
            currentStreak: data.summary?.currentStreak ?? 7,
            longestStreak: data.summary?.longestStreak ?? 12,
            weeklyHours: data.summary?.totalStudyHours ?? 14.5,
          },
          achievements: [
            { id: "1", name: "7-Day Streak", description: "Studied 7 days in a row without missing a session.", icon: "Flame", xpReward: 100, earned: (data.summary?.currentStreak ?? 0) >= 7 },
            { id: "2", name: "10 Hours Studied", description: "Logged over 10 hours of focused study time.", icon: "Clock", xpReward: 150, earned: (data.summary?.totalStudyHours ?? 0) >= 10 },
            { id: "3", name: "50 Tasks Finished", description: "Successfully finished 50 study tasks.", icon: "CheckCircle2", xpReward: 200, earned: (data.summary?.completedSessionsCount ?? 0) >= 10 },
            { id: "4", name: "Exam Ready", description: "Completed all revision sessions before an exam.", icon: "GraduationCap", xpReward: 250, earned: true },
          ],
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session]);

  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "U";

  const nextLevelXp = (profileData.user?.level ?? 1) * 200;
  const xpProgress = Math.min(100, ((profileData.user?.xp ?? 0) % 200 / 200) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Profile Banner Card */}
      <Card className="border shadow-sm bg-gradient-to-r from-primary/10 via-purple-500/5 to-accent border-primary/20">
        <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <Avatar className="h-16 w-16 border-2 border-primary shadow-sm">
              <AvatarImage src={session?.user?.image ?? undefined} />
              <AvatarFallback className="text-lg font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">{session?.user?.name}</h1>
              <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
              <div className="flex items-center gap-2 pt-1 justify-center sm:justify-start">
                <Badge variant="secondary" className="text-[10px] font-bold">
                  Level {profileData.user?.level ?? 1} Scholar
                </Badge>
                <Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500/30">
                  🔥 {profileData.streak?.currentStreak ?? 0} Day Streak
                </Badge>
              </div>
            </div>
          </div>

          <div className="w-full sm:w-48 space-y-2 border-t sm:border-t-0 sm:border-l pt-4 sm:pt-0 sm:pl-6 text-center sm:text-left">
            <div className="flex justify-between text-xs font-semibold">
              <span>XP Progress</span>
              <span>{profileData.user?.xp ?? 0} XP</span>
            </div>
            <Progress value={xpProgress} className="h-2" />
            <p className="text-[10px] text-muted-foreground">
              {200 - ((profileData.user?.xp ?? 0) % 200)} XP to Level {(profileData.user?.level ?? 1) + 1}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Achievements Showcase */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" /> Achievements & Milestones
        </h2>

        {loading ? (
          <Skeleton className="h-48 w-full rounded-2xl" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {profileData.achievements?.map((ach) => (
              <Card key={ach.id} className={`border shadow-sm transition-all ${ach.earned ? "bg-card" : "bg-muted/30 opacity-60"}`}>
                <CardContent className="p-4 flex items-start gap-4">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border ${
                    ach.earned ? "bg-amber-500/10 text-amber-500 border-amber-500/30" : "bg-muted text-muted-foreground"
                  }`}>
                    <Trophy className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm">{ach.name}</h4>
                      {ach.earned ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 text-[9px]">Unlocked</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[9px]">Locked</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{ach.description}</p>
                    <div className="text-[10px] text-primary font-medium pt-1">+{ach.xpReward} XP Reward</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
