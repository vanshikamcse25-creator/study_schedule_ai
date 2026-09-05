import prisma from "@/lib/db";
import { generateStudyPlan, adjustDailyPlan, rescheduleSessions, isGroqConfigured } from "@/lib/ai/groq";
import {
  buildSchedulingContext,
  validateSessionConstraints,
  removeDuplicateSessions,
  mapSessionType,
  mapDifficulty,
  getDaysRemaining,
  type SchedulingSubject,
  type SchedulingExam,
  type SchedulingPreferences,
} from "@/lib/scheduling/priority";
import { startOfDay, endOfDay, addMinutesToTime } from "@/lib/utils";
import { notifyDailyPlan } from "@/lib/services/notifications";

export async function getUserSchedulingData(userId: string) {
  const [profile, subjects, exams, existingSessions] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.subject.findMany({
      where: { userId },
      include: { topics: true },
    }),
    prisma.exam.findMany({
      where: { userId, date: { gte: new Date() } },
      include: { subject: true },
      orderBy: { date: "asc" },
    }),
    prisma.studySession.findMany({
      where: {
        userId,
        date: { gte: startOfDay(new Date()) },
      },
      include: { subject: true },
    }),
  ]);

  let activeProfile = profile;
  if (!activeProfile) {
    activeProfile = await prisma.profile.create({
      data: {
        userId,
        preferredStudyTime: "FLEXIBLE",
        availableHoursPerDay: 4,
        studyDays: ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
        maxSessionDuration: 60,
        breakDuration: 10,
        studyStyle: "MIXED",
      },
    });
  }

  const schedulingSubjects: SchedulingSubject[] = subjects.map((s) => ({
    id: s.id,
    name: s.name,
    difficulty: s.difficulty,
    priority: s.priority,
    progress: s.progress,
    topics: s.topics.map((t) => ({
      id: t.id,
      name: t.name,
      difficulty: t.difficulty,
      estimatedMinutes: t.estimatedMinutes,
      completed: t.completed,
      progress: t.progress,
    })),
  }));

  const schedulingExams: SchedulingExam[] = exams.map((e) => ({
    id: e.id,
    title: e.title,
    subjectName: e.subject?.name,
    date: e.date,
    importance: e.importance,
    daysRemaining: getDaysRemaining(e.date),
  }));

  const preferences: SchedulingPreferences = {
    preferredStudyTime: activeProfile.preferredStudyTime ?? "FLEXIBLE",
    availableHoursPerDay: activeProfile.availableHoursPerDay ?? 4,
    studyDays: activeProfile.studyDays?.length ? activeProfile.studyDays : ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
    maxSessionDuration: activeProfile.maxSessionDuration ?? 60,
    breakDuration: activeProfile.breakDuration ?? 10,
    studyStyle: activeProfile.studyStyle ?? "MIXED",
  };

  return { profile: activeProfile, subjects, exams, existingSessions, schedulingSubjects, schedulingExams, preferences };
}

function generateFallbackPlan(
  schedulingSubjects: SchedulingSubject[],
  schedulingExams: SchedulingExam[],
  preferences: SchedulingPreferences,
  days: number = 7
): {
  sessions: Array<{
    date: string;
    startTime: string;
    endTime: string;
    subject: string;
    topic: string;
    duration: number;
    type: string;
    reason: string;
  }>;
  summary: string;
} {
  const sessions: Array<{
    date: string;
    startTime: string;
    endTime: string;
    subject: string;
    topic: string;
    duration: number;
    type: string;
    reason: string;
  }> = [];

  const now = new Date();
  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const preferredStart =
    { MORNING: "09:00", AFTERNOON: "13:00", EVENING: "17:00", NIGHT: "20:00", FLEXIBLE: "09:00" }[
      preferences.preferredStudyTime
    ] ?? "09:00";

  const configuredDays = preferences.studyDays?.length
    ? preferences.studyDays.map((d) => d.toLowerCase())
    : dayNames;

  const sessionTypes = ["study", "revision", "practice", "mock_test"];

  // Collect all topic items across all subjects
  interface FlatTopic {
    subjectName: string;
    topicName: string;
    difficulty: string;
    estimatedMinutes: number;
    subjectProgress: number;
  }

  const allTopics: FlatTopic[] = [];
  for (const subject of schedulingSubjects) {
    const uncompleted = subject.topics.filter((t) => !t.completed);
    if (uncompleted.length) {
      for (const topic of uncompleted) {
        allTopics.push({
          subjectName: subject.name,
          topicName: topic.name,
          difficulty: topic.difficulty,
          estimatedMinutes: topic.estimatedMinutes,
          subjectProgress: subject.progress,
        });
      }
    } else {
      allTopics.push({
        subjectName: subject.name,
        topicName: "Core Concepts & Practice",
        difficulty: subject.difficulty,
        estimatedMinutes: 60,
        subjectProgress: subject.progress,
      });
    }
  }

  let topicIndex = 0;
  let typeIndex = 0;

  for (let dayOffset = 0; dayOffset < days; dayOffset++) {
    const currentDate = new Date(now);
    currentDate.setDate(currentDate.getDate() + dayOffset);
    const dayName = dayNames[currentDate.getDay()];

    if (configuredDays.includes(dayName) || configuredDays.length === 0) {
      let currentTime = preferredStart;
      let dailyMinutes = 0;
      const maxDaily = Math.max(120, (preferences.availableHoursPerDay || 4) * 60);

      while (dailyMinutes < maxDaily && allTopics.length > 0) {
        const item = allTopics[topicIndex % allTopics.length];
        const duration = Math.min(preferences.maxSessionDuration || 60, item.estimatedMinutes || 60, maxDaily - dailyMinutes);
        if (duration < 15) break;

        const exam = schedulingExams.find((e) => e.subjectName?.toLowerCase() === item.subjectName.toLowerCase());
        const sessionType = exam && exam.daysRemaining <= 7 ? "revision" : sessionTypes[typeIndex % sessionTypes.length];

        const yyyy = currentDate.getFullYear();
        const mm = String(currentDate.getMonth() + 1).padStart(2, "0");
        const dd = String(currentDate.getDate()).padStart(2, "0");
        const dateStr = `${yyyy}-${mm}-${dd}`;

        sessions.push({
          date: dateStr,
          startTime: currentTime,
          endTime: addMinutesToTime(currentTime, duration),
          subject: item.subjectName,
          topic: item.topicName,
          duration,
          type: sessionType,
          reason: exam
            ? `Upcoming exam in ${exam.daysRemaining} days`
            : `Scheduled ${sessionType} session for ${item.subjectName}`,
        });

        currentTime = addMinutesToTime(currentTime, duration + (preferences.breakDuration || 10));
        dailyMinutes += duration;
        topicIndex++;
        typeIndex++;
      }
    }
  }

  return {
    sessions,
    summary: `Generated ${sessions.length} study sessions across ${days} days tailored to your schedule.`,
  };
}

export async function generatePlan(userId: string, days: number = 7) {
  let data = await getUserSchedulingData(userId);

  if (!data.schedulingSubjects.length) {
    // Auto-create default subjects for user if none exist yet
    const math = await prisma.subject.create({
      data: {
        userId,
        name: "General Mathematics",
        difficulty: "MEDIUM",
        priority: "HIGH",
        color: "#6366f1",
        topics: {
          create: [
            { name: "Algebra & Calculus", estimatedMinutes: 60 },
            { name: "Problem Solving", estimatedMinutes: 45 },
          ],
        },
      },
    });

    const cs = await prisma.subject.create({
      data: {
        userId,
        name: "Computer Science",
        difficulty: "HARD",
        priority: "HIGH",
        color: "#3b82f6",
        topics: {
          create: [
            { name: "Data Structures & Algorithms", estimatedMinutes: 60 },
            { name: "System Architecture", estimatedMinutes: 45 },
          ],
        },
      },
    });

    data = await getUserSchedulingData(userId);
  }

  const context = buildSchedulingContext(
    data.schedulingSubjects,
    data.schedulingExams,
    data.preferences,
    data.existingSessions,
    days
  );

  let aiPlan;
  try {
    if (isGroqConfigured()) {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("AI generation timeout")), 5000)
      );
      aiPlan = await Promise.race([generateStudyPlan(context), timeoutPromise]);
    } else {
      aiPlan = generateFallbackPlan(data.schedulingSubjects, data.schedulingExams, data.preferences, days);
    }
  } catch {
    aiPlan = generateFallbackPlan(data.schedulingSubjects, data.schedulingExams, data.preferences, days);
  }

  if (!aiPlan.sessions || aiPlan.sessions.length === 0) {
    aiPlan = generateFallbackPlan(data.schedulingSubjects, data.schedulingExams, data.preferences, days);
  }

  // Clear existing SCHEDULED sessions from today onwards before inserting new plan
  await prisma.studySession.deleteMany({
    where: {
      userId,
      date: { gte: startOfDay(new Date()) },
      status: "SCHEDULED",
    },
  });

  const subjectMap = new Map(data.subjects.map((s) => [s.name.toLowerCase(), s]));
  const topicMap = new Map(
    data.subjects.flatMap((s) => s.topics.map((t) => [`${s.name.toLowerCase()}_${t.name.toLowerCase()}`, t]))
  );

  const createdSessions = [];
  for (const session of aiPlan.sessions as Array<{ date: string; startTime: string; endTime: string; duration: number; type?: string; subject: string; topic?: string; reason?: string }>) {
    const subject = subjectMap.get(session.subject.toLowerCase());
    const topicKey = session.topic ? `${session.subject.toLowerCase()}_${session.topic.toLowerCase()}` : null;
    const topic = topicKey ? topicMap.get(topicKey) : null;

    const parts = session.date.split("-").map(Number);
    const sessionDate = parts.length === 3 ? new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 0, 0, 0)) : new Date(session.date);

    const created = await prisma.studySession.create({
      data: {
        userId,
        subjectId: subject?.id,
        topicId: topic?.id,
        title: session.topic ? `${session.subject} — ${session.topic}` : session.subject,
        date: sessionDate,
        startTime: session.startTime,
        endTime: session.endTime,
        duration: session.duration,
        type: mapSessionType(session.type ?? "study"),
        difficulty: subject ? mapDifficulty(subject.difficulty) : "MEDIUM",
        status: "SCHEDULED",
        reason: session.reason,
      },
      include: { subject: true, topic: true },
    });
    createdSessions.push(created);
  }

  const today = startOfDay(new Date());
  const todaySessions = createdSessions.filter((s) => s.date >= today && s.date <= endOfDay(today));
  if (todaySessions.length) {
    await notifyDailyPlan(userId, todaySessions.length);
  }

  return { sessions: createdSessions, summary: aiPlan.summary ?? "Study plan generated successfully." };
}

export async function regenerateDay(userId: string, date: string) {
  const targetDate = new Date(date);
  await prisma.studySession.deleteMany({
    where: {
      userId,
      date: { gte: startOfDay(targetDate), lte: endOfDay(targetDate) },
      status: { in: ["SCHEDULED", "MISSED"] },
    },
  });
  return generatePlan(userId, 1);
}

export async function rescheduleMissedSession(
  userId: string,
  sessionId: string,
  action: "auto" | "tomorrow" | "skip"
) {
  const session = await prisma.studySession.findFirst({
    where: { id: sessionId, userId },
    include: { subject: true, topic: true },
  });
  if (!session) throw new Error("Session not found");

  if (action === "skip") {
    return prisma.studySession.update({
      where: { id: sessionId },
      data: { status: "SKIPPED" },
    });
  }

  await prisma.studySession.update({
    where: { id: sessionId },
    data: { status: "MISSED" },
  });

  if (action === "tomorrow") {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return prisma.studySession.create({
      data: {
        userId,
        subjectId: session.subjectId,
        topicId: session.topicId,
        title: session.title,
        date: tomorrow,
        startTime: session.startTime,
        endTime: session.endTime,
        duration: session.duration,
        type: session.type,
        difficulty: session.difficulty,
        status: "SCHEDULED",
        reason: "Rescheduled from missed session",
      },
    });
  }

  const data = await getUserSchedulingData(userId);
  const context = buildSchedulingContext(
    data.schedulingSubjects,
    data.schedulingExams,
    data.preferences,
    data.existingSessions,
    3
  ) + `\n\nMISSED SESSION TO RESCHEDULE:\n${JSON.stringify({
    subject: session.subject?.name,
    topic: session.topic?.name,
    duration: session.duration,
    type: session.type,
  })}`;

  let aiPlan;
  try {
    if (isGroqConfigured()) {
      aiPlan = await rescheduleSessions(context);
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      aiPlan = {
        sessions: [{
          date: tomorrow.toISOString().split("T")[0],
          startTime: session.startTime,
          endTime: session.endTime,
          subject: session.subject?.name ?? "Study",
          topic: session.topic?.name,
          duration: session.duration,
          type: session.type.toLowerCase(),
          reason: "Auto-rescheduled missed session",
        }],
        summary: "Session rescheduled to next available slot.",
      };
    }
  } catch {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    aiPlan = {
      sessions: [{
        date: tomorrow.toISOString().split("T")[0],
        startTime: session.startTime,
        endTime: session.endTime,
        subject: session.subject?.name ?? "Study",
        topic: session.topic?.name,
        duration: session.duration,
        type: "study",
        reason: "Fallback reschedule",
      }],
    };
  }

  const subjectMap = new Map(data.subjects.map((s) => [s.name.toLowerCase(), s]));
  const created = [];
  for (const s of (aiPlan.sessions as Array<{ subject: string; topic?: string; date: string; startTime: string; endTime: string; duration: number; type?: string; reason?: string }>).slice(0, 3)) {
    const subject = subjectMap.get(s.subject.toLowerCase());
    const createdSession = await prisma.studySession.create({
      data: {
        userId,
        subjectId: subject?.id ?? session.subjectId,
        topicId: session.topicId,
        title: s.topic ? `${s.subject} — ${s.topic}` : s.subject,
        date: new Date(s.date),
        startTime: s.startTime,
        endTime: s.endTime,
        duration: s.duration,
        type: mapSessionType(s.type ?? "study"),
        difficulty: session.difficulty,
        status: "SCHEDULED",
        reason: s.reason ?? "Rescheduled",
      },
    });
    created.push(createdSession);
  }

  return { rescheduled: created, summary: aiPlan.summary };
}

export async function completeSession(userId: string, sessionId: string, actualMinutes?: number) {
  const session = await prisma.studySession.findFirst({
    where: { id: sessionId, userId },
    include: { subject: true, topic: true },
  });
  if (!session) throw new Error("Session not found");

  const updated = await prisma.studySession.update({
    where: { id: sessionId },
    data: {
      status: "COMPLETED",
      actualMinutes: actualMinutes ?? session.duration,
    },
  });

  if (session.subjectId) {
    const subjectTopics = await prisma.topic.findMany({ where: { subjectId: session.subjectId } });
    if (session.topicId) {
      await prisma.topic.update({
        where: { id: session.topicId },
        data: { progress: { increment: 15 }, completed: false },
      });
      const topic = await prisma.topic.findUnique({ where: { id: session.topicId } });
      if (topic && topic.progress >= 100) {
        await prisma.topic.update({ where: { id: session.topicId }, data: { completed: true, progress: 100 } });
      }
    }
    const completedTopics = subjectTopics.filter((t) => t.completed).length;
    const totalTopics = subjectTopics.length || 1;
    const newProgress = Math.min(100, ((completedTopics + 0.5) / totalTopics) * 100);
    await prisma.subject.update({
      where: { id: session.subjectId },
      data: { progress: newProgress },
    });
  }

  const { updateStreak, awardXp, checkAndAwardAchievements } = await import("@/lib/services/gamification");
  await updateStreak(userId);
  await awardXp(userId, Math.floor((actualMinutes ?? session.duration) / 5));
  await checkAndAwardAchievements(userId);

  return updated;
}

export async function getAiRecommendation(userId: string): Promise<string> {
  const data = await getUserSchedulingData(userId);
  const { calculatePriorityScores } = await import("@/lib/scheduling/priority");
  const scores = calculatePriorityScores(data.schedulingSubjects, data.schedulingExams);

  if (!scores.length) {
    return "Add subjects and topics to receive personalized study recommendations.";
  }

  const top = scores[0];
  const exam = data.schedulingExams.find(
    (e) => e.subjectName?.toLowerCase() === top.subjectName.toLowerCase()
  );
  const subject = data.schedulingSubjects.find((s) => s.name === top.subjectName);

  if (exam) {
    return `${top.subjectName} needs your attention today. Your exam is in ${exam.daysRemaining} days and your current progress is ${Math.round(subject?.progress ?? 0)}%. Focus on ${top.topicName ?? "key topics"}.`;
  }

  return `${top.subjectName} should be your priority today. ${top.reasons.slice(0, 2).join(". ")}.`;
}
