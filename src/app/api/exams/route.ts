import { NextRequest } from "next/server";
import { getAuthUser, errorResponse, successResponse } from "@/lib/api-utils";
import prisma from "@/lib/db";
import { examSchema } from "@/lib/validations";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const exams = await prisma.exam.findMany({
      where: { userId: user.id },
      include: { subject: true },
      orderBy: { date: "asc" },
    });

    return successResponse({ exams });
  } catch {
    return errorResponse("Failed to fetch exams", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const parsed = examSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0]?.message ?? "Invalid exam input");
    }

    const { title, subjectId, date, time, type, importance, topics, notes } = parsed.data;

    const exam = await prisma.exam.create({
      data: {
        userId: user.id,
        title,
        subjectId: subjectId || null,
        date: new Date(date),
        time,
        type,
        importance,
        topics: topics ?? [],
        notes,
      },
      include: { subject: true },
    });

    return successResponse({ exam }, 201);
  } catch (err) {
    console.error("Create Exam Error:", err);
    return errorResponse("Failed to create exam", 500);
  }
}
