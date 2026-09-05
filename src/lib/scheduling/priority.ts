import { Difficulty, Priority, SessionType } from "@prisma/client";
import {
  addMinutesToTime,
  parseTimeToMinutes,
  getDaysRemaining,
  startOfDay,
} from "@/lib/utils";

export interface SchedulingSubject {
  id: string;
  name: string;
  difficulty: Difficulty;
  priority: Priority;
  progress: number;
  topics: Array<{
    id: string;
    name: string;
    difficulty: Difficulty;
    estimatedMinutes: number;
    completed: boolean;
    progress: number;
  }>;
}

export interface SchedulingExam {
  id: string;
  title: string;
  subjectName?: string;
  date: Date;
  importance: Priority;
  daysRemaining: number;
}

export interface SchedulingPreferences {
  preferredStudyTime: string;
  availableHoursPerDay: number;
  studyDays: string[];
  maxSessionDuration: number;
  breakDuration: number;
  studyStyle: string;
}

export interface PriorityScore {
  subjectId: string;
  subjectName: string;
  topicId?: string;
  topicName?: string;
  score: number;
  reasons: string[];
}

const DAY_MAP: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
};

const PREFERRED_START: Record<string, string> = {
  MORNING: "08:00",
  AFTERNOON: "13:00",
  EVENING: "17:00",
  NIGHT: "20:00",
  FLEXIBLE: "09:00",
};

export function calculatePriorityScores(
  subjects: SchedulingSubject[],
  exams: SchedulingExam[]
): PriorityScore[] {
  const scores: PriorityScore[] = [];

  for (const subject of subjects) {
    const subjectExams = exams.filter(
      (e) => e.subjectName?.toLowerCase() === subject.name.toLowerCase()
    );
    const nearestExam = subjectExams.sort((a, b) => a.daysRemaining - b.daysRemaining)[0];

    for (const topic of subject.topics.filter((t) => !t.completed)) {
      let score = 0;
      const reasons: string[] = [];

      if (nearestExam) {
        if (nearestExam.daysRemaining <= 2) { score += 40; reasons.push("Exam in 2 days"); }
        else if (nearestExam.daysRemaining <= 7) { score += 30; reasons.push("Exam within a week"); }
        else if (nearestExam.daysRemaining <= 14) { score += 20; reasons.push("Exam approaching"); }
        else if (nearestExam.daysRemaining <= 30) { score += 10; reasons.push("Upcoming exam"); }
      }

      if (subject.progress < 30) { score += 25; reasons.push("Low subject progress"); }
      else if (subject.progress < 60) { score += 15; reasons.push("Moderate progress"); }

      if (topic.progress < 30) { score += 15; reasons.push("Topic not started"); }
      else if (topic.progress < 70) { score += 8; reasons.push("Topic in progress"); }

      const diffScore = { EASY: 5, MEDIUM: 10, HARD: 20 }[topic.difficulty] ?? 10;
      score += diffScore;
      if (topic.difficulty === "HARD") reasons.push("Difficult topic");

      const prioScore = { LOW: 5, MEDIUM: 10, HIGH: 20, CRITICAL: 30 }[subject.priority] ?? 10;
      score += prioScore;

      scores.push({
        subjectId: subject.id,
        subjectName: subject.name,
        topicId: topic.id,
        topicName: topic.name,
        score,
        reasons,
      });
    }
  }

  return scores.sort((a, b) => b.score - a.score);
}

export function getPreferredStartTime(preferredStudyTime: string): string {
  return PREFERRED_START[preferredStudyTime] ?? "09:00";
}

export function isStudyDay(date: Date, studyDays: string[]): boolean {
  const dayName = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][date.getDay()];
  return studyDays.map((d) => d.toLowerCase()).includes(dayName);
}

export function getAvailableDates(
  startDate: Date,
  days: number,
  studyDays: string[]
): Date[] {
  const dates: Date[] = [];
  const current = new Date(startDate);
  while (dates.length < days) {
    if (isStudyDay(current, studyDays)) {
      dates.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
    if (dates.length === 0 && current.getTime() - startDate.getTime() > days * 2 * 86400000) break;
  }
  return dates;
}

export interface SessionSlot {
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
}

export function validateSessionConstraints(
  sessions: Array<{
    date: string;
    startTime: string;
    endTime: string;
    duration: number;
    type?: string;
  }>,
  preferences: SchedulingPreferences,
  existingSessions: Array<{ date: Date; startTime: string; endTime: string; status: string }>
): { valid: boolean; errors: string[]; sanitized: typeof sessions } {
  const errors: string[] = [];
  const maxDailyMinutes = preferences.availableHoursPerDay * 60;
  const dailyTotals: Record<string, number> = {};
  const sanitized: typeof sessions = [];

  const completedKeys = new Set(
    existingSessions
      .filter((s) => s.status === "COMPLETED")
      .map((s) => `${s.date.toISOString().split("T")[0]}_${s.startTime}`)
  );

  for (const session of sessions) {
    if (session.type === "break") {
      sanitized.push(session);
      continue;
    }

    if (completedKeys.has(`${session.date}_${session.startTime}`)) {
      errors.push(`Cannot overwrite completed session on ${session.date}`);
      continue;
    }

    if (session.duration > preferences.maxSessionDuration) {
      session.duration = preferences.maxSessionDuration;
      session.endTime = addMinutesToTime(session.startTime, session.duration);
    }

    dailyTotals[session.date] = (dailyTotals[session.date] ?? 0) + session.duration;

    if (dailyTotals[session.date] > maxDailyMinutes) {
      const remaining = maxDailyMinutes - (dailyTotals[session.date] - session.duration);
      if (remaining <= 0) {
        errors.push(`Daily limit exceeded on ${session.date}`);
        continue;
      }
      session.duration = remaining;
      session.endTime = addMinutesToTime(session.startTime, remaining);
      dailyTotals[session.date] = maxDailyMinutes;
    }

    const sessionDate = new Date(session.date);
    if (!isStudyDay(sessionDate, preferences.studyDays)) {
      errors.push(`${session.date} is not a configured study day`);
      continue;
    }

    sanitized.push(session);
  }

  return { valid: errors.length === 0, errors, sanitized };
}

export function sessionsOverlap(
  a: { date: string; startTime: string; endTime: string },
  b: { date: string; startTime: string; endTime: string }
): boolean {
  if (a.date !== b.date) return false;
  const aStart = parseTimeToMinutes(a.startTime);
  const aEnd = parseTimeToMinutes(a.endTime);
  const bStart = parseTimeToMinutes(b.startTime);
  const bEnd = parseTimeToMinutes(b.endTime);
  return aStart < bEnd && bStart < aEnd;
}

export function removeDuplicateSessions<T extends { date: string; startTime: string; subject?: string; topic?: string }>(
  sessions: T[],
  existing: Array<{ date: Date; startTime: string; subjectId?: string | null }>
): T[] {
  const existingKeys = new Set(
    existing.map((s) => `${s.date.toISOString().split("T")[0]}_${s.startTime}`)
  );
  const seen = new Set<string>();
  return sessions.filter((s) => {
    const key = `${s.date}_${s.startTime}`;
    if (existingKeys.has(key) || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function mapSessionType(type: string): SessionType {
  const map: Record<string, SessionType> = {
    study: "STUDY",
    revision: "REVISION",
    practice: "PRACTICE",
    mock_test: "MOCK_TEST",
    break: "BREAK",
  };
  return map[type.toLowerCase()] ?? "STUDY";
}

export function mapDifficulty(diff: string): Difficulty {
  const map: Record<string, Difficulty> = {
    easy: "EASY", medium: "MEDIUM", hard: "HARD",
    EASY: "EASY", MEDIUM: "MEDIUM", HARD: "HARD",
  };
  return map[diff] ?? "MEDIUM";
}

export function buildSchedulingContext(
  subjects: SchedulingSubject[],
  exams: SchedulingExam[],
  preferences: SchedulingPreferences,
  existingSessions: Array<{ date: Date; startTime: string; endTime: string; status: string; subject?: { name: string } | null }>,
  targetDays: number = 7
): string {
  const priorityScores = calculatePriorityScores(subjects, exams);
  const startDate = startOfDay(new Date());

  return JSON.stringify({
    userPreferences: {
      preferredStudyTime: preferences.preferredStudyTime,
      availableHoursPerDay: preferences.availableHoursPerDay,
      studyDays: preferences.studyDays,
      maxSessionDuration: preferences.maxSessionDuration,
      breakDuration: preferences.breakDuration,
      studyStyle: preferences.studyStyle,
      preferredStartTime: getPreferredStartTime(preferences.preferredStudyTime),
    },
    subjects: subjects.map((s) => ({
      name: s.name,
      difficulty: s.difficulty,
      priority: s.priority,
      progress: s.progress,
      topics: s.topics.map((t) => ({
        name: t.name,
        difficulty: t.difficulty,
        estimatedMinutes: t.estimatedMinutes,
        completed: t.completed,
        progress: t.progress,
      })),
    })),
    exams: exams.map((e) => ({
      title: e.title,
      subject: e.subjectName,
      daysRemaining: e.daysRemaining,
      importance: e.importance,
    })),
    priorityRanking: priorityScores.slice(0, 15).map((p) => ({
      subject: p.subjectName,
      topic: p.topicName,
      score: p.score,
      reasons: p.reasons,
    })),
    existingSessions: existingSessions.map((s) => ({
      date: s.date.toISOString().split("T")[0],
      startTime: s.startTime,
      endTime: s.endTime,
      status: s.status,
      subject: s.subject?.name,
    })),
    schedulePeriod: {
      startDate: startDate.toISOString().split("T")[0],
      days: targetDays,
      availableDates: getAvailableDates(startDate, targetDays, preferences.studyDays).map(
        (d) => d.toISOString().split("T")[0]
      ),
    },
    constraints: {
      maxDailyMinutes: preferences.availableHoursPerDay * 60,
      maxSessionDuration: preferences.maxSessionDuration,
      breakDuration: preferences.breakDuration,
      doNotModifyCompleted: true,
      noDuplicates: true,
      noOverlaps: true,
    },
  }, null, 2);
}

export function buildChatContext(data: {
  profile: SchedulingPreferences & { name?: string | null };
  subjects: Array<{ name: string; progress: number; difficulty: string }>;
  exams: Array<{ title: string; subjectName?: string; daysRemaining: number }>;
  todaySessions: Array<{ startTime: string; endTime: string; subject?: string; topic?: string; status: string }>;
  streak: number;
}): string {
  return `
USER PROFILE
Name: ${data.profile.name ?? "Student"}
Available hours/day: ${data.profile.availableHoursPerDay}
Preferred time: ${data.profile.preferredStudyTime}
Study streak: ${data.streak} days

SUBJECTS
${data.subjects.map((s) => `- ${s.name}: ${Math.round(s.progress)}% (${s.difficulty})`).join("\n")}

UPCOMING EXAMS
${data.exams.length ? data.exams.map((e) => `- ${e.title}${e.subjectName ? ` (${e.subjectName})` : ""}: ${e.daysRemaining} days`).join("\n") : "No upcoming exams"}

TODAY'S PLAN
${data.todaySessions.length ? data.todaySessions.map((s) => `- ${s.startTime}-${s.endTime}: ${s.subject ?? "Break"}${s.topic ? ` - ${s.topic}` : ""} [${s.status}]`).join("\n") : "No sessions scheduled today"}
`.trim();
}

export { getDaysRemaining, DAY_MAP };
