import prisma from "@/lib/db";
import { calculateLevel } from "@/lib/utils";

const ACHIEVEMENTS = [
  { key: "streak_7", name: "7-Day Streak", description: "Study for 7 consecutive days", icon: "flame", xpReward: 100, threshold: 7 },
  { key: "hours_10", name: "10 Hours Studied", description: "Complete 10 hours of study", icon: "clock", xpReward: 75, threshold: 600 },
  { key: "tasks_50", name: "50 Tasks Completed", description: "Complete 50 study tasks", icon: "check-circle", xpReward: 150, threshold: 50 },
  { key: "exam_ready", name: "Exam Ready", description: "Reach 80% progress on a subject before exam", icon: "trophy", xpReward: 200, threshold: 80 },
  { key: "sessions_100", name: "Century Club", description: "Complete 100 study sessions", icon: "star", xpReward: 250, threshold: 100 },
];

export async function seedAchievements() {
  for (const achievement of ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { key: achievement.key },
      update: achievement,
      create: achievement,
    });
  }
}

export async function awardXp(userId: string, amount: number) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { xp: { increment: amount } },
  });
  const newLevel = calculateLevel(user.xp);
  if (newLevel > user.level) {
    await prisma.user.update({
      where: { id: userId },
      data: { level: newLevel },
    });
  }
  return { xp: user.xp + amount, level: newLevel };
}

export async function checkAndAwardAchievements(userId: string) {
  const achievements = await prisma.achievement.findMany();
  const earned = await prisma.userAchievement.findMany({
    where: { userId },
    select: { achievementId: true },
  });
  const earnedIds = new Set(earned.map((e) => e.achievementId));

  const streak = await prisma.studyStreak.findUnique({ where: { userId } });
  const completedSessions = await prisma.studySession.count({
    where: { userId, status: "COMPLETED" },
  });
  const totalMinutes = await prisma.studySession.aggregate({
    where: { userId, status: "COMPLETED" },
    _sum: { actualMinutes: true, duration: true },
  });
  const totalStudyMinutes = totalMinutes._sum.actualMinutes ?? totalMinutes._sum.duration ?? 0;
  const completedTasks = await prisma.task.count({
    where: { userId, status: "COMPLETED" },
  });

  const newlyEarned: string[] = [];

  for (const achievement of achievements) {
    if (earnedIds.has(achievement.id)) continue;

    let earned = false;
    switch (achievement.key) {
      case "streak_7":
        earned = (streak?.currentStreak ?? 0) >= achievement.threshold;
        break;
      case "hours_10":
        earned = totalStudyMinutes >= achievement.threshold;
        break;
      case "tasks_50":
        earned = completedTasks >= achievement.threshold;
        break;
      case "sessions_100":
        earned = completedSessions >= achievement.threshold;
        break;
      case "exam_ready": {
        const subjects = await prisma.subject.findMany({ where: { userId } });
        earned = subjects.some((s) => s.progress >= achievement.threshold);
        break;
      }
    }

    if (earned) {
      await prisma.userAchievement.create({
        data: { userId, achievementId: achievement.id },
      });
      await awardXp(userId, achievement.xpReward);
      await createNotification(userId, "ACHIEVEMENT", `Achievement Unlocked: ${achievement.name}`, achievement.description);
      newlyEarned.push(achievement.name);
    }
  }

  return newlyEarned;
}

async function createNotification(
  userId: string,
  type: "ACHIEVEMENT" | "STREAK" | "SYSTEM",
  title: string,
  message: string
) {
  await prisma.notification.create({
    data: { userId, type, title, message },
  });
}

export async function updateStreak(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = await prisma.studyStreak.findUnique({ where: { userId } });
  if (!streak) {
    streak = await prisma.studyStreak.create({
      data: { userId, currentStreak: 1, longestStreak: 1, lastStudyDate: today },
    });
    return streak;
  }

  const lastDate = streak.lastStudyDate ? new Date(streak.lastStudyDate) : null;
  if (lastDate) lastDate.setHours(0, 0, 0, 0);

  if (lastDate && lastDate.getTime() === today.getTime()) {
    return streak;
  }

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let newStreak = 1;
  if (lastDate && lastDate.getTime() === yesterday.getTime()) {
    newStreak = streak.currentStreak + 1;
  }

  const longestStreak = Math.max(streak.longestStreak, newStreak);

  if (newStreak === 7 || newStreak === 30 || newStreak === 100) {
    await createNotification(
      userId,
      "STREAK",
      `${newStreak}-Day Streak! 🔥`,
      `Amazing! You've studied for ${newStreak} consecutive days.`
    );
  }

  return prisma.studyStreak.update({
    where: { userId },
    data: { currentStreak: newStreak, longestStreak, lastStudyDate: today },
  });
}
