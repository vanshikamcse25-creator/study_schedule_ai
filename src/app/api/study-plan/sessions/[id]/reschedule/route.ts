import { NextRequest } from "next/server";
import { getAuthUser, errorResponse, successResponse } from "@/lib/api-utils";
import { rescheduleMissedSession } from "@/lib/services/study-plan";
import { rescheduleSchema } from "@/lib/validations";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const { id } = await params;
    const body = await req.json();
    const parsed = rescheduleSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0]?.message ?? "Invalid reschedule action");
    }

    const result = await rescheduleMissedSession(user.id, id, parsed.data.action);

    return successResponse({
      message: "Session rescheduled successfully",
      result,
    });
  } catch (err: any) {
    return errorResponse(err.message ?? "Failed to reschedule session", 500);
  }
}
