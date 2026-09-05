import { NextRequest } from "next/server";
import { requireAuthUserId, errorResponse, successResponse } from "@/lib/api-utils";
import { generatePlan } from "@/lib/services/study-plan";
import { generatePlanSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const userId = await requireAuthUserId();
    if (typeof userId !== "string") return userId;

    const body = await req.json().catch(() => ({}));
    const parsed = generatePlanSchema.safeParse(body);
    const days = parsed.success && parsed.data.days ? parsed.data.days : 7;

    const result = await generatePlan(userId, days);

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
