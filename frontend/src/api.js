async function post(url, body) {
  let res;
  try {
    res = await fetch("/api" + url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Cannot reach the server. Start the backend with: npm run dev");
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Something went wrong");
  return data;
}

async function get(url) {
  let res;
  try {
    res = await fetch("/api" + url);
  } catch {
    throw new Error("Cannot reach the server. Start the backend with: npm run dev");
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Something went wrong");
  return data;
}

export const createCandidate = (body) => post("/candidates", body);
export const startInterview = (candidateId) => post(`/candidates/${candidateId}/interview`);
export const sendAnswer = (interviewId, questionId, result) =>
  post(`/interviews/${interviewId}/answer`, { questionId, result });
export const getResult = (interviewId) => get(`/interviews/${interviewId}/result`);
