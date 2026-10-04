"""Generate white-background UML diagrams for the AI Interview Platform."""

import os

import matplotlib.pyplot as plt
import matplotlib.patches as patches


OUTPUT_DIR = r"D:\interview\diagrams"
os.makedirs(OUTPUT_DIR, exist_ok=True)

plt.rcParams["font.family"] = "DejaVu Sans"
plt.rcParams["figure.dpi"] = 220


def class_box(ax, x, y, width, title, attributes, methods, height=1.65):
    ax.add_patch(patches.Rectangle((x, y), width, height, fill=False, edgecolor="black", linewidth=1.1))
    title_height = 0.3
    attribute_height = 0.64
    ax.plot([x, x + width], [y + height - title_height, y + height - title_height], color="black", linewidth=0.8)
    ax.plot(
        [x, x + width],
        [y + height - title_height - attribute_height, y + height - title_height - attribute_height],
        color="black",
        linewidth=0.8,
    )
    ax.text(x + width / 2, y + height - 0.15, title, ha="center", va="center", fontsize=8, fontweight="bold")
    for index, line in enumerate(attributes):
        ax.text(x + 0.1, y + height - title_height - 0.16 - index * 0.19, line, fontsize=6.5, va="center")
    for index, line in enumerate(methods):
        ax.text(x + 0.1, y + height - title_height - attribute_height - 0.16 - index * 0.19, line, fontsize=6.5, va="center")


def arrow(ax, start, end, label=None, label_offset=(0, 0)):
    ax.annotate("", xy=end, xytext=start, arrowprops={"arrowstyle": "-|>", "color": "black", "linewidth": 0.9, "mutation_scale": 9})
    if label:
        midpoint = ((start[0] + end[0]) / 2 + label_offset[0], (start[1] + end[1]) / 2 + label_offset[1])
        ax.text(*midpoint, label, fontsize=6.5, ha="center", va="center", backgroundcolor="white")


def create_class_diagram():
    fig, ax = plt.subplots(figsize=(12, 8), facecolor="white")
    ax.set_facecolor("white")
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 9)
    ax.axis("off")
    ax.text(7, 8.65, "Class Diagram of AI Interview Platform", ha="center", fontsize=13, fontweight="bold")

    class_box(ax, 0.5, 6.45, 2.8, "Interviewer", ["- interviewerId: String", "- name: String", "- email: String"], ["+ createSession(): Session", "+ viewResults(): Report"])
    class_box(ax, 4.1, 6.45, 3.0, "InterviewSession", ["- sessionId: String", "- jobTitle: String", "- status: SessionStatus"], ["+ generateQuestions(): void", "+ shareLink(): String", "+ closeSession(): void"])
    class_box(ax, 8.0, 6.45, 2.8, "Candidate", ["- candidateId: String", "- name: String", "- email: String"], ["+ register(): void", "+ uploadResume(): Resume", "+ startInterview(): void"])
    class_box(ax, 11.2, 6.45, 2.3, "Resume", ["- resumeId: String", "- fileUrl: String", "- parsedText: String"], ["+ upload(): void", "+ parse(): String"])

    class_box(ax, 1.0, 3.55, 2.9, "Question", ["- questionId: String", "- text: String", "- category: String"], ["+ create(): Question", "+ getText(): String"])
    class_box(ax, 4.55, 3.55, 3.0, "InterviewResponse", ["- responseId: String", "- transcript: String", "- videoUrl: String"], ["+ record(): void", "+ transcribe(): String", "+ getDuration(): int"])
    class_box(ax, 8.35, 3.55, 2.8, "Evaluation", ["- score: double", "- feedback: String", "- integrityScore: double"], ["+ scoreResponse(): double", "+ generateFeedback(): String"])
    class_box(ax, 11.45, 3.55, 2.0, "AIService", ["- provider: String"], ["+ generateQuestions(): Question[]", "+ evaluate(): Evaluation"])

    class_box(ax, 3.0, 0.55, 2.8, "MediaRecorder", ["- recordingId: String", "- videoUrl: String", "- audioUrl: String"], ["+ start(): void", "+ stop(): void", "+ save(): void"])
    class_box(ax, 6.6, 0.55, 2.8, "IntegrityMonitor", ["- eventCount: int", "- warningCount: int"], ["+ monitorGaze(): void", "+ detectViolation(): boolean", "+ getScore(): double"])
    class_box(ax, 10.2, 0.55, 2.5, "Report", ["- reportId: String", "- createdAt: Date"], ["+ calculateScore(): double", "+ export(): String"])

    arrow(ax, (3.3, 7.25), (4.1, 7.25), "creates")
    arrow(ax, (7.1, 7.25), (8.0, 7.25), "hosts")
    arrow(ax, (10.8, 7.25), (11.2, 7.25), "uploads")
    arrow(ax, (5.5, 6.45), (2.45, 5.2), "contains 1..*")
    arrow(ax, (5.6, 6.45), (6.05, 5.2), "records")
    arrow(ax, (8.9, 6.45), (7.1, 5.2), "submits")
    arrow(ax, (7.55, 4.35), (8.35, 4.35), "evaluated by")
    arrow(ax, (10.2, 4.35), (11.45, 4.35), "uses")
    arrow(ax, (6.05, 3.55), (4.4, 2.2), "saved by")
    arrow(ax, (7.55, 3.9), (7.8, 2.2), "monitored by")
    arrow(ax, (9.75, 3.55), (11.4, 2.2), "summarized in")

    plt.tight_layout()
    fig.savefig(os.path.join(OUTPUT_DIR, "uml_class_diagram_ai_interview_platform.png"), dpi=220, bbox_inches="tight", facecolor="white")
    plt.close(fig)


def create_statechart():
    fig, ax = plt.subplots(figsize=(8.5, 10), facecolor="white")
    ax.set_facecolor("white")
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 15)
    ax.axis("off")
    ax.text(5, 14.6, "Statechart of Interview Session", ha="center", fontsize=13, fontweight="bold")

    arrow_style = {"arrowstyle": "->", "color": "black", "linewidth": 1.0, "mutation_scale": 10}

    def state(x, y, label, width=3.2):
        ax.add_patch(patches.FancyBboxPatch((x, y), width, 0.62, boxstyle="round,pad=0.06", fill=False, edgecolor="black", linewidth=1.0))
        ax.text(x + width / 2, y + 0.31, label, ha="center", va="center", fontsize=7.5)

    def transition(start, end, label, label_position=None):
        ax.annotate("", xy=end, xytext=start, arrowprops=arrow_style)
        if label_position is None:
            label_position = ((start[0] + end[0]) / 2 + 0.15, (start[1] + end[1]) / 2 + 0.08)
        ax.text(*label_position, label, fontsize=6.5, ha="center", va="center", backgroundcolor="white")

    ax.add_patch(patches.Circle((5, 13.85), 0.12, color="black"))
    state(3.4, 12.65, "Session Created")
    state(3.4, 11.0, "Questions Prepared")
    state(3.4, 9.35, "Candidate Registered")
    state(3.4, 7.7, "Interview In Progress")
    state(0.55, 5.45, "Response Captured", 2.7)
    state(3.65, 5.45, "Integrity Checked", 2.7)
    state(6.75, 5.45, "Answer Evaluated", 2.7)
    state(3.4, 3.45, "Results Published")
    state(3.4, 1.75, "Session Completed")
    state(7.0, 9.35, "Session Cancelled", 2.4)
    state(7.0, 7.7, "Integrity Violation", 2.4)

    transition((5, 13.85), (5, 13.27), "createSession")
    transition((5, 12.65), (5, 11.62), "generateQuestions")
    transition((5, 11.0), (5, 9.97), "registerCandidate")
    transition((5, 9.35), (5, 8.32), "startInterview [consentGiven]")
    transition((4.55, 7.7), (1.9, 6.07), "submitAnswer", (3.15, 6.95))
    transition((5.0, 7.7), (5.0, 6.07), "monitorSignals", (5.6, 6.85))
    transition((5.45, 7.7), (8.0, 5.97), "violationDetected\n[severityHigh]", (7.85, 7.3))
    transition((3.25, 5.76), (3.65, 5.76), "responseRecorded", (3.45, 6.2))
    transition((6.35, 5.76), (6.75, 5.76), "integrityPassed", (6.55, 6.2))
    transition((8.2, 5.45), (8.2, 4.55), "terminateInterview", (8.95, 5.0))
    transition((6.75, 5.45), (5.85, 4.07), "allAnswersScored", (6.85, 4.65))
    transition((5.0, 3.45), (5.0, 2.37), "candidateReviewsResults")
    transition((8.2, 9.35), (8.2, 8.32), "cancelSession")
    transition((7.0, 6.0), (6.35, 6.0), "warningIssued\n[severityLow]", (6.65, 6.55))

    ax.add_patch(patches.Circle((5, 1.2), 0.2, fill=False, edgecolor="black", linewidth=1.1))
    ax.add_patch(patches.Circle((5, 1.2), 0.11, color="black"))
    transition((5, 1.75), (5, 1.4), "complete")
    ax.text(5, 0.72, "Final state", ha="center", fontsize=7.5, fontweight="bold")

    plt.tight_layout()
    fig.savefig(os.path.join(OUTPUT_DIR, "uml_statechart_interview_session.png"), dpi=220, bbox_inches="tight", facecolor="white")
    plt.close(fig)


if __name__ == "__main__":
    create_class_diagram()
    create_statechart()
    print("Saved white-background UML class and statechart PNGs")