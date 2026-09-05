import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { NextResponse } from "next/server";

export async function getAuthUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function getAuthUser(): Promise<{ id: string } | null> {
  const userId = await getAuthUserId();
  if (!userId) return null;
  return { id: userId };
}

export async function requireAuthUserId(): Promise<string | NextResponse> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
      await prisma.user.create({
        data: {
          id: userId,
          email: session.user.email ?? `${userId}@studyflow.ai`,
          name: session.user.name ?? "Student",
          image: session.user.image,
        },
      });
    }
  } catch (err) {
    console.error("Error ensuring user exists in DB:", err);
  }

  return userId;
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}
