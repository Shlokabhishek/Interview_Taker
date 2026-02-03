# AI Interview Platform

A comprehensive AI-powered interview platform built with React, Vite, and TailwindCSS. This platform enables HR teams to train AI avatars with their face and voice to conduct automated video/audio interviews with multiple candidates simultaneously.

## Features

### Interviewer Portal
- **AI Avatar Training**: Train an AI avatar with your face images and voice samples
- **Session Management**: Create and manage interview sessions with custom questions
- **Candidate Tracking**: View all candidates with AI-analyzed scores and rankings
- **Dashboard**: Real-time insights and statistics on interview performance
- **Settings**: Manage profile, security, and notification preferences

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

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

### Demo Credentials

**Interviewer Account:**
- Email: `demo@interview.pro`
- Password: `demo123`

**HR Account:**
- Email: `hr@company.com`
- Password: `hr123`

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
│   ├── AuthContext.jsx
│   └── InterviewContext.jsx
├── pages/
│   ├── auth/          # Authentication pages
│   │   ├── Login.jsx
│   │   └── Register.jsx
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
├── utils/             # Utility functions
│   ├── helpers.js
│   ├── aiAnalysis.js
│   └── mediaUtils.js
├── App.jsx            # Main application with routing
├── main.jsx           # Entry point
└── index.css          # Global styles with Tailwind
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

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

1. **Sign Up/Login**: Create an account or use demo credentials
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

The platform uses several metrics to evaluate candidate responses:

- **Relevance Score**: How well the answer addresses the question
- **Keyword Matching**: Detection of expected keywords and concepts
- **Confidence Analysis**: Based on speech patterns and delivery
- **Technical Accuracy**: For domain-specific questions

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
