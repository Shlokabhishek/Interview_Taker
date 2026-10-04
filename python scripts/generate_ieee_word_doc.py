"""Generate an authentic IEEE Conference formatted Word document (.docx).
Key improvements:
- Strictly reflects what is actually implemented in the project.
- Uses actual project diagrams (Architecture, Activity Diagram, Use Case Diagram, Class Diagram).
- ZERO text overflow: All figures are full-width or properly scaled with generous margins.
- Clean 2-column IEEE layout with 1-column title/author headers and wide figure spans.
- Resolved Table I & Table II cell widths: Fixed column pushing by setting exact dxa widths on every cell.
- Formatted mathematical equations, Table I (Tech Stack), Table II (Functional Verification), and Algorithm 1 box.
"""

import os
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.section import WD_SECTION_START
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

OUTPUT_PATHS = [
    r"D:\interview\AI_Interview_Platform_Research_Paper_Resolved.docx",
    r"D:\interview\AI_Interview_Platform_Research_Paper_Fixed.docx",
    r"D:\interview\docs\AI_Interview_Platform_Research_Paper.docx",
    r"D:\integrated\AI_Interview_Platform_Research_Paper_Updated.docx",
    r"D:\interview\AI_Interview_Platform_Research_Paper.docx",
    r"D:\interview\AI_Interview_Platform_Research_Paper_Final.docx",
]
DIAG_DIR = r"D:\interview\diagrams"

def set_cell_background(cell, fill_hex):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=35, bottom=35, left=45, right=45):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_table_borders(table, color="A0AEC0", sz="4", val="single"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'  <w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'  <w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'  <w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'  <w:left w:val="none"/>'
        f'  <w:right w:val="none"/>'
        f'  <w:insideV w:val="none"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

def format_ieee_table(table, col_widths_dxa, alignment=WD_TABLE_ALIGNMENT.CENTER):
    """Format a table to strictly adhere to IEEE column width constraints.
    - Sets tblW in dxa
    - Sets tblLayout to fixed
    - Sets tblGrid explicitly
    - Sets tcW on every cell in every row explicitly in dxa
    """
    total_w = sum(col_widths_dxa)
    table.alignment = alignment
    table.autofit = False

    tblPr = table._tbl.tblPr
    
    # Remove existing tblW / tblLayout if present
    for child in list(tblPr):
        if child.tag.endswith('tblW') or child.tag.endswith('tblLayout'):
            tblPr.remove(child)
            
    tblW = parse_xml(f'<w:tblW {nsdecls("w")} w:w="{total_w}" w:type="dxa"/>')
    tblPr.append(tblW)
    tblLayout = parse_xml(f'<w:tblLayout {nsdecls("w")} w:type="fixed"/>')
    tblPr.append(tblLayout)

    # Set or replace tblGrid
    tblGrid = table._tbl.xpath('./w:tblGrid')
    if tblGrid:
        table._tbl.remove(tblGrid[0])
    new_grid = OxmlElement('w:tblGrid')
    for w in col_widths_dxa:
        col_elm = OxmlElement('w:gridCol')
        col_elm.set(qn('w:w'), str(w))
        new_grid.append(col_elm)
    table._tbl.insert(table._tbl.index(tblPr) + 1, new_grid)

    # For every row and cell
    for row in table.rows:
        trPr = row._tr.get_or_add_trPr()
        trPr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))
        
        for c_idx, cell in enumerate(row.cells):
            tcPr = cell._tc.get_or_add_tcPr()
            for child in list(tcPr):
                if child.tag.endswith('tcW'):
                    tcPr.remove(child)
            w_dxa = col_widths_dxa[c_idx]
            tcW = parse_xml(f'<w:tcW {nsdecls("w")} w:w="{w_dxa}" w:type="dxa"/>')
            tcPr.append(tcW)

def make_section_2cols(section, space=360):
    sectPr = section._sectPr
    cols = sectPr.xpath('./w:cols')
    if not cols:
        cols = OxmlElement('w:cols')
        sectPr.append(cols)
    else:
        cols = cols[0]
    cols.set(qn('w:num'), '2')
    cols.set(qn('w:space'), str(space))

def make_section_1col(section):
    sectPr = section._sectPr
    cols = sectPr.xpath('./w:cols')
    if not cols:
        cols = OxmlElement('w:cols')
        sectPr.append(cols)
    else:
        cols = cols[0]
    cols.set(qn('w:num'), '1')

def generate_paper():
    doc = Document()

    # Base page settings: Letter, 0.65 inch margins
    sec0 = doc.sections[0]
    sec0.top_margin = Inches(0.7)
    sec0.bottom_margin = Inches(0.8)
    sec0.left_margin = Inches(0.65)
    sec0.right_margin = Inches(0.65)
    make_section_1col(sec0)

    # Base font
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Times New Roman'
    normal_style.font.size = Pt(9.5)
    normal_style.font.color.rgb = RGBColor(0x11, 0x18, 0x27)

    # -------------------------------------------------------------
    # 1. TITLE & SUBTITLE (1 COLUMN)
    # -------------------------------------------------------------
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(0)
    p_title.paragraph_format.space_after = Pt(4)
    run_title = p_title.add_run("AI-Driven Automated Interview Platform with\nAvatar-Based Candidate Assessment")
    run_title.font.name = 'Times New Roman'
    run_title.font.size = Pt(22)
    run_title.font.bold = True

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_after = Pt(12)
    run_sub = p_sub.add_run("Design, Implementation, and Functional Evaluation")
    run_sub.font.name = 'Times New Roman'
    run_sub.font.size = Pt(11)
    run_sub.font.italic = True
    run_sub.font.color.rgb = RGBColor(0x37, 0x41, 0x51)

    # -------------------------------------------------------------
    # 2. AUTHORS TABLE (1 COLUMN)
    # -------------------------------------------------------------
    t_auth = doc.add_table(rows=1, cols=2)
    format_ieee_table(t_auth, [5184, 5184], alignment=WD_TABLE_ALIGNMENT.CENTER)

    c_left = t_auth.cell(0, 0)
    p_al = c_left.paragraphs[0]
    p_al.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_al_names = p_al.add_run("Shlok Abhishek, Satyadip Lal, Mannat, Aditya Raj\n")
    r_al_names.bold = True
    r_al_names.font.size = Pt(10)
    r_al_inst = p_al.add_run("3rd Year Students, Department of Computer Science and Engineering\nSchool of Engineering and Technology\nSharda University, Greater Noida, Uttar Pradesh, India")
    r_al_inst.font.size = Pt(8.5)
    r_al_inst.font.italic = True

    c_right = t_auth.cell(0, 1)
    p_ar = c_right.paragraphs[0]
    p_ar.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_ar_name = p_ar.add_run("V. Sathiyasuntharam\n")
    r_ar_name.bold = True
    r_ar_name.font.size = Pt(10)
    r_ar_inst = p_ar.add_run("Mentor, Department of Computer Science and Engineering\nSchool of Engineering and Technology\nSharda University, Greater Noida, Uttar Pradesh, India\nsathiya4196@gmail.com")
    r_ar_inst.font.size = Pt(8.5)
    r_ar_inst.font.italic = True

    p_div = doc.add_paragraph()
    p_div.paragraph_format.space_before = Pt(6)
    p_div.paragraph_format.space_after = Pt(6)

    # -------------------------------------------------------------
    # 3. 2-COLUMN SECTION: ABSTRACT, INTRO, RELATED WORK
    # -------------------------------------------------------------
    sec_2col = doc.add_section(WD_SECTION_START.CONTINUOUS)
    sec_2col.top_margin = Inches(0.7)
    sec_2col.bottom_margin = Inches(0.8)
    sec_2col.left_margin = Inches(0.65)
    sec_2col.right_margin = Inches(0.65)
    make_section_2cols(sec_2col, space=360)

    def add_sec(title):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(3)
        run = p.add_run(title)
        run.bold = True
        run.font.size = Pt(10)
        run.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)

    def add_subsec(title):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(7)
        p.paragraph_format.space_after = Pt(2)
        run = p.add_run(title)
        run.bold = True
        run.font.size = Pt(9.5)
        run.font.color.rgb = RGBColor(0x1F, 0x29, 0x37)

    def add_p(text, indent=True):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.08
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        if indent:
            p.paragraph_format.first_line_indent = Inches(0.18)
        run = p.add_run(text)
        run.font.size = Pt(9.5)
        return p

    def add_eq(eq_text, eq_num):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(3)
        p.paragraph_format.space_after = Pt(3)
        p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        r_eq = p.add_run(f"       {eq_text}")
        r_eq.font.italic = True
        r_eq.font.size = Pt(9)
        r_num = p.add_run(f"    ({eq_num})")
        r_num.font.size = Pt(9)
        r_num.bold = True

    # ABSTRACT
    p_abs = doc.add_paragraph()
    p_abs.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_abs.paragraph_format.space_after = Pt(4)
    r_ab_h = p_abs.add_run("Abstract—")
    r_ab_h.bold = True
    r_ab_h.font.size = Pt(9)
    
    abs_body = (
        "The expansion of asynchronous hiring has created demand for interview systems that scale efficiently without sacrificing candidate engagement or evaluation consistency. "
        "This paper presents AI Interview Platform, a web-based recruitment ecosystem that enables human resource teams to conduct automated asynchronous video interviews through a personalized AI avatar. "
        "The platform pairs a React single-page frontend with a serverless backend and implements a dual-mode evaluation framework: an instruction-tuned large language model (LLM) generates questions and evaluates open-ended responses semantically, while a deterministic rule-based engine acts as an immediate fallback whenever external connectivity is disrupted. "
        "A key architectural feature is the synthesis of an interviewer avatar from an HR professional's photographs and voice profile, synchronized with text-to-speech (TTS) and real-time speech-to-text (STT) for conversational delivery. "
        "To uphold assessment integrity without transmitting private video streams, the platform includes a client-side morphological computer vision heuristic that detects unauthorized mobile phone consultation directly on HTML5 Canvas buffers. "
        "We describe the system architecture, the 3NF normalized database schema, the five-dimension scoring formulation (relevance, accuracy, confidence, keyword coverage, and professional skill signals), and the graceful degradation strategy. "
        "We report a functional evaluation of the implemented platform and examine its alignment with emerging statutory standards for automated hiring tools, including NYC Local Law 144, the Illinois Artificial Intelligence Video Interview Act, and the European Union AI Act."
    )
    r_ab_b = p_abs.add_run(abs_body)
    r_ab_b.font.size = Pt(9)

    # KEYWORDS
    p_kw = doc.add_paragraph()
    p_kw.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_kw.paragraph_format.space_after = Pt(6)
    r_kw_h = p_kw.add_run("Index Terms—")
    r_kw_h.bold = True
    r_kw_h.font.italic = True
    r_kw_h.font.size = Pt(8.5)
    r_kw_b = p_kw.add_run("Artificial Intelligence, Large Language Models, Automated Video Interviewing, Synthetic Avatars, Speech Recognition, Candidate Assessment, Graceful Degradation, Edge Computer Vision, Algorithmic Fairness.")
    r_kw_b.font.italic = True
    r_kw_b.font.size = Pt(8.5)

    # SECTION I
    add_sec("I. INTRODUCTION")
    add_p(
        "High-volume talent acquisition remains an operational bottleneck in modern organizations. When applicant volume increases, recruiters face significant hurdles in maintaining evaluation consistency, minimizing turnaround times, and delivering an engaging candidate experience [1], [2]. Conventional unstructured interviews are susceptible to interviewer subjectivity, fatigue, and grading disparities [3]. While structured interviews reduce variance, organizing them across multiple candidates and interviewers remains resource-intensive."
    )
    add_p(
        "Recent advances in natural language processing (NLP) and large language models (LLMs) allow systems to generate context-aware questions and evaluate spoken answers semantically [4], [5]. However, many existing automated screening tools present applicants with static text forms or chatbots. This lack of interpersonal cues can make the evaluation feel impersonal, discouraging candidates and obscuring verbal communication dynamics [6]."
    )
    add_p(
        "To address this, we developed AI Interview Platform, a web-based system that combines automated interview workflows with a personalized AI avatar. An avatar trained on an interviewer's photographs and voice samples delivers questions through text-to-speech synthesis, while candidates respond verbally and visually through browser media APIs. The system automates session creation, question generation, candidate registration, response recording, multi-dimensional scoring, and ranking."
    )
    add_p(
        "At the same time, automated hiring platforms face growing regulatory and legal scrutiny. Concerns regarding algorithmic bias, disability accommodations, and transparency have led to significant legal actions and statutory frameworks [7], [8]. New York City Local Law 144 requires annual independent bias audits and impact-ratio reporting for automated employment decision tools [9]. The Illinois Artificial Intelligence Video Interview Act mandates candidate disclosure, explanation, and consent [10]. The EU AI Act classifies employment-related AI systems as high-risk, imposing strict transparency and human-oversight duties [11]. This regulatory context directly informs our design choices regarding candidate consent, data minimization, and human-in-the-loop decision boundaries."
    )
    add_p(
        "The primary contributions of this paper are as follows: (1) an end-to-end full-stack architecture featuring separate interviewer and candidate portals with a 3NF normalized persistence tier; (2) a personalized synthetic avatar pipeline pairing recruiter likeness with TTS audio narration; (3) a dual-mode question generation and scoring framework that degrades gracefully to local deterministic algorithms during network interruptions; (4) a five-dimension scoring formulation evaluating relevance, technical accuracy, linguistic confidence, keyword coverage, and professional skills; (5) a privacy-preserving, edge-computed computer vision heuristic detecting unauthorized phone use without transmitting video frames; and (6) a functional evaluation verifying system behavior against regulatory transparency principles."
    )

    # SECTION II
    add_sec("II. RELATED WORK AND REGULATORY CONTEXT")
    add_subsec("A. Automated Interview Evaluation")
    add_p(
        "Early automated interview systems relied on predefined question banks and rule-based keyword intersection [3]. While computationally efficient, these systems could not capture semantic intent or reward synonymous technical phrasing. Transformer models such as BERT [4] and instruction-tuned autoregressive LLMs [5] have enabled semantic similarity scoring and contextual answer understanding. Our platform builds on this foundation by deploying instruction-tuned LLMs with strictly validated JSON schemas, while retaining a deterministic scoring engine as an operational fail-safe."
    )
    add_subsec("B. Avatars and Virtual Agents")
    add_p(
        "Text-to-speech and computer-vision techniques have enabled conversational agents in education and customer service [12], [13]. However, the use of personalized avatars trained on specific recruiters within asynchronous hiring remains relatively uncommon. Our platform pairs avatar personalization with real-time browser-based speech processing to enhance applicant presence without prohibitive streaming render costs."
    )
    add_subsec("C. Regulatory Landscape")
    add_p(
        "Commercial automated interview tools have faced major challenges regarding transparency and fairness. A 2019 FTC complaint against HireVue prompted the vendor to remove facial-analysis scoring in 2021 [7]. In 2023, the EEOC settled a landmark algorithmic discrimination suit involving automated age screening [14]. More recently, legal complaints have highlighted the necessity of accessible accommodation protocols for candidates with speech or hearing impairments [8]. Regulatory mandates such as NYC Local Law 144 [9], the Illinois AI Video Interview Act [10], and the EU AI Act [11] require advance candidate disclosure, auditable evaluation metrics, and mandatory human oversight, which we treat as baseline system design requirements."
    )

    # -------------------------------------------------------------
    # 4. FULL-WIDTH SPAN FOR FIG. 1: SYSTEM ARCHITECTURE
    # -------------------------------------------------------------
    sec_fig1 = doc.add_section(WD_SECTION_START.CONTINUOUS)
    make_section_1col(sec_fig1)

    arch_img_path = os.path.join(DIAG_DIR, "system_architecture_clean.png")
    if not os.path.exists(arch_img_path):
        arch_img_path = os.path.join(DIAG_DIR, "system_architecture.png")

    if os.path.exists(arch_img_path):
        p_f1 = doc.add_paragraph()
        p_f1.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_f1.paragraph_format.space_before = Pt(4)
        p_f1.paragraph_format.space_after = Pt(2)
        doc.add_picture(arch_img_path, width=Inches(6.8))

        p_cap1 = doc.add_paragraph()
        p_cap1.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap1.paragraph_format.space_after = Pt(8)
        r_c1 = p_cap1.add_run("Fig. 1. End-to-end architectural topology of the AI Interview Platform. The client frontend comprises dedicated portals for candidates and interviewers, executing edge-based speech synthesis, streaming transcription, and morphological proctoring. The serverless orchestration layer coordinates cloud-based LLM response evaluation with an automatic failover circuit breaker that transparently engages an on-device deterministic scoring engine during API latency spikes or outages.")
        r_c1.font.size = Pt(8.5)
        r_c1.font.italic = True

    # -------------------------------------------------------------
    # 5. BACK TO 2 COLUMNS: SECTION III, IV
    # -------------------------------------------------------------
    sec_2col2 = doc.add_section(WD_SECTION_START.CONTINUOUS)
    make_section_2cols(sec_2col2, space=360)

    add_sec("III. SYSTEM ARCHITECTURE")
    add_p(
        "The system architecture follows a decoupled client-server model designed for scalability and resilience, as illustrated in Fig. 1. The frontend is a React single-page application, while the backend consists of serverless API endpoints and a relational persistence layer."
    )
    add_subsec("A. Frontend Layer")
    add_p(
        "The frontend is developed using React 18, Vite 5, and TailwindCSS 3, organized into two dedicated portals: "
        "(1) Interviewer Portal: allows recruiters to create sessions, define job requirements, author or generate questions, configure avatar likeness, inspect response recordings, examine candidate scores, and review integrity logs; "
        "(2) Candidate Portal: accessible via unique session links, guides applicants through device verification, informed consent, avatar question delivery, real-time transcription, and response recording."
    )
    add_subsec("B. Backend Layer")
    add_p(
        "The backend is implemented as serverless functions deployed on Vercel, supplemented by a Node.js development server. It exposes endpoints for session management, candidate registration, question generation, and response evaluation. The backend isolates LLM credentials on the server side and incorporates a circuit breaker that routes evaluation requests to the local deterministic scorer if third-party AI services experience latency anomalies (> 8000 ms) or outages."
    )
    add_subsec("C. Data Persistence")
    add_p(
        "The platform supports dual-mode persistence: (1) Local browser persistence via the Web Storage API enables standalone offline demonstrations; (2) A normalized MySQL database structured in Third Normal Form (3NF) enforces referential integrity across six tables: interviewer, session, question, candidate, response, and integrity_event, ensuring structured audit logging."
    )

    # TABLE I IN COLUMN (FIXED WIDTH FORMATTING)
    p_t1_h = doc.add_paragraph()
    p_t1_h.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_t1_h.paragraph_format.space_before = Pt(6)
    p_t1_h.paragraph_format.space_after = Pt(2)
    r_t1_h = p_t1_h.add_run("TABLE I: System Technology Stack")
    r_t1_h.bold = True
    r_t1_h.font.size = Pt(8.5)

    # Total width: 4752 dxa (3.30 inches, perfectly fits 3.475 in column)
    # Col 0: 1584 dxa (1.10 in), Col 1: 3168 dxa (2.20 in)
    t_tech = doc.add_table(rows=11, cols=2)
    format_ieee_table(t_tech, [1584, 3168])
    set_table_borders(t_tech)

    stack_data = [
        ("Subsystem Layer", "Component Implementation and Role"),
        ("Client Framework", "React 18, Vite 5, TailwindCSS 3 (Modular UI)"),
        ("State & Routing", "Context API, React Router 6, Lucide React"),
        ("Speech Synthesis", "Web Speech API (SpeechSynthesisUtterance)"),
        ("Speech Recognition", "Web Speech API (webkitSpeechRecognition)"),
        ("Media Pipeline", "HTML5 MediaRecorder (VP8/Opus WebM)"),
        ("Edge Computer Vision", "HTML5 Canvas, Morphological Flood-Fill Engine"),
        ("Primary AI Engine", "OpenAI API (gpt-4o-mini with JSON Schemas)"),
        ("Fallback Analyzer", "Local Deterministic Rule-Based Scorer"),
        ("Gateway Runtime", "Node.js, Vercel Serverless Functions"),
        ("Persistence Engine", "MySQL (3NF Normalized), MongoDB, LocalStorage"),
    ]
    for idx, (k, v) in enumerate(stack_data):
        row = t_tech.rows[idx]
        c0, c1 = row.cells[0], row.cells[1]
        c0.paragraphs[0].text = k
        c1.paragraphs[0].text = v
        c0.paragraphs[0].runs[0].font.name = 'Times New Roman'
        c1.paragraphs[0].runs[0].font.name = 'Times New Roman'
        c0.paragraphs[0].runs[0].font.size = Pt(7.5)
        c1.paragraphs[0].runs[0].font.size = Pt(7.5)
        c0.paragraphs[0].paragraph_format.space_before = Pt(2)
        c0.paragraphs[0].paragraph_format.space_after = Pt(2)
        c1.paragraphs[0].paragraph_format.space_before = Pt(2)
        c1.paragraphs[0].paragraph_format.space_after = Pt(2)
        if idx == 0:
            c0.paragraphs[0].runs[0].bold = True
            c1.paragraphs[0].runs[0].bold = True
            set_cell_background(c0, "E2E8F0")
            set_cell_background(c1, "E2E8F0")
        set_cell_margins(c0, top=35, bottom=35, left=45, right=45)
        set_cell_margins(c1, top=35, bottom=35, left=45, right=45)

    # SECTION IV
    add_sec("IV. METHODOLOGY AND ALGORITHMIC FORMULATION")
    add_subsec("A. Personalized AI Avatar")
    add_p(
        "HR professionals upload facial photographs and optional video clips to configure the avatar. During an interview, the avatar displays the interviewer's likeness while question text is narrated using browser-native text-to-speech. Rate and pitch parameters are tuned for natural delivery (ν_rate = 0.95 · ν_base, ρ_pitch = 1.02 · ρ_base). Speech events trigger active visual state pulses, while controls allow candidates to replay audio, toggle subtitles, and adjust volume."
    )
    add_subsec("B. Dual-Mode Question Generation")
    add_p(
        "Question generation operates in two modes: (1) In AI-assisted mode, a prompt incorporating job description and optional resume text is sent to the LLM, returning structured questions with time limits, keywords, and rubrics; (2) In deterministic mode, an on-device analyzer extracts skills and project signals from the job description and resume, populating parameterized question templates locally."
    )
    add_subsec("C. Multi-Dimensional Response Scoring")
    add_p(
        "Responses are evaluated across five dimensions: "
        "(1) Relevance (R) measures lexical overlap between candidate answer a and question q with a response-length bonus:\n"
        "   R = min(100, (|W(a) ∩ W(q)| / |W(q)|) · 80 + β_len(a))\n"
        "(2) Technical Accuracy (A) combines keyword coverage and relevance:\n"
        "   A = min(100, round(0.60 · K + 0.40 · R))\n"
        "(3) Linguistic Confidence (C) parses certainty markers against hesitation patterns:\n"
        "   C = clamp(50 + 10 · N_pos(a) - 10 · N_neg(a) + δ_len(a), 0, 100)\n"
        "(4) Keyword Match (K) tracks the proportion of expected concepts κ appearing in the answer:\n"
        "   K = round((|κ ∩ lexemes(a)| / |κ|) · 100)\n"
        "(5) Skill Presence (S) detects competency keywords across 6 categories (communication, problem-solving, teamwork, leadership, technical, adaptability)."
    )
    add_p(
        "The overall score is computed as a weighted combination scaled by question weight W_i:\n"
        "   Score_i = min(100, 0.25·R + 0.30·A + 0.20·C + 0.25·K) · W_i\n"
        "When the LLM service is available, it produces structured scores and narrative feedback. When unavailable, the system executes the deterministic scoring module."
    )

    # ALGORITHM 1 BOX (IN COLUMN)
    t_alg = doc.add_table(rows=1, cols=1)
    format_ieee_table(t_alg, [4752])
    c_a = t_alg.cell(0, 0)
    set_cell_background(c_a, "F8FAFC")
    set_cell_margins(c_a, top=60, bottom=60, left=80, right=80)
    set_table_borders(t_alg, color="CBD5E1")

    p_a1 = c_a.paragraphs[0]
    r_a1_h = p_a1.add_run("Algorithm 1: Scoring with Resilient Fallback\n")
    r_a1_h.bold = True
    r_a1_h.font.size = Pt(8.5)
    
    alg_body = (
        "Input: transcript a, question q, keywords κ, weight W.\n"
        "Output: (Score, R, A, C, K, S, evidence).\n"
        "1: isScored ← False\n"
        "2: if CircuitBreaker.isOpen() == False then\n"
        "3:     J_res ← RemoteLLMScoring(a, q, κ, Schema)\n"
        "4:     if J_res is valid then\n"
        "5:         Extract R, A, C, K, S, evidence ← J_res\n"
        "6:         isScored ← True\n"
        "7:     end if\n"
        "8: end if\n"
        "9: if isScored == False then\n"
        "10:    R ← ComputeRelevance(a, q) via lexical overlap\n"
        "11:    K ← ComputeKeywordCoverage(a, κ)\n"
        "12:    A ← ComputeAccuracy(K, R) = 0.60·K + 0.40·R\n"
        "13:    C ← ComputeConfidence(a) via polarity markers\n"
        "14:    S ← {ComputeSkillPresence(a, D_j)}\n"
        "15:    evidence ← SynthesizeRuleBasedNotes(a, κ, S)\n"
        "16: end if\n"
        "17: Score ← min(100, w_R·R + w_A·A + w_C·C + w_K·K)·W\n"
        "18: return (Score, R, A, C, K, S, evidence)"
    )
    r_a1_b = p_a1.add_run(alg_body)
    r_a1_b.font.size = Pt(7.5)
    r_a1_b.font.name = 'Consolas'

    add_subsec("D. Client-Side Phone-Usage Detection")
    add_p(
        "To preserve interview integrity while respecting candidate privacy, the platform implements a client-side computer vision heuristic operating on downsampled HTML5 Canvas frames (scanned every 1500 ms). Candidate pixels are flagged if brightness < 55 or (brightness > 185 and contrast < 38). Contiguous candidate pixels are grouped using 4-connectivity flood fill. If a component satisfies phone aspect ratio (1.45–3.8), rectangularity (>0.42), and lower vertical position, an advisory warning is displayed and logged with a 5000 ms cooldown. Concurrently, audio energy is monitored to flag extended silences (<0.035 for >3500 ms). Camera frames are never sent to external servers."
    )

    # -------------------------------------------------------------
    # 6. FULL-WIDTH SPAN FOR FIG. 2: ACTUAL PROJECT ACTIVITY DIAGRAM
    # -------------------------------------------------------------
    sec_fig2 = doc.add_section(WD_SECTION_START.CONTINUOUS)
    make_section_1col(sec_fig2)

    act_img_path = os.path.join(DIAG_DIR, "diagram_activity_perfect.png")
    if os.path.exists(act_img_path):
        p_f2 = doc.add_paragraph()
        p_f2.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_f2.paragraph_format.space_before = Pt(4)
        p_f2.paragraph_format.space_after = Pt(2)
        doc.add_picture(act_img_path, width=Inches(4.3))

        p_cap2 = doc.add_paragraph()
        p_cap2.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap2.paragraph_format.space_after = Pt(8)
        r_c2 = p_cap2.add_run("Fig. 2. UML Activity Diagram of the AI Interview Platform, showing the complete end-to-end execution flow: session initialization, question generation, candidate registration, avatar-conducted interview, concurrent capture of video, audio transcription, and integrity heuristics, followed by response scoring and candidate completion.")
        r_c2.font.size = Pt(8.5)
        r_c2.font.italic = True

    # -------------------------------------------------------------
    # 7. BACK TO 2 COLUMNS: SECTION V
    # -------------------------------------------------------------
    sec_2col3 = doc.add_section(WD_SECTION_START.CONTINUOUS)
    make_section_2cols(sec_2col3, space=360)

    add_sec("V. IMPLEMENTATION AND USER INTERFACES")
    add_p(
        "The system is implemented as a full-stack JavaScript application using React 18, Vite 5, TailwindCSS 3, and Node.js. Vocal answers are captured using the MediaRecorder API as WebM audio/video blobs, while the browser SpeechRecognition interface generates streaming transcripts. All network communications are encrypted via HTTPS, and API keys are isolated server-side."
    )
    add_p(
        "Fig. 3 illustrates the platform's functional use cases, modeling the end-to-end actor relationships across the Interviewer, Candidate, AI Service, and Integrity Service. Fig. 4 details the corresponding UML Class Diagram, defining entity relationships and service boundaries across the architecture."
    )

    # -------------------------------------------------------------
    # 8. FULL-WIDTH SPAN FOR FIG. 3: USE CASE DIAGRAM (ACTUAL PROJECT IMAGE)
    # -------------------------------------------------------------
    sec_fig3 = doc.add_section(WD_SECTION_START.CONTINUOUS)
    make_section_1col(sec_fig3)

    usecase_img_path = os.path.join(DIAG_DIR, "diagram_usecase_perfect.png")
    if os.path.exists(usecase_img_path):
        p_f3 = doc.add_paragraph()
        p_f3.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_f3.paragraph_format.space_before = Pt(4)
        p_f3.paragraph_format.space_after = Pt(2)
        doc.add_picture(usecase_img_path, width=Inches(6.8))

        p_cap3 = doc.add_paragraph()
        p_cap3.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap3.paragraph_format.space_after = Pt(8)
        r_c3 = p_cap3.add_run("Fig. 3. UML Use Case Diagram of the AI Interview Platform, modeling interactions among the four primary actors (Interviewer/HR, Candidate, AI Service, and Integrity Service) across 13 core operational use cases (UC1 through UC13), including automated session management, AI question generation, avatar delivery, streaming transcription, edge proctoring, and auditable candidate scoring.")
        r_c3.font.size = Pt(8.5)
        r_c3.font.italic = True

    # -------------------------------------------------------------
    # 9. BACK TO 2 COLUMNS: SECTION VI
    # -------------------------------------------------------------
    sec_2col4 = doc.add_section(WD_SECTION_START.CONTINUOUS)
    make_section_2cols(sec_2col4, space=360)

    add_sec("VI. FUNCTIONAL EVALUATION AND SYSTEM VERIFICATION")
    add_subsec("A. Functional Testing of Platform Modules")
    add_p(
        "We evaluated the platform across both interviewer and candidate workflows. Table II summarizes the verification results for the core functional modules. "
        "The avatar system guided candidates through multi-question sessions with synchronized audio narration and visual speech state changes. Real-time transcription operated reliably in Chromium-based browsers, producing usable transcripts for immediate scoring. "
        "Both question-generation pathways functioned as designed: the AI-assisted mode produced role-relevant questions from job descriptions, while the local deterministic mode extracted skills and generated structured questions without external internet connectivity."
    )

    # TABLE II IN COLUMN (FIXED WIDTH FORMATTING)
    p_t2_h = doc.add_paragraph()
    p_t2_h.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_t2_h.paragraph_format.space_before = Pt(6)
    p_t2_h.paragraph_format.space_after = Pt(2)
    r_t2_h = p_t2_h.add_run("TABLE II: Functional Verification of Core Modules")
    r_t2_h.bold = True
    r_t2_h.font.size = Pt(8.5)

    # Total width: 4752 dxa (3.30 inches)
    # Col 0: 1368 dxa (0.95 in), Col 1: 2376 dxa (1.65 in), Col 2: 1008 dxa (0.70 in)
    t_eval = doc.add_table(rows=9, cols=3)
    format_ieee_table(t_eval, [1368, 2376, 1008])
    set_table_borders(t_eval)

    eval_data = [
        ("Module", "Verification Test", "Status"),
        ("Avatar Narration", "Photo upload + TTS narration", "Pass"),
        ("Speech STT", "Live streaming transcription", "Pass"),
        ("AI Question Gen", "Role & JD prompt synthesis", "Pass"),
        ("Fallback Gen", "Offline skill/project extraction", "Pass"),
        ("5D Scorer", "R, A, C, K, S score calculation", "Pass"),
        ("Phone Detection", "Connected-component CV heuristic", "Pass"),
        ("Audio Anomaly", "Silence floor threshold detection", "Pass"),
        ("3NF Persistence", "MySQL relational table CRUD", "Pass"),
    ]
    for idx, (m, t, res) in enumerate(eval_data):
        row = t_eval.rows[idx]
        c0, c1, c2 = row.cells[0], row.cells[1], row.cells[2]
        c0.paragraphs[0].text = m
        c1.paragraphs[0].text = t
        c2.paragraphs[0].text = res
        c0.paragraphs[0].runs[0].font.name = 'Times New Roman'
        c1.paragraphs[0].runs[0].font.name = 'Times New Roman'
        c2.paragraphs[0].runs[0].font.name = 'Times New Roman'
        c0.paragraphs[0].runs[0].font.size = Pt(7.5)
        c1.paragraphs[0].runs[0].font.size = Pt(7.5)
        c2.paragraphs[0].runs[0].font.size = Pt(7.5)
        c0.paragraphs[0].paragraph_format.space_before = Pt(2)
        c0.paragraphs[0].paragraph_format.space_after = Pt(2)
        c1.paragraphs[0].paragraph_format.space_before = Pt(2)
        c1.paragraphs[0].paragraph_format.space_after = Pt(2)
        c2.paragraphs[0].paragraph_format.space_before = Pt(2)
        c2.paragraphs[0].paragraph_format.space_after = Pt(2)
        c2.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        if idx == 0:
            c0.paragraphs[0].runs[0].bold = True
            c1.paragraphs[0].runs[0].bold = True
            c2.paragraphs[0].runs[0].bold = True
            set_cell_background(c0, "E2E8F0")
            set_cell_background(c1, "E2E8F0")
            set_cell_background(c2, "E2E8F0")
        set_cell_margins(c0, top=35, bottom=35, left=40, right=40)
        set_cell_margins(c1, top=35, bottom=35, left=40, right=40)
        set_cell_margins(c2, top=35, bottom=35, left=40, right=40)

    add_subsec("B. Scoring Resilience and Fallback Behavior")
    add_p(
        "Under normal operating conditions, the LLM provides nuanced evaluation narratives and calibrated scores. When network interruptions or API errors were simulated, the circuit breaker automatically engaged the deterministic scorer without aborting candidate sessions. The deterministic engine provides consistent, reproducible baseline scores (zero score variance across identical inputs), ensuring operational continuity."
    )
    add_subsec("C. Edge Proctoring Observations")
    add_p(
        "The connected-component phone-detection heuristic reliably detected high-contrast rectangular objects during active recording. Because the heuristic relies on morphological features and thresholding, lighting variations can cause false positives. Consequently, integrity events are recorded as advisory review telemetry for human recruiters rather than automated disqualifications."
    )
    add_subsec("D. Limitations")
    add_p(
        "Several limitations are noted: (1) Speech recognition accuracy varies across browsers, operating best in Chrome and less reliably in Safari and Firefox; (2) The deterministic fallback scorer is bounded by literal keyword matching and cannot reward synonyms; (3) The phone-detection heuristic is sensitive to camera placement and lighting; and (4) Third-party LLM rate limits constrain concurrency."
    )

    # -------------------------------------------------------------
    # 10. FULL-WIDTH SPAN FOR FIG. 4: UML CLASS DIAGRAM
    # -------------------------------------------------------------
    sec_fig4 = doc.add_section(WD_SECTION_START.CONTINUOUS)
    make_section_1col(sec_fig4)

    class_img_path = os.path.join(DIAG_DIR, "uml_class_diagram_ai_interview_platform.png")
    if os.path.exists(class_img_path):
        p_f4 = doc.add_paragraph()
        p_f4.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_f4.paragraph_format.space_before = Pt(4)
        p_f4.paragraph_format.space_after = Pt(2)
        doc.add_picture(class_img_path, width=Inches(6.4))

        p_cap4 = doc.add_paragraph()
        p_cap4.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap4.paragraph_format.space_after = Pt(8)
        r_c4 = p_cap4.add_run("Fig. 4. UML Class Diagram detailing the object-oriented structure of the platform, showing relationship dependencies between portal controllers, session entities, speech and proctoring services, and the multi-dimensional scoring engine.")
        r_c4.font.size = Pt(8.5)
        r_c4.font.italic = True

    # -------------------------------------------------------------
    # 11. BACK TO 2 COLUMNS: SECTION VII, VIII, REFERENCES
    # -------------------------------------------------------------
    sec_2col5 = doc.add_section(WD_SECTION_START.CONTINUOUS)
    make_section_2cols(sec_2col5, space=360)

    add_sec("VII. ETHICAL CONSIDERATIONS AND REGULATORY ALIGNMENT")
    add_subsec("A. Disclosure and Consent (Illinois 820 ILCS 42)")
    add_p(
        "In compliance with the Illinois Artificial Intelligence Video Interview Act, the platform displays an advance disclosure modal informing candidates that AI is used to generate questions and evaluate responses, requiring explicit consent before initializing media capture."
    )
    add_subsec("B. Auditability and Disparate Impact (NYC Local Law 144)")
    add_p(
        "NYC Local Law 144 mandates annual independent bias audits evaluating selection-rate impact ratios across race and sex. The platform stores granular per-dimension scores and question weights in normalized relational tables, providing structured data for external auditability."
    )
    add_subsec("C. Human-in-the-Loop Oversight (EU AI Act)")
    add_p(
        "In alignment with the EU AI Act's high-risk classification, candidate rankings serve as decision-support signals for recruiters. The system does not execute automated rejections, maintaining mandatory human review for all hiring decisions."
    )
    add_subsec("D. Accessibility Accommodations")
    add_p(
        "To support candidates with disabilities pursuant to ADA Title III, the platform provides subtitle captions, question replay, and audio volume controls, ensuring accessibility for hearing-impaired applicants."
    )

    add_sec("VIII. CONCLUSION AND FUTURE WORK")
    add_p(
        "We presented AI Interview Platform, a web-based automated interview system combining a personalized synthetic avatar, real-time speech processing, dual-mode question generation, and a five-dimension scoring model with a deterministic fallback. The platform demonstrates that engaging asynchronous interviewing can be achieved without complex 3D streaming infrastructure, while maintaining operational resilience during network interruptions. Future work will focus on formal demographic bias audits, improved deep-learning edge object detection, and multimodal evaluation combining vocal prosody with transcript analysis."
    )

    add_sec("REFERENCES")
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
        p_ref.paragraph_format.space_after = Pt(2)
        p_ref.paragraph_format.line_spacing = 1.05
        p_ref.paragraph_format.left_indent = Inches(0.18)
        p_ref.paragraph_format.first_line_indent = Inches(-0.18)
        p_ref.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        r_run = p_ref.add_run(r)
        r_run.font.size = Pt(8)

    # Save to all target locations
    saved_paths = []
    for out_path in OUTPUT_PATHS:
        try:
            os.makedirs(os.path.dirname(out_path), exist_ok=True)
            doc.save(out_path)
            saved_paths.append(out_path)
            print(f"Successfully generated: {out_path}")
        except Exception as e:
            print(f"Skipped {out_path} (in-use or locked): {e}")
            
    return saved_paths

if __name__ == "__main__":
    generate_paper()
