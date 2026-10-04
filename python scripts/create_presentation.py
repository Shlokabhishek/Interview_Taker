import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

def create_deck():
    prs = Presentation()
    # Set slide dimensions to widescreen 16:9
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    
    # Colors
    NAVY = RGBColor(15, 23, 42)       # #0F172A Dark background / primary header
    INDIGO = RGBColor(79, 70, 229)    # #4F46E5 Brand accent
    BLUE = RGBColor(37, 99, 235)      # #2563EB Sub-accent
    DARK_GRAY = RGBColor(30, 41, 59)  # #1E293B Text dark
    TEXT_MUTED = RGBColor(100, 116, 139) # #64748B Secondary text
    WHITE = RGBColor(255, 255, 255)
    LIGHT_BG = RGBColor(248, 250, 252) # #F8FAFC Slide background
    CARD_BG = RGBColor(255, 255, 255)
    CARD_BORDER = RGBColor(226, 232, 240)
    ACCENT_BG = RGBColor(238, 242, 255) # Indigo light tint
    PO_BADGE_BG = RGBColor(224, 231, 255) # Light blue badge
    PO_BADGE_TXT = RGBColor(67, 56, 202) # Indigo text

    blank_layout = prs.slide_layouts[6]

    def set_slide_background(slide, color):
        background = slide.background
        fill = background.fill
        fill.solid()
        fill.fore_color.rgb = color

    def add_header(slide, title_text, category_text, po_text=None):
        # Category / Header tag
        cat_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(10), Inches(0.4))
        tf = cat_box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        p.text = category_text.upper()
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = INDIGO

        # Main Title
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.7), Inches(9.5), Inches(0.8))
        tf_t = title_box.text_frame
        tf_t.word_wrap = True
        tf_t.margin_left = tf_t.margin_top = tf_t.margin_right = tf_t.margin_bottom = 0
        p_t = tf_t.paragraphs[0]
        p_t.text = title_text
        p_t.font.size = Pt(24)
        p_t.font.bold = True
        p_t.font.color.rgb = NAVY

        # PO Badge if present
        if po_text:
            badge = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(10.5), Inches(0.5), Inches(2.0), Inches(0.45))
            badge.fill.solid()
            badge.fill.fore_color.rgb = PO_BADGE_BG
            badge.line.color.rgb = PO_BADGE_BG
            tf_b = badge.text_frame
            tf_b.word_wrap = True
            p_b = tf_b.paragraphs[0]
            p_b.text = f"Outcome: {po_text}"
            p_b.alignment = PP_ALIGN.CENTER
            p_b.font.size = Pt(11)
            p_b.font.bold = True
            p_b.font.color.rgb = PO_BADGE_TXT

    def add_card(slide, left, top, width, height, title, points, bg_color=CARD_BG, border_color=CARD_BORDER, title_color=INDIGO):
        shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        shape.fill.solid()
        shape.fill.fore_color.rgb = bg_color
        shape.line.color.rgb = border_color
        shape.line.width = Pt(1)

        tf = shape.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.25)
        tf.margin_right = Inches(0.25)
        tf.margin_top = Inches(0.25)
        tf.margin_bottom = Inches(0.25)

        if title:
            p = tf.paragraphs[0]
            p.text = title
            p.font.size = Pt(16)
            p.font.bold = True
            p.font.color.rgb = title_color
            p.space_after = Pt(10)
            first_point = True
        else:
            first_point = False

        for pt in points:
            if first_point and not title:
                p = tf.paragraphs[0]
                first_point = False
            else:
                p = tf.add_paragraph()
            
            p.space_after = Pt(6)
            p.font.size = Pt(13)
            p.font.color.rgb = DARK_GRAY
            
            if isinstance(pt, tuple):
                header_str, detail_str = pt
                run1 = p.add_run()
                run1.text = f"•  {header_str}: "
                run1.font.bold = True
                run1.font.color.rgb = NAVY
                
                run2 = p.add_run()
                run2.text = detail_str
                run2.font.bold = False
            else:
                p.text = f"•  {pt}"

    # ==========================================
    # SLIDE 1: Title Slide (Dark Theme)
    # ==========================================
    slide1 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide1, NAVY)

    # Accent bar top
    bar = slide1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(0.15))
    bar.fill.solid()
    bar.fill.fore_color.rgb = INDIGO
    bar.line.fill.background()

    # Title box
    tbox = slide1.shapes.add_textbox(Inches(1.0), Inches(1.5), Inches(11.333), Inches(2.2))
    tf = tbox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "AI INTERVIEW PLATFORM"
    p.font.size = Pt(38)
    p.font.bold = True
    p.font.color.rgb = WHITE
    
    p2 = tf.add_paragraph()
    p2.text = "An AI-Driven Automated Interview System with Avatar-Based Candidate Assessment"
    p2.font.size = Pt(20)
    p2.font.color.rgb = RGBColor(199, 210, 254) # Light indigo
    p2.space_before = Pt(12)

    # Metadata Card (Dark accent)
    meta_card = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.0), Inches(4.2), Inches(11.333), Inches(2.2))
    meta_card.fill.solid()
    meta_card.fill.fore_color.rgb = RGBColor(30, 41, 59)
    meta_card.line.color.rgb = INDIGO
    tf_m = meta_card.text_frame
    tf_m.word_wrap = True
    tf_m.margin_left = Inches(0.4)
    tf_m.margin_top = Inches(0.3)

    p_m1 = tf_m.paragraphs[0]
    p_m1.text = "ACADEMIC PROJECT DEFENSE & PRESENTATION"
    p_m1.font.size = Pt(14)
    p_m1.font.bold = True
    p_m1.font.color.rgb = INDIGO

    p_m2 = tf_m.add_paragraph()
    p_m2.text = "Mapped Program Outcomes: PO1 (Problem Definition) | PO4 (Project Concept) | PO5 (Literature Survey) | PO2 (Feasibility) | PO11 (Roadmap & Team Distribution)"
    p_m2.font.size = Pt(12)
    p_m2.font.color.rgb = RGBColor(226, 232, 240)
    p_m2.space_before = Pt(8)

    p_m3 = tf_m.add_paragraph()
    p_m3.text = "Presenter / Lead Developer: Shlok Abhishek  |  Technology Stack: React 18, Vite, Node.js, Web Speech API, OpenAI LLM, MongoDB"
    p_m3.font.size = Pt(12)
    p_m3.font.color.rgb = RGBColor(148, 163, 184)
    p_m3.space_before = Pt(12)


    # ==========================================
    # SLIDE 2: Clarity of Problem Definition (PO1) - The Challenge & Problem Statement
    # ==========================================
    slide2 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide2, LIGHT_BG)
    add_header(slide2, "Clarity of Problem Definition", "1. Problem Definition & Objectives", "PO1")

    # Left Card: Current Recruitment Bottlenecks
    add_card(slide2, Inches(0.8), Inches(1.6), Inches(5.6), Inches(5.2),
             "Current Hiring Challenges & Pain Points", [
                 ("High Human Resource Burden", "Manual screening & scheduling consume hundreds of HR hours per open position."),
                 ("Subjectivity & Evaluation Bias", "Unstructured human interviews suffer from interviewer fatigue, personal bias, and inconsistent scoring metrics."),
                 ("Scalability Bottleneck", "Concurrent evaluation of hundreds of applicants simultaneously is impossible with human panels."),
                 ("Asynchronous Quality Deficit", "Existing automated form tests lack human interaction, engagement, and video/audio nuance."),
                 ("Interview Integrity Risks", "Unmonitored remote screening invites cheating, impersonation, or unauthorized external assistance.")
             ])

    # Right Card: Formal Problem Statement & Objectives
    add_card(slide2, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.2),
             "Problem Statement & Project Objectives", [
                 ("Core Objective", "Design & deploy a full-stack, AI-driven asynchronous interview platform that humanizes screening via personalized avatars."),
                 ("Humanized Interaction", "Allow HR to train digital avatars using face photos and voice samples to conduct voice-guided video interviews."),
                 ("Automated Scoring Engine", "Implement multi-dimensional scoring (Relevance, Technical Accuracy, Confidence, Keywords, Skills) powered by LLMs."),
                 ("Resilient Architecture", "Provide a deterministic local rule-based fallback engine to guarantee 100% uptime during API service outages."),
                 ("Proctored Integrity", "Incorporate browser-based computer-vision heuristics to detect unauthorized mobile phone usage in real time.")
             ], bg_color=ACCENT_BG, border_color=INDIGO, title_color=NAVY)


    # ==========================================
    # SLIDE 3: Description of Project Concept (PO4) - Architecture & Workflows
    # ==========================================
    slide3 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide3, LIGHT_BG)
    add_header(slide3, "Description of Project Concept - Architecture & Workflows", "2. Project Concept & System Design", "PO4")

    # 3-Column Layout
    add_card(slide3, Inches(0.8), Inches(1.6), Inches(3.7), Inches(5.2),
             "Interviewer Portal (HR)", [
                 ("Profile & Settings", "No-auth local profile with configurable API endpoints & share links."),
                 ("Avatar Trainer", "Upload face photos & audio samples to synthesize interviewer avatar."),
                 ("Session Creation", "Define custom role questions, criteria, weights, and expected keywords."),
                 ("Candidate Leaderboard", "View AI-analyzed scores, transcripts, video recordings, and candidate rankings.")
             ])

    add_card(slide3, Inches(4.8), Inches(1.6), Inches(3.7), Inches(5.2),
             "Candidate Portal (Applicant)", [
                 ("Seamless Registration", "Access interview via unique shared link with zero software install."),
                 ("Interactive AI Room", "Engage with personalized avatar delivering audio questions via Web Speech TTS."),
                 ("Speech-to-Text Processing", "Real-time speech recognition converts spoken answers into text transcripts."),
                 ("Media Recorder", "Captures candidate video/audio WebM blobs for HR verification.")
             ])

    add_card(slide3, Inches(8.8), Inches(1.6), Inches(3.7), Inches(5.2),
             "Core Engine & API Layer", [
                 ("Serverless API Layer", "Node.js / Vercel endpoints mediating secure OpenAI LLM calls."),
                 ("Dual-Engine Evaluator", "Instruction-tuned LLM scoring with local rule-based fallback."),
                 ("Phone-Usage CV Detector", "Client-side connected-component video analysis for integrity."),
                 ("Flexible Persistence", "Browser localStorage + optional MongoDB database storage.")
             ], bg_color=ACCENT_BG, border_color=INDIGO, title_color=NAVY)


    # ==========================================
    # SLIDE 4: Description of Project Concept (PO4) - AI Scoring & Avatar Technology
    # ==========================================
    slide4 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide4, LIGHT_BG)
    add_header(slide4, "Description of Project Concept - AI Scoring & Avatar Tech", "2. Project Concept & System Design", "PO4")

    # Left Card: Avatar & Speech Pipeline
    add_card(slide4, Inches(0.8), Inches(1.6), Inches(5.6), Inches(5.2),
             "Personalized AI Avatar & Speech Pipeline", [
                 ("Likeness Training", "Combines HR face photo/video with synthetic voice profiles."),
                 ("TTS Speech Synthesis", "Uses Web Speech API to articulate interview questions naturally with pitch/rate modulation."),
                 ("Visual Synchronization", "Subtle pulse animations and active speaking indicators simulate human conversation."),
                 ("Accessibility & Control", "Candidates can toggle closed captions, adjust volume, or replay questions.")
             ])

    # Right Card: Multi-Dimensional Scoring Model
    add_card(slide4, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.2),
             "Multi-Dimensional Candidate Assessment", [
                 ("Relevance Score (w_R = 0.25)", "Measures lexical overlap & depth of direct response to the prompt."),
                 ("Technical Accuracy (w_A = 0.30)", "Evaluates domain correctness against expected technical solutions."),
                 ("Confidence Analysis (w_C = 0.20)", "Infers assertiveness, specificity, and ownership language."),
                 ("Keyword Matching (w_K = 0.25)", "Verifies presence of domain-specific target terminology."),
                 ("Mathematical Formulation", "Overall Score = min(100, [w_R*R + w_A*A + w_C*C + w_K*K]) * Question_Weight")
             ], bg_color=ACCENT_BG, border_color=INDIGO, title_color=NAVY)


    # ==========================================
    # SLIDE 5: Study of the Literature Survey (PO5) - Literature Review & Comparative Analysis
    # ==========================================
    slide5 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide5, LIGHT_BG)
    add_header(slide5, "Study of the Literature Survey", "3. Literature Survey & Related Work", "PO5")

    # Left Card: Cited Research Literature
    add_card(slide5, Inches(0.8), Inches(1.6), Inches(5.6), Inches(5.2),
             "Key Academic Research Literature", [
                 ("Cappelli (2019) [HBR]", "Highlights critical flaws & systemic inefficiencies in conventional human hiring pipelines."),
                 ("Levashina et al. (2014) [Pers. Psych.]", "Proves structured interviews reduce bias but remain highly labor-intensive."),
                 ("Salgado & Moscoso (2012)", "Establishes predictive validity of structured evaluation while emphasizing operational cost bottlenecks."),
                 ("Devlin et al. (2019) & OpenAI (2023)", "Demonstrates power of BERT & LLMs for deep semantic NLP and response scoring."),
                 ("Sridhar & Narayanan (2020)", "Explores virtual agents & TTS synthesis for engaging human-computer interaction.")
             ])

    # Right Table Card: Comparative Matrix
    table_shape = slide5.shapes.add_table(5, 4, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.2))
    table = table_shape.table
    table.columns[0].width = Inches(1.5)
    table.columns[1].width = Inches(1.4)
    table.columns[2].width = Inches(1.4)
    table.columns[3].width = Inches(1.4)

    headers = ["Feature", "Traditional HR", "Text Bots", "Proposed Platform"]
    for i, h in enumerate(headers):
        cell = table.cell(0, i)
        cell.fill.solid()
        cell.fill.fore_color.rgb = NAVY
        p = cell.text_frame.paragraphs[0]
        p.text = h
        p.font.bold = True
        p.font.size = Pt(12)
        p.font.color.rgb = WHITE
        p.alignment = PP_ALIGN.CENTER

    data = [
        ["Interviewer Face/Voice", "Human Only", "Static / None", "Personalized Avatar"],
        ["Scoring Method", "Manual & Subjective", "Keyword Match", "LLM + Fallback Rules"],
        ["System Availability", "Scheduled Hours", "Cloud Dependent", "100% Uptime (Fallback)"],
        ["Integrity Monitoring", "In-person proctor", "None", "Browser CV Phone Detect"]
    ]

    for row_idx, row_data in enumerate(data, start=1):
        for col_idx, text in enumerate(row_data):
            cell = table.cell(row_idx, col_idx)
            cell.fill.solid()
            cell.fill.fore_color.rgb = ACCENT_BG if col_idx == 3 else WHITE
            p = cell.text_frame.paragraphs[0]
            p.text = text
            p.font.size = Pt(11)
            p.font.color.rgb = INDIGO if col_idx == 3 else DARK_GRAY
            if col_idx == 3 or col_idx == 0:
                p.font.bold = True


    # ==========================================
    # SLIDE 6: Study of the Literature Survey (PO5) - Research Gaps Identified
    # ==========================================
    slide6 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide6, LIGHT_BG)
    add_header(slide6, "Study of the Literature Survey - Identified Research Gaps", "3. Literature Survey & Related Work", "PO5")

    # 3 Card Layout for Gaps & Solutions
    add_card(slide6, Inches(0.8), Inches(1.6), Inches(3.7), Inches(5.2),
             "Gap 1: Depersonalization", [
                 ("Existing State", "Automated interview systems use generic text bots or robotic voiceovers, causing low candidate engagement."),
                 ("Our Solution", "Personalized AI Avatar synthesized from actual HR face photos and voice samples to humanize the experience.")
             ])

    add_card(slide6, Inches(4.8), Inches(1.6), Inches(3.7), Inches(5.2),
             "Gap 2: Third-Party Fragility", [
                 ("Existing State", "Pure LLM applications crash or fail completely when API keys expire or server outages occur."),
                 ("Our Solution", "Deterministic Local Rule-Based Scorer that guarantees continuous evaluation capability without cloud AI dependencies.")
             ], bg_color=ACCENT_BG, border_color=INDIGO, title_color=NAVY)

    add_card(slide6, Inches(8.8), Inches(1.6), Inches(3.7), Inches(5.2),
             "Gap 3: Unmonitored Remote Cheating", [
                 ("Existing State", "Asynchronous video tools have no real-time checks for unauthorized phone usage or notes during answers."),
                 ("Our Solution", "In-browser computer-vision heuristic using frame connected-component labeling for real-time phone detection.")
             ])


    # ==========================================
    # SLIDE 7: Project Feasibility (PO2) - Technical & Operational Feasibility
    # ==========================================
    slide7 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide7, LIGHT_BG)
    add_header(slide7, "Project Feasibility - Technical & Operational", "4. Project Feasibility Analysis", "PO2")

    # Left Card: Technical Feasibility
    add_card(slide7, Inches(0.8), Inches(1.6), Inches(5.6), Inches(5.2),
             "Technical Feasibility & Stack", [
                 ("Modern Stack", "Built on React 18, Vite 5, TailwindCSS 3, React Router 6, and Lucide React."),
                 ("Native Web APIs", "Leverages standard Web Speech API (TTS & STT) and MediaRecorder API, requiring zero third-party plugins."),
                 ("Serverless API Architecture", "Lightweight Express backend + Vercel Serverless API functions for seamless global scaling."),
                 ("Database Integration", "MongoDB document persistence for cross-device synchronization with graceful fallback to browser localStorage."),
                 ("AI Model Compatibility", "Integrates OpenAI GPT models (gpt-4o / gpt-5.6-luna) via structured JSON schema prompts.")
             ])

    # Right Card: Operational & Usability Feasibility
    add_card(slide7, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.2),
             "Operational Feasibility & User Experience", [
                 ("Zero Friction for Applicants", "Candidates join via simple browser URLs without creating accounts or downloading software."),
                 ("Browser Compatibility", "Optimized for Chromium browsers (Chrome 80+, Edge 80+), with fallback for Firefox and Safari."),
                 ("Interviewer Autonomy", "Intuitive dashboard allows HR to set up sessions, custom questions, and avatars in under 5 minutes."),
                 ("System Availability Guarantee", "Rule-based smart question generator and response analyzer ensure 100% operational readiness.")
             ], bg_color=ACCENT_BG, border_color=INDIGO, title_color=NAVY)


    # ==========================================
    # SLIDE 8: Project Feasibility (PO2) - Economic, Legal & Ethical Feasibility
    # ==========================================
    slide8 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide8, LIGHT_BG)
    add_header(slide8, "Project Feasibility - Economic, Legal & Ethical", "4. Project Feasibility Analysis", "PO2")

    # Left Card: Economic Feasibility
    add_card(slide8, Inches(0.8), Inches(1.6), Inches(5.6), Inches(5.2),
             "Economic Feasibility & Cost-Effectiveness", [
                 ("Minimal Infrastructure Overhead", "Serverless deployment eliminates expensive dedicated server hosting costs."),
                 ("Low Token API Cost", "Optimized prompt engineering compresses API payload, resulting in pennies per candidate interview."),
                 ("Client-Side Offloading", "Speech recognition, video recording, and phone detection execute on client browsers, cutting backend CPU costs."),
                 ("High HR ROI", "Reduces initial screening costs by over 80% while accelerating candidate shortlisting from weeks to hours.")
             ])

    # Right Card: Legal, Ethical & Privacy Feasibility
    add_card(slide8, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.2),
             "Legal, Ethical & Privacy Compliance", [
                 ("Privacy-First Media Handling", "Video and audio files are captured and stored client-side or securely in isolated cloud storage."),
                 ("Zero Server Frame Transmission", "Phone-usage detection processes camera frames strictly in browser memory—no facial or video data leaves the device."),
                 ("GDPR & Data Protection", "Explicit consent banners, transparent data retention rules, and secure session credentials."),
                 ("Unbiased Scoring", "Multi-dimensional scoring evaluates objective answer transcripts against standardized criteria, neutralizing human demographic bias.")
             ], bg_color=ACCENT_BG, border_color=INDIGO, title_color=NAVY)


    # ==========================================
    # SLIDE 9: Roadmap of Project (PO11) - Milestone Timeline & Phases
    # ==========================================
    slide9 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide9, LIGHT_BG)
    add_header(slide9, "Roadmap of Project - Timeline & Development Phases", "5. Roadmap & Team Work Distribution", "PO11")

    # 5 Phase Horizontal Layout Cards
    phases = [
        ("Phase 1: Architecture & Planning", "Weeks 1 - 2", [
            ("Scope & Requirements", "Defined PO objectives & system requirements."),
            ("Tech Selection", "Selected React, Vite, Node.js, and MongoDB.")
        ]),
        ("Phase 2: Core Portals & UI", "Weeks 3 - 4", [
            ("Interviewer Dashboard", "Built session creation & candidate tracking UI."),
            ("Candidate Portal", "Designed candidate registration & flow.")
        ]),
        ("Phase 3: AI Avatar & Speech", "Weeks 5 - 6", [
            ("Avatar Synthesis", "Integrated face photo & voice profile."),
            ("Speech Pipeline", "Implemented Web Speech TTS/STT engine.")
        ]),
        ("Phase 4: LLM & Fallback Scorer", "Weeks 7 - 8", [
            ("LLM Endpoint", "Connected OpenAI GPT API with JSON schema."),
            ("Local Fallback", "Built rule-based keyword & relevance engine.")
        ]),
        ("Phase 5: Integrity & Testing", "Weeks 9 - 12", [
            ("CV Phone Detection", "Added browser canvas connected-component check."),
            ("Evaluation & Paper", "System testing & IEEE paper defense.")
        ])
    ]

    for idx, (p_title, p_time, p_pts) in enumerate(phases):
        left_pos = Inches(0.8 + idx * 2.45)
        add_card(slide9, left_pos, Inches(1.6), Inches(2.3), Inches(5.2),
                 p_title, p_pts,
                 bg_color=ACCENT_BG if idx % 2 == 1 else WHITE,
                 border_color=INDIGO if idx % 2 == 1 else CARD_BORDER,
                 title_color=NAVY)


    # ==========================================
    # SLIDE 10: Distribution of Work Among Team (PO11) - Task Allocation Matrix
    # ==========================================
    slide10 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide10, LIGHT_BG)
    add_header(slide10, "Distribution of Work Among Team", "5. Roadmap & Team Work Distribution", "PO11")

    # Work Distribution Table Card
    add_card(slide10, Inches(0.8), Inches(1.6), Inches(11.7), Inches(5.2),
             "Team Work Distribution & Responsibility Matrix", [])

    table_shape10 = slide10.shapes.add_table(6, 4, Inches(1.1), Inches(2.3), Inches(11.1), Inches(4.2))
    table10 = table_shape10.table
    table10.columns[0].width = Inches(2.2)
    table10.columns[1].width = Inches(2.2)
    table10.columns[2].width = Inches(4.5)
    table10.columns[3].width = Inches(2.2)

    headers10 = ["Module / Area", "Lead Role", "Key Responsibilities & Deliverables", "Program Outcome"]
    for i, h in enumerate(headers10):
        cell = table10.cell(0, i)
        cell.fill.solid()
        cell.fill.fore_color.rgb = NAVY
        p = cell.text_frame.paragraphs[0]
        p.text = h
        p.font.bold = True
        p.font.size = Pt(12)
        p.font.color.rgb = WHITE
        p.alignment = PP_ALIGN.CENTER

    team_data = [
        ["Frontend UI & Layouts", "Shlok Abhishek (Lead)", "React SPA architecture, Tailwind design system, Candidate & Interviewer views", "PO4 (Concept)"],
        ["AI Avatar & Speech Pipeline", "Shlok Abhishek (Lead)", "Avatar trainer module, Web Speech TTS synthesis, STT transcription, visual sync", "PO4 (Concept)"],
        ["Backend API & LLM Scorer", "Shlok Abhishek (Lead)", "Vercel serverless API, OpenAI GPT prompt engineering, MongoDB database persistence", "PO1 & PO2 (Feasibility)"],
        ["Deterministic Fallback Engine", "Shlok Abhishek (Lead)", "Local rule-based generator & multi-dimensional weighted scoring algorithm", "PO2 (Feasibility)"],
        ["CV Integrity & Research", "Shlok Abhishek (Lead)", "Canvas phone-usage detection heuristic, performance testing, IEEE LaTeX paper", "PO5 & PO11 (Roadmap)"]
    ]

    for row_idx, row_data in enumerate(team_data, start=1):
        for col_idx, text in enumerate(row_data):
            cell = table10.cell(row_idx, col_idx)
            cell.fill.solid()
            cell.fill.fore_color.rgb = ACCENT_BG if row_idx % 2 == 1 else WHITE
            p = cell.text_frame.paragraphs[0]
            p.text = text
            p.font.size = Pt(11)
            p.font.color.rgb = DARK_GRAY
            if col_idx == 0 or col_idx == 1:
                p.font.bold = True


    # ==========================================
    # SLIDE 11: System Demonstration & Key Artifacts (PO4 / Communication)
    # ==========================================
    slide11 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide11, LIGHT_BG)
    add_header(slide11, "System Demonstration & Key Deliverables", "6. System Implementation & Artifacts", "PO4")

    # 4 Cards Grid Layout
    add_card(slide11, Inches(0.8), Inches(1.6), Inches(5.6), Inches(2.5),
             "1. Interviewer Dashboard & Avatar", [
                 ("Avatar Trainer", "Upload facial photos & record voice samples."),
                 ("Session Creator", "Define role requirements, target skills, & weights.")
             ])

    add_card(slide11, Inches(6.8), Inches(1.6), Inches(5.7), Inches(2.5),
             "2. Candidate Interactive Interview Room", [
                 ("TTS Avatar Guidance", "Interactive avatar asks questions with live voice."),
                 ("Real-time STT", "Captures applicant response with speech-to-text transcript.")
             ], bg_color=ACCENT_BG, border_color=INDIGO, title_color=NAVY)

    add_card(slide11, Inches(0.8), Inches(4.3), Inches(5.6), Inches(2.5),
             "3. Automated Candidate Evaluation", [
                 ("Multi-Dimensional Score", "Displays Relevance, Accuracy, Confidence & Keywords."),
                 ("Ranked Leaderboard", "Ranks applicants instantly for HR review.")
             ], bg_color=ACCENT_BG, border_color=INDIGO, title_color=NAVY)

    add_card(slide11, Inches(6.8), Inches(4.3), Inches(5.7), Inches(2.5),
             "4. Interview Integrity & Proctoring", [
                 ("Phone-Usage Detection", "CV canvas heuristic alerts on handheld phone presence."),
                 ("Local Fallback", "Smooth transition to rule-based engine during outages.")
             ])


    # ==========================================
    # SLIDE 12: Communication & Presentation / Conclusion
    # ==========================================
    slide12 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide12, NAVY)

    # Accent top bar
    bar12 = slide12.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(0.15))
    bar12.fill.solid()
    bar12.fill.fore_color.rgb = INDIGO
    bar12.line.fill.background()

    # Header text
    add_card(slide12, Inches(0.8), Inches(0.6), Inches(11.7), Inches(6.2),
             "Conclusion & Future Scope", [
                 ("Project Achievements", "Successfully developed and verified an AI-driven automated interview platform featuring avatar synthesis, speech recognition, LLM multi-dimensional scoring, local fallback resilience, and browser-based proctoring."),
                 ("Program Outcomes Fulfilled", "PO1 (Clear Problem Definition), PO4 (Comprehensive System Concept), PO5 (Literature Survey & Matrix), PO2 (Rigorous Feasibility Analysis), PO11 (Structured Roadmap & Work Distribution)."),
                 ("Key Deliverables", "Production-ready Web SPA (React/Vite), Serverless Backend API, Comprehensive Documentation (README.md), and Academic Research Defense Paper (research_paper.tex)."),
                 ("Future Enhancements", "Integration of deep-learning object detectors (YOLO/MediaPipe), emotion and prosody voice analysis, multimodal video-transcript evaluation models, and multi-interviewer panel avatars.")
             ], bg_color=RGBColor(30, 41, 59), border_color=INDIGO, title_color=WHITE)

    # Re-color text in slide 12 card for dark theme readability
    card_shape = slide12.shapes[-1]
    tf12 = card_shape.text_frame
    for p in tf12.paragraphs[1:]:
        p.font.color.rgb = RGBColor(226, 232, 240)
        for r in p.runs:
            if r.font.bold:
                r.font.color.rgb = RGBColor(199, 210, 254)
            else:
                r.font.color.rgb = RGBColor(226, 232, 240)

    output_path = r"d:\interview\presentations\AI_Interview_Platform_Presentation.pptx"
    prs.save(output_path)
    print(f"Presentation saved successfully to {output_path}")

if __name__ == "__main__":
    create_deck()
