"""Generate clean black-and-white UML diagrams for the AI Interview Platform."""

import os

import matplotlib.pyplot as plt
import matplotlib.patches as patches


OUTPUT_DIR = r"D:\interview\diagrams"
os.makedirs(OUTPUT_DIR, exist_ok=True)

plt.rcParams["font.family"] = "DejaVu Sans"
plt.rcParams["figure.dpi"] = 220


def draw_actor(ax, x, y, label):
    """Draw a simple UML stick actor with a readable label."""
    ax.add_patch(patches.Circle((x, y + 0.28), 0.18, fill=False, edgecolor="black", linewidth=1.2))
    ax.plot([x, x], [y + 0.10, y - 0.24], color="black", lw=1.2)
    ax.plot([x - 0.20, x + 0.20], [y, y], color="black", lw=1.2)
    ax.plot([x, x - 0.16], [y - 0.24, y - 0.48], color="black", lw=1.2)
    ax.plot([x, x + 0.16], [y - 0.24, y - 0.48], color="black", lw=1.2)
    ax.text(x, y - 0.72, label, ha="center", va="center", fontsize=8, fontweight="bold")


def create_perfect_usecase_diagram():
    fig, ax = plt.subplots(figsize=(14, 9))
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 10)
    ax.axis("off")

    ax.text(8, 9.65, "AI INTERVIEW PLATFORM - USE CASE DIAGRAM", ha="center", fontsize=14, fontweight="bold")
    ax.add_patch(patches.Rectangle((2.6, 0.35), 10.8, 8.9, fill=False, edgecolor="black", linewidth=1.2))
    ax.text(8, 9.02, "AI Interview Platform", ha="center", va="center", fontsize=10, fontweight="bold")

    draw_actor(ax, 0.9, 7.25, "Interviewer / HR")
    draw_actor(ax, 0.9, 3.55, "Candidate")
    draw_actor(ax, 15.1, 7.25, "AI Service")
    draw_actor(ax, 15.1, 2.35, "Integrity Service")

    use_cases = {
        "UC1": ("Create Interview Session", 5.2, 8.0),
        "UC2": ("Configure Avatar and Media", 5.2, 6.95),
        "UC4": ("Share Interview Link", 5.2, 5.9),
        "UC13": ("Review Results and Leaderboard", 5.2, 4.85),
        "UC5": ("Register Candidate Profile", 5.2, 3.65),
        "UC6": ("Upload Resume", 5.2, 2.6),
        "UC7": ("Provide Integrity Consent", 5.2, 1.55),
        "UC8": ("Attend AI Avatar Interview", 7.6, 3.1),
        "UC3": ("Generate Questions", 10.9, 8.0),
        "UC11": ("Score Candidate Answers", 10.9, 5.65),
        "UC9": ("Record Video and Audio", 10.9, 3.1),
        "UC10": ("Transcribe Speech", 10.9, 1.9),
        "UC12": ("Verify Integrity Signals", 10.9, 0.75),
    }

    for uc_id, (label, x, y) in use_cases.items():
        ax.add_patch(patches.Ellipse((x, y), 2.75, 0.62, facecolor="white", edgecolor="black", linewidth=1.1))
        ax.text(x, y, f"{uc_id}: {label}", ha="center", va="center", fontsize=7.2)

    def association(actor_x, actor_y, uc_id, side="left"):
        _, x, y = use_cases[uc_id]
        target_x = x - 1.38 if side == "left" else x + 1.38
        ax.plot([actor_x, target_x], [actor_y, y], color="black", lw=0.9)

    # Actor-to-use-case associations.
    for uc_id in ("UC1", "UC2", "UC4", "UC13"):
        association(1.1, 7.25, uc_id)
    for uc_id in ("UC5", "UC6", "UC7", "UC8"):
        association(1.1, 3.55, uc_id)
    for uc_id in ("UC3", "UC11"):
        association(14.9, 7.25, uc_id, "right")
    association(14.9, 2.35, "UC12", "right")

    relation_arrow = dict(arrowstyle="->", color="black", linewidth=0.9, linestyle="--", mutation_scale=10)

    def relation(source, target, stereotype, offset=(0, 0.12)):
        _, sx, sy = use_cases[source]
        _, tx, ty = use_cases[target]
        # Shorten the line at both ellipses so it does not run through their labels.
        dx, dy = tx - sx, ty - sy
        length = max((dx * dx + dy * dy) ** 0.5, 0.01)
        start = (sx + dx / length * 1.4, sy + dy / length * 0.32)
        end = (tx - dx / length * 1.4, ty - dy / length * 0.32)
        ax.annotate("", xy=end, xytext=start, arrowprops=relation_arrow)
        ax.text((sx + tx) / 2 + offset[0], (sy + ty) / 2 + offset[1], stereotype, ha="center", fontsize=7)

    relation("UC1", "UC3", "<<include>>")
    relation("UC6", "UC5", "<<extend>>", (0.75, 0))
    relation("UC8", "UC9", "<<include>>")
    relation("UC9", "UC10", "<<include>>", (0.75, 0))
    relation("UC13", "UC11", "<<include>>", (0, 0.14))

    # Small key, kept outside the actor and association paths.
    ax.add_patch(patches.Rectangle((0.25, 0.25), 2.05, 1.15, fill=False, edgecolor="black", linewidth=0.8))
    ax.text(1.28, 1.2, "Relations Key", ha="center", fontsize=7.2, fontweight="bold")
    ax.plot([0.45, 0.9], [0.93, 0.93], color="black", lw=0.9)
    ax.text(1.0, 0.93, "Association", va="center", fontsize=6.5)
    ax.annotate("", xy=(0.9, 0.64), xytext=(0.45, 0.64), arrowprops=relation_arrow)
    ax.text(1.0, 0.64, "include / extend", va="center", fontsize=6.5)

    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, "diagram_usecase_perfect.png"), dpi=220, bbox_inches="tight", facecolor="white")
    plt.close()


def create_perfect_activity_diagram():
    fig, ax = plt.subplots(figsize=(8.2, 11.2))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 15)
    ax.axis("off")
    ax.text(5, 14.6, "AI INTERVIEW PLATFORM - ACTIVITY DIAGRAM", ha="center", fontsize=13, fontweight="bold")

    arrow = dict(arrowstyle="->", color="black", linewidth=1, mutation_scale=10)

    def action(y, text):
        ax.add_patch(patches.FancyBboxPatch((2.2, y), 5.6, 0.65, boxstyle="round,pad=0.06", fill=False, edgecolor="black", linewidth=1))
        ax.text(5, y + 0.325, text, ha="center", va="center", fontsize=8)

    def down(y_top, y_bottom):
        ax.annotate("", xy=(5, y_bottom), xytext=(5, y_top), arrowprops=arrow)

    ax.add_patch(patches.Circle((5, 13.95), 0.12, color="black"))
    action(12.85, "Interviewer creates a session and enters job description")
    down(13.83, 13.5)
    action(11.7, "System generates questions and interviewer shares the link")
    down(12.85, 12.35)
    action(10.55, "Candidate opens link and registers profile")
    down(11.7, 11.2)

    # Resume decision and two simple alternatives.
    ax.add_patch(patches.Polygon([[5, 9.95], [5.55, 9.55], [5, 9.15], [4.45, 9.55]], fill=False, edgecolor="black", linewidth=1))
    ax.text(5, 9.55, "Resume\nuploaded?", ha="center", va="center", fontsize=7)
    down(10.55, 9.95)
    ax.annotate("", xy=(7.0, 9.55), xytext=(5.55, 9.55), arrowprops=arrow)
    ax.text(6.2, 9.75, "Yes", fontsize=7)
    ax.add_patch(patches.FancyBboxPatch((7.0, 9.2), 2.45, 0.7, boxstyle="round,pad=0.06", fill=False, edgecolor="black", linewidth=1))
    ax.text(8.22, 9.55, "Parse resume and tailor\nquestions", ha="center", va="center", fontsize=7)
    # The alternative paths meet at one point; a single outgoing arrow avoids
    # overlapping arrowheads at the merge.
    ax.annotate("", xy=(5.28, 8.65), xytext=(8.22, 9.2), arrowprops=arrow)
    ax.plot([5.28, 5], [8.65, 8.6], color="black", lw=1)
    ax.plot([5, 5], [9.15, 8.6], color="black", lw=1)
    ax.text(5.18, 8.85, "No", fontsize=7)

    action(7.25, "Candidate provides consent and starts AI avatar interview")
    ax.annotate("", xy=(5, 7.9), xytext=(5, 8.6), arrowprops=arrow)
    ax.add_patch(patches.Rectangle((1.1, 6.65), 7.8, 0.08, color="black"))
    ax.text(5, 6.95, "Fork: answer capture and integrity monitoring", ha="center", fontsize=7.5)
    down(7.25, 6.73)

    for x, text in ((2.1, "Record video\nand audio"), (5, "Transcribe\nspeech"), (7.9, "Monitor integrity\nsignals")):
        ax.add_patch(patches.FancyBboxPatch((x - 1.0, 5.25), 2.0, 0.7, boxstyle="round,pad=0.06", fill=False, edgecolor="black", linewidth=1))
        ax.text(x, 5.6, text, ha="center", va="center", fontsize=7.2)
        ax.annotate("", xy=(x, 5.95), xytext=(x, 6.65), arrowprops=arrow)
        ax.annotate("", xy=(x, 4.8), xytext=(x, 5.25), arrowprops=arrow)

    ax.add_patch(patches.Rectangle((1.1, 4.72), 7.8, 0.08, color="black"))
    ax.text(5, 4.4, "Join: combine interview response data", ha="center", fontsize=7.5)
    action(3.25, "System scores answers, applies integrity checks, and updates results")
    down(4.72, 3.9)
    ax.add_patch(patches.Circle((5, 2.55), 0.20, fill=False, edgecolor="black", linewidth=1.2))
    ax.add_patch(patches.Circle((5, 2.55), 0.11, color="black"))
    down(3.25, 2.75)
    ax.text(5, 2.15, "Interview complete", ha="center", fontsize=8, fontweight="bold")

    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, "diagram_activity_perfect.png"), dpi=220, bbox_inches="tight", facecolor="white")
    plt.close()


if __name__ == "__main__":
    create_perfect_usecase_diagram()
    create_perfect_activity_diagram()
    print("Saved black-and-white use case and activity diagrams")
