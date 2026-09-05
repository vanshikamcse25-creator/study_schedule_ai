import { NextRequest } from "next/server";
import { getAuthUser, errorResponse, successResponse } from "@/lib/api-utils";
import prisma from "@/lib/db";
import { subjectSchema } from "@/lib/validations";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const { id } = await params;
    const subject = await prisma.subject.findFirst({
      where: { id, userId: user.id },
      include: { topics: true, exams: true, tasks: true },
    });

    if (!subject) return errorResponse("Subject not found", 404);

    return successResponse({ subject });
  } catch {
    return errorResponse("Failed to fetch subject", 500);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const { id } = await params;
    const body = await req.json();
    const parsed = subjectSchema.partial().safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0]?.message ?? "Invalid input");
    }

    const existing = await prisma.subject.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return errorResponse("Subject not found", 404);

    const updated = await prisma.subject.update({
      where: { id },
      data: parsed.data,
      include: { topics: true },
    });

    return successResponse({ subject: updated });
  } catch {
    return errorResponse("Failed to update subject", 500);
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
    const existing = await prisma.subject.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return errorResponse("Subject not found", 404);

    await prisma.subject.delete({ where: { id } });

    return successResponse({ message: "Subject deleted successfully" });
  } catch {
    return errorResponse("Failed to delete subject", 500);
  }
}
