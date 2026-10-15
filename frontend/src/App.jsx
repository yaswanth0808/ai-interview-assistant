import { useState } from "react";
import { createCandidate, startInterview, sendAnswer, getResult } from "./api.js";

const TOTAL = 10;
const EMPTY_FORM = { name: "", role: "", skills: "", projects: "" };
const EMPTY_COUNTS = { correct: 0, partial: 0, wrong: 0 };
const SAMPLE = {
  name: "Ravi Kumar",
  role: "Web Developer Intern",
  skills: "React.js, Node.js, Express, MySQL, JWT, Git",
  projects:
    "E-commerce website: React frontend, Node/Express REST API, MySQL database, JWT login, cart and order history.\nWeather dashboard: React app using a public weather API, with search history kept in local storage.",
};

/* One group of tally marks: four strokes, the fifth crosses them */
function TallyGroup({ count }) {
  const strokes = Math.min(count, 4);
  return (
    <svg className="tally-group" width="34" height="30" viewBox="0 0 34 30" aria-hidden="true">
      {Array.from({ length: strokes }).map((_, i) => (
        <line key={i} x1={5 + i * 7} y1="3" x2={5 + i * 7} y2="27" />
      ))}
      {count === 5 && <line x1="1" y1="23" x2="33" y2="7" />}
    </svg>
  );
}

function Tally({ count, label, tone }) {
  const groups = [];
  for (let i = 0; i < Math.floor(count / 5); i++) groups.push(5);
  if (count % 5) groups.push(count % 5);
  return (
    <div className={`tally tone-${tone}`}>
      <div className="tally-head">
        <span>{label}</span>
        <strong>{count}</strong>
      </div>
      <div className="tally-marks" aria-label={`${count} ${label}`}>
        {groups.length === 0 ? <span className="tally-empty">none yet</span> : groups.map((g, i) => <TallyGroup key={i} count={g} />)}
      </div>
    </div>
  );
}

function CandidateForm({ form, setForm, onStart, busy }) {
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const ready = form.name.trim() && form.role.trim() && form.skills.trim() && form.projects.trim();

  return (
    <section className="panel form-panel">
      <h2>Candidate details</h2>
      <p className="hint">The questions are written from this information, so include the candidate's real projects.</p>

      <label>
        Candidate name
        <input value={form.name} onChange={set("name")} placeholder="e.g. Ravi Kumar" />
      </label>
      <label>
        Role applied for
        <input value={form.role} onChange={set("role")} placeholder="e.g. Web Developer Intern" />
      </label>
      <label>
        Skills
        <input value={form.skills} onChange={set("skills")} placeholder="e.g. React, Node.js, MySQL" />
      </label>
      <label>
        Projects
        <textarea
          rows="6"
          value={form.projects}
          onChange={set("projects")}
          placeholder="Describe each project in a line or two: what it does and the tech used."
        />
      </label>

      <div className="actions">
        <button className="btn primary" disabled={!ready || busy} onClick={onStart}>
          {busy ? "Preparing first question…" : "Start interview"}
        </button>
        <button className="btn ghost" disabled={busy} onClick={() => setForm(SAMPLE)}>
          Fill sample candidate
        </button>
      </div>
    </section>
  );
}

function Interview({ name, question, counts, onAnswer, onFinish, busy }) {
  const [showAnswer, setShowAnswer] = useState(false);
  const answered = counts.correct + counts.partial + counts.wrong;

  return (
    <div className="interview">
      <section className="panel question-panel">
        <div className="q-meta">
          <span>
            Question {question.seq} of {TOTAL}
          </span>
          <span className={`chip level-${question.difficulty}`}>{question.difficulty}</span>
          <span className="topic">{question.topic}</span>
        </div>

        <p className="question-text">{question.question}</p>

        <button className="btn ghost small" onClick={() => setShowAnswer(!showAnswer)}>
          {showAnswer ? "Hide expected answer" : "Show expected answer"}
        </button>
        {showAnswer && <div className="expected">{question.expected_answer}</div>}

        <div className="judge">
          <p className="judge-label">How did {name} answer?</p>
          <div className="judge-buttons">
            <button className="btn correct" disabled={busy} onClick={() => onAnswer("correct")}>
              Correct
            </button>
            <button className="btn partial" disabled={busy} onClick={() => onAnswer("partial")}>
              Partly correct
            </button>
            <button className="btn wrong" disabled={busy} onClick={() => onAnswer("wrong")}>
              Wrong
            </button>
          </div>
          {busy && <p className="hint">Preparing the next question…</p>}
        </div>
      </section>

      <aside className="panel scorecard">
        <h2>Scorecard</h2>
        <p className="hint">{name}</p>
        <Tally count={counts.correct} label="Correct" tone="correct" />
        <Tally count={counts.partial} label="Partly correct" tone="partial" />
        <Tally count={counts.wrong} label="Wrong" tone="wrong" />
        <div className="progress" aria-label={`${answered} of ${TOTAL} answered`}>
          <div style={{ width: `${(answered / TOTAL) * 100}%` }} />
        </div>
        <p className="hint">
          {answered} of {TOTAL} answered
        </p>
        <button className="btn ghost small" disabled={busy || answered === 0} onClick={onFinish}>
          Finish now and see result
        </button>
      </aside>
    </div>
  );
}

function Result({ name, role, result, onReset }) {
  const tone = result.verdict === "Eligible" ? "correct" : result.verdict === "Borderline" ? "partial" : "wrong";
  return (
    <section className="panel result">
      <p className="hint">
        {name} · {role}
      </p>
      <div className="score">
        <span className="score-number">{result.score}</span>
        <span className="score-out">/ {result.outOf}</span>
      </div>
      <p className={`verdict tone-${tone}`}>{result.verdict}</p>

      <div className="result-tallies">
        <Tally count={result.tally.correct} label="Correct" tone="correct" />
        <Tally count={result.tally.partial} label="Partly correct" tone="partial" />
        <Tally count={result.tally.wrong} label="Wrong" tone="wrong" />
      </div>

      <div className="topics">
        <div>
          <h3>Strong topics</h3>
          {result.strongTopics.length ? (
            <ul>{result.strongTopics.map((t) => <li key={t}>{t}</li>)}</ul>
          ) : (
            <p className="hint">None recorded</p>
          )}
        </div>
        <div>
          <h3>Needs work</h3>
          {result.weakTopics.length ? (
            <ul>{result.weakTopics.map((t) => <li key={t}>{t}</li>)}</ul>
          ) : (
            <p className="hint">None recorded</p>
          )}
        </div>
      </div>

      <p className="hint">Score = (correct + half of partly correct) out of {TOTAL} questions. 7 or more is Eligible, 5 to 7 is Borderline.</p>
      <button className="btn primary" onClick={onReset}>
        Start a new interview
      </button>
    </section>
  );
}

export default function App() {
  const [screen, setScreen] = useState("form");
  const [form, setForm] = useState(EMPTY_FORM);
  const [interviewId, setInterviewId] = useState(null);
  const [question, setQuestion] = useState(null);
  const [counts, setCounts] = useState(EMPTY_COUNTS);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run(task) {
    setBusy(true);
    setError("");
    try {
      await task();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const begin = () =>
    run(async () => {
      const { candidateId } = await createCandidate(form);
      const data = await startInterview(candidateId);
      setInterviewId(data.interviewId);
      setQuestion(data.question);
      setCounts(EMPTY_COUNTS);
      setScreen("interview");
    });

  const answer = (r) =>
    run(async () => {
      const data = await sendAnswer(interviewId, question.id, r);
      setCounts((c) => ({ ...c, [r]: c[r] + 1 }));
      if (data.done) {
        setResult(data.result);
        setScreen("result");
      } else {
        setQuestion(data.question);
      }
    });

  const finishNow = () =>
    run(async () => {
      setResult(await getResult(interviewId));
      setScreen("result");
    });

  const reset = () => {
    setForm(EMPTY_FORM);
    setQuestion(null);
    setResult(null);
    setCounts(EMPTY_COUNTS);
    setScreen("form");
  };

  return (
    <div className="app">
      <header className="top">
        <h1>Interview Scorecard</h1>
        <p>Ask about the candidate's own projects, mark each answer, and get a score out of 10.</p>
      </header>

      {error && <div className="error">{error}</div>}

      {screen === "form" && <CandidateForm form={form} setForm={setForm} onStart={begin} busy={busy} />}
      {screen === "interview" && (
        <Interview
          key={question.id}
          name={form.name}
          question={question}
          counts={counts}
          onAnswer={answer}
          onFinish={finishNow}
          busy={busy}
        />
      )}
      {screen === "result" && <Result name={form.name} role={form.role} result={result} onReset={reset} />}
    </div>
  );
}
