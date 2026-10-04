const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Load .env
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx <= 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

async function init3NFSchema() {
  const config = {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'ai_interview_platform',
  };

  console.log(`Connecting to MySQL database "${config.database}" at ${config.host}:${config.port}...`);
  const conn = await mysql.createConnection(config);

  console.log('Ensuring 6+ 3NF Normalized Tables exist in MySQL...');

  await conn.query('SET FOREIGN_KEY_CHECKS = 0');

  // 1. Table: interviewers
  await conn.query(`
    CREATE TABLE IF NOT EXISTS interviewers (
      id VARCHAR(191) NOT NULL PRIMARY KEY,
      name VARCHAR(255) NULL,
      email VARCHAR(255) NULL UNIQUE,
      created_at DATETIME(3) NOT NULL,
      updated_at DATETIME(3) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 2. Table: sessions
  await conn.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id VARCHAR(191) NOT NULL PRIMARY KEY,
      interviewer_id VARCHAR(191) NULL,
      link VARCHAR(191) NULL UNIQUE,
      title VARCHAR(255) NOT NULL,
      description TEXT NULL,
      time_limit INT DEFAULT 60,
      avatar_config JSON NULL,
      created_at DATETIME(3) NOT NULL,
      updated_at DATETIME(3) NOT NULL,
      INDEX idx_sessions_interviewer (interviewer_id),
      CONSTRAINT fk_sessions_interviewer FOREIGN KEY (interviewer_id) REFERENCES interviewers(id) ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 3. Table: questions
  await conn.query(`
    CREATE TABLE IF NOT EXISTS questions (
      id VARCHAR(191) NOT NULL PRIMARY KEY,
      session_id VARCHAR(191) NOT NULL,
      order_index INT NOT NULL DEFAULT 0,
      text TEXT NOT NULL,
      type VARCHAR(50) DEFAULT 'technical',
      weight DOUBLE DEFAULT 1.0,
      time_limit INT DEFAULT 60,
      expected_keywords JSON NULL,
      evaluation_criteria TEXT NULL,
      created_at DATETIME(3) NOT NULL,
      INDEX idx_questions_session (session_id),
      CONSTRAINT fk_questions_session FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 4. Table: candidates
  await conn.query(`
    CREATE TABLE IF NOT EXISTS candidates (
      id VARCHAR(191) NOT NULL PRIMARY KEY,
      session_id VARCHAR(191) NOT NULL,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'registered',
      overall_score DOUBLE NULL,
      rank_position INT NULL,
      integrity_consent TINYINT(1) DEFAULT 1,
      resume_text LONGTEXT NULL,
      resume_insights JSON NULL,
      analysis JSON NULL,
      registered_at DATETIME(3) NULL,
      completed_at DATETIME(3) NULL,
      created_at DATETIME(3) NOT NULL,
      updated_at DATETIME(3) NOT NULL,
      INDEX idx_candidates_session (session_id),
      CONSTRAINT fk_candidates_session FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 5. Table: responses
  await conn.query(`
    CREATE TABLE IF NOT EXISTS responses (
      id VARCHAR(191) NOT NULL PRIMARY KEY,
      candidate_id VARCHAR(191) NOT NULL,
      question_id VARCHAR(191) NULL,
      question_text TEXT NULL,
      audio_url TEXT NULL,
      video_url TEXT NULL,
      transcript LONGTEXT NULL,
      relevance_score DOUBLE NULL,
      accuracy_score DOUBLE NULL,
      confidence_score DOUBLE NULL,
      keyword_match_score DOUBLE NULL,
      strengths JSON NULL,
      improvements JSON NULL,
      analysis JSON NULL,
      overall_response_score DOUBLE NULL,
      created_at DATETIME(3) NOT NULL,
      INDEX idx_responses_candidate (candidate_id),
      INDEX idx_responses_question (question_id),
      CONSTRAINT fk_responses_candidate FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 6. Table: integrity_events
  await conn.query(`
    CREATE TABLE IF NOT EXISTS integrity_events (
      id VARCHAR(191) NOT NULL PRIMARY KEY,
      candidate_id VARCHAR(191) NOT NULL,
      event_type VARCHAR(100) NOT NULL,
      timestamp_ms BIGINT NOT NULL,
      confidence DOUBLE NULL,
      bounding_box JSON NULL,
      penalty_weight DOUBLE DEFAULT 0,
      reverified TINYINT(1) DEFAULT 0,
      created_at DATETIME(3) NOT NULL,
      INDEX idx_integrity_candidate (candidate_id),
      CONSTRAINT fk_integrity_candidate FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await conn.query('SET FOREIGN_KEY_CHECKS = 1');

  const [tables] = await conn.query('SHOW TABLES');
  console.log('--- Successfully initialized 6+ 3NF Normalized Tables in MySQL ---');
  console.log(tables.map((t) => Object.values(t)[0]));

  await conn.end();
}

init3NFSchema().catch((err) => {
  console.error('Initialization Error:', err);
  process.exit(1);
});
