import { PrismaClient, EducationLevel, PreferredStudyTime, StudyStyle, Difficulty, Priority, ExamType, SessionType, SessionStatus, TaskStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clean up existing data for test user
  const existingUser = await prisma.user.findUnique({
    where: { email: "demo@studyflow.ai" },
  });

  if (existingUser) {
    await prisma.user.delete({ where: { id: existingUser.id } });
  }

  const hashedPassword = await bcrypt.hash("password123", 10);

  const user = await prisma.user.create({
    data: {
      name: "Alex Morgan",
      email: "demo@studyflow.ai",
      password: hashedPassword,
      onboardingComplete: true,
      xp: 450,
      level: 3,
      profile: {
        create: {
          educationLevel: EducationLevel.UNIVERSITY,
          course: "Computer Science",
          semester: "Semester 5",
          preferredStudyTime: PreferredStudyTime.MORNING,
          availableHoursPerDay: 4.5,
          studyDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
          maxSessionDuration: 60,
          breakDuration: 10,
          studyStyle: StudyStyle.SHORT_FOCUSED,
        },
      },
      studyStreak: {
        create: {
          currentStreak: 7,
          longestStreak: 12,
          lastStudyDate: new Date(),
          weeklyGoal: 20,
          weeklyHours: 14.5,
        },
      },
    },
  });

  console.log(`Created user: ${user.email} (ID: ${user.id})`);

  // Create Subjects & Topics
  const cs = await prisma.subject.create({
    data: {
      userId: user.id,
      name: "Data Structures & Algorithms",
      code: "CS301",
      difficulty: Difficulty.HARD,
      priority: Priority.CRITICAL,
      progress: 42,
      color: "#6366f1",
      topics: {
        create: [
          { name: "Binary Search Trees & AVL", difficulty: Difficulty.MEDIUM, estimatedMinutes: 60, completed: true, progress: 100 },
          { name: "Graph Traversal (BFS & DFS)", difficulty: Difficulty.HARD, estimatedMinutes: 90, completed: false, progress: 40 },
          { name: "Dynamic Programming", difficulty: Difficulty.HARD, estimatedMinutes: 120, completed: false, progress: 20 },
          { name: "Heap Sort & Priority Queues", difficulty: Difficulty.MEDIUM, estimatedMinutes: 60, completed: false, progress: 10 },
        ],
      },
    },
  });

  const math = await prisma.subject.create({
    data: {
      userId: user.id,
      name: "Linear Algebra & Calculus",
      code: "MATH201",
      difficulty: Difficulty.HARD,
      priority: Priority.HIGH,
      progress: 58,
      color: "#ec4899",
      topics: {
        create: [
          { name: "Eigenvalues & Eigenvectors", difficulty: Difficulty.HARD, estimatedMinutes: 90, completed: true, progress: 100 },
          { name: "Matrix Transformations", difficulty: Difficulty.MEDIUM, estimatedMinutes: 60, completed: true, progress: 100 },
          { name: "Multivariable Integration", difficulty: Difficulty.HARD, estimatedMinutes: 90, completed: false, progress: 30 },
        ],
      },
    },
  });

  const db = await prisma.subject.create({
    data: {
      userId: user.id,
      name: "Database Systems",
      code: "CS304",
      difficulty: Difficulty.MEDIUM,
      priority: Priority.HIGH,
      progress: 75,
      color: "#10b981",
      topics: {
        create: [
          { name: "Relational Algebra & SQL Joins", difficulty: Difficulty.EASY, estimatedMinutes: 45, completed: true, progress: 100 },
          { name: "Normalization (1NF to BCNF)", difficulty: Difficulty.MEDIUM, estimatedMinutes: 60, completed: true, progress: 100 },
          { name: "Indexing & B+ Trees", difficulty: Difficulty.HARD, estimatedMinutes: 75, completed: false, progress: 50 },
        ],
      },
    },
  });

  const os = await prisma.subject.create({
    data: {
      userId: user.id,
      name: "Operating Systems",
      code: "CS302",
      difficulty: Difficulty.MEDIUM,
      priority: Priority.MEDIUM,
      progress: 30,
      color: "#f59e0b",
      topics: {
        create: [
          { name: "Process Scheduling Algorithms", difficulty: Difficulty.MEDIUM, estimatedMinutes: 60, completed: true, progress: 100 },
          { name: "Memory Management & Paging", difficulty: Difficulty.HARD, estimatedMinutes: 90, completed: false, progress: 20 },
          { name: "Deadlocks & Semaphores", difficulty: Difficulty.MEDIUM, estimatedMinutes: 60, completed: false, progress: 0 },
        ],
      },
    },
  });

  // Create Exams & Deadlines
  const now = new Date();
  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  await prisma.exam.createMany({
    data: [
      {
        userId: user.id,
        subjectId: cs.id,
        title: "DSA Midterm Examination",
        date: in3Days,
        time: "10:00 AM",
        type: ExamType.EXAM,
        importance: Priority.CRITICAL,
        topics: ["Trees", "Graphs", "Dynamic Programming"],
        notes: "Covers chapters 4-8. Bring scientific calculator.",
      },
      {
        userId: user.id,
        subjectId: math.id,
        title: "Calculus Assignment II",
        date: in7Days,
        time: "11:59 PM",
        type: ExamType.ASSIGNMENT,
        importance: Priority.HIGH,
        topics: ["Multivariable Integration"],
      },
      {
        userId: user.id,
        subjectId: db.id,
        title: "Database Term Project Demo",
        date: in14Days,
        time: "02:00 PM",
        type: ExamType.PROJECT,
        importance: Priority.HIGH,
        topics: ["ER Diagram", "Schema", "Indexing"],
      },
    ],
  });

  // Create Tasks
  await prisma.task.createMany({
    data: [
      {
        userId: user.id,
        subjectId: cs.id,
        title: "Solve 5 LeetCode DP Problems",
        description: "Focus on knapsack and memoization technique",
        dueDate: in3Days,
        status: TaskStatus.IN_PROGRESS,
        priority: Priority.HIGH,
      },
      {
        userId: user.id,
        subjectId: math.id,
        title: "Review Multivariable Practice Worksheet",
        dueDate: in7Days,
        status: TaskStatus.TODO,
        priority: Priority.MEDIUM,
      },
      {
        userId: user.id,
        subjectId: os.id,
        title: "Read Chapter 5: Virtual Memory",
        dueDate: in14Days,
        status: TaskStatus.TODO,
        priority: Priority.LOW,
      },
    ],
  });

  // Create Today's Study Sessions
  const today = new Date();
  const topicGraph = await prisma.topic.findFirst({ where: { subjectId: cs.id, name: { contains: "Graph" } } });
  const topicIntegration = await prisma.topic.findFirst({ where: { subjectId: math.id, name: { contains: "Integration" } } });

  await prisma.studySession.createMany({
    data: [
      {
        userId: user.id,
        subjectId: cs.id,
        topicId: topicGraph?.id,
        title: "Data Structures — Graph Traversal (BFS & DFS)",
        date: today,
        startTime: "09:00",
        endTime: "10:00",
        duration: 60,
        type: SessionType.STUDY,
        difficulty: Difficulty.HARD,
        status: SessionStatus.COMPLETED,
        actualMinutes: 60,
        reason: "Exam in 3 days & low topic completion rate",
      },
      {
        userId: user.id,
        subjectId: math.id,
        topicId: topicIntegration?.id,
        title: "Linear Algebra — Multivariable Integration",
        date: today,
        startTime: "10:10",
        endTime: "11:10",
        duration: 60,
        type: SessionType.PRACTICE,
        difficulty: Difficulty.HARD,
        status: SessionStatus.SCHEDULED,
        reason: "Practice session before upcoming assignment",
      },
      {
        userId: user.id,
        subjectId: db.id,
        title: "Database Systems — Indexing & B+ Trees",
        date: today,
        startTime: "11:20",
        endTime: "12:20",
        duration: 60,
        type: SessionType.REVISION,
        difficulty: Difficulty.MEDIUM,
        status: SessionStatus.SCHEDULED,
        reason: "Scheduled review of database storage mechanisms",
      },
    ],
  });

  // Create Achievements seed
  const achievements = [
    { key: "streak-7", name: "7-Day Streak", description: "Studied 7 days in a row without missing a session.", icon: "Flame", xpReward: 100, threshold: 7 },
    { key: "hours-10", name: "10 Hours Studied", description: "Logged over 10 hours of focused study time.", icon: "Clock", xpReward: 150, threshold: 10 },
    { key: "tasks-50", name: "50 Tasks Completed", description: "Successfully finished 50 study tasks.", icon: "CheckCircle2", xpReward: 200, threshold: 50 },
    { key: "exam-ready", name: "Exam Ready", description: "Completed all revision sessions before an upcoming exam.", icon: "GraduationCap", xpReward: 250, threshold: 1 },
  ];

  for (const ach of achievements) {
    await prisma.achievement.upsert({
      where: { key: ach.key },
      update: ach,
      create: ach,
    });
  }

  // Award 1st achievement to user
  const streakAch = await prisma.achievement.findUnique({ where: { key: "streak-7" } });
  if (streakAch) {
    await prisma.userAchievement.create({
      data: {
        userId: user.id,
        achievementId: streakAch.id,
      },
    });
  }

  // Create notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: user.id,
        type: "EXAM",
        title: "Upcoming Exam Alert 🚨",
        message: "DSA Midterm Examination is scheduled in 3 days. Make sure to complete your revision!",
        read: false,
      },
      {
        userId: user.id,
        type: "DAILY_PLAN",
        title: "Today's Study Plan Ready ✨",
        message: "You have 3 study sessions scheduled today totaling 3.0 hours.",
        read: true,
      },
      {
        userId: user.id,
        type: "STREAK",
        title: "7-Day Streak Unlocked! 🔥",
        message: "Awesome consistency! You hit a 7-day study streak and earned 100 XP.",
        read: true,
      },
    ],
  });

  console.log("✅ Database successfully seeded with demo user demo@studyflow.ai");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
