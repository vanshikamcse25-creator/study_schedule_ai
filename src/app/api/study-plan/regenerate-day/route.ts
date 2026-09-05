import { NextRequest } from "next/server";
import { getAuthUser, errorResponse, successResponse } from "@/lib/api-utils";
import { regenerateDay } from "@/lib/services/study-plan";
import { regenerateDaySchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const parsed = regenerateDaySchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0]?.message ?? "Invalid date");
    }

    const result = await regenerateDay(user.id, parsed.data.date);

    return successResponse({
      message: "Day plan regenerated successfully",
      sessions: result.sessions,
      summary: result.summary,
    });
  } catch (err: any) {
    return errorResponse(err.message ?? "Failed to regenerate day plan", 500);
  }
}
