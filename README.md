# AI Interview Platform

A comprehensive AI-powered interview platform built with React, Vite, and TailwindCSS. This platform enables HR teams to train AI avatars with their face and voice to conduct automated video/audio interviews with multiple candidates simultaneously.

## Features

### Interviewer Portal
- **AI Avatar Training**: Train an AI avatar with your face images and voice samples
- **Session Management**: Create and manage interview sessions with custom questions
- **Candidate Tracking**: View all candidates with AI-analyzed scores and rankings
- **Dashboard**: Real-time insights and statistics on interview performance
- **Settings**: Manage the local interviewer profile, share links, backend URL, and notification preferences

### Candidate Portal
- **Easy Registration**: Join interviews via unique links
- **AI-Conducted Interviews**: Interact with AI avatar through video/audio responses
- **Real-time Transcription**: Speech-to-text for answer processing
- **Progress Tracking**: Visual progress through interview questions

## Tech Stack

- **React 18.2** - UI framework
- **Vite 5.0** - Build tool with HMR
- **TailwindCSS 3.3** - Utility-first CSS
- **React Router DOM 6** - Client-side routing
- **Lucide React** - Icon library
- **Recharts** - Data visualization
- **Web Speech API** - Speech synthesis and recognition
- **MediaRecorder API** - Video/audio recording

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm 9+

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Shlokabhishek/Interview_Taker.git
cd Interview_Taker
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Set these values as needed:
- `MONGODB_URI`
- `MONGODB_DB` (optional, defaults to `ai_interview_platform`)
- `OPENAI_API_KEY` (required for AI question generation and scoring)
- `OPENAI_MODEL` (optional, defaults to `gpt-5.6-luna`)

4. Start the development server:
```bash
npm run dev
```

5. Open `https://localhost:3001` in your browser

### Optional Backend (Cross-Device Results)

By default, development can still run without backend persistence, but AI generation/scoring and cross-device results require the backend.

To make sessions/candidates available across devices, run the included lightweight backend:

```bash
npm run dev:backend
```

For LAN testing, start the frontend in auto-LAN mode (detects your machine IP and configures base URLs automatically):

```bash
npm run dev:lan
```

Or start backend + frontend together in one command:

```bash
npm run dev:lan:all
```

Then set the backend URL in the app:
- Go to `Interviewer -> Settings`
- Set `Backend API URL (Optional)` to `http://<your-ip>:8787`

For sharing interview links on LAN, set:
- `Public Base URL (Share Links)` to `http://<your-ip>:3001` (or your deployed domain)

Notes for LAN mode:
- `npm run dev:lan` sets `VITE_API_BASE_URL` to `http://<detected-ip>:8787`
- `npm run dev:lan` sets `VITE_PUBLIC_BASE_URL` to `http://<detected-ip>:3001`
- `.env.lan.example` is included for manual overrides if you need a fixed IP profile

### Vercel Deployment Notes

This repo includes Vercel Serverless Functions under `api/` for sessions/candidates. For persistence on Vercel, add a MongoDB connection string as `MONGODB_URI` (and optional `MONGODB_DB`) in your Vercel project environment variables.

For AI features on Vercel, also add `OPENAI_API_KEY` and optionally `OPENAI_MODEL`.

If you previously set `Backend API URL (Optional)` to `http://localhost:8787` (or similar) during local development, clear it before using the deployed site; otherwise sessions will never reach the deployed `/api` and candidates may see **Interview Not Found**.

## Project Structure

```
src/
├── components/
│   ├── interview/     # Interview-specific components
│   │   ├── VideoRecorder.jsx
│   │   ├── AIAvatar.jsx
│   │   ├── Timer.jsx
│   │   └── SpeechToText.jsx
│   ├── layouts/       # Page layouts
│   │   ├── InterviewerLayout.jsx
│   │   └── CandidateLayout.jsx
│   └── shared/        # Reusable UI components
│       ├── Button.jsx
│       ├── Input.jsx
│       ├── Card.jsx
│       ├── Modal.jsx
│       └── ...
├── contexts/          # React context providers
│   ├── AuthContext.jsx    # Local no-auth interviewer profile
│   └── InterviewContext.jsx
├── pages/
│   ├── candidate/     # Candidate portal pages
│   │   ├── CandidateRegistration.jsx
│   │   ├── InterviewRoom.jsx
│   │   └── InterviewComplete.jsx
│   └── interviewer/   # Interviewer portal pages
│       ├── LandingPage.jsx
│       ├── Dashboard.jsx
│       ├── Sessions.jsx
│       ├── CreateSession.jsx
│       ├── SessionDetail.jsx
│       ├── AvatarTraining.jsx
│       ├── Candidates.jsx
│       └── Settings.jsx
├── services/          # App, AI, media, and question services
│   ├── app.js
│   ├── ai.js
│   ├── media.js
│   └── questions.js
├── App.jsx            # Main application with routing
├── main.jsx           # Entry point
└── index.css          # Global styles with Tailwind
```

Generated and supporting artifacts are kept outside the runtime entrypoint:

- `docs/` - SRS files, templates, project analysis, and Mermaid documentation
- `presentations/` - generated PowerPoint presentations
- `html files/` - standalone presentation and flowchart HTML artifacts
- `python scripts/` - diagram, presentation, and document generation tools
- `scripts/` - JavaScript development launchers

## Available Scripts

- `npm run dev` - Start development server
- `npm run dev:lan` - Start development server with auto-detected LAN IP base URLs
- `npm run dev:lan:all` - Start backend and LAN frontend together
- `npm run dev all` - Alias behavior that also starts backend and LAN frontend together
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

When using `npm run dev:lan:all` (or `npm run dev all`), if `8787` or `3001` is already occupied, the launcher automatically picks the next free ports and prints the exact URLs to open.

## Deployment

This project is configured for deployment on Vercel:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Vercel will automatically detect the Vite configuration
4. Deploy!

### Vercel Configuration

The `vercel.json` file is already configured with:
- SPA routing rewrites
- Security headers
- Build output settings

## How It Works

### For Interviewers/HR

1. **Open Dashboard**: Use the local no-auth interviewer profile
2. **Train Your Avatar**: Upload face images and record voice samples
3. **Create Session**: Add interview questions with evaluation criteria
4. **Share Link**: Send the unique interview link to candidates
5. **Review Results**: View AI-analyzed responses with scores and rankings

### For Candidates

1. **Open Link**: Click the interview link shared by the interviewer
2. **Register**: Enter your name and email
3. **Start Interview**: Enable camera and microphone
4. **Answer Questions**: Respond to AI avatar's questions via video/audio
5. **Complete**: Submit your interview for review

## AI Analysis

The platform sends each candidate answer to the server-side AI analysis endpoint and evaluates it against the question, expected keywords, and interviewer criteria. The response includes:

- **Relevance Score**: How well the answer addresses the question
- **Keyword Matching**: Detection of expected keywords and concepts
- **Confidence Analysis**: Clarity, specificity, and credible ownership in the answer
- **Technical Accuracy**: Practical correctness for domain-specific questions
- **Strengths and Improvements**: Short evidence-based review notes

## Browser Support

- Chrome 80+ (Recommended)
- Firefox 75+
- Safari 14+
- Edge 80+

**Note**: Speech recognition works best in Chrome.

## Privacy & Security

- All data is stored locally in the browser (localStorage)
- Video/audio recordings are processed client-side
- GDPR-compliant data handling notices
- Secure session management

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue on GitHub or contact the development team.

---

Built with ❤️ for modern hiring teams
#   A I - I n t e r v i e w - p l a t f o r m  
 