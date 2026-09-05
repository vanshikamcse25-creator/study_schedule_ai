import { NextRequest } from "next/server";
import { getAuthUser, errorResponse, successResponse } from "@/lib/api-utils";
import prisma from "@/lib/db";
import { examSchema } from "@/lib/validations";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const { id } = await params;
    const body = await req.json();
    const parsed = examSchema.partial().safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0]?.message ?? "Invalid input");
    }

    const existing = await prisma.exam.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return errorResponse("Exam not found", 404);

    const dataToUpdate: any = { ...parsed.data };
    if (parsed.data.date) {
      dataToUpdate.date = new Date(parsed.data.date);
    }

    const updated = await prisma.exam.update({
      where: { id },
      data: dataToUpdate,
      include: { subject: true },
    });

    return successResponse({ exam: updated });
  } catch {
    return errorResponse("Failed to update exam", 500);
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
    const existing = await prisma.exam.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return errorResponse("Exam not found", 404);

    await prisma.exam.delete({ where: { id } });

    return successResponse({ message: "Exam deleted successfully" });
  } catch {
    return errorResponse("Failed to delete exam", 500);
  }
}
