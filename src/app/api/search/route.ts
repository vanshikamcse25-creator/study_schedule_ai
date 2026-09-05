import { NextRequest } from "next/server";
import { getAuthUser, errorResponse, successResponse } from "@/lib/api-utils";
import prisma from "@/lib/db";
import { searchQuerySchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? "";

    const parsed = searchQuerySchema.safeParse({ q });
    if (!parsed.success) {
      return successResponse({ results: [] });
    }

    const queryStr = parsed.data.q.toLowerCase();

    const [subjects, exams, tasks, sessions] = await Promise.all([
      prisma.subject.findMany({
        where: {
          userId: user.id,
          OR: [
            { name: { contains: queryStr, mode: "insensitive" } },
            { code: { contains: queryStr, mode: "insensitive" } },
          ],
        },
        take: 5,
      }),
      prisma.exam.findMany({
        where: {
          userId: user.id,
          OR: [
            { title: { contains: queryStr, mode: "insensitive" } },
            { notes: { contains: queryStr, mode: "insensitive" } },
          ],
        },
        include: { subject: true },
        take: 5,
      }),
      prisma.task.findMany({
        where: {
          userId: user.id,
          OR: [
            { title: { contains: queryStr, mode: "insensitive" } },
            { description: { contains: queryStr, mode: "insensitive" } },
          ],
        },
        include: { subject: true },
        take: 5,
      }),
      prisma.studySession.findMany({
        where: {
          userId: user.id,
          OR: [
            { title: { contains: queryStr, mode: "insensitive" } },
            { reason: { contains: queryStr, mode: "insensitive" } },
          ],
        },
        include: { subject: true },
        take: 5,
      }),
    ]);

    const results = [
      ...subjects.map((s) => ({
        type: "subject" as const,
        id: s.id,
        title: s.name,
        subtitle: s.code ? `Code: ${s.code} • Progress: ${Math.round(s.progress)}%` : `Progress: ${Math.round(s.progress)}%`,
        url: `/subjects?id=${s.id}`,
      })),
      ...exams.map((e) => ({
        type: "exam" as const,
        id: e.id,
        title: e.title,
        subtitle: `${e.subject?.name ?? "Exam"} • ${new Date(e.date).toLocaleDateString()}`,
        url: `/exams`,
      })),
      ...tasks.map((t) => ({
        type: "task" as const,
        id: t.id,
        title: t.title,
        subtitle: `${t.subject?.name ?? "Task"} • ${t.status}`,
        url: `/tasks`,
      })),
      ...sessions.map((s) => ({
        type: "session" as const,
        id: s.id,
        title: s.title ?? "Study Session",
        subtitle: `${s.subject?.name ?? "Study"} • ${s.startTime} - ${s.endTime}`,
        url: `/study-plan`,
      })),
    ];

    return successResponse({ results });
  } catch (err) {
    console.error("Global search error:", err);
    return errorResponse("Search failed", 500);
  }
}
