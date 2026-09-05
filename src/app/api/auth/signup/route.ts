import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import { signupSchema } from "@/lib/validations";
import { errorResponse, successResponse } from "@/lib/api-utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0]?.message ?? "Invalid input");
    }

    const existing = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });
    if (existing) {
      return errorResponse("An account with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(parsed.data.password, 12);
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        password: hashedPassword,
        profile: { create: {} },
        studyStreak: { create: {} },
      },
    });

    return successResponse({ id: user.id, email: user.email }, 201);
  } catch {
    return errorResponse("Something went wrong while creating your account. Please try again.", 500);
  }
}
