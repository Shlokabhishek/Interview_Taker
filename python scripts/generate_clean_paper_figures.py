"""Generate spacious, non-overlapping, publication-quality figures for the IEEE paper.
Ensures:
- NO text overflows, clips, or touches any box borders.
- Generous padding, clean horizontal typography, high contrast.
- 100% truthful to the actual implementation in the project.
"""

import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches

DIAG_DIR = r"D:\interview\diagrams"
ROOT_DIR = r"D:\interview"
os.makedirs(DIAG_DIR, exist_ok=True)

plt.rcParams["font.sans-serif"] = ["DejaVu Sans", "Arial", "Helvetica"]
plt.rcParams["font.family"] = "sans-serif"
plt.rcParams["figure.dpi"] = 300

def generate_clean_architecture():
    """Generate a clean, spacious System Architecture Diagram with ZERO text overflow."""
    fig, ax = plt.subplots(figsize=(12, 7.2), facecolor="white")
    ax.set_facecolor("white")
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 70)
    ax.axis("off")

    # Outer Title
    ax.text(50, 67.5, "AI INTERVIEW PLATFORM - SYSTEM ARCHITECTURE", 
            ha="center", va="center", fontsize=13, fontweight="bold", color="#0F172A")

    # Helper function for major subsystem containers
    def draw_container(x, y, w, h, title, bg="#F8FAFC", border="#2563EB"):
        box = patches.FancyBboxPatch(
            (x, y), w, h, boxstyle="round,pad=0.6",
            facecolor=bg, edgecolor=border, linewidth=1.4
        )
        ax.add_patch(box)
        # Header banner
        header = patches.FancyBboxPatch(
            (x, y + h - 5.5), w, 5.5, boxstyle="round,pad=0.2",
            facecolor=border, edgecolor=border, linewidth=1.0
        )
        ax.add_patch(header)
        ax.text(x + w / 2, y + h - 2.8, title, ha="center", va="center",
                fontsize=9.5, fontweight="bold", color="white")

    # Helper function for inner component modules
    def draw_card(x, y, w, h, title, desc="", bg="#FFFFFF", border="#CBD5E1"):
        card = patches.FancyBboxPatch(
            (x, y), w, h, boxstyle="round,pad=0.4",
            facecolor=bg, edgecolor=border, linewidth=1.0
        )
        ax.add_patch(card)
        if desc:
            ax.text(x + w / 2, y + h - 2.4, title, ha="center", va="center",
                    fontsize=8.5, fontweight="bold", color="#1E293B")
            ax.text(x + w / 2, y + (h - 2.4) / 2, desc, ha="center", va="center",
                    fontsize=7.2, color="#475569")
        else:
            ax.text(x + w / 2, y + h / 2, title, ha="center", va="center",
                    fontsize=8.0, fontweight="bold", color="#1E293B")

    # 1. CLIENT LAYER (Left column: x = 3 to 31)
    draw_container(3, 4, 28, 60, "CLIENT PRESENTATION TIER\n(React 18 / Vite 5 / TailwindCSS)", bg="#F0F9FF", border="#0284C7")
    
    # Candidate Portal Group
    draw_card(4.5, 41, 25, 12, "Candidate Portal", 
              "• Synthetic Avatar Audio/Video Player\n• Web Speech API (Streaming STT)\n• HTML5 MediaRecorder (WebM Audio/Video)\n• Edge CV Proctoring (Canvas / Flood-Fill)",
              bg="#FFFFFF", border="#7DD3FC")

    # Interviewer Portal Group
    draw_card(4.5, 26, 25, 13, "Interviewer Portal",
              "• Session & Role Question Authoring\n• Recruiter Avatar Persona Trainer\n• Candidate Leaderboard & Rankings\n• 5-Dimension Radar Scorecards\n• Integrity Audit Review Dashboard",
              bg="#FFFFFF", border="#7DD3FC")

    # Shared Client Services
    draw_card(4.5, 6, 25, 18, "Client Core Services",
              "• Local Deterministic Fallback Scorer\n• Local Keyword & Skill Matcher\n• Client-Side Gaze & Silence Tracker\n• Browser LocalStorage Caching\n• Device Permissions Handshake",
              bg="#FFFFFF", border="#BAE6FD")

    # 2. SERVERLESS ORCHESTRATION LAYER (Center column: x = 36 to 64)
    draw_container(36, 4, 28, 60, "ORCHESTRATION & API GATEWAY\n(Node.js / Vercel Serverless Functions)", bg="#F8FAFC", border="#4F46E5")
    
    draw_card(37.5, 50, 25, 7.5, "HTTP API Router & CORS Gateway",
              "• Express Router & Vercel Functions\n• Secure Origin & Token Validation",
              bg="#FFFFFF", border="#C7D2FE")

    draw_card(37.5, 39, 25, 9.5, "Session & Candidate Controllers",
              "• POST /sessions & Link Sharing\n• POST /candidates & Consent Capture\n• GET /candidates Leaderboard Query",
              bg="#FFFFFF", border="#C7D2FE")

    draw_card(37.5, 25.5, 25, 12, "AI & Integrity Triage Gateway",
              "• POST /generate-questions Controller\n• POST /analyze-response Controller\n• POST /integrity/events Processor\n• Structured JSON Schema Enforcement",
              bg="#FFFFFF", border="#C7D2FE")

    draw_card(37.5, 6, 25, 17.5, "Operational Resilience Engine",
              "• Failover Circuit Breaker\n• Timeout Interceptor (8000 ms)\n• HTTP 429/5xx Error Trap\n• Automatic Redirection to Local Fallback\n• Immutable Audit Logging",
              bg="#FEF2F2", border="#FCA5A5")

    # 3. AI SERVICES & PERSISTENCE TIER (Right column: x = 69 to 97)
    draw_container(69, 35, 28, 29, "EXTERNAL AI ASSESSMENT ENGINE", bg="#FEFCE8", border="#CA8A04")
    
    draw_card(70.5, 46.5, 25, 11, "Cloud LLM (OpenAI gpt-4o-mini)",
              "• Role & Resume Contextual Questions\n• Semantic 5-Dimension Evaluation\n• Evidence-Based Strength Synthesis\n• Strict JSON Schema Guardrails",
              bg="#FFFFFF", border="#FDE047")

    draw_card(70.5, 36.5, 25, 8.5, "Fallback Safety Switch",
              "• Activates if Cloud AI is Unavailable\n• Guarantees Zero Interview Halts",
              bg="#FFFBEB", border="#FCD34D")

    draw_container(69, 4, 28, 29, "DATA PERSISTENCE & AUDIT TIER", bg="#F1F5F9", border="#475569")
    
    draw_card(70.5, 19.5, 25, 8.0, "Relational MySQL 3NF Database",
              "• Tables: sessions, questions, candidates\n• Tables: responses, integrity_events",
              bg="#FFFFFF", border="#94A3B8")

    draw_card(70.5, 11.5, 25, 6.5, "NoSQL Document Store (MongoDB)",
              "• Flexible session & candidate schemas",
              bg="#FFFFFF", border="#94A3B8")

    draw_card(70.5, 5.5, 25, 4.8, "Client LocalStorage (Offline Mode)",
              "• Zero-server local demonstrations",
              bg="#FFFFFF", border="#94A3B8")

    # ARROWS & DATA FLOWS (Horizontal, clear, well-separated)
    def connect_arrow(x1, y1, x2, y2, label="", color="#2563EB", style="->", rad=0.0):
        kw = dict(arrowstyle=style, color=color, lw=1.5, mutation_scale=11)
        if rad != 0.0:
            kw["connectionstyle"] = f"arc3,rad={rad}"
        ax.annotate("", xy=(x2, y2), xytext=(x1, y1), arrowprops=kw)
        if label:
            mx, my = (x1 + x2) / 2, (y1 + y2) / 2
            ax.text(mx, my + 1.2, label, ha="center", va="center", 
                    fontsize=7.2, fontweight="bold", color=color, backgroundcolor="white")

    # Client to API
    connect_arrow(31, 48, 36, 48, "HTTPS / JSON", color="#0284C7", style="<->")
    connect_arrow(31, 20, 36, 20, "Telemetry / Sync", color="#4F46E5", style="->")

    # API to AI
    connect_arrow(64, 52, 69, 52, "OpenAI API", color="#CA8A04", style="<->")
    connect_arrow(64, 40, 69, 40, "Failover Trigger", color="#DC2626", style="<-")

    # API to Database
    connect_arrow(64, 18, 69, 18, "SQL CRUD", color="#475569", style="<->")

    plt.tight_layout()
    out1 = os.path.join(DIAG_DIR, "system_architecture_clean.png")
    out2 = os.path.join(ROOT_DIR, "system_architecture.png")
    plt.savefig(out1, dpi=300, bbox_inches="tight", facecolor="white")
    plt.savefig(out2, dpi=300, bbox_inches="tight", facecolor="white")
    plt.close()
    print("Saved clean architecture:", out1)

def generate_clean_ui_overview():
    """Generate a clean, high-resolution UI overview with ZERO text clipping."""
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 6.0), facecolor="white")
    for ax in (ax1, ax2):
        ax.set_facecolor("white")
        ax.set_xlim(0, 100)
        ax.set_ylim(0, 70)
        ax.axis("off")

    # --- PANEL 1: CANDIDATE INTERVIEW ROOM ---
    # Window Frame
    ax1.add_patch(patches.FancyBboxPatch((2, 2), 96, 66, boxstyle="round,pad=0.5", facecolor="#F8FAFC", edgecolor="#94A3B8", lw=1.5))
    ax1.add_patch(patches.Rectangle((2, 62), 96, 6, facecolor="#0F172A"))
    ax1.text(6, 65, "Candidate Interview Room | Session: Full-Stack Engineer", color="#F8FAFC", fontsize=8.5, fontweight="bold", va="center")
    
    # Active status badge
    ax1.add_patch(patches.FancyBboxPatch((76, 63), 20, 4, boxstyle="round,pad=0.2", facecolor="#16A34A", edgecolor="none"))
    ax1.text(86, 65, "RECORDING ACTIVE", color="white", fontsize=6.8, fontweight="bold", ha="center", va="center")

    # Left: Recruiter AI Avatar Box
    ax1.add_patch(patches.Rectangle((5, 28), 43, 31, facecolor="#1E293B", edgecolor="#475569", lw=1.2))
    # Simulated avatar graphic
    ax1.add_patch(patches.Circle((26.5, 47), 7.5, facecolor="#E2E8F0"))
    ax1.add_patch(patches.Ellipse((26.5, 33), 19, 9, facecolor="#64748B"))
    ax1.add_patch(patches.Circle((24.5, 48.5), 1.0, facecolor="#0F172A"))
    ax1.add_patch(patches.Circle((28.5, 48.5), 1.0, facecolor="#0F172A"))
    ax1.plot([24.5, 28.5], [44.5, 44.5], color="#DC2626", lw=2)
    ax1.text(26.5, 30.5, "AI Avatar (Speaking)", color="#F1F5F9", fontsize=7.5, ha="center")
    ax1.add_patch(patches.Rectangle((6, 53), 18, 4.5, facecolor="#0284C7"))
    ax1.text(15, 55.2, "TTS Audio: Active", color="white", fontsize=6.5, ha="center", va="center")

    # Right: Candidate Live Webcam & Edge Proctoring
    ax1.add_patch(patches.Rectangle((52, 28), 43, 31, facecolor="#1E293B", edgecolor="#475569", lw=1.2))
    ax1.add_patch(patches.Circle((73.5, 46.5), 7.5, facecolor="#FDE047"))
    ax1.add_patch(patches.Ellipse((73.5, 32.5), 19, 9, facecolor="#475569"))
    ax1.text(73.5, 30.5, "Candidate Camera Feed", color="#F1F5F9", fontsize=7.5, ha="center")
    # Edge CV indicator badge
    ax1.add_patch(patches.Rectangle((53, 53), 25, 4.5, facecolor="#15803D"))
    ax1.text(65.5, 55.2, "Edge CV: No Phone Detected", color="white", fontsize=6.2, ha="center", va="center")

    # Bottom: Question & Real-Time Transcript Box
    ax1.add_patch(patches.Rectangle((5, 5), 90, 20, facecolor="#FFFFFF", edgecolor="#CBD5E1", lw=1.0))
    ax1.text(7, 21.5, "Current Question (Time Limit: 120s | Weight: High):", fontsize=7.8, fontweight="bold", color="#0F172A")
    ax1.text(7, 18.2, '"How do you optimize React applications to prevent unnecessary component re-renders?"',
             fontsize=7.2, color="#1E293B", style="italic")
    ax1.plot([7, 93], [15.5, 15.5], color="#E2E8F0", lw=0.8)
    ax1.text(7, 12.8, "Live Transcript (Web Speech API):", fontsize=7.0, fontweight="bold", color="#475569")
    ax1.text(7, 8.8, '"I use React.memo, useCallback for event handlers, and useMemo for heavy computations to keep renders fast..."',
             fontsize=6.8, color="#334155")

    ax1.text(50, -3.5, "(a) Candidate Asynchronous Interview Room with Avatar Delivery and Live Transcription",
             ha="center", fontsize=8.2, fontweight="bold", color="#0F172A")

    # --- PANEL 2: INTERVIEWER DASHBOARD ---
    ax2.add_patch(patches.FancyBboxPatch((2, 2), 96, 66, boxstyle="round,pad=0.5", facecolor="#F8FAFC", edgecolor="#94A3B8", lw=1.5))
    ax2.add_patch(patches.Rectangle((2, 62), 96, 6, facecolor="#0E7490"))
    ax2.text(6, 65, "Interviewer Portal | Candidate Evaluation & Scoring Dashboard", color="#F8FAFC", fontsize=8.5, fontweight="bold", va="center")

    # Candidate Summary Table Box
    ax2.add_patch(patches.Rectangle((5, 43), 90, 17, facecolor="#FFFFFF", edgecolor="#CBD5E1", lw=1.0))
    ax2.text(7, 56.5, "Candidate Evaluation Summary (Session: Full-Stack Engineer)", fontsize=7.8, fontweight="bold", color="#0F172A")
    ax2.plot([5, 95], [54, 54], color="#E2E8F0", lw=0.8)

    headers = ["Rank", "Candidate", "Relevance", "Accuracy", "Confidence", "Keywords", "Overall", "Status"]
    xs = [7, 17, 36, 47, 58, 68, 79, 87]
    for h, x in zip(headers, xs):
        ax2.text(x, 50.8, h, fontsize=6.8, fontweight="bold", color="#475569")

    rows = [
        ("1", "A. Sharma", "92%", "88%", "85%", "90%", "89.2", "Completed"),
        ("2", "K. Patel", "84%", "82%", "80%", "85%", "82.8", "Completed"),
        ("3", "R. Verma", "74%", "70%", "72%", "75%", "72.6", "Completed"),
    ]
    yr = 47.0
    for r in rows:
        for val, x in zip(r, xs):
            col = "#15803D" if val == "Completed" else "#1E293B"
            ax2.text(x, yr, val, fontsize=6.5, color=col)
        yr -= 3.5

    # Left Card: 5-Dimension Radar Breakdown
    ax2.add_patch(patches.Rectangle((5, 5), 43, 35, facecolor="#FFFFFF", edgecolor="#CBD5E1", lw=1.0))
    ax2.text(7, 36.5, "Score Breakdown (A. Sharma)", fontsize=7.5, fontweight="bold", color="#0F172A")
    
    bars = [("Relevance", 92, "#3B82F6"), ("Accuracy", 88, "#10B981"),
            ("Confidence", 85, "#F59E0B"), ("Keywords", 90, "#8B5CF6"), ("Overall", 89, "#EC4899")]
    yb = 30.5
    for name, val, col in bars:
        ax2.text(7, yb, f"{name}: {val}%", fontsize=6.5, color="#334155")
        ax2.add_patch(patches.Rectangle((22, yb - 1), 23, 2.8, facecolor="#F1F5F9", edgecolor="#CBD5E1"))
        ax2.add_patch(patches.Rectangle((22, yb - 1), 23 * (val / 100), 2.8, facecolor=col))
        yb -= 5.5

    # Right Card: Competencies & Evidence
    ax2.add_patch(patches.Rectangle((52, 5), 43, 35, facecolor="#FFFFFF", edgecolor="#CBD5E1", lw=1.0))
    ax2.text(54, 36.5, "Evaluation Evidence & Notes", fontsize=7.5, fontweight="bold", color="#0F172A")
    ax2.text(54, 32.5, "Strengths Identified:", fontsize=6.8, fontweight="bold", color="#15803D")
    ax2.text(54, 27.5, "• Cited React.memo & useCallback correctly.\n• Demonstrated strong technical clarity.\n• Covered 9 out of 10 target keywords.", fontsize=6.2, color="#334155")
    
    ax2.text(54, 21.0, "Skill Signals Detected:", fontsize=6.8, fontweight="bold", color="#2563EB")
    ax2.text(54, 16.0, "• Technical Depth: High (90%)\n• Communication: Clear (85%)\n• Problem Solving: Solid (82%)", fontsize=6.2, color="#334155")

    ax2.text(54, 9.5, "Integrity Status: Verified", fontsize=6.8, fontweight="bold", color="#15803D")
    ax2.text(54, 6.5, "Zero phone flags recorded during session.", fontsize=6.2, color="#475569")

    ax2.text(50, -3.5, "(b) Interviewer Portal with Candidate Rankings, 5-Dimension Scores, and Evidence Breakdown",
             ha="center", fontsize=8.2, fontweight="bold", color="#0F172A")

    plt.tight_layout()
    out1 = os.path.join(DIAG_DIR, "platform_interface_mockup.png")
    out2 = os.path.join(ROOT_DIR, "platform_interface_mockup.png")
    plt.savefig(out1, dpi=300, bbox_inches="tight", facecolor="white")
    plt.savefig(out2, dpi=300, bbox_inches="tight", facecolor="white")
    plt.close()
    print("Saved clean UI mockup:", out1)

if __name__ == "__main__":
    generate_clean_architecture()
    generate_clean_ui_overview()
