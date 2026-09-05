import { NextRequest } from "next/server";
import { getAuthUser, errorResponse, successResponse } from "@/lib/api-utils";
import { sendMessage } from "@/lib/services/chat";
import { chatMessageSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const parsed = chatMessageSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0]?.message ?? "Invalid message");
    }

    const { message, conversationId } = parsed.data;
    const result = await sendMessage(user.id, message, conversationId);

    return successResponse({
      reply: result.reply,
      conversationId: result.conversationId,
      messageId: result.userMessage.id,
    });
  } catch (err: any) {
    console.error("Chat API Error:", err);
    return errorResponse(err.message ?? "Failed to process chat message", 500);
  }
}
