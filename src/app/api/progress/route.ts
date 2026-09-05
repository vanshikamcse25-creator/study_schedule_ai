import { NextRequest } from "next/server";
import { getAuthUser, errorResponse, successResponse } from "@/lib/api-utils";
import prisma from "@/lib/db";
import { startOfDay, subDays } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const daysParam = parseInt(searchParams.get("days") ?? "7", 10);
    const days = [7, 30, 90].includes(daysParam) ? daysParam : 7;

    const startDate = startOfDay(subDays(new Date(), days - 1));

    const [subjects, sessions, streak, userDb] = await Promise.all([
      prisma.subject.findMany({
        where: { userId: user.id },
        include: { topics: true },
      }),
      prisma.studySession.findMany({
        where: {
          userId: user.id,
          date: { gte: startDate },
        },
      }),
      prisma.studyStreak.findUnique({
        where: { userId: user.id },
      }),
      prisma.user.findUnique({
        where: { id: user.id },
        select: { xp: true, level: true },
      }),
    ]);

    const completedSessions = sessions.filter((s) => s.status === "COMPLETED");
    const missedSessions = sessions.filter((s) => s.status === "MISSED");
    const totalMinutes = completedSessions.reduce((acc, s) => acc + (s.actualMinutes ?? s.duration), 0);
    const completionRate = sessions.length ? Math.round((completedSessions.length / sessions.length) * 100) : 100;

    // Daily breakdown for charts
    const chartMap: Record<string, { date: string; minutes: number; completed: number; missed: number }> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = subDays(new Date(), i).toISOString().split("T")[0];
      chartMap[d] = { date: d, minutes: 0, completed: 0, missed: 0 };
    }

    sessions.forEach((s) => {
      const dateStr = s.date.toISOString().split("T")[0];
      if (chartMap[dateStr]) {
        if (s.status === "COMPLETED") {
          chartMap[dateStr].minutes += s.actualMinutes ?? s.duration;
          chartMap[dateStr].completed += 1;
        } else if (s.status === "MISSED") {
          chartMap[dateStr].missed += 1;
        }
      }
    });

    const dailyData = Object.values(chartMap);

    return successResponse({
      summary: {
        totalStudyHours: parseFloat((totalMinutes / 60).toFixed(1)),
        completedSessionsCount: completedSessions.length,
        missedSessionsCount: missedSessions.length,
        completionRate,
        currentStreak: streak?.currentStreak ?? 0,
        longestStreak: streak?.longestStreak ?? 0,
        xp: userDb?.xp ?? 0,
        level: userDb?.level ?? 1,
      },
      subjectProgress: subjects.map((s) => ({
        id: s.id,
        name: s.name,
        color: s.color,
        progress: s.progress,
        totalTopics: s.topics.length,
        completedTopics: s.topics.filter((t) => t.completed).length,
      })),
      dailyData,
    });
  } catch (err) {
    console.error("Progress API error:", err);
    return errorResponse("Failed to fetch progress analytics", 500);
  }
}
