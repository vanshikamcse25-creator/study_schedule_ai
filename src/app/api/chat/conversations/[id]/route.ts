import { NextRequest } from "next/server";
import { getAuthUser, errorResponse, successResponse } from "@/lib/api-utils";
import prisma from "@/lib/db";
import { deleteConversation } from "@/lib/services/chat";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const { id } = await params;
    const conversation = await prisma.chatConversation.findFirst({
      where: { id, userId: user.id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!conversation) return errorResponse("Conversation not found", 404);

    return successResponse({ conversation });
  } catch {
    return errorResponse("Failed to fetch conversation", 500);
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
    await deleteConversation(user.id, id);

    return successResponse({ message: "Conversation deleted successfully" });
  } catch (err: any) {
    return errorResponse(err.message ?? "Failed to delete conversation", 500);
  }
}
