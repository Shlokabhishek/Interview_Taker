import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { 
  ChevronRight,
  Clock,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Send,
  AlertCircle
} from 'lucide-react';
import { useInterview } from '../../contexts/InterviewContext';
import { CandidateLayout } from '../../components/layouts';
import { 
  Card, 
  Button,
  Progress,
  Loading,
  Alert
} from '../../components/shared';
import { VideoRecorder, AIAvatar, Timer } from '../../components/interview';
import { analyzeResponse, generateInterviewSummary } from '../../utils/aiAnalysis';
import { speakText, stopSpeech, createSpeechRecognition } from '../../utils/mediaUtils';
import { formatDuration } from '../../utils/helpers';

const InterviewRoom = () => {
  const { link } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { fetchSessionByLink, updateCandidate, candidates } = useInterview();
  
  const [session, setSession] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Interview state
  const [phase, setPhase] = useState('intro'); // intro, question, answering, processing, complete
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  
  // Media state
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  
  const recognitionRef = useRef(null);
  const recordingRef = useRef(null);
  const speechAdvanceTimeoutRef = useRef(null);
  const phaseRef = useRef('intro');

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const clearSpeechAdvanceTimeout = useCallback(() => {
    if (speechAdvanceTimeoutRef.current) {
      clearTimeout(speechAdvanceTimeoutRef.current);
      speechAdvanceTimeoutRef.current = null;
    }
  }, []);

  const beginAnswering = useCallback(() => {
    // Guard against double-fires (mobile TTS can fire both end+error, or we may hit the timeout fallback).
    if (phaseRef.current !== 'question') return;

    clearSpeechAdvanceTimeout();
    setIsAISpeaking(false);
    setPhase('answering');
    setIsRecording(true);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {}
    }
  }, [clearSpeechAdvanceTimeout]);

  const candidateId = useMemo(() => {
    const params = new URLSearchParams(location.search || '');
    const fromQuery = params.get('candidate');
    const fromState = location.state?.candidateId;
    if (fromQuery) return fromQuery;
    if (fromState) return fromState;
    try {
      return localStorage.getItem(`lastCandidateId_${link}`);
    } catch (e) {
      return null;
    }
  }, [link, location.search, location.state]);

  // Load session and candidate
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const foundSession = await fetchSessionByLink(link);
      if (cancelled) return;

      if (foundSession) {
        setSession(foundSession);

        const foundCandidate = candidates.find(c => c.id === candidateId);
        if (foundCandidate) {
          setCandidate(foundCandidate);
        } else {
          // Fallback when InterviewContext hasn't loaded yet or after refresh
          try {
            const stored = JSON.parse(localStorage.getItem('allCandidates') || '[]');
            const storedCandidate = stored.find(c => c.id === candidateId);
            if (storedCandidate) setCandidate(storedCandidate);
          } catch (e) {}
        }
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [link, candidateId, fetchSessionByLink, candidates]);

  // Initialize speech recognition
  useEffect(() => {
    const recognition = createSpeechRecognition();
    if (recognition) {
      recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setCurrentTranscript(prev => prev + ' ' + finalTranscript);
        }
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
      };
      
      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      clearSpeechAdvanceTimeout();
      stopSpeech();
    };
  }, [clearSpeechAdvanceTimeout]);

  // Get current question
  const currentQuestion = session?.questions?.[currentQuestionIndex];
  const totalQuestions = session?.questions?.length || 0;
  const progress = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;

  const embedTrainedAvatar = Boolean(session?.avatarConfig?.trainedAt);
  const avatarVideo = session?.avatarConfig?.avatarVideo || null;
  const avatarImage = session?.avatarConfig?.avatarImage || session?.avatarImage || null;
  const avatarName = session?.avatarConfig?.avatarName || session?.interviewerName || 'AI Interviewer';

  // Ask a question
  const askQuestion = useCallback((questionIndex) => {
    const question = session?.questions?.[questionIndex];
    if (!question) return;

    clearSpeechAdvanceTimeout();
    setCurrentQuestionIndex(questionIndex);
    setPhase('question');
    phaseRef.current = 'question';
    setIsAISpeaking(true);
    setCurrentTranscript('');
    setTimeRemaining(question.timeLimit || 120);

    // Fallback: if TTS "end" event never fires (common on some mobile browsers),
    // move to answering after an estimated time.
    const estimatedSpeakMs = Math.min(
      20000,
      Math.max(4500, (question.text || '').length * 55)
    );

    speechAdvanceTimeoutRef.current = setTimeout(() => {
      beginAnswering();
    }, estimatedSpeakMs);
  }, [session, clearSpeechAdvanceTimeout, beginAnswering]);

  // Start the interview
  const startInterview = useCallback(() => {
    // Use a non-question phase while the intro voice is playing,
    // otherwise the avatar auto-speaks the first question immediately.
    setPhase('processing');
    phaseRef.current = 'processing';
    setIsAISpeaking(true);

    // Speak intro message
    const introText = `Hello ${candidate?.name}! Welcome to your interview for ${session?.title}. I'll be asking you ${totalQuestions} questions today. Take your time with each answer, and speak clearly. Let's begin with the first question.`;

    speakText(introText, () => {
      // After intro, ask first question
      setTimeout(() => {
        askQuestion(0);
      }, 1000);
    });
  }, [candidate, session, totalQuestions, askQuestion]);

  // Submit current answer
  const submitAnswer = useCallback(() => {
    setIsRecording(false);
    setPhase('processing');
    phaseRef.current = 'processing';
    setIsAISpeaking(false);
    clearSpeechAdvanceTimeout();
    
    // Stop speech recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    // Analyze response
    const question = session?.questions?.[currentQuestionIndex];
    const analysis = analyzeResponse(
      currentTranscript,
      question?.text,
      question?.expectedKeywords || [],
      question?.weight || 1
    );

    // Store response
    const response = {
      questionId: question?.id,
      questionIndex: currentQuestionIndex,
      questionText: question?.text,
      answer: currentTranscript,
      analysis,
      timestamp: new Date().toISOString(),
    };

    setResponses(prev => [...prev, response]);

    // Move to next question or finish
    setTimeout(() => {
      if (currentQuestionIndex < totalQuestions - 1) {
        askQuestion(currentQuestionIndex + 1);
      } else {
        // Finish interview
        finishInterview([...responses, response]);
      }
    }, 500);
  }, [currentTranscript, currentQuestionIndex, session, totalQuestions, responses, askQuestion, clearSpeechAdvanceTimeout]);

  // Handle time up
  const handleTimeUp = useCallback(() => {
    submitAnswer();
  }, [submitAnswer]);

  // Finish the interview
  const finishInterview = useCallback((allResponses) => {
    setPhase('complete');
    
    // Generate summary
    const analysisResults = allResponses.map(r => r.analysis);
    const summary = generateInterviewSummary(analysisResults);
    
    // Calculate overall score
    const overallScore = analysisResults.length > 0
      ? Math.round(
          analysisResults.reduce((sum, a) => sum + (a.overallScore || 0), 0) / analysisResults.length
        )
      : 0;

    // Update candidate
    if (candidate) {
      const completedUpdate = {
        status: 'completed',
        completedAt: new Date().toISOString(),
        responses: allResponses,
        analysis: summary,
        overallScore,
      };

      updateCandidate(candidate.id, completedUpdate);

      // Ensure persistence even if navigation happens immediately after completion.
      try {
        const stored = JSON.parse(localStorage.getItem('allCandidates') || '[]');
        if (Array.isArray(stored)) {
          const updated = stored.map((c) =>
            c?.id === candidate.id ? { ...c, ...completedUpdate } : c
          );
          localStorage.setItem('allCandidates', JSON.stringify(updated));
        }
      } catch (e) {}
    }

    // Speak closing message
    speakText("Thank you for completing this interview. Your responses have been recorded and will be reviewed by the hiring team. We'll be in touch soon. Good luck!", () => {
      setIsAISpeaking(false);
    });

    // Persist and show results screen (avoids looking like it "redirected to sign in")
    if (candidate?.id) {
      try {
        localStorage.setItem(`lastCandidateId_${link}`, candidate.id);
      } catch (e) {}
      navigate(`/interview/${link}/complete?candidate=${candidate.id}`, { replace: true });
    }
  }, [candidate, link, navigate, updateCandidate]);

  // Skip to next question
  const skipQuestion = useCallback(() => {
    submitAnswer();
  }, [submitAnswer]);

  if (loading) {
    return (
      <CandidateLayout>
        <div className="min-h-[80vh] flex items-center justify-center">
          <Loading size="lg" text="Preparing interview room..." />
        </div>
      </CandidateLayout>
    );
  }

  if (!session || !candidate) {
    return (
      <CandidateLayout>
        <div className="min-h-[80vh] flex items-center justify-center p-4">
          <Card className="max-w-md w-full text-center">
            <div className="p-8">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Session Error</h2>
              <p className="text-gray-500 mb-6">
                Unable to load the interview session. Please register again.
              </p>
              <Button variant="primary" onClick={() => navigate(`/interview/${link}`)}>
                Go Back
              </Button>
            </div>
          </Card>
        </div>
      </CandidateLayout>
    );
  }

  return (
    <CandidateLayout>
      <div className="min-h-[80vh] p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-semibold text-white">{session.title}</h1>
              <p className="text-gray-400">{candidate.name}</p>
            </div>
            {phase !== 'intro' && phase !== 'complete' && (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-gray-400">Question</p>
                  <p className="text-white font-semibold">{currentQuestionIndex + 1} of {totalQuestions}</p>
                </div>
                <Progress value={progress} className="w-32" />
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className={embedTrainedAvatar ? 'space-y-6' : 'grid lg:grid-cols-3 gap-6'}>
            {/* AI Avatar Section (when not embedded) */}
            {!embedTrainedAvatar && (
              <div className="lg:col-span-1">
                <Card className="h-full bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700">
                  <div className="p-6 flex flex-col items-center justify-center h-full">
                    <AIAvatar
                      avatarVideo={avatarVideo}
                      avatarImage={avatarImage}
                      avatarName={avatarName}
                      text={phase === 'question' ? currentQuestion?.text : null}
                      autoSpeak={phase === 'question'}
                      showControls={false}
                      size="lg"
                      onSpeechEnd={beginAnswering}
                    />
                    
                    {isAISpeaking && (
                      <div className="mt-4 flex items-center gap-2 text-primary-400">
                        <div className="flex items-center gap-1">
                          <span className="w-1 h-3 bg-primary-400 rounded-full animate-pulse" />
                          <span className="w-1 h-4 bg-primary-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                          <span className="w-1 h-2 bg-primary-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="text-sm">Speaking...</span>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            )}

            {/* Main Interview Area */}
            <div className={embedTrainedAvatar ? 'space-y-6' : 'lg:col-span-2 space-y-6'}>
              {/* Intro Phase */}
              {phase === 'intro' && (
                <Card className="bg-gray-800 border-gray-700">
                  <div className="p-8 text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Ready to Begin?</h2>
                    <p className="text-gray-400 mb-6">
                      You'll answer {totalQuestions} questions via video and audio. 
                      The AI interviewer will ask each question and you'll have time to respond.
                      Your camera and microphone should be enabled.
                    </p>
                    
                    <div className="flex items-center justify-center gap-8 mb-8">
                      <div className="flex items-center gap-2 text-green-400">
                        <Video className="w-5 h-5" />
                        <span>Camera Ready</span>
                      </div>
                      <div className="flex items-center gap-2 text-green-400">
                        <Mic className="w-5 h-5" />
                        <span>Microphone Ready</span>
                      </div>
                    </div>

                    <Button 
                      variant="primary" 
                      size="xl"
                      onClick={startInterview}
                      icon={ChevronRight}
                      iconPosition="right"
                    >
                      Start Interview
                    </Button>
                  </div>
                </Card>
              )}

              {/* Question & Answering Phase */}
              {(phase === 'question' || phase === 'answering' || phase === 'processing') && (
                <>
                  {/* Question Display */}
                  <Card className="bg-gray-800 border-gray-700">
                    <div className="p-6">
                      <div className={embedTrainedAvatar ? 'flex flex-col sm:flex-row gap-6' : ''}>
                        {embedTrainedAvatar && (
                          <div className="w-full sm:w-72">
                            <AIAvatar
                              avatarVideo={avatarVideo}
                              avatarImage={avatarImage}
                              avatarName={avatarName}
                              text={phase === 'question' ? currentQuestion?.text : null}
                              autoSpeak={phase === 'question'}
                              showControls={false}
                              showSubtitles={false}
                              size="inline"
                              onSpeechEnd={beginAnswering}
                            />

                            {isAISpeaking && (
                              <div className="mt-3 flex items-center gap-2 text-primary-400">
                                <div className="flex items-center gap-1">
                                  <span className="w-1 h-3 bg-primary-400 rounded-full animate-pulse" />
                                  <span className="w-1 h-4 bg-primary-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                                  <span className="w-1 h-2 bg-primary-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                                </div>
                                <span className="text-sm">Speaking...</span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className={embedTrainedAvatar ? 'flex-1' : ''}>
                          <div className="flex items-start justify-between gap-4 mb-4">
                            <span className="text-sm text-primary-400 font-medium">
                              Question {currentQuestionIndex + 1}
                            </span>
                            {phase === 'answering' && session.settings?.showTimer && (
                              <Timer
                                duration={currentQuestion?.timeLimit || 120}
                                onTimeUp={handleTimeUp}
                                size="sm"
                              />
                            )}
                          </div>
                          <p className="text-lg text-white">{currentQuestion?.text}</p>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Video Recording Area */}
                  <Card className="bg-gray-800 border-gray-700 overflow-hidden">
                    <div className="p-4">
                      <VideoRecorder
                        onRecordingComplete={(data) => {
                          recordingRef.current = data;
                        }}
                        onRecordingStart={() => setIsRecording(true)}
                        maxDuration={currentQuestion?.timeLimit || 120}
                        autoStart={phase === 'answering'}
                        showControls={false}
                        showPreview={true}
                      />
                    </div>

                    {/* Transcript Preview */}
                    {phase === 'answering' && currentTranscript && (
                      <div className="px-4 pb-4">
                        <div className="p-4 bg-gray-700/50 rounded-lg">
                          <p className="text-sm text-gray-400 mb-2">Your response (transcribed):</p>
                          <p className="text-white text-sm">{currentTranscript}</p>
                        </div>
                      </div>
                    )}

                    {/* Recording Status */}
                    <div className="px-4 pb-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {isRecording && (
                          <div className="flex items-center gap-2 text-red-400">
                            <div className="w-3 h-3 bg-red-500 rounded-full recording-indicator" />
                            <span className="text-sm">Recording</span>
                          </div>
                        )}
                      </div>

                      {phase === 'answering' && (
                        <div className="flex items-center gap-3">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={skipQuestion}
                          >
                            Skip
                          </Button>
                          <Button
                            variant="primary"
                            icon={Send}
                            onClick={submitAnswer}
                          >
                            Submit Answer
                          </Button>
                        </div>
                      )}

                      {phase === 'processing' && (
                        <div className="flex items-center gap-2 text-primary-400">
                          <Loading size="sm" text="" />
                          <span className="text-sm">Processing...</span>
                        </div>
                      )}
                    </div>
                  </Card>
                </>
              )}

              {/* Complete Phase */}
              {phase === 'complete' && (
                <Card className="bg-gray-800 border-gray-700">
                  <div className="p-8 text-center">
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    
                    <h2 className="text-2xl font-bold text-white mb-4">Interview Complete!</h2>
                    <p className="text-gray-400 mb-6">
                      Thank you for completing this interview. Your responses have been recorded 
                      and will be reviewed by the hiring team.
                    </p>

                    <div className="p-4 bg-gray-700/50 rounded-lg mb-6">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold text-white">{totalQuestions}</p>
                          <p className="text-sm text-gray-400">Questions</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-white">{responses.length}</p>
                          <p className="text-sm text-gray-400">Answered</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-green-400">Done</p>
                          <p className="text-sm text-gray-400">Status</p>
                        </div>
                      </div>
                    </div>

                    <Button variant="primary" onClick={() => navigate('/')}>
                      Return to Home
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </CandidateLayout>
  );
};

export default InterviewRoom;
