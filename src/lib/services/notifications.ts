import prisma from "@/lib/db";
import { NotificationType } from "@prisma/client";
import { getDaysRemaining } from "@/lib/utils";

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  link?: string,
  metadata?: Record<string, unknown>
) {
  return prisma.notification.create({
    data: { userId, type, title, message, link, metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined },
  });
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({ where: { userId, read: false } });
}

export async function markAsRead(userId: string, notificationId: string) {
  return prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { read: true },
  });
}

export async function markAllAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}

export async function checkUpcomingExams(userId: string) {
  const exams = await prisma.exam.findMany({
    where: { userId, date: { gte: new Date() } },
    include: { subject: true },
    orderBy: { date: "asc" },
  });

  for (const exam of exams) {
    const days = getDaysRemaining(exam.date);
    if (days === 7 || days === 3 || days === 1) {
      const existing = await prisma.notification.findFirst({
        where: {
          userId,
          type: "EXAM",
          metadata: { path: ["examId"], equals: exam.id },
          createdAt: { gte: new Date(Date.now() - 86400000) },
        },
      });
      if (!existing) {
        await createNotification(
          userId,
          "EXAM",
          `${exam.title} in ${days} day${days > 1 ? "s" : ""}`,
          `${exam.subject?.name ?? "General"} exam approaching. Current progress: ${exam.subject?.progress ?? 0}%.`,
          "/exams",
          { examId: exam.id, daysRemaining: days }
        );
      }
    }
  }
}

export async function notifyMissedSession(
  userId: string,
  sessionId: string,
  subjectName: string,
  topicName?: string
) {
  const label = topicName ? `${subjectName} — ${topicName}` : subjectName;
  return createNotification(
    userId,
    "MISSED_SESSION",
    `Missed session: ${label}`,
    `You missed your scheduled ${label} session. Would you like to reschedule?`,
    "/study-plan",
    { sessionId }
  );
}

export async function notifyDailyPlan(userId: string, sessionCount: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const existing = await prisma.notification.findFirst({
    where: {
      userId,
      type: "DAILY_PLAN",
      createdAt: { gte: today },
    },
  });
  if (existing) return;

  await createNotification(
    userId,
    "DAILY_PLAN",
    "Today's Study Plan",
    `You have ${sessionCount} session${sessionCount !== 1 ? "s" : ""} scheduled for today.`,
    "/dashboard"
  );
}
