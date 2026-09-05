import { getAuthUser, errorResponse, successResponse } from "@/lib/api-utils";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const count = await prisma.notification.count({
      where: { userId: user.id, read: false },
    });

    return successResponse({ count });
  } catch {
    return errorResponse("Failed to fetch unread count", 500);
  }
}
