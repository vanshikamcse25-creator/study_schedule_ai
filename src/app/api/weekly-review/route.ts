import { NextRequest } from "next/server";
import { getAuthUser, errorResponse, successResponse } from "@/lib/api-utils";
import prisma from "@/lib/db";
import { generateWeeklyReview } from "@/lib/ai/groq";
import { startOfWeek, endOfWeek, subDays } from "date-fns";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const reviews = await prisma.weeklyReview.findMany({
      where: { userId: user.id },
      orderBy: { weekStart: "desc" },
      take: 10,
    });

    return successResponse({ reviews });
  } catch {
    return errorResponse("Failed to fetch weekly reviews", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const sessions = await prisma.studySession.findMany({
      where: {
        userId: user.id,
        date: { gte: weekStart, lte: weekEnd },
      },
      include: { subject: true },
    });

    const completed = sessions.filter((s) => s.status === "COMPLETED");
    const missed = sessions.filter((s) => s.status === "MISSED");
    const totalMinutes = completed.reduce((acc, s) => acc + (s.actualMinutes ?? s.duration), 0);
    const rate = sessions.length ? (completed.length / sessions.length) * 100 : 100;

    let recommendation = "Great job staying focused this week! Keep up the consistent study routine.";
    try {
      const context = JSON.stringify({
        totalStudyMinutes: totalMinutes,
        sessionsCompleted: completed.length,
        sessionsMissed: missed.length,
        completionRate: rate,
      });
      const aiReview = await generateWeeklyReview(context);
      if (aiReview?.recommendation) {
        recommendation = aiReview.recommendation;
      }
    } catch {
      /* fallback */
    }

    const review = await prisma.weeklyReview.create({
      data: {
        userId: user.id,
        weekStart,
        weekEnd,
        totalStudyMinutes: totalMinutes,
        sessionsCompleted: completed.length,
        sessionsMissed: missed.length,
        completionRate: rate,
        aiRecommendation: recommendation,
      },
    });

    return successResponse({ review }, 201);
  } catch {
    return errorResponse("Failed to generate weekly review", 500);
  }
}
