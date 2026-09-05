import prisma from "@/lib/db";
import { buildChatContext } from "@/lib/scheduling/priority";
import { chatWithAssistant, isGroqConfigured } from "@/lib/ai/groq";
import { getDaysRemaining, startOfDay, endOfDay } from "@/lib/utils";

export async function getChatContext(userId: string): Promise<string> {
  const [user, profile, subjects, exams, todaySessions, streak] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.profile.findUnique({ where: { userId } }),
    prisma.subject.findMany({ where: { userId } }),
    prisma.exam.findMany({
      where: { userId, date: { gte: new Date() } },
      include: { subject: true },
      orderBy: { date: "asc" },
      take: 5,
    }),
    prisma.studySession.findMany({
      where: {
        userId,
        date: { gte: startOfDay(new Date()), lte: endOfDay(new Date()) },
      },
      include: { subject: true, topic: true },
      orderBy: { startTime: "asc" },
    }),
    prisma.studyStreak.findUnique({ where: { userId } }),
  ]);

  return buildChatContext({
    profile: {
      name: user?.name,
      preferredStudyTime: profile?.preferredStudyTime ?? "FLEXIBLE",
      availableHoursPerDay: profile?.availableHoursPerDay ?? 4,
      studyDays: profile?.studyDays ?? [],
      maxSessionDuration: profile?.maxSessionDuration ?? 60,
      breakDuration: profile?.breakDuration ?? 10,
      studyStyle: profile?.studyStyle ?? "MIXED",
    },
    subjects: subjects.map((s) => ({
      name: s.name,
      progress: s.progress,
      difficulty: s.difficulty,
    })),
    exams: exams.map((e) => ({
      title: e.title,
      subjectName: e.subject?.name,
      daysRemaining: getDaysRemaining(e.date),
    })),
    todaySessions: todaySessions.map((s) => ({
      startTime: s.startTime,
      endTime: s.endTime,
      subject: s.subject?.name,
      topic: s.topic?.name,
      status: s.status,
    })),
    streak: streak?.currentStreak ?? 0,
  });
}

export async function sendChatMessage(userId: string, message: string, conversationId?: string) {
  let conversation;
  if (conversationId) {
    conversation = await prisma.chatConversation.findFirst({
      where: { id: conversationId, userId },
    });
    if (!conversation) throw new Error("Conversation not found");
  } else {
    conversation = await prisma.chatConversation.create({
      data: {
        userId,
        title: message.slice(0, 50) + (message.length > 50 ? "..." : ""),
      },
    });
  }

  await prisma.chatMessage.create({
    data: { conversationId: conversation.id, role: "user", content: message },
  });

  const context = await getChatContext(userId);
  let response: string;

  try {
    if (isGroqConfigured()) {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Groq API timeout")), 6000)
      );
      response = await Promise.race([chatWithAssistant(context, message), timeoutPromise]);
    } else {
      response = generateFallbackResponse(message, context);
    }
  } catch (err) {
    console.error("Chat Assistant AI Error:", err);
    response = generateFallbackResponse(message, context);
  }

  await prisma.chatMessage.create({
    data: { conversationId: conversation.id, role: "assistant", content: response },
  });

  await prisma.chatConversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date() },
  });

  return { conversationId: conversation.id, response };
}

function generateFallbackResponse(message: string, context: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("2 hours") || lower.includes("limited time") || lower.includes("short time")) {
    return "With **2 hours** available today, here is your optimal split:\n\n1. **Block 1 (50 min)**: Deep focus on your lowest-progress subject topic.\n2. **Break (10 min)**: Rest and hydration.\n3. **Block 2 (40 min)**: Active practice / problem solving.\n4. **Review (20 min)**: Quick summary and flashcards.";
  }

  if (lower.includes("5 days") || lower.includes("revision plan")) {
    return "For your upcoming exam in **5 days**, follow this daily countdown strategy:\n\n- **Day 5 & 4**: High-weight topic deep dives + summary notes\n- **Day 3**: Practice past exam questions & active recall\n- **Day 2**: Full timed mock test + review weak areas\n- **Day 1**: Formula & key concept review (no heavy cramming)";
  }

  if (lower.includes("binary search") || lower.includes("tree")) {
    return "**Binary Search Trees (BST)** are hierarchical data structures where each node has at most two children:\n\n- **Left Child**: Value is strictly smaller than the parent.\n- **Right Child**: Value is strictly greater than the parent.\n\n**Key Time Complexities**:\n- Search / Insert / Delete: $O(\\log n)$ average, $O(n)$ worst-case (unbalanced).\n- **In-order traversal** visits nodes in ascending sorted order!";
  }

  if (lower.includes("quiz") || lower.includes("database") || lower.includes("normalization")) {
    return "**Database Normalization Quiz**:\n\n1. **1NF**: What requirement ensures a table is in First Normal Form?\n   *Answer: Atomic columns (no multi-valued attributes) and a defined primary key.*\n\n2. **2NF**: What type of dependency must be eliminated for 2NF?\n   *Answer: Partial dependencies (non-key attributes depending on only part of a composite key).*\n\n3. **3NF**: What rule defines 3NF?\n   *Answer: No transitive dependencies (non-key attributes depending on other non-key attributes).*";
  }

  if (lower.includes("missed") || lower.includes("fix my plan") || lower.includes("yesterday")) {
    return "No worries! To reschedule missed sessions:\n\n1. Go to your **Study Plan** page.\n2. Click the **Reschedule** button on any missed block.\n3. Choose **Reschedule Automatically** to let StudyFlow AI rebalance your remaining slots for this week without overloading your daily hours.";
  }

  if (lower.includes("today") || lower.includes("study now") || lower.includes("prioritize") || lower.includes("what should i study")) {
    const subjectMatch = context.match(/SUBJECTS\n([\s\S]*?)\n\nUPCOMING/);
    if (subjectMatch) {
      const lines = subjectMatch[1].trim().split("\n");
      const sorted = lines
        .map((l) => {
          const match = l.match(/- (.+): (\d+)%/);
          return match ? { name: match[1], progress: parseInt(match[2]) } : null;
        })
        .filter(Boolean)
        .sort((a, b) => (a?.progress ?? 0) - (b?.progress ?? 0));
      if (sorted[0]) {
        return `Based on your current progress, I recommend focusing on **${sorted[0].name}** today (${sorted[0].progress}% complete). Start with core concepts and practice active recall for maximum retention.`;
      }
    }
    return "Based on your current study schedule, prioritize your highest-difficulty subject today. Allocate 60 minutes for active learning followed by a 10-minute break.";
  }

  if (lower.includes("missed") || lower.includes("fix my plan") || lower.includes("yesterday")) {
    return "No worries! To reschedule missed sessions:\n\n1. Go to your **Study Plan** page.\n2. Click the **Reschedule** button on any missed block.\n3. Choose **Reschedule Automatically** to let StudyFlow AI rebalance your remaining slots for this week without overloading your daily hours.";
  }

  // Dynamic roadmap response for ANY topic, question, or skill requested by the user
  const topicClean = message.replace(/i want to learn|how to learn|tell me about|explain|what is|how do i|i want to/gi, "").trim();
  const topicTitle = topicClean.length > 0 ? topicClean.charAt(0).toUpperCase() + topicClean.slice(1) : "this topic";

  return `Here is a structured study roadmap to master **${topicTitle}** efficiently:

1. **Foundations (Phase 1)**:
   - Understand core terminology, principles, and high-level architecture of ${topicTitle}.
   - Set up your study environment, tools, or practice playground.

2. **Core Practice (Phase 2)**:
   - Work through practical exercises, key examples, and code/math problems.
   - Use active recall and spaced repetition flashcards for core concepts.

3. **Projects & Revision (Phase 3)**:
   - Build a mini-project or solve real-world test problems.
   - Review weak areas and quiz yourself on edge cases.

Would you like me to add **${topicTitle}** to your subjects list on StudyFlow AI?`;
}

export async function createConversation(userId: string, title?: string) {
  return prisma.chatConversation.create({
    data: {
      userId,
      title: title ?? "New Conversation",
    },
  });
}

export async function sendMessage(userId: string, message: string, conversationId?: string) {
  const result = await sendChatMessage(userId, message, conversationId);
  const userMessage = await prisma.chatMessage.findFirst({
    where: { conversationId: result.conversationId, role: "user" },
    orderBy: { createdAt: "desc" },
  });
  return {
    reply: result.response,
    conversationId: result.conversationId,
    userMessage: userMessage ?? { id: Date.now().toString() },
  };
}

export async function getConversations(userId: string) {
  return prisma.chatConversation.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { messages: true } },
    },
  });
}

export async function getConversationMessages(userId: string, conversationId: string) {
  const conversation = await prisma.chatConversation.findFirst({
    where: { id: conversationId, userId },
  });
  if (!conversation) throw new Error("Conversation not found");

  return prisma.chatMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
  });
}

export async function deleteConversation(userId: string, conversationId: string) {
  const conversation = await prisma.chatConversation.findFirst({
    where: { id: conversationId, userId },
  });
  if (!conversation) throw new Error("Conversation not found");
  return prisma.chatConversation.delete({ where: { id: conversationId } });
}

