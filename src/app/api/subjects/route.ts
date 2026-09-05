import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuthUserId, errorResponse, successResponse } from "@/lib/api-utils";
import { subjectSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const userId = await requireAuthUserId(req);
    if (typeof userId !== "string") return userId;

    const subjects = await prisma.subject.findMany({
      where: { userId },
      include: {
        topics: { orderBy: { createdAt: "asc" } },
        _count: { select: { exams: true, tasks: true, studySessions: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(subjects);
  } catch {
    return errorResponse("Failed to fetch subjects", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireAuthUserId(req);
    if (typeof userId !== "string") return userId;

    const body = await req.json();
    const parsed = subjectSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0]?.message ?? "Invalid input");
    }

    const subject = await prisma.subject.create({
      data: { ...parsed.data, userId },
      include: { topics: true },
    });

    return successResponse(subject, 201);
  } catch (err: any) {
    console.error("Error creating subject:", err);
    return errorResponse(err?.message ?? "Failed to create subject", 500);
  }
}
