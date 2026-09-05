import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

export const onboardingStep1Schema = z.object({
  name: z.string().min(2),
  educationLevel: z.enum(["SCHOOL", "COLLEGE", "UNIVERSITY", "OTHER"]),
  course: z.string().optional(),
  semester: z.string().optional(),
});

export const onboardingStep2Schema = z.object({
  preferredStudyTime: z.enum(["MORNING", "AFTERNOON", "EVENING", "NIGHT", "FLEXIBLE"]),
  availableHoursPerDay: z.number().min(1).max(16),
  studyDays: z.array(z.string()).min(1),
  maxSessionDuration: z.number().min(15).max(180),
  breakDuration: z.number().min(5).max(60),
  studyStyle: z.enum(["SHORT_FOCUSED", "LONG_DEEP", "MIXED"]),
});

export const subjectSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
  code: z.string().optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  color: z.string().optional(),
});

export const topicSchema = z.object({
  name: z.string().min(1, "Topic name is required"),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  estimatedMinutes: z.number().min(15).max(480),
});

export const examSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subjectId: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  time: z.string().optional(),
  type: z.enum(["EXAM", "ASSIGNMENT", "PROJECT", "DEADLINE"]),
  importance: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  topics: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  subjectId: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
});

export const studySessionSchema = z.object({
  subjectId: z.string().optional(),
  topicId: z.string().optional(),
  title: z.string().optional(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  duration: z.number(),
  type: z.enum(["STUDY", "REVISION", "PRACTICE", "MOCK_TEST", "BREAK"]),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
});

export const aiSessionSchema = z.object({
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  subject: z.string(),
  topic: z.string().optional(),
  duration: z.number(),
  type: z.enum(["study", "revision", "practice", "mock_test", "break"]).default("study"),
  reason: z.string().optional(),
});

export const aiPlanResponseSchema = z.object({
  sessions: z.array(aiSessionSchema),
  summary: z.string().optional(),
});

export const profileSettingsSchema = z.object({
  name: z.string().min(2).optional(),
  educationLevel: z.enum(["SCHOOL", "COLLEGE", "UNIVERSITY", "OTHER"]).optional(),
  course: z.string().optional(),
  semester: z.string().optional(),
  preferredStudyTime: z.enum(["MORNING", "AFTERNOON", "EVENING", "NIGHT", "FLEXIBLE"]).optional(),
  availableHoursPerDay: z.number().min(1).max(16).optional(),
  studyDays: z.array(z.string()).optional(),
  maxSessionDuration: z.number().min(15).max(180).optional(),
  breakDuration: z.number().min(5).max(60).optional(),
  studyStyle: z.enum(["SHORT_FOCUSED", "LONG_DEEP", "MIXED"]).optional(),
  theme: z.enum(["LIGHT", "DARK", "SYSTEM"]).optional(),
  notifyExams: z.boolean().optional(),
  notifyDeadlines: z.boolean().optional(),
  notifySessions: z.boolean().optional(),
  notifyDailyPlan: z.boolean().optional(),
  notifyWeeklyReview: z.boolean().optional(),
  notifyStreaks: z.boolean().optional(),
  aiAutoReschedule: z.boolean().optional(),
  aiWeeklyReview: z.boolean().optional(),
});

export const chatMessageSchema = z.object({
  message: z.string().min(1, "Message cannot be empty").max(4000),
  conversationId: z.string().optional(),
});

export const rescheduleSchema = z.object({
  action: z.enum(["auto", "tomorrow", "skip"]),
});

export const generatePlanSchema = z.object({
  days: z.number().min(1).max(30).optional(),
});

export const regenerateDaySchema = z.object({
  date: z.string().min(1, "Date is required"),
});

export const completeSessionSchema = z.object({
  actualMinutes: z.number().min(1).max(480).optional(),
});

export const markNotificationsReadSchema = z
  .object({
    id: z.string().optional(),
    all: z.boolean().optional(),
  })
  .refine((data) => data.id || data.all, {
    message: "Provide notification id or set all to true",
  });

export const onboardingSchema = onboardingStep1Schema.merge(onboardingStep2Schema).extend({
  subjects: z
    .array(
      subjectSchema.extend({
        topics: z.array(topicSchema).optional(),
      })
    )
    .optional(),
});

export const searchQuerySchema = z.object({
  q: z.string().min(1, "Search query is required").max(200),
});

export const progressDaysSchema = z.enum(["7", "30", "90"]);

export const taskUpdateSchema = taskSchema.partial().extend({
  status: z.enum(["TODO", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
});

export const sessionUpdateSchema = studySessionSchema.partial().extend({
  status: z
    .enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "MISSED", "SKIPPED", "RESCHEDULED"])
    .optional(),
  notes: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type SubjectInput = z.infer<typeof subjectSchema>;
export type TopicInput = z.infer<typeof topicSchema>;
export type ExamInput = z.infer<typeof examSchema>;
export type TaskInput = z.infer<typeof taskSchema>;
export type StudySessionInput = z.infer<typeof studySessionSchema>;
export type AiPlanResponse = z.infer<typeof aiPlanResponseSchema>;
