import { NextRequest } from "next/server";
import { getAuthUser, errorResponse, successResponse } from "@/lib/api-utils";
import prisma from "@/lib/db";
import { createConversation } from "@/lib/services/chat";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const conversations = await prisma.chatConversation.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return successResponse({ conversations });
  } catch {
    return errorResponse("Failed to fetch conversations", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const body = await req.json().catch(() => ({}));
    const title = body.title ?? "New Conversation";

    const conversation = await createConversation(user.id, title);

    return successResponse({ conversation }, 201);
  } catch {
    return errorResponse("Failed to create conversation", 500);
  }
}
