import { NextRequest } from "next/server";
import { getAuthUser, errorResponse, successResponse } from "@/lib/api-utils";
import prisma from "@/lib/db";
import { taskUpdateSchema } from "@/lib/validations";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const { id } = await params;
    const body = await req.json();
    const parsed = taskUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0]?.message ?? "Invalid task update");
    }

    const existing = await prisma.task.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return errorResponse("Task not found", 404);

    const updateData: any = { ...parsed.data };
    if (parsed.data.dueDate) {
      updateData.dueDate = new Date(parsed.data.dueDate);
    }

    const updated = await prisma.task.update({
      where: { id },
      data: updateData,
      include: { subject: true },
    });

    return successResponse({ task: updated });
  } catch {
    return errorResponse("Failed to update task", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const { id } = await params;
    const existing = await prisma.task.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return errorResponse("Task not found", 404);

    await prisma.task.delete({ where: { id } });

    return successResponse({ message: "Task deleted successfully" });
  } catch {
    return errorResponse("Failed to delete task", 500);
  }
}
