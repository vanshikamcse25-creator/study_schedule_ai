import { NextRequest } from "next/server";
import { getAuthUser, errorResponse, successResponse } from "@/lib/api-utils";
import prisma from "@/lib/db";
import { studySessionSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const whereClause: any = { userId: user.id };

    if (startDateParam || endDateParam) {
      whereClause.date = {};
      if (startDateParam) {
        const start = new Date(startDateParam);
        start.setUTCHours(0, 0, 0, 0);
        whereClause.date.gte = start;
      }
      if (endDateParam) {
        const end = new Date(endDateParam);
        end.setUTCHours(23, 59, 59, 999);
        whereClause.date.lte = end;
      }
    }

    const sessions = await prisma.studySession.findMany({
      where: whereClause,
      include: { subject: true, topic: true },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    return successResponse({ sessions });
  } catch {
    return errorResponse("Failed to fetch sessions", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const parsed = studySessionSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0]?.message ?? "Invalid session input");
    }

    const { subjectId, topicId, title, date, startTime, endTime, duration, type, difficulty } = parsed.data;

    let finalTitle = title;
    if (!finalTitle && subjectId) {
      const subj = await prisma.subject.findFirst({ where: { id: subjectId, userId: user.id } });
      finalTitle = subj?.name ?? "Study Session";
    }

    const session = await prisma.studySession.create({
      data: {
        userId: user.id,
        subjectId: subjectId || null,
        topicId: topicId || null,
        title: finalTitle ?? "Custom Session",
        date: new Date(date),
        startTime,
        endTime,
        duration,
        type,
        difficulty,
        status: "SCHEDULED",
      },
      include: { subject: true, topic: true },
    });

    return successResponse({ session }, 201);
  } catch {
    return errorResponse("Failed to create study session", 500);
  }
}
