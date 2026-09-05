import { NextRequest } from "next/server";
import { getAuthUser, errorResponse, successResponse } from "@/lib/api-utils";
import { completeSession } from "@/lib/services/study-plan";
import { completeSessionSchema } from "@/lib/validations";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const parsed = completeSessionSchema.safeParse(body);
    const actualMinutes = parsed.success ? parsed.data.actualMinutes : undefined;

    const updatedSession = await completeSession(user.id, id, actualMinutes);

    return successResponse({
      message: "Session marked as completed",
      session: updatedSession,
    });
  } catch (err: any) {
    return errorResponse(err.message ?? "Failed to complete session", 500);
  }
}
