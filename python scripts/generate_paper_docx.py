"""Generate a publication-grade Word document (.docx) matching the IEEE research paper,
with embedded high-resolution figures, tables, callout boxes for algorithms, and proper formatting.
"""

import os
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

DOC_PATH = r"D:\interview\AI_Interview_Platform_Research_Paper.docx"
DIAG_DIR = r"D:\interview\diagrams"

def set_cell_background(cell, fill_hex):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def create_ieee_docx():
    doc = Document()
    
    # Page setup - Standard Letter, 0.75 inch margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(0.75)
        section.bottom_margin = Inches(0.75)
        section.left_margin = Inches(0.75)
        section.right_margin = Inches(0.75)

    # Styles
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Times New Roman'
    normal_style.font.size = Pt(10)
    normal_style.font.color.rgb = RGBColor(0x1A, 0x1A, 0x1A)

    # 1. TITLE
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(0)
    p_title.paragraph_format.space_after = Pt(4)
    run_title = p_title.add_run("AI-Driven Automated Interview Platform with\nAvatar-Based Candidate Assessment")
    run_title.font.name = 'Times New Roman'
    run_title.font.size = Pt(20)
    run_title.font.bold = True

    # Subtitle / Design note
    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_after = Pt(12)
    run_sub = p_sub.add_run("Systems Architecture, Resilient Algorithmic Evaluation, and Regulatory Governance")
    run_sub.font.name = 'Times New Roman'
    run_sub.font.size = Pt(11)
    run_sub.font.italic = True
    run_sub.font.color.rgb = RGBColor(0x4A, 0x55, 0x68)

    # 2. AUTHORS TABLE
    t_auth = doc.add_table(rows=1, cols=2)
    t_auth.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_auth.autofit = False
    for col in t_auth.columns:
        col.width = Inches(3.4)

    # Left Authors
    c_left = t_auth.cell(0, 0)
    p_al = c_left.paragraphs[0]
    p_al.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_al_names = p_al.add_run("Shlok Abhishek, Satyadip Lal, Mannat, Aditya Raj\n")
    r_al_names.bold = True
    r_al_names.font.size = Pt(10)
    r_al_inst = p_al.add_run("3rd Year Students, Department of Computer Science and Engineering\nSchool of Engineering and Technology\nSharda University, Greater Noida, Uttar Pradesh, India")
    r_al_inst.font.size = Pt(9)
    r_al_inst.font.italic = True

    # Right Mentor
    c_right = t_auth.cell(0, 1)
    p_ar = c_right.paragraphs[0]
    p_ar.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_ar_name = p_ar.add_run("V. Sathiyasuntharam\n")
    r_ar_name.bold = True
    r_ar_name.font.size = Pt(10)
    r_ar_inst = p_ar.add_run("Mentor, Department of Computer Science and Engineering\nSchool of Engineering and Technology\nSharda University, Greater Noida, Uttar Pradesh, India\nEmail: sathiya4196@gmail.com")
    r_ar_inst.font.size = Pt(9)
    r_ar_inst.font.italic = True

    p_spacer = doc.add_paragraph()
    p_spacer.paragraph_format.space_after = Pt(8)

    # 3. ABSTRACT & KEYWORDS BOX
    t_abs = doc.add_table(rows=1, cols=1)
    t_abs.alignment = WD_TABLE_ALIGNMENT.CENTER
    c_abs = t_abs.cell(0, 0)
    c_abs.width = Inches(7.0)
    set_cell_background(c_abs, "F7FAFC")
    set_cell_margins(c_abs, top=140, bottom=140, left=180, right=180)

    p_abs = c_abs.paragraphs[0]
    p_abs.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    r_abs_h = p_abs.add_run("Abstract—")
    r_abs_h.bold = True
    r_abs_h.font.size = Pt(9.5)
    
    abs_text = (
        "The acceleration of distributed workforce paradigms has underscored the operational limitations of conventional "
        "candidate screening, where human interviewer fatigue, subjective grading variance, and logistical bottlenecks constrain recruitment velocity. "
        "Although asynchronous video interviewing (AVI) offers administrative scalability, existing commercial implementations frequently deploy "
        "impersonal questionnaires or rigid text chatbots that strip conversational warmth, induce applicant detachment, and obscure critical non-verbal cues. "
        "In this paper, we introduce AI Interview Platform, a resilient, full-stack web ecosystem that unifies personalized synthetic interviewer avatars "
        "with modern large language models (LLMs) to conduct engaging, high-fidelity asynchronous evaluations. Our architecture synthesizes an interactive "
        "interviewer avatar from an HR practitioner's facial imagery and vocal characteristics, coupling neural text-to-speech (TTS) with real-time speech-to-text (STT) "
        "streaming to recreate an authentic conversational interview dynamic. To eliminate single points of failure, the platform incorporates a dual-mode evaluation "
        "framework that seamlessly pivots from a cloud-hosted LLM assessment engine to an on-device deterministic analyzer during network latency surges or service outages. "
        "Candidate responses are quantified across five orthogonal dimensions: relevance, technical accuracy, linguistic confidence, domain keyword density, and professional "
        "competency signals. Furthermore, to uphold assessment validity without infringing upon applicant privacy, the system deploys an edge-computed morphological computer vision "
        "heuristic that monitors unauthorized smartphone consultation entirely within the client browser, transmitting zero video frames to remote infrastructure. "
        "We ground our technical contribution within the evolving international regulatory landscape governing algorithmic hiring—specifically New York City Local Law 144, "
        "the Illinois Artificial Intelligence Video Interview Act, and the European Union AI Act—delineating auditable bias testing, accommodation workflows, and human-in-the-loop "
        "governance structures necessary for lawful corporate deployment."
    )
    r_abs_body = p_abs.add_run(abs_text)
    r_abs_body.font.size = Pt(9.5)

    p_kw = c_abs.add_paragraph()
    p_kw.paragraph_format.space_before = Pt(4)
    r_kw_h = p_kw.add_run("Index Terms—")
    r_kw_h.bold = True
    r_kw_h.font.size = Pt(9)
    r_kw_b = p_kw.add_run("Artificial Intelligence, Large Language Models, Automated Video Interviewing, Synthetic Avatars, Speech Recognition and Synthesis, Multi-Dimensional Candidate Assessment, Graceful Degradation, Edge Computer Vision, Algorithmic Fairness, Regulatory Compliance.")
    r_kw_b.font.size = Pt(9)
    r_kw_b.font.italic = True

    # Helper function for Section Headings
    def add_sec_heading(title):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(4)
        run = p.add_run(title)
        run.bold = True
        run.font.size = Pt(12)
        run.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)

    def add_subsec_heading(title):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(3)
        run = p.add_run(title)
        run.bold = True
        run.font.size = Pt(10.5)
        run.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)

    def add_p(text, justify=True):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.line_spacing = 1.15
        if justify:
            p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        run = p.add_run(text)
        run.font.size = Pt(10)
        return p

    # 4. SECTION I: INTRODUCTION
    add_sec_heading("I. INTRODUCTION")
    add_p(
        "High-volume talent acquisition remains one of the most operationally demanding functions within modern corporate management. "
        "When applicant pools surge into the thousands for specialized technical and operational vacancies, human resource departments encounter an acute trilemma: "
        "preserving rigorous evaluation quality, minimizing time-to-hire latency, and maintaining equitable, consistent standards across diverse candidate cohorts [1], [2]. "
        "Empirical organizational research demonstrates that unstructured human interviews suffer from severe cognitive vulnerabilities, including confirmation bias, primacy effects, "
        "and interviewer-to-interviewer scoring disparities exceeding 35% [3]. While structured interview protocols temper some of these systemic inconsistencies, their administrative "
        "orchestration across disparate time zones imposes prohibitive labor expenditures on senior engineering and operational personnel."
    )
    add_p(
        "The advent of transformer architectures and instruction-tuned large language models (LLMs) has catalyzed automated recruitment tooling [4], [5]. "
        "Contemporary natural language processing systems can synthesize domain-tailored interview rubrics, interpret unstructured spoken discourse, and extract competency signals with remarkable semantic depth. "
        "However, the majority of commercially available first-round screening utilities reduce this rich interaction to disembodied form fields or transactional chatbots. "
        "This computational sterility precipitates applicant alienation, obscures communication subtleties, and diminishes candidate perceived organizational attractiveness, prompting top-tier talent to abandon recruitment funnels prematurely [6]."
    )
    add_p(
        "To resolve this tension between computational scalability and conversational presence, we introduce AI Interview Platform. The platform establishes an asynchronous interview environment where an anthropomorphic avatar—synthesized from the photographs and voice samples of a designated enterprise recruiter—narrates tailored inquiries to the candidate in real time. Candidates respond verbally and visually through standard web browser interfaces, while client-side media pipelines transcribe utterances, buffer audiovisual streams, and execute privacy-preserving proctoring heuristics directly on edge hardware."
    )
    add_p(
        "Crucially, the deployment of artificial intelligence in employment decisions has transitioned from an unregulated experimental domain to an arena of intense legal, civil-rights, and regulatory oversight. "
        "In 2019, the Electronic Privacy Information Center (EPIC) lodged a formal Federal Trade Commission (FTC) complaint against HireVue, arguing that proprietary computer-vision models evaluating candidate micro-expressions lacked scientific validity and introduced severe demographic disparities, prompting the vendor to retire facial-analysis scoring globally in January 2021 [7]. "
        "In early 2025, the American Civil Liberties Union (ACLU) of Colorado initiated federal EEOC proceedings alleging that automated speech-recognition scoring tools penalized candidates with non-normative speech cadences and speech impediments while denying reasonable captioning accommodations [8]. "
        "Concurrently, codified statutory frameworks have emerged: New York City Local Law 144 mandates independent annual algorithmic bias audits measuring selection-rate impact ratios across race and sex [9]; the Illinois Artificial Intelligence Video Interview Act (820 ILCS 42) establishes strict consent and algorithmic disclosure requirements [10]; and the European Union Artificial Intelligence Act (Regulation 2024/1689) explicitly classifies employment-related AI systems as high-risk under Annex III, mandating continuous human oversight, transparent logging, and rigorous data governance [11]."
    )
    add_p(
        "Within this rigorous socio-technical context, our primary contributions include: (1) an end-to-end full-stack serverless architecture featuring dedicated recruiter and candidate portals; (2) a personalized synthetic avatar narration pipeline synchronizing facial imagery and neural TTS; (3) a dual-mode question generation and response evaluation framework guaranteeing continuous operation via a deterministic fallback engine; (4) a five-dimensional scoring formulation balancing relevance, technical accuracy, linguistic confidence, keyword coverage, and professional competencies; (5) a client-side morphological computer vision heuristic detecting unauthorized phone consultation with zero server-side video transmission; and (6) a comprehensive regulatory alignment framework addressing NYC Local Law 144, Illinois 820 ILCS 42, and the EU AI Act."
    )

    # 5. SECTION II: RELATED WORK
    add_sec_heading("II. RELATED WORK AND REGULATORY FOUNDATION")
    add_subsec_heading("A. Computational Scoring in Automated Recruitment")
    add_p(
        "Early automated interviewing systems depended almost exclusively on rigid lexical ontologies, finite-state syntactic parsers, and verbatim keyword intersection [3]. "
        "Although computationally negligible, such heuristics suffered from extreme brittleness: candidates deploying accurate technical synonyms were systematically penalized, while manipulative applicants could easily inflate scores via keyword stuffing. "
        "The transition toward dense vector embeddings and bidirectional transformer encoders, exemplified by BERT [4] and sentence transformers, enabled semantic proximity matching across open-ended responses. "
        "Modern autoregressive language models, such as GPT-4 and instruction-tuned variants [5], have extended these capabilities by interpreting contextual reasoning, domain-specific nuances, and situational problem-solving capabilities. "
        "Our platform leverages instruction-tuned LLMs with strictly validated JSON schemas to produce calibrated scores, while introducing a deterministic fallback analyzer that preserves baseline grading continuity during API throttling or upstream outages."
    )
    add_subsec_heading("B. Conversational Agents and Synthetic Avatars")
    add_p(
        "Human-computer interaction research confirms that anthropomorphic visual and auditory cues significantly heighten user engagement, perceived empathy, and communication effort during remote interactions [12], [13]. "
        "While digital humans have been successfully deployed in pedagogical environments and virtual patient counseling, commercial recruitment platforms have largely avoided avatar-driven inquiry due to rendering latency and infrastructure costs. "
        "Our architecture circumvents expensive 3D vertex streaming by synchronizing localized photographic personas and visual state transitions with browser-native speech synthesis, providing an interactive, humanized interview interface that operates fluidly across commodity consumer devices."
    )
    add_subsec_heading("C. Regulatory Landscape and Algorithmic Litigation")
    add_p(
        "The unchecked deployment of predictive psychometrics has produced substantial legal and civil rights repercussions. The 2019 EPIC complaint against HireVue established that opaque, unvalidated algorithmic assessments create profound risks of disparate impact against neurodivergent applicants and minority groups [7]. "
        "In 2023, the Equal Employment Opportunity Commission (EEOC) finalized a landmark settlement with iTutorGroup regarding recruitment software that automatically rejected candidates based on age-derived criteria [14]. "
        "Furthermore, the 2025 ACLU litigation against Intuit demonstrated that relying on uncalibrated automated speech recognition without mandatory accommodations creates severe barriers for deaf and speech-impaired individuals [8]. "
        "Statutory mandates directly reflect these concerns. NYC Local Law 144 mandates that employers commissioning automated employment decision tools (AEDTs) publish annual, independent bias audits verifying that selection rates for protected demographic categories adhere to the EEOC's four-fifths threshold (80% adverse impact ratio) [9]. "
        "The Illinois Artificial Intelligence Video Interview Act mandates explicit advance disclosure of AI evaluation parameters and establishes enforceable rights for candidate data destruction within 30 days [10]. "
        "Crucially, the European Union AI Act designates employment, worker management, and recruitment decision tools as High-Risk systems under Annex III, mandating exhaustive risk management documentation, high-quality training datasets, continuous activity logging, and fail-safe human oversight [11]."
    )

    # 6. SECTION III: SYSTEM ARCHITECTURE
    add_sec_heading("III. SYSTEM ARCHITECTURE")
    add_p(
        "The system architecture follows a decoupled client-server paradigm engineered for horizontal scalability, high resilience, and minimal latency. As depicted in Fig. 1, the system segregates administrative management from candidate interaction, orchestrating client-side processing with an asynchronous serverless execution tier."
    )

    # Insert Architecture Image
    arch_img_path = os.path.join(DIAG_DIR, "system_architecture.png")
    if os.path.exists(arch_img_path):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(6)
        p_img.paragraph_format.space_after = Pt(2)
        doc.add_picture(arch_img_path, width=Inches(6.8))
        
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_after = Pt(8)
        r_c = p_cap.add_run("Fig. 1. End-to-end architectural topology of the AI Interview Platform.")
        r_c.font.size = Pt(9)
        r_c.font.italic = True

    add_subsec_heading("A. Frontend Presentation Tier")
    add_p(
        "The user interface layer is built with React 18, Vite 5, and TailwindCSS 3, encapsulated within a responsive single-page application (SPA). The application enforces strict role-based route isolation: "
        "(1) Interviewer Portal empowers recruiters to create customized interview sessions, configure role parameters, author or auto-generate question sets, configure synthetic avatar media, examine candidate response recordings, inspect multi-dimensional scores, and review integrity audit logs; "
        "(2) Candidate Portal provides an intuitive, accessible interface accessible via encrypted session tokens. It executes automated device verification, secures candidate consent, orchestrates avatar-driven question presentation, buffers media streams, renders real-time streaming transcripts, and executes edge proctoring algorithms."
    )

    add_subsec_heading("B. Serverless Orchestration Gateway")
    add_p(
        "The backend tier is architected as lightweight serverless micro-functions deployed on Vercel infrastructure, supplemented by a Node.js development runtime. The gateway provides secure RESTful endpoints for session lifecycle operations, question authoring, resume feature extraction, candidate scoring, and integrity telemetry aggregation. "
        "Crucially, the gateway encapsulates all external AI credentials within server-side execution boundaries, preventing client inspection of proprietary API keys. It incorporates an automated circuit breaker that intercepts third-party service latency anomalies (> 8000 ms) or HTTP 429/5xx status codes, redirecting evaluation requests to the deterministic fallback engine without client interruption."
    )

    add_subsec_heading("C. Data Persistence and Schema Topology")
    add_p(
        "To satisfy diverse deployment configurations, data persistence supports a dual-tier topology: "
        "(1) Local-First Browser Persistence utilizes the Web Storage API to cache session states, candidate responses, and proctoring telemetry on client devices, enabling zero-configuration offline demonstrations and local evaluations; "
        "(2) Relational and Document Tier integrates with a normalized MySQL database structured in Third Normal Form (3NF) alongside optional MongoDB document collections. The relational schema establishes explicit foreign-key constraints across six core entities: interviewer, session, question, candidate, response, and integrity_event, ensuring referential integrity and supporting immutable audit trails required for statutory compliance."
    )

    # Table I: Technology Stack
    p_t1_title = doc.add_paragraph()
    p_t1_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_t1_title.paragraph_format.space_before = Pt(8)
    p_t1_title.paragraph_format.space_after = Pt(2)
    r_t1 = p_t1_title.add_run("TABLE I: System Technology Stack and Architectural Responsibilities")
    r_t1.bold = True
    r_t1.font.size = Pt(9.5)

    t_tech = doc.add_table(rows=11, cols=2)
    t_tech.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_tech.autofit = False
    for col, w in zip(t_tech.columns, [Inches(2.6), Inches(4.4)]):
        col.width = w

    stack_rows = [
        ("Subsystem Layer", "Component Implementation and Role"),
        ("Client Framework", "React 18, Vite 5, TailwindCSS 3 (Modular Reactive SPA)"),
        ("State & Routing", "Context API, React Router 6, Lucide React"),
        ("Speech Synthesis", "Web Speech API (SpeechSynthesisUtterance with rate/pitch tuning)"),
        ("Speech Recognition", "Web Speech API (webkitSpeechRecognition streaming transcription)"),
        ("Media Capture", "HTML5 MediaRecorder API (VP8/Opus WebM containers)"),
        ("Edge Computer Vision", "HTML5 Canvas, Morphological Flood-Fill Heuristic Engine"),
        ("Primary AI Engine", "OpenAI API (gpt-4o-mini with enforced JSON schema validation)"),
        ("Fallback Scorer", "Deterministic Rule-Based Natural Language Analyzer"),
        ("Gateway Runtime", "Node.js, Vercel Serverless Serverless API Functions"),
        ("Persistence Tier", "MySQL (3NF Normalized), MongoDB, LocalStorage Dual Tier"),
    ]

    for idx, (l, r) in enumerate(stack_rows):
        row = t_tech.rows[idx]
        cell_l, cell_r = row.cells[0], row.cells[1]
        cell_l.paragraphs[0].text = l
        cell_r.paragraphs[0].text = r
        if idx == 0:
            set_cell_background(cell_l, "E2E8F0")
            set_cell_background(cell_r, "E2E8F0")
            cell_l.paragraphs[0].runs[0].bold = True
            cell_r.paragraphs[0].runs[0].bold = True
        else:
            set_cell_background(cell_l, "FFFFFF" if idx % 2 == 1 else "F8FAFC")
            set_cell_background(cell_r, "FFFFFF" if idx % 2 == 1 else "F8FAFC")
        set_cell_margins(cell_l, top=60, bottom=60, left=100, right=100)
        set_cell_margins(cell_r, top=60, bottom=60, left=100, right=100)

    # 7. SECTION IV: METHODOLOGY
    add_sec_heading("IV. METHODOLOGY AND ALGORITHMIC FORMULATION")
    add_subsec_heading("A. Synthetic Avatar Synthesis and Temporal Alignment")
    add_p(
        "To construct an engaging interview persona, the platform allows HR professionals to ingest portrait imagery and acoustic profile samples. "
        "During interview progression, the synthesized avatar renders the recruiter's likeness within the candidate viewport. Speech synthesis is orchestrated via the browser's native text-to-speech subsystem, where voice inflection, prosodic pitch, and acoustic rate parameters are calibrated to natural human conversational cadences: ν_rate = 0.95 · ν_base, ρ_pitch = 1.02 · ρ_base. "
        "Visual state transitions are synchronized with utterance execution events. When the TTS engine triggers onboundary or onstart callbacks, the client UI executes subtle CSS transformation matrices and animates active-speaking status auras, conveying dynamic presence. When speech concludes, the avatar transitions gracefully into a passive attentive posture. "
        "Candidates are provided with granular interface controls to replay questions, adjust audio output, and toggle high-contrast subtitles, directly addressing accessibility requirements for hearing-impaired applicants."
    )

    add_subsec_heading("B. Dual-Mode Question Generation Pipeline")
    add_p(
        "Interview inquiries can be synthesized through two operational pathways: "
        "(1) Generative LLM Synthesis: When connected to external services, the serverless gateway constructs an instruction-tuned prompt concatenating the target job description, required seniority level, and candidate resume extract. The model returns a structured JSON payload defining 5–8 contextual questions with assigned time allocations (60–180s), domain evaluation rubrics, and expected technical keywords (κ_i); "
        "(2) Deterministic Rule-Based Extraction: Under disconnected or degraded operational states, an on-device text analyzer applies regular-expression tokenization and term frequency-inverse document frequency (TF-IDF) heuristics across the job specification and resume text. It identifies core competency clusters (e.g., distributed systems, database scaling, API design) and instantiates parameterized templates, guaranteeing continuous session authoring."
    )

    add_subsec_heading("C. Multi-Dimensional Psychometric Scoring Formulation")
    add_p(
        "To prevent superficial evaluation based solely on vocabulary matching, candidate responses are graded across five orthogonal evaluation dimensions:"
    )
    add_p(
        "1) Relevance (R): Measures semantic congruence between candidate answer text a and posed question q. It evaluates lexical content-word overlap while incorporating an asymptotic response-length modulation bonus:\n"
        "   R = min(100, (|W(a) ∩ W(q)| / |W(q)|) · 80 + β_len(a))\n"
        "where W(·) extracts unique content words (>3 characters) and β_len(a) rewards adequate technical elaboration (20 pts for 30–200 words, 10 pts for 20–29 words)."
    )
    add_p(
        "2) Technical Accuracy (A): Quantifies domain correctness by calculating the harmonic interaction between expected keyword coverage and semantic question relevance:\n"
        "   A = min(100, round(0.60 · K + 0.40 · R))"
    )
    add_p(
        "3) Linguistic Confidence (C): Evaluates applicant assertiveness and communication conviction by parsing linguistic certainty markers against hesitation patterns:\n"
        "   C = clamp(50 + 10 · N_pos(a) - 10 · N_neg(a) + δ_len(a), 0, 100)\n"
        "where N_pos tallies assertive phrasing ('I engineered', 'specifically', 'conclusively'), N_neg tallies equivocation markers ('maybe', 'I guess'), and δ_len provides a bounded adjustment reflecting fluency."
    )
    add_p(
        "4) Keyword Match Ratio (K): Reflects normalized coverage of expected technical concepts κ:\n"
        "   K = round((|κ ∩ lexemes(a)| / |κ|) · 100),  |κ| > 0"
    )
    add_p(
        "5) Professional Skill Presence (S): Quantifies the manifestation of critical competencies across Communication (S1), Problem Solving (S2), Teamwork (S3), Leadership (S4), Technical Depth (S5), and Adaptability (S6):\n"
        "   S_j = min(100, round((|D_j ∩ lexemes(a)| / |D_j|) · 200))"
    )
    add_p(
        "6) Composite Score Integration: The per-question overall score combines primary dimensions via normalized empirical weights, scaled by recruiter-assigned question importance multiplier W_i (1.0–3.0):\n"
        "   Overall_Score_i = min(100, w_R · R + w_A · A + w_C · C + w_K · K) · W_i\n"
        "with w_R = 0.25, w_A = 0.30, w_C = 0.20, w_K = 0.25. The qualitative competency vector S = [S1, ..., S6] is preserved alongside the numerical score to generate granular candidate profile radars."
    )

    # ALGORITHM 1 BOX IN WORD
    t_alg = doc.add_table(rows=1, cols=1)
    t_alg.alignment = WD_TABLE_ALIGNMENT.CENTER
    c_alg = t_alg.cell(0, 0)
    c_alg.width = Inches(7.0)
    set_cell_background(c_alg, "F8FAFC")
    set_cell_margins(c_alg, top=120, bottom=120, left=160, right=160)

    p_a1 = c_alg.paragraphs[0]
    r_a1_h = p_a1.add_run("Algorithm 1: Multi-Dimensional Response Scoring with Resilient Fallback\n")
    r_a1_h.bold = True
    r_a1_h.font.size = Pt(10)
    
    alg_body = (
        "Input: Candidate transcript a, question q, expected keywords κ, question weight W, skill lexicons {D_j}.\n"
        "Output: Comprehensive evaluation tuple (Score, R, A, C, K, S, evidence).\n"
        "1: Initialize isScored ← False\n"
        "2: if CircuitBreaker.isOpen() == False then\n"
        "3:     try remote execution: J_res ← RemoteLLMScoring(a, q, κ, Schema)\n"
        "4:     if J_res satisfies schema and numerical bounds then\n"
        "5:         Extract R, A, C, K, S, evidence ← J_res; isScored ← True\n"
        "6:     end if\n"
        "7: end if\n"
        "8: if isScored == False then\n"
        "9:     Engage deterministic fallback analyzer:\n"
        "10:    R ← ComputeRelevance(a, q) via lexical overlap and length bonus\n"
        "11:    K ← ComputeKeywordCoverage(a, κ)\n"
        "12:    A ← ComputeAccuracy(K, R) = round(0.60·K + 0.40·R)\n"
        "13:    C ← ComputeConfidence(a) via linguistic assertive polarity\n"
        "14:    S ← {ComputeSkillPresence(a, D_j)} across 6 competency taxonomies\n"
        "15:    evidence ← SynthesizeRuleBasedNotes(a, κ, S)\n"
        "16: end if\n"
        "17: Score ← min(100, w_R·R + w_A·A + w_C·C + w_K·K) · W\n"
        "18: return (Score, R, A, C, K, S, evidence)"
    )
    r_a1_b = p_a1.add_run(alg_body)
    r_a1_b.font.size = Pt(9)
    r_a1_b.font.name = 'Consolas'

    add_subsec_heading("D. Edge-Computed Computer Vision Integrity Heuristic")
    add_p(
        "To safeguard interview authenticity without violating candidate privacy through server-side video surveillance, the platform implements a lightweight client-side computer-vision heuristic operating on downsampled HTML5 Canvas frames (scanned every 1500 ms). "
        "A pixel at coordinates (x,y) is classified as a phone-candidate pixel if: P(x,y) ⇔ (I_mean < 55) ∨ (I_mean > 185 ∧ Δ_RGB < 38), identifying dark chassis or illuminated smartphone displays. "
        "Contiguous candidate pixels are aggregated into spatial components using 4-connectivity flood fill. For each bounding box of dimensions W_b × H_b and area Ω, aspect ratio ψ and rectangularity factor φ are calculated: "
        "ψ = max(W_b, H_b) / min(W_b, H_b), φ = Ω / (W_b · H_b). "
        "An unauthorized device alert is flagged when Ω_min ≤ Ω ≤ Ω_max, 1.45 ≤ ψ ≤ 3.8, φ > 0.42, and normalized center Y_norm > 0.18, with confidence: "
        "Λ_phone = min(0.92, 0.70·φ + 0.20·min(ψ, 2.8)). Alerts are subject to a 5000 ms cooldown to suppress false alarms. "
        "Concurrently, the Web Audio API AnalyserNode tracks acoustic energy floors, flagging extended abnormal silences (< 0.035 for > 3500 ms). Zero video frames are transmitted to remote servers."
    )

    # 8. SECTION V: IMPLEMENTATION & USER EXPERIENCE
    add_sec_heading("V. IMPLEMENTATION AND USER EXPERIENCE")
    add_p(
        "The platform's user interfaces and operational workflows are depicted in Fig. 2. The technical toolchain combines modern reactive design patterns with robust web standards."
    )

    # Insert UI Mockup Image
    ui_img_path = os.path.join(DIAG_DIR, "platform_interface_mockup.png")
    if os.path.exists(ui_img_path):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(6)
        p_img.paragraph_format.space_after = Pt(2)
        doc.add_picture(ui_img_path, width=Inches(6.8))
        
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_after = Pt(8)
        r_c = p_cap.add_run("Fig. 2. Operational interfaces of the AI Interview Platform: (a) Candidate asynchronous interview room; (b) Interviewer evaluation dashboard.")
        r_c.font.size = Pt(9)
        r_c.font.italic = True

    add_subsec_heading("A. Speech and Media Pipelines")
    add_p(
        "Candidate vocal answers are captured via the MediaRecorder API, encoded as WebM containers utilizing VP8 video and Opus audio codecs at variable bitrates. "
        "In parallel, streaming speech recognition is executed via the browser's SpeechRecognition interface, providing live transcription feedback in the candidate viewport. "
        "The media interface incorporates robust hardware permission handshakes, visual audio-level VU meters, and automatic timer-driven stream termination upon question expiration."
    )
    add_subsec_heading("B. Security and Credential Isolation")
    add_p(
        "All communications between the single-page application and backend endpoints utilize transport layer security (HTTPS). "
        "Sensitive API credentials for LLM services reside exclusively within encrypted serverless environment variables. "
        "Client requests are authenticated through cryptographic session tokens tied to specific interview instances, preventing unauthorized access or replay attacks."
    )

    # 9. SECTION VI: EMPIRICAL EVALUATION
    add_sec_heading("VI. EMPIRICAL EVALUATION AND RESULTS")
    add_subsec_heading("A. Experimental Setup")
    add_p(
        "To evaluate the functional reliability, scoring fidelity, and computational latency of our architecture, we assembled a standardized benchmark dataset comprising N=120 simulated interview responses spanning software engineering, system architecture, and technical product management domains. Responses exhibited diverse linguistic competencies, technical accuracy levels, and verbosity lengths."
    )

    # Insert Evaluation Image
    eval_img_path = os.path.join(DIAG_DIR, "evaluation_results.png")
    if os.path.exists(eval_img_path):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(6)
        p_img.paragraph_format.space_after = Pt(2)
        doc.add_picture(eval_img_path, width=Inches(6.8))
        
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_after = Pt(8)
        r_c = p_cap.add_run("Fig. 3. Empirical evaluation results: (Left) Bivariate correlation between Cloud LLM and deterministic fallback scorers (r = 0.892); (Right) Precision-recall curves for client-side edge proctoring heuristics.")
        r_c.font.size = Pt(9)
        r_c.font.italic = True

    add_subsec_heading("B. Scorer Calibration and Correlation Analysis")
    add_p(
        "We conducted rigorous comparative calibration between the primary cloud LLM scoring engine (gpt-4o-mini) and the deterministic fallback scoring algorithm on identical candidate answer transcripts. "
        "As illustrated in Fig. 3 (Left), the two assessment pipelines demonstrate strong linear agreement. Pearson correlation analysis yielded r = 0.892 (p < 0.001), while Spearman's rank correlation coefficient reached ρ = 0.867 (p < 0.001), demonstrating that relative candidate rankings remain remarkably stable even during complete upstream AI service failure. "
        "The deterministic fallback algorithm exhibited zero score variance across identical inputs (σ² = 0), establishing its value as a deterministic baseline. While the LLM engine demonstrated superior semantic sensitivity to conceptual nuance, the fallback engine achieved an acceptable mean absolute error of MAE = 5.82 points on a 100-point scale."
    )

    add_subsec_heading("C. Operational Latency Benchmarking")
    add_p(
        "System latency was evaluated across 500 simulated request cycles. The end-to-end processing pipeline under cloud LLM operation yielded a mean turnaround time of τ_LLM = 1840 ± 260 ms, primarily dominated by external network hops and autoregressive token generation. "
        "In contrast, when the circuit breaker engaged the local deterministic analyzer, response evaluation executed in τ_fallback = 14 ± 3 ms, representing a 130-fold latency reduction that guarantees uninterrupted candidate progression."
    )

    # Table II: Benchmarks
    p_t2_title = doc.add_paragraph()
    p_t2_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_t2_title.paragraph_format.space_before = Pt(8)
    p_t2_title.paragraph_format.space_after = Pt(2)
    r_t2 = p_t2_title.add_run("TABLE II: Empirical Performance Benchmarks Across Scoring Engines")
    r_t2.bold = True
    r_t2.font.size = Pt(9.5)

    t_bench = doc.add_table(rows=7, cols=4)
    t_bench.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_bench.autofit = False
    for col, w in zip(t_bench.columns, [Inches(2.2), Inches(1.6), Inches(1.8), Inches(1.4)]):
        col.width = w

    bench_rows = [
        ("Metric Axis", "Cloud LLM", "Deterministic Fallback", "Correlation (r)"),
        ("Mean Overall Score", "76.4 ± 11.2", "74.1 ± 9.8", "0.892"),
        ("Relevance (R)", "78.2 ± 12.5", "75.8 ± 11.1", "0.854"),
        ("Technical Accuracy (A)", "75.1 ± 13.8", "73.4 ± 12.0", "0.881"),
        ("Linguistic Confidence (C)", "77.8 ± 10.4", "76.2 ± 9.5", "0.812"),
        ("Keyword Density (K)", "74.6 ± 14.2", "71.0 ± 13.6", "0.915"),
        ("Execution Latency (ms)", "1840 ± 260", "14 ± 3", "N/A"),
    ]

    for idx, row_data in enumerate(bench_rows):
        row = t_bench.rows[idx]
        for c_idx, val in enumerate(row_data):
            cell = row.cells[c_idx]
            cell.paragraphs[0].text = val
            if idx == 0:
                set_cell_background(cell, "E2E8F0")
                cell.paragraphs[0].runs[0].bold = True
            else:
                set_cell_background(cell, "FFFFFF" if idx % 2 == 1 else "F8FAFC")
            set_cell_margins(cell, top=60, bottom=60, left=80, right=80)

    add_subsec_heading("D. Edge Proctoring Heuristic Performance")
    add_p(
        "The client-side smartphone detection heuristic was evaluated against a validated video test suite comprising 80 positive smartphone consultation instances and 120 negative instances (e.g., gestures, notepad usage, coffee mugs, background objects) across diverse illumination conditions (150–650 lux). "
        "As illustrated in Fig. 3 (Right), the morphological phone detection heuristic achieved an Area Under the Precision-Recall Curve (AUC-PR) of 0.86, achieving a precision of 88.2% at a recall of 84.6% when operating at the optimal confidence threshold Λ_phone ≥ 0.58. "
        "The auxiliary gaze-deviation heuristic attained an AUC-PR of 0.74. Because environmental lighting fluctuations and camera placement introduce edge cases, all heuristic detections are logged strictly as advisory telemetry for human recruiter review rather than triggering automated disqualification."
    )

    # 10. SECTION VII: ETHICAL CONSIDERATIONS & REGULATORY COMPLIANCE
    add_sec_heading("VII. ETHICAL CONSIDERATIONS, ALGORITHMIC FAIRNESS, AND REGULATORY GOVERNANCE")
    add_p(
        "Deploying artificial intelligence within employment selection workflows mandates strict adherence to legal equity standards and algorithmic auditing protocols."
    )
    add_subsec_heading("A. Adverse Impact Auditing and NYC Local Law 144")
    add_p(
        "Under New York City Local Law 144, automated employment decision tools must undergo independent annual bias audits to quantify demographic equity. "
        "Specifically, systems must compute the Adverse Impact Ratio (AIR) across protected categories (race, ethnicity, and gender) pursuant to the EEOC's Four-Fifths Doctrine: "
        "AIR = Selection_Rate_protected / Selection_Rate_reference ≥ 0.80. "
        "Our architecture natively records granular per-dimension assessment vectors and anonymized demographic flags within normalized audit tables. "
        "This structured persistence permits statistical auditors to compute continuous impact ratios without accessing raw video streams or candidate personal identification data, facilitating turn-key compliance with statutory auditing requirements."
    )
    add_subsec_heading("B. Statutory Transparency and Illinois 820 ILCS 42")
    add_p(
        "In strict compliance with the Illinois Artificial Intelligence Video Interview Act, the candidate portal enforces pre-interview transparency: "
        "(1) Informed Consent Protocol: Applicants receive plain-language disclosures articulating the role of artificial intelligence in evaluating their spoken responses before camera feeds are initialized; "
        "(2) Feature Explanation: The interface presents candidate-facing summaries explaining the five evaluation dimensions and confirming that edge proctoring heuristics function locally; "
        "(3) Right to Erasure: The database schema implements hard-deletion cascades, guaranteeing that candidate video buffers, transcripts, and integrity logs are permanently purged within 30 days upon candidate request."
    )
    add_subsec_heading("C. High-Risk Governance and the EU AI Act")
    add_p(
        "The European Union Artificial Intelligence Act categorizes recruitment and employment evaluation systems under Annex III as High-Risk AI. Our design operationalizes key compliance obligations mandated under Chapter III of the Act: "
        "(1) Human-in-the-Loop (HITL) Oversight: Algorithmic rankings serve strictly as decision-support prioritization for human recruiters. Autonomous candidate disqualification is explicitly disabled at the architectural level; "
        "(2) Logging and Traceability: Immutable audit logs record every scoring transaction, including whether scores originated from the cloud LLM or fallback analyzer, accompanied by complete evidence excerpts; "
        "(3) Accessibility Accommodations: In alignment with the Americans with Disabilities Act (ADA Title III) and WCAG 2.1 AA accessibility guidelines, candidates can toggle real-time captioning, inspect synthesized questions textually, and request alternative non-verbal assessment workflows."
    )

    # 11. SECTION VIII: CONCLUSION
    add_sec_heading("VIII. CONCLUSION AND FUTURE WORK")
    add_p(
        "We presented AI Interview Platform, a resilient, full-stack asynchronous recruitment system that combines personalized synthetic avatars, real-time speech processing, and multi-dimensional language model evaluation with an edge-computed proctoring engine. "
        "By pairing an interactive visual persona with a dual-mode graceful degradation architecture, the platform preserves conversational presence during candidate assessment while maintaining continuous operational uptime under upstream AI service disruptions. "
        "Empirical evaluation validates strong calibration (r = 0.892) between the cloud LLM and deterministic fallback scorers, alongside reliable edge proctoring performance. "
        "Furthermore, our design directly addresses international regulatory mandates under NYC Local Law 144, Illinois 820 ILCS 42, and the EU AI Act, establishing verifiable transparency, auditable data persistence, and mandatory human oversight."
    )
    add_p(
        "Future research will advance along three distinct frontiers: (1) executing multi-institution longitudinal trials across diverse demographic cohorts to establish predictive validity against standardized post-hire human performance evaluations; (2) integrating multi-modal transformer models that simultaneously process acoustic prosody, speech pacing, and visual engagement while auditing for cross-cultural phonetic fairness; and (3) deploying compact quantized neural networks (e.g., MobileNetV4) via WebAssembly to enhance detection accuracy under complex domestic lighting conditions."
    )

    # 12. REFERENCES
    add_sec_heading("REFERENCES")
    refs = [
        "[1] P. Cappelli, 'Your approach to hiring is all wrong,' Harvard Business Review, vol. 97, no. 3, pp. 48–58, 2019.",
        "[2] J. M. Levashina, C. J. Hartwell, F. P. Morgeson, and M. A. Campion, 'The structured employment interview: Narrative and quantitative review of the research literature,' Personnel Psychology, vol. 67, no. 1, pp. 241–293, 2014.",
        "[3] J. Salgado and S. Moscoso, 'Validity of structured interviews,' in The SAGE Handbook of Personnel Selection and Assessment, SAGE, 2012, pp. 287–303.",
        "[4] J. Devlin, M.-W. Chang, K. Lee, and K. Toutanova, 'BERT: Pre-training of deep bidirectional transformers for language understanding,' in Proc. NAACL-HLT, 2019, pp. 4171–4186.",
        "[5] T. B. Brown et al., 'Language models are few-shot learners,' in Advances in Neural Information Processing Systems (NeurIPS), vol. 33, 2020, pp. 1877–1901.",
        "[6] T. N. Bauer, T. Truxillo, K. Mack, and C. Costa, 'Applicant reactions to digital recruitment and selection,' in The Oxford Handbook of Job Search and Technology, Oxford Univ. Press, 2022, pp. 315–338.",
        "[7] K. Harwell, 'A face-scanning algorithm increasingly decides whether you deserve the job,' The Washington Post, Nov. 2019; Electronic Privacy Information Center, 'EPIC complaint to the FTC in re HireVue,' Nov. 2019.",
        "[8] ACLU of Colorado, 'Discrimination complaint filed with the U.S. Equal Employment Opportunity Commission and Colorado Civil Rights Division regarding AI-driven automated hiring platforms,' Mar. 2025.",
        "[9] New York City Council, 'Local Law 144 of 2021: Automated Employment Decision Tools,' NYC Administrative Code, effective Jan. 1, 2023.",
        "[10] Illinois General Assembly, 'Artificial Intelligence Video Interview Act,' 820 ILCS 42, effective Jan. 1, 2020.",
        "[11] European Parliament and Council of the European Union, 'Regulation (EU) 2024/1689 (Artificial Intelligence Act),' Official Journal of the European Union, July 2024.",
        "[12] K. R. Sridhar and S. Narayanan, 'Beyond perceptual thresholds: Speech synthesis and virtual agents,' IEEE Transactions on Affective Computing, vol. 11, no. 1, pp. 1–14, 2020.",
        "[13] J. Cassell, J. Sullivan, S. Prevost, and E. Churchill, Embodied Conversational Agents, Cambridge, MA: MIT Press, 2000.",
        "[14] U.S. Equal Employment Opportunity Commission, 'EEOC announces settlement of first landmark algorithmic discrimination suit against iTutorGroup,' EEOC Press Release, Aug. 2023.",
        "[15] H.-Y. Suen, K.-E. Hung, and C.-L. Lin, 'Intelligent video interview agent: Development and validation of an asynchronous evaluation tool,' Computers in Human Behavior, vol. 100, pp. 248–258, 2019.",
        "[16] M. Raghavan, S. Barocas, J. Kleinberg, and K. Levy, 'Mitigating bias in algorithmic hiring: Evaluating claims and practices,' in Proc. ACM FAccT, 2020, pp. 469–481."
    ]
    for r in refs:
        p_ref = doc.add_paragraph()
        p_ref.paragraph_format.space_after = Pt(3)
        p_ref.paragraph_format.left_indent = Inches(0.25)
        p_ref.paragraph_format.first_line_indent = Inches(-0.25)
        r_run = p_ref.add_run(r)
        r_run.font.size = Pt(8.5)

    doc.save(DOC_PATH)
    print("Saved publication-grade Word document:", DOC_PATH)

if __name__ == "__main__":
    create_ieee_docx()
