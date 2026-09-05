import { NextRequest } from "next/server";
import { getAuthUser, errorResponse, successResponse } from "@/lib/api-utils";
import prisma from "@/lib/db";
import { sessionUpdateSchema } from "@/lib/validations";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const { id } = await params;
    const body = await req.json();
    const parsed = sessionUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0]?.message ?? "Invalid update input");
    }

    const existing = await prisma.studySession.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return errorResponse("Session not found", 404);

    const updateData: any = { ...parsed.data };
    if (parsed.data.date) {
      updateData.date = new Date(parsed.data.date);
    }

    const updated = await prisma.studySession.update({
      where: { id },
      data: updateData,
      include: { subject: true, topic: true },
    });

    return successResponse({ session: updated });
  } catch {
    return errorResponse("Failed to update study session", 500);
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
    const existing = await prisma.studySession.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return errorResponse("Session not found", 404);

    await prisma.studySession.delete({ where: { id } });

    return successResponse({ message: "Session deleted successfully" });
  } catch {
    return errorResponse("Failed to delete study session", 500);
  }
}
