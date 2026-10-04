# AI Interview Platform Diagrams

## Interview flow sequence diagram

```mermaid
sequenceDiagram
    autonumber
    actor Interviewer
    actor Candidate
    participant UI as React Web App
    participant API as Interview API
    participant Store as Session/Candidate Store
    participant AI as AI Analysis Service
    participant Integrity as Integrity Verification Service

    Interviewer->>UI: Create interview session
    UI->>API: POST /sessions
    API->>Store: Upsert session and questions
    Store-->>API: Saved session
    API-->>UI: Session link

    Candidate->>UI: Open interview link
    UI->>API: GET /session-by-link?link=...
    API->>Store: Find session by link
    Store-->>API: Session and question set
    API-->>UI: Interview details

    Candidate->>UI: Submit registration and consent
    UI->>API: POST /candidates
    API->>Store: Upsert registered candidate
    Store-->>API: Candidate id
    API-->>UI: Registration confirmed

    loop For each interview question
        UI->>Candidate: Present AI avatar question
        Candidate->>UI: Speak answer
        UI->>UI: Transcribe speech and capture integrity signals
        UI->>AI: POST /analyze-response
        AI-->>UI: Score, skills, strengths, improvements
        UI->>UI: Store response with analysis

        opt Integrity batch interval elapsed
            UI->>Integrity: POST /integrity/events with events and sampled frames
            Integrity-->>UI: Server events and discrepancy score
            UI->>UI: Recalculate trust score
        end
    end

    UI->>UI: Calculate interview summary and overall score
    UI->>API: PATCH /candidates?id=...
    API->>Store: Save responses, analysis, integrity, completed status
    Store-->>API: Completed candidate
    API-->>UI: Completion confirmed
    UI-->>Candidate: Show interview completion screen

    Interviewer->>UI: Open candidate results
    UI->>API: GET /candidates?sessionId=...
    API->>Store: Load candidates for session
    Store-->>API: Candidate results
    API-->>UI: Scores, responses, and integrity review status
```

## Entity relationship diagram

```mermaid
flowchart TB
    %% --- STYLE DEFINITIONS ---
    classDef entity fill:#fff,stroke:#000,stroke-width:2px,color:#000,font-weight:bold
    classDef attribute fill:#fff,stroke:#000,stroke-width:1px,color:#000
    classDef relationship fill:#fff,stroke:#000,stroke-width:1px,color:#000
    
    %% --- ENTITIES (Rectangles) ---
    I[INTERVIEWER]:::entity
    S[SESSION]:::entity
    Q[QUESTION]:::entity
    C[CANDIDATE]:::entity
    R[RESPONSE]:::entity
    E[INTEGRITY_EVENT]:::entity

    %% --- ATTRIBUTES (Ovals) ---
    %% Interviewer Attributes
    I_pk([PK id]):::attribute
    I_email([UK email]):::attribute
    I_name([name]):::attribute

    %% Session Attributes
    S_pk([PK id]):::attribute
    S_fk([FK interviewer_id]):::attribute
    S_link([UK link]):::attribute
    S_title([title]):::attribute

    %% Question Attributes
    Q_pk([PK id]):::attribute
    Q_fk([FK session_id]):::attribute
    Q_text([text]):::attribute
    Q_type([type]):::attribute

    %% Candidate Attributes
    C_pk([PK id]):::attribute
    C_fk([FK session_id]):::attribute
    C_email([email]):::attribute
    C_score([overall_score]):::attribute

    %% Response Attributes
    R_pk([PK id]):::attribute
    R_candidate([FK candidate_id]):::attribute
    R_question([FK question_id]):::attribute
    R_transcript([transcript]):::attribute
    R_score([overall_response_score]):::attribute

    %% Integrity Event Attributes
    E_pk([PK id]):::attribute
    E_fk([FK candidate_id]):::attribute
    E_type([event_type]):::attribute
    E_confidence([confidence]):::attribute

    %% --- RELATIONSHIPS (Diamonds) ---
    Rel_Creates{Creates}:::relationship
    Rel_Contains{Contains}:::relationship
    Rel_Receives{Receives}:::relationship
    Rel_Submits{Submits}:::relationship
    Rel_Evaluates{Evaluates}:::relationship
    Rel_Generates{Generates}:::relationship

    %% --- CONNECTIONS: ENTITIES TO RELATIONSHIPS ---
    I --- Rel_Creates --- S
    S --- Rel_Contains --- Q
    S --- Rel_Receives --- C
    C --- Rel_Submits --- R
    Q --- Rel_Evaluates --- R
    C --- Rel_Generates --- E

    %% --- CONNECTIONS: ENTITIES TO ATTRIBUTES ---
    I --- I_pk
    I --- I_email
    I --- I_name

    S --- S_pk
    S --- S_fk
    S --- S_link
    S --- S_title

    Q --- Q_pk
    Q --- Q_fk
    Q --- Q_text
    Q --- Q_type

    C --- C_pk
    C --- C_fk
    C --- C_email
    C --- C_score

    R --- R_pk
    R --- R_candidate
    R --- R_question
    R --- R_transcript
    R --- R_score

    E --- E_pk
    E --- E_fk
    E --- E_type
    E --- E_confidence
```

### Storage note

This Chen-style ERD uses rectangles for entities, ovals for attributes, and diamonds for relationships. The MySQL adapter creates six normalized tables. `sessions`, `questions`, `candidates`, `responses`, and `integrity_events` use real foreign keys with cascade rules. JSON attributes remain marked with `JSON`, and `question_id` in `responses` is nullable.
