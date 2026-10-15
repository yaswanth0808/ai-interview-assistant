import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-5-5";

export async function generateQuestion({ candidate, history, difficulty }) {
  const asked =
    history
      .map((h, i) => `${i + 1}. [${h.difficulty}] ${h.question} -> ${h.result || "unanswered"}`)
      .join("\n") || "None yet";

  const prompt = `You are helping an interviewer assess a candidate.

Candidate: ${candidate.name}
Role applied for: ${candidate.role}
Skills: ${candidate.skills}
Projects: ${candidate.projects}

Questions asked so far (with how the candidate did):
${asked}

Write ONE new ${difficulty} technical question.
Rules:
- Base it on the candidate's own projects or listed skills.
- If the last answer was correct, go deeper on that topic. If wrong, ask a simpler related question.
- Do not repeat an earlier question.
- Include a short expected answer so the interviewer can judge correctness.

Return ONLY JSON, no markdown:
{"question": "...", "topic": "...", "expected_answer": "..."}`;

  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 600,
    messages: [{ role: "user", content: prompt }],
  });

  const text = res.content.map((b) => b.text || "").join("");
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}
