import { NextRequest } from "next/server";
import { getAuthUser, errorResponse, successResponse } from "@/lib/api-utils";
import prisma from "@/lib/db";
import { topicSchema } from "@/lib/validations";
import { z } from "zod";

const updateTopicSchema = topicSchema.partial().extend({
  completed: z.boolean().optional(),
  progress: z.number().min(0).max(100).optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const { id } = await params;
    const body = await req.json();
    const parsed = updateTopicSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0]?.message ?? "Invalid input");
    }

    const topic = await prisma.topic.findFirst({
      where: { id, subject: { userId: user.id } },
    });
    if (!topic) return errorResponse("Topic not found", 404);

    const updated = await prisma.topic.update({
      where: { id },
      data: parsed.data,
    });

    return successResponse({ topic: updated });
  } catch {
    return errorResponse("Failed to update topic", 500);
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
    const topic = await prisma.topic.findFirst({
      where: { id, subject: { userId: user.id } },
    });
    if (!topic) return errorResponse("Topic not found", 404);

    await prisma.topic.delete({ where: { id } });

    return successResponse({ message: "Topic deleted successfully" });
  } catch {
    return errorResponse("Failed to delete topic", 500);
  }
}
