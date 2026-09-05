import { NextRequest } from "next/server";
import { getAuthUser, errorResponse, successResponse } from "@/lib/api-utils";
import prisma from "@/lib/db";
import { profileSettingsSchema } from "@/lib/validations";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const [userDb, profile] = await Promise.all([
      prisma.user.findUnique({
        where: { id: user.id },
        select: { id: true, name: true, email: true, image: true },
      }),
      prisma.profile.findUnique({
        where: { userId: user.id },
      }),
    ]);

    return successResponse({ user: userDb, profile });
  } catch {
    return errorResponse("Failed to fetch settings", 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const parsed = profileSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0]?.message ?? "Invalid settings data");
    }

    const { name, ...profileData } = parsed.data;

    if (name) {
      await prisma.user.update({
        where: { id: user.id },
        data: { name },
      });
    }

    const updatedProfile = await prisma.profile.upsert({
      where: { userId: user.id },
      update: profileData,
      create: {
        userId: user.id,
        ...profileData,
      },
    });

    return successResponse({
      message: "Settings updated successfully",
      profile: updatedProfile,
    });
  } catch (err) {
    console.error("Update settings error:", err);
    return errorResponse("Failed to update settings", 500);
  }
}
