const mysql = require('mysql2/promise');

let pool = null;
let schemaPromise = null;

const getMysqlConfig = () => ({
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'ai_interview_platform',
  waitForConnections: true,
  connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT || 10),
  charset: 'utf8mb4',
});

const mysqlConfigured = () => Boolean(
  process.env.MYSQL_HOST ||
  process.env.MYSQL_USER ||
  process.env.MYSQL_PASSWORD ||
  process.env.MYSQL_DATABASE ||
  process.env.MYSQL_URL
);

const getMysqlPool = async () => {
  if (!mysqlConfigured()) return null;
  if (pool) return pool;

  const config = getMysqlConfig();
  if (process.env.MYSQL_URL) {
    pool = mysql.createPool(process.env.MYSQL_URL);
  } else {
    pool = mysql.createPool(config);
  }

  try {
    await ensure3NFSchema(pool);
    return pool;
  } catch (error) {
    await pool.end().catch(() => {});
    pool = null;
    throw error;
  }
};

const ensure3NFSchema = async (connectionPool) => {
  if (schemaPromise) return schemaPromise;

  schemaPromise = (async () => {
    const connection = await connectionPool.getConnection();
    try {
      await connection.query('SET FOREIGN_KEY_CHECKS = 0');

      // Check if legacy sessions table exists without 'title' column
      const [tableExists] = await connection.query('SHOW TABLES LIKE "sessions"');
      if (tableExists.length > 0) {
        const [titleCol] = await connection.query('SHOW COLUMNS FROM sessions LIKE "title"');
        if (titleCol.length === 0) {
          await connection.query('DROP TABLE IF EXISTS integrity_events, responses, candidates, questions, sessions, interviewers');
        }
      }

      // 1. Table: interviewers
      await connection.query(`
        CREATE TABLE IF NOT EXISTS interviewers (
          id VARCHAR(191) NOT NULL PRIMARY KEY,
          name VARCHAR(255) NULL,
          email VARCHAR(255) NULL UNIQUE,
          created_at DATETIME(3) NOT NULL,
          updated_at DATETIME(3) NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 2. Table: sessions
      await connection.query(`
        CREATE TABLE IF NOT EXISTS sessions (
          id VARCHAR(191) NOT NULL PRIMARY KEY,
          interviewer_id VARCHAR(191) NULL,
          link VARCHAR(191) NULL UNIQUE,
          title VARCHAR(255) NOT NULL,
          description TEXT NULL,
          status VARCHAR(32) NOT NULL DEFAULT 'draft',
          time_limit INT DEFAULT 60,
          settings JSON NULL,
          avatar_config JSON NULL,
          created_at DATETIME(3) NOT NULL,
          updated_at DATETIME(3) NOT NULL,
          INDEX idx_sessions_interviewer (interviewer_id),
          CONSTRAINT fk_sessions_interviewer FOREIGN KEY (interviewer_id) REFERENCES interviewers(id) ON DELETE SET NULL ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      const sessionColumns = [
        ['status', "VARCHAR(32) NOT NULL DEFAULT 'draft'"],
        ['settings', 'JSON NULL'],
      ];
      for (const [column, definition] of sessionColumns) {
        const [existingColumn] = await connection.query('SHOW COLUMNS FROM sessions LIKE ?', [column]);
        if (existingColumn.length === 0) {
          await connection.query(`ALTER TABLE sessions ADD COLUMN ${column} ${definition}`);
        }
      }

      // 3. Table: questions
      await connection.query(`
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
      await connection.query(`
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

      const candidateColumns = [
        ['status', "VARCHAR(32) NOT NULL DEFAULT 'registered'"],
        ['analysis', 'JSON NULL'],
        ['registered_at', 'DATETIME(3) NULL'],
        ['completed_at', 'DATETIME(3) NULL'],
      ];
      for (const [column, definition] of candidateColumns) {
        const [existingColumn] = await connection.query('SHOW COLUMNS FROM candidates LIKE ?', [column]);
        if (existingColumn.length === 0) {
          await connection.query(`ALTER TABLE candidates ADD COLUMN ${column} ${definition}`);
        }
      }

      // 5. Table: responses
      await connection.query(`
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

      const responseColumns = [
        ['question_text', 'TEXT NULL'],
        ['analysis', 'JSON NULL'],
      ];
      for (const [column, definition] of responseColumns) {
        const [existingColumn] = await connection.query('SHOW COLUMNS FROM responses LIKE ?', [column]);
        if (existingColumn.length === 0) {
          await connection.query(`ALTER TABLE responses ADD COLUMN ${column} ${definition}`);
        }
      }

      // 6. Table: integrity_events
      await connection.query(`
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

      await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    } finally {
      connection.release();
    }
  })().catch((error) => {
    schemaPromise = null;
    throw error;
  });

  return schemaPromise;
};

const parseJson = (value) => {
  if (value && typeof value === 'object') return value;
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const now = () => new Date();

// --- 3NF SESSION OPERATIONS ---

const buildSessionObject = async (db, sessionRow) => {
  if (!sessionRow) return null;
  const [qRows] = await db.execute(
    'SELECT * FROM questions WHERE session_id = ? ORDER BY order_index ASC',
    [sessionRow.id]
  );

  const questions = qRows.map((q) => ({
    id: q.id,
    text: q.text,
    type: q.type,
    weight: q.weight,
    timeLimit: q.time_limit,
    expectedKeywords: parseJson(q.expected_keywords) || [],
    evaluationCriteria: q.evaluation_criteria || '',
  }));

  return {
    id: sessionRow.id,
    interviewerId: sessionRow.interviewer_id,
    link: sessionRow.link,
    title: sessionRow.title || 'Untitled Session',
    description: sessionRow.description || '',
    status: sessionRow.status || 'draft',
    timeLimit: sessionRow.time_limit,
    settings: parseJson(sessionRow.settings) || {
      totalDuration: 30,
      allowLateEntry: true,
      showTimer: true,
      recordVideo: true,
      recordAudio: true,
    },
    avatarConfig: parseJson(sessionRow.avatar_config) || null,
    questions,
    createdAt: sessionRow.created_at,
    updatedAt: sessionRow.updated_at,
  };
};

const getSessionByLink = async (link) => {
  const db = await getMysqlPool();
  if (!db || !link) return null;
  const [rows] = await db.execute('SELECT * FROM sessions WHERE link = ? LIMIT 1', [link]);
  return rows[0] ? buildSessionObject(db, rows[0]) : null;
};

const listSessions = async (interviewerId) => {
  const db = await getMysqlPool();
  if (!db) return [];
  const [rows] = interviewerId
    ? await db.execute('SELECT * FROM sessions WHERE interviewer_id = ? ORDER BY updated_at DESC', [interviewerId])
    : await db.execute('SELECT * FROM sessions ORDER BY updated_at DESC');

  const result = [];
  for (const row of rows) {
    result.push(await buildSessionObject(db, row));
  }
  return result;
};

const putSession = async (session) => {
  const db = await getMysqlPool();
  if (!db || !session?.id) return null;

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Ensure interviewer exists if interviewerId is provided
    if (session.interviewerId) {
      await conn.execute(
        `INSERT INTO interviewers (id, name, created_at, updated_at)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE updated_at = VALUES(updated_at)`,
        [session.interviewerId, session.interviewerName || 'Interviewer', now(), now()]
      );
    }

    // 2. Upsert into sessions table
    await conn.execute(
      `INSERT INTO sessions (id, interviewer_id, link, title, description, status, time_limit, settings, avatar_config, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         interviewer_id = VALUES(interviewer_id),
         link = VALUES(link),
         title = VALUES(title),
         description = VALUES(description),
         status = VALUES(status),
         time_limit = VALUES(time_limit),
         settings = VALUES(settings),
         avatar_config = VALUES(avatar_config),
         updated_at = VALUES(updated_at)`,
      [
        session.id,
        session.interviewerId || null,
        session.link || null,
        session.title || 'Untitled Session',
        session.description || '',
        session.status || 'draft',
        session.timeLimit || 60,
        JSON.stringify(session.settings || {}),
        JSON.stringify(session.avatarConfig || null),
        session.createdAt ? new Date(session.createdAt) : now(),
        now(),
      ]
    );

    // 3. Upsert questions into questions table
    const questions = Array.isArray(session.questions) ? session.questions : [];
    const questionIds = [];

    for (let idx = 0; idx < questions.length; idx += 1) {
      const q = questions[idx];
      const qId = q.id || `q_${session.id}_${idx + 1}`;
      questionIds.push(qId);

      await conn.execute(
        `INSERT INTO questions (id, session_id, order_index, text, type, weight, time_limit, expected_keywords, evaluation_criteria, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           order_index = VALUES(order_index),
           text = VALUES(text),
           type = VALUES(type),
           weight = VALUES(weight),
           time_limit = VALUES(time_limit),
           expected_keywords = VALUES(expected_keywords),
           evaluation_criteria = VALUES(evaluation_criteria)`,
        [
          qId,
          session.id,
          idx,
          q.text || '',
          q.type || 'technical',
          q.weight || 1.0,
          q.timeLimit || session.timeLimit || 60,
          JSON.stringify(q.expectedKeywords || []),
          q.evaluationCriteria || '',
          now(),
        ]
      );
    }

    // 4. Delete questions removed from the session
    if (questionIds.length > 0) {
      const placeholders = questionIds.map(() => '?').join(',');
      await conn.execute(
        `DELETE FROM questions WHERE session_id = ? AND id NOT IN (${placeholders})`,
        [session.id, ...questionIds]
      );
    } else {
      await conn.execute('DELETE FROM questions WHERE session_id = ?', [session.id]);
    }

    await conn.commit();
    return await buildSessionObject(db, { id: session.id, ...session, updated_at: now() });
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

const patchSession = async (id, updates) => {
  const db = await getMysqlPool();
  if (!db || !id) return null;
  const [rows] = await db.execute('SELECT * FROM sessions WHERE id = ? LIMIT 1', [id]);
  if (!rows[0]) return null;
  const existing = await buildSessionObject(db, rows[0]);
  const next = { ...existing, ...(updates || {}), updatedAt: new Date().toISOString() };
  return putSession(next);
};

const deleteSession = async (id) => {
  const db = await getMysqlPool();
  if (!db || !id) return false;
  // ON DELETE CASCADE automatically deletes questions, candidates, responses, and integrity_events in MySQL 3NF
  const [result] = await db.execute('DELETE FROM sessions WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

// --- 3NF CANDIDATE OPERATIONS ---

const buildCandidateObject = async (db, candRow) => {
  if (!candRow) return null;

  // 1. Query responses
  const [respRows] = await db.execute(
    'SELECT * FROM responses WHERE candidate_id = ? ORDER BY created_at ASC',
    [candRow.id]
  );

  const responses = respRows.map((r) => ({
    id: r.id,
    questionId: r.question_id,
    questionText: r.question_text,
    audioUrl: r.audio_url,
    videoUrl: r.video_url,
    transcript: r.transcript,
    relevance: r.relevance_score,
    accuracy: r.accuracy_score,
    confidence: r.confidence_score,
    keywordMatch: r.keyword_match_score,
    overallScore: r.overall_response_score,
    strengths: parseJson(r.strengths) || [],
    improvements: parseJson(r.improvements) || [],
    analysis: parseJson(r.analysis) || null,
  }));

  // 2. Query integrity events
  const [eventRows] = await db.execute(
    'SELECT * FROM integrity_events WHERE candidate_id = ? ORDER BY timestamp_ms ASC',
    [candRow.id]
  );

  const integrityEvents = eventRows.map((e) => ({
    id: e.id,
    eventType: e.event_type,
    timestamp: Number(e.timestamp_ms),
    confidence: e.confidence,
    boundingBox: parseJson(e.bounding_box),
    penaltyWeight: e.penalty_weight,
    reverified: Boolean(e.reverified),
  }));

  return {
    id: candRow.id,
    sessionId: candRow.session_id,
    name: candRow.name || '',
    email: candRow.email || '',
    status: candRow.status || 'registered',
    overallScore: candRow.overall_score,
    rank: candRow.rank_position,
    integrityConsent: Boolean(candRow.integrity_consent),
    resumeText: candRow.resume_text,
    resumeInsights: parseJson(candRow.resume_insights),
    analysis: parseJson(candRow.analysis),
    registeredAt: candRow.registered_at,
    completedAt: candRow.completed_at,
    responses,
    integrityEvents,
    createdAt: candRow.created_at,
    updatedAt: candRow.updated_at,
  };
};

const putCandidate = async (candidate) => {
  const db = await getMysqlPool();
  if (!db || !candidate?.id) return null;

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Upsert into candidates table
    await conn.execute(
      `INSERT INTO candidates (id, session_id, name, email, status, overall_score, rank_position, integrity_consent, resume_text, resume_insights, analysis, registered_at, completed_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         session_id = VALUES(session_id),
         name = VALUES(name),
         email = VALUES(email),
         status = VALUES(status),
         overall_score = VALUES(overall_score),
         rank_position = VALUES(rank_position),
         integrity_consent = VALUES(integrity_consent),
         resume_text = VALUES(resume_text),
         resume_insights = VALUES(resume_insights),
         analysis = VALUES(analysis),
         registered_at = VALUES(registered_at),
         completed_at = VALUES(completed_at),
         updated_at = VALUES(updated_at)`,
      [
        candidate.id,
        candidate.sessionId || null,
        candidate.name || 'Candidate',
        candidate.email || '',
        candidate.status || 'registered',
        candidate.overallScore !== undefined ? candidate.overallScore : null,
        candidate.rank !== undefined ? candidate.rank : null,
        candidate.integrityConsent !== false ? 1 : 0,
        candidate.resumeText || null,
        JSON.stringify(candidate.resumeInsights || null),
        JSON.stringify(candidate.analysis || null),
        candidate.registeredAt ? new Date(candidate.registeredAt) : null,
        candidate.completedAt ? new Date(candidate.completedAt) : null,
        candidate.createdAt ? new Date(candidate.createdAt) : now(),
        now(),
      ]
    );

    // 2. Upsert candidate responses into responses table
    const responses = Array.isArray(candidate.responses)
      ? candidate.responses
      : Array.isArray(candidate.answers)
      ? candidate.answers
      : [];

    for (let idx = 0; idx < responses.length; idx += 1) {
      const r = responses[idx];
      const respId = r.id || `resp_${candidate.id}_${idx + 1}`;

      await conn.execute(
        `INSERT INTO responses (id, candidate_id, question_id, question_text, audio_url, video_url, transcript, relevance_score, accuracy_score, confidence_score, keyword_match_score, strengths, improvements, analysis, overall_response_score, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           question_id = VALUES(question_id),
           question_text = VALUES(question_text),
           audio_url = VALUES(audio_url),
           video_url = VALUES(video_url),
           transcript = VALUES(transcript),
           relevance_score = VALUES(relevance_score),
           accuracy_score = VALUES(accuracy_score),
           confidence_score = VALUES(confidence_score),
           keyword_match_score = VALUES(keyword_match_score),
           strengths = VALUES(strengths),
           improvements = VALUES(improvements),
           analysis = VALUES(analysis),
           overall_response_score = VALUES(overall_response_score)`,
        [
          respId,
          candidate.id,
          r.questionId || null,
          r.questionText || null,
          r.audioUrl || null,
          r.videoUrl || null,
          r.transcript || '',
          r.relevance !== undefined ? r.relevance : null,
          r.accuracy !== undefined ? r.accuracy : null,
          r.confidence !== undefined ? r.confidence : null,
          r.keywordMatch !== undefined ? r.keywordMatch : null,
          JSON.stringify(r.strengths || []),
          JSON.stringify(r.improvements || []),
          JSON.stringify(r.analysis || null),
          r.overallScore !== undefined ? r.overallScore : null,
          now(),
        ]
      );
    }

    // 3. Upsert integrity events into integrity_events table
    const integrityEvents = Array.isArray(candidate.integrityEvents) ? candidate.integrityEvents : [];
    for (let idx = 0; idx < integrityEvents.length; idx += 1) {
      const e = integrityEvents[idx];
      const eventId = e.id || `event_${candidate.id}_${idx + 1}`;

      await conn.execute(
        `INSERT INTO integrity_events (id, candidate_id, event_type, timestamp_ms, confidence, bounding_box, penalty_weight, reverified, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           event_type = VALUES(event_type),
           timestamp_ms = VALUES(timestamp_ms),
           confidence = VALUES(confidence),
           bounding_box = VALUES(bounding_box),
           penalty_weight = VALUES(penalty_weight),
           reverified = VALUES(reverified)`,
        [
          eventId,
          candidate.id,
          e.eventType || e.type || 'unknown_event',
          e.timestamp || Date.now(),
          e.confidence !== undefined ? e.confidence : 1.0,
          JSON.stringify(e.boundingBox || null),
          e.penaltyWeight || 0,
          e.reverified ? 1 : 0,
          now(),
        ]
      );
    }

    await conn.commit();
    return await buildCandidateObject(db, { id: candidate.id, ...candidate });
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

const listCandidates = async (sessionId) => {
  const db = await getMysqlPool();
  if (!db) return [];
  const [rows] = sessionId
    ? await db.execute('SELECT * FROM candidates WHERE session_id = ? ORDER BY updated_at DESC', [sessionId])
    : await db.execute('SELECT * FROM candidates ORDER BY updated_at DESC');

  const result = [];
  for (const row of rows) {
    result.push(await buildCandidateObject(db, row));
  }
  return result;
};

const patchCandidate = async (id, updates) => {
  const db = await getMysqlPool();
  if (!db || !id) return null;
  const [rows] = await db.execute('SELECT * FROM candidates WHERE id = ? LIMIT 1', [id]);
  if (!rows[0]) return null;
  const existing = await buildCandidateObject(db, rows[0]);
  const next = { ...existing, ...(updates || {}) };
  return putCandidate(next);
};

module.exports = {
  mysqlConfigured,
  getMysqlPool,
  getSessionByLink,
  listSessions,
  putSession,
  patchSession,
  deleteSession,
  putCandidate,
  listCandidates,
  patchCandidate,
};
