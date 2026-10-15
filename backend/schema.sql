CREATE DATABASE IF NOT EXISTS interview_assistant;
USE interview_assistant;

CREATE TABLE candidates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(100) NOT NULL,
  skills TEXT,
  projects TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE interviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  candidate_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (candidate_id) REFERENCES candidates(id)
);

CREATE TABLE questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  interview_id INT NOT NULL,
  seq INT NOT NULL,
  question TEXT NOT NULL,
  topic VARCHAR(150),
  expected_answer TEXT,
  difficulty ENUM('easy','medium','hard') NOT NULL,
  result ENUM('correct','partial','wrong') NULL,
  FOREIGN KEY (interview_id) REFERENCES interviews(id)
);
