import { NextRequest } from "next/server";
import { getAuthUser, errorResponse, successResponse } from "@/lib/api-utils";
import prisma from "@/lib/db";
import { topicSchema } from "@/lib/validations";
import { z } from "zod";

const createTopicSchema = topicSchema.extend({
  subjectId: z.string().min(1, "Subject ID is required"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const parsed = createTopicSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0]?.message ?? "Invalid topic input");
    }

    const { subjectId, name, difficulty, estimatedMinutes } = parsed.data;
    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, userId: user.id },
    });
    if (!subject) return errorResponse("Subject not found", 404);

    const topic = await prisma.topic.create({
      data: {
        subjectId,
        name,
        difficulty,
        estimatedMinutes,
      },
    });

    return successResponse({ topic }, 201);
  } catch {
    return errorResponse("Failed to create topic", 500);
  }
}
