import "dotenv/config";
import express from "express";
import cors from "cors";
import { pool } from "./db.js";
import { generateQuestion } from "./ai.js";

const app = express();
app.use(cors());
app.use(express.json());

const TOTAL = 10; // questions per interview
const LEVELS = ["easy", "medium", "hard"];

const wrap = (fn) => (req, res) =>
  fn(req, res).catch((err) => {
    console.error(err);
    res.status(500).json({ error: err.message });
  });

// Correct -> harder, wrong -> easier, partial -> same level
const nextLevel = (current, result) => {
  const i = LEVELS.indexOf(current);
  if (result === "correct") return LEVELS[Math.min(i + 1, 2)];
  if (result === "wrong") return LEVELS[Math.max(i - 1, 0)];
  return current;
};

async function askNext(interviewId, difficulty) {
  const [[interview]] = await pool.query("SELECT candidate_id FROM interviews WHERE id=?", [interviewId]);
  const [[candidate]] = await pool.query("SELECT * FROM candidates WHERE id=?", [interview.candidate_id]);
  const [history] = await pool.query(
    "SELECT question, difficulty, result FROM questions WHERE interview_id=? ORDER BY seq",
    [interviewId]
  );

  const q = await generateQuestion({ candidate, history, difficulty });
  const seq = history.length + 1;
  const [r] = await pool.query(
    "INSERT INTO questions (interview_id, seq, question, topic, expected_answer, difficulty) VALUES (?,?,?,?,?,?)",
    [interviewId, seq, q.question, q.topic, q.expected_answer, difficulty]
  );
  return { id: r.insertId, seq, total: TOTAL, difficulty, ...q };
}

async function getResult(interviewId) {
  const [rows] = await pool.query(
    "SELECT topic, result FROM questions WHERE interview_id=? AND result IS NOT NULL",
    [interviewId]
  );
  const count = (t) => rows.filter((r) => r.result === t).length;
  const points = count("correct") + count("partial") * 0.5;
  const score = Math.round((points / TOTAL) * 100) / 10; // out of 10
  const verdict = score >= 7 ? "Eligible" : score >= 5 ? "Borderline" : "Not eligible";

  return {
    score,
    outOf: 10,
    verdict,
    tally: { correct: count("correct"), partial: count("partial"), wrong: count("wrong") },
    strongTopics: [...new Set(rows.filter((r) => r.result === "correct").map((r) => r.topic))],
    weakTopics: [...new Set(rows.filter((r) => r.result === "wrong").map((r) => r.topic))],
  };
}

// 1. Add candidate
app.post("/api/candidates", wrap(async (req, res) => {
  const { name, role, skills, projects } = req.body;
  const [r] = await pool.query(
    "INSERT INTO candidates (name, role, skills, projects) VALUES (?,?,?,?)",
    [name, role, skills, projects]
  );
  res.json({ candidateId: r.insertId });
}));

// 2. Start interview -> returns first question
app.post("/api/candidates/:id/interview", wrap(async (req, res) => {
  const [r] = await pool.query("INSERT INTO interviews (candidate_id) VALUES (?)", [req.params.id]);
  const question = await askNext(r.insertId, "medium");
  res.json({ interviewId: r.insertId, question });
}));

// 3. Mark answer (correct | partial | wrong) -> next question or final result
app.post("/api/interviews/:id/answer", wrap(async (req, res) => {
  const { questionId, result } = req.body;
  if (!["correct", "partial", "wrong"].includes(result))
    return res.status(400).json({ error: "result must be correct, partial or wrong" });

  const [[q]] = await pool.query("SELECT difficulty FROM questions WHERE id=?", [questionId]);
  await pool.query("UPDATE questions SET result=? WHERE id=?", [result, questionId]);

  const [[{ answered }]] = await pool.query(
    "SELECT COUNT(*) AS answered FROM questions WHERE interview_id=? AND result IS NOT NULL",
    [req.params.id]
  );
  if (answered >= TOTAL) return res.json({ done: true, result: await getResult(req.params.id) });

  const question = await askNext(req.params.id, nextLevel(q.difficulty, result));
  res.json({ done: false, question, progress: await getResult(req.params.id) });
}));

// 4. Final result any time
app.get("/api/interviews/:id/result", wrap(async (req, res) => {
  res.json(await getResult(req.params.id));
}));

app.listen(process.env.PORT || 5000, () => console.log("Server running"));
