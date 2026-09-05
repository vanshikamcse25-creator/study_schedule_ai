import { NextRequest } from "next/server";
import { getAuthUser, errorResponse, successResponse } from "@/lib/api-utils";
import prisma from "@/lib/db";
import { onboardingSchema } from "@/lib/validations";
import { generatePlan } from "@/lib/services/study-plan";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const parsed = onboardingSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0]?.message ?? "Invalid onboarding data");
    }

    const {
      name,
      educationLevel,
      course,
      semester,
      preferredStudyTime,
      availableHoursPerDay,
      studyDays,
      maxSessionDuration,
      breakDuration,
      studyStyle,
      subjects,
    } = parsed.data;

    // Update User name
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        onboardingComplete: true,
      },
    });

    // Upsert Profile
    await prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        educationLevel,
        course,
        semester,
        preferredStudyTime,
        availableHoursPerDay,
        studyDays,
        maxSessionDuration,
        breakDuration,
        studyStyle,
      },
      create: {
        userId: user.id,
        educationLevel,
        course,
        semester,
        preferredStudyTime,
        availableHoursPerDay,
        studyDays,
        maxSessionDuration,
        breakDuration,
        studyStyle,
      },
    });

    // Create Subjects and Topics if provided
    if (subjects && subjects.length > 0) {
      for (const subj of subjects) {
        await prisma.subject.create({
          data: {
            userId: user.id,
            name: subj.name,
            code: subj.code,
            difficulty: subj.difficulty,
            priority: subj.priority,
            color: subj.color ?? "#6366f1",
            topics: subj.topics
              ? {
                  create: subj.topics.map((t) => ({
                    name: t.name,
                    difficulty: t.difficulty,
                    estimatedMinutes: t.estimatedMinutes,
                  })),
                }
              : undefined,
          },
        });
      }
    }

    // Auto-generate first study plan if subjects were added
    let planSummary = null;
    const userSubjectsCount = await prisma.subject.count({ where: { userId: user.id } });
    if (userSubjectsCount > 0) {
      try {
        const planResult = await generatePlan(user.id, 7);
        planSummary = planResult.summary;
      } catch (err) {
        console.error("Auto plan generation error during onboarding:", err);
      }
    }

    return successResponse({ message: "Onboarding completed successfully", planSummary }, 200);
  } catch (error) {
    console.error("Onboarding API Error:", error);
    return errorResponse("Failed to save onboarding data", 500);
  }
}
