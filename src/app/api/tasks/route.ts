import { NextRequest } from "next/server";
import { getAuthUser, errorResponse, successResponse } from "@/lib/api-utils";
import prisma from "@/lib/db";
import { taskSchema } from "@/lib/validations";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const tasks = await prisma.task.findMany({
      where: { userId: user.id },
      include: { subject: true },
      orderBy: { createdAt: "desc" },
    });

    return successResponse({ tasks });
  } catch {
    return errorResponse("Failed to fetch tasks", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const parsed = taskSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0]?.message ?? "Invalid task input");
    }

    const { title, description, subjectId, dueDate, priority } = parsed.data;

    const task = await prisma.task.create({
      data: {
        userId: user.id,
        title,
        description,
        subjectId: subjectId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority,
      },
      include: { subject: true },
    });

    return successResponse({ task }, 201);
  } catch {
    return errorResponse("Failed to create task", 500);
  }
}
