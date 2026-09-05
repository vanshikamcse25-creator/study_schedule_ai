import { NextRequest } from "next/server";
import { getAuthUser, errorResponse, successResponse } from "@/lib/api-utils";
import { generatePlan } from "@/lib/services/study-plan";
import { generatePlanSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const body = await req.json().catch(() => ({}));
    const parsed = generatePlanSchema.safeParse(body);
    const days = parsed.success && parsed.data.days ? parsed.data.days : 7;

    const result = await generatePlan(user.id, days);

    return successResponse({
      message: "Study plan generated successfully",
      sessions: result.sessions,
      summary: result.summary,
    });
  } catch (err: any) {
    console.error("Generate Study Plan API Error:", err);
    return errorResponse(err.message ?? "Failed to generate study plan", 500);
  }
}
