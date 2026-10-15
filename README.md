# Interview Scorecard

A full-stack web app that helps an interviewer ask **project-based questions**, mark each answer, and get a **score out of 10** with an eligibility verdict.

## Features
- Enter a candidate's name, role, skills and projects
- AI generates questions based on the candidate's own projects
- Each question comes with an expected answer to help the interviewer judge
- Mark every answer: **Correct**, **Partly correct** or **Wrong**
- Adaptive difficulty: a correct answer leads to a harder follow-up, a wrong answer to an easier related one
- Live scorecard with **tally marks**
- Final score out of 10, verdict (Eligible / Borderline / Not eligible), strong topics and weak topics

## Tech stack
- **Frontend:** React.js (Vite)
- **Backend:** Node.js, Express
- **Database:** MySQL
- **AI:** Claude API (Anthropic)

## How scoring works
- 10 questions per interview
- Score = (correct + 0.5 x partly correct) out of 10
- 7 or above: Eligible | 5 to 7: Borderline | below 5: Not eligible

## Run locally

### 1. Database
Run `backend/schema.sql` in MySQL (Workbench or terminal).

### 2. Backend
```
cd backend
npm install
```
Copy `.env.example` to `.env` and fill in your MySQL password and Anthropic API key, then:
```
npm run dev
```

### 3. Frontend
In a second terminal:
```
cd frontend
npm install
npm run dev
```
Open http://localhost:5173

## API
| Method | Route | Purpose |
|---|---|---|
| POST | /api/candidates | Add a candidate |
| POST | /api/candidates/:id/interview | Start an interview, returns first question |
| POST | /api/interviews/:id/answer | Mark an answer, returns next question or final result |
| GET | /api/interviews/:id/result | Get current score and verdict |

## Future improvements
- Resume upload (PDF) to fill candidate details automatically
- Interviewer login and saved interview history
- Export the result as a PDF report
- Custom pass mark and number of questions

## Author
Padala Yaswanth
