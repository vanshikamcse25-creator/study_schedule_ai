import Groq from "groq-sdk";
import { aiPlanResponseSchema, type AiPlanResponse } from "@/lib/validations";
import {
  STUDY_PLAN_GENERATION_PROMPT,
  DAILY_ADJUSTMENT_PROMPT,
  RESCHEDULING_PROMPT,
  AI_ASSISTANT_PROMPT,
  WEEKLY_REVIEW_PROMPT,
  QUIZ_GENERATION_PROMPT,
  TOPIC_EXPLANATION_PROMPT,
} from "@/lib/ai/prompts";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODEL = "llama3-8b-8192";

async function callGroq(systemPrompt: string, userPrompt: string, jsonMode = true): Promise<string> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.4,
    max_tokens: 2048,
    ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Empty response from AI");
  return content;
}

function parseJsonResponse<T>(content: string, retries = 2): T {
  let lastError: Error | null = null;
  for (let i = 0; i <= retries; i++) {
    try {
      const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
      return JSON.parse(cleaned) as T;
    } catch (e) {
      lastError = e as Error;
    }
  }
  throw lastError ?? new Error("Failed to parse AI response");
}

export async function generateStudyPlan(context: string): Promise<AiPlanResponse> {
  const content = await callGroq(STUDY_PLAN_GENERATION_PROMPT, context);
  const parsed = parseJsonResponse<unknown>(content);
  const validated = aiPlanResponseSchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error("AI returned an invalid study plan format");
  }
  return validated.data;
}

export async function adjustDailyPlan(context: string): Promise<AiPlanResponse> {
  const content = await callGroq(DAILY_ADJUSTMENT_PROMPT, context);
  const parsed = parseJsonResponse<unknown>(content);
  const validated = aiPlanResponseSchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error("AI returned an invalid plan adjustment");
  }
  return validated.data;
}

export async function rescheduleSessions(context: string): Promise<AiPlanResponse> {
  const content = await callGroq(RESCHEDULING_PROMPT, context);
  const parsed = parseJsonResponse<unknown>(content);
  const validated = aiPlanResponseSchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error("AI returned an invalid rescheduling plan");
  }
  return validated.data;
}

export async function chatWithAssistant(context: string, message: string): Promise<string> {
  const content = await callGroq(
    AI_ASSISTANT_PROMPT,
    `CONTEXT:\n${context}\n\nUSER MESSAGE:\n${message}`,
    false
  );
  return content;
}

export async function generateWeeklyReview(context: string): Promise<{ recommendation: string; insights: string[] }> {
  const content = await callGroq(WEEKLY_REVIEW_PROMPT, context);
  const parsed = parseJsonResponse<{ recommendation: string; insights: string[] }>(content);
  return parsed;
}

export async function generateQuiz(context: string): Promise<{ questions: Array<{ question: string; options: string[]; answer: string }> }> {
  const content = await callGroq(QUIZ_GENERATION_PROMPT, context);
  return parseJsonResponse(content);
}

export async function explainTopic(context: string): Promise<string> {
  return callGroq(TOPIC_EXPLANATION_PROMPT, context, false);
}

export function isGroqConfigured(): boolean {
  return !!process.env.GROQ_API_KEY;
}
