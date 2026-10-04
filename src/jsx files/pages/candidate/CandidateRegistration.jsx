import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  FileText, 
  ArrowRight,
  AlertCircle,
  Video,
  Mic,
  Shield
} from 'lucide-react';
import { useInterview } from '../../contexts/InterviewContext';
import { CandidateLayout } from '../../components/layouts';
import { 
  Card, 
  CardContent, 
  Button, 
  Input,
  Alert,
  Loading
} from '../../components/shared';
import { getApiBaseUrl, isValidEmail } from '../../services/app';
import { checkMediaSupport } from '../../services/media';
import { analyzeResumeWithAI } from '../../services/ai';

const CandidateRegistration = () => {
  const { link } = useParams();
  const navigate = useNavigate();
  const { fetchSessionByLink, addCandidate } = useInterview();
  
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [resume, setResume] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [resumeInsights, setResumeInsights] = useState(null);
  const [analyzingResume, setAnalyzingResume] = useState(false);
  const [errors, setErrors] = useState({});
  const [mediaSupport, setMediaSupport] = useState({ hasVideo: false, hasAudio: false });
  const [submitting, setSubmitting] = useState(false);
  const [apiHealth, setApiHealth] = useState(null);
  const [apiHealthError, setApiHealthError] = useState('');
  const [integrityConsent, setIntegrityConsent] = useState(false);

  // Load session
  useEffect(() => {
    const loadSession = async () => {
      const foundSession = await fetchSessionByLink(link);
      if (foundSession) {
        setSession(foundSession);
      }
      setLoading(false);
    };
    loadSession();
  }, [link, fetchSessionByLink]);

  useEffect(() => {
    if (loading || session) return;

    const apiBase = getApiBaseUrl();
    if (!apiBase) return;

    fetch(`${apiBase}/health`)
      .then((r) => r.json())
      .then((json) => {
        setApiHealth(json);
        setApiHealthError('');
      })
      .catch((e) => {
        setApiHealth(null);
        setApiHealthError(e?.message || 'API health check failed');
      });
  }, [loading, session]);

  // Check media support
  useEffect(() => {
    const checkMedia = async () => {
      const support = await checkMediaSupport();
      setMediaSupport(support);
    };
    checkMedia();
  }, []);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleResumeChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setErrors(prev => ({ ...prev, resume: 'File size must be less than 5MB' }));
        return;
      }

      setResume(file);
      setResumeInsights(null);
      setAnalyzingResume(true);
      setErrors(prev => ({ ...prev, resume: '' }));

      try {
        const text = await file.text();
        const cleanedText = text
          .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
          .replace(/[ \t]+/g, ' ')
          .replace(/\n\s*\n/g, '\n')
          .trim();

        if (cleanedText.length < 30) {
          setErrors(prev => ({
            ...prev,
            resume: 'This file was uploaded, but text could not be extracted clearly. Please upload a text-based resume or paste it as text.',
          }));
          setResumeText('');
          return;
        }

        setResumeText(cleanedText);
        try {
          const insights = await analyzeResumeWithAI({
            resumeText: cleanedText,
            jobDescription: session?.jobDescription || session?.description || '',
            defaultTimeLimit: session?.settings?.defaultTimePerQuestion || 120,
          });
          setResumeInsights(insights);
          setErrors((prev) => ({ ...prev, resume: '' }));
        } catch (error) {
          setErrors((prev) => ({
            ...prev,
            resume: error?.message || 'Unable to analyze this resume. Try a text-based resume file.',
          }));
        }
      } catch (error) {
        setErrors(prev => ({
          ...prev,
          resume: error?.message || 'Unable to analyze this resume. Try a text-based resume file.',
        }));
      } finally {
        setAnalyzingResume(false);
        e.target.value = '';
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!mediaSupport.hasVideo || !mediaSupport.hasAudio) {
      newErrors.media = 'Camera and microphone are required for this interview';
    }

    if (!integrityConsent) {
      newErrors.consent = 'Please review and acknowledge the interview integrity disclosure';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const candidate = addCandidate({
        ...formData,
        sessionId: session.id,
        resumeFile: resume?.name,
        resumeText,
        resumeInsights,
        status: 'registered',
        integrityConsent: {
          granted: true,
          grantedAt: new Date().toISOString(),
          policy: 'derived-events-only; sampled frames for server re-verification; human review required',
        },
      });

      try {
        localStorage.setItem(`lastCandidateId_${link}`, candidate.id);
      } catch (e) {}

      // Navigate to interview room
      navigate(`/interview/${link}/room?candidate=${candidate.id}`, {
        state: { candidateId: candidate.id } 
      });
    } catch (error) {
      setErrors({ form: 'Failed to register. Please try again.' });
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <CandidateLayout>
        <div className="min-h-[80vh] flex items-center justify-center">
          <Loading size="lg" text="Loading interview..." />
        </div>
      </CandidateLayout>
    );
  }

  if (!session) {
    return (
      <CandidateLayout>
        <div className="min-h-[80vh] flex items-center justify-center p-4">
          <Card className="max-w-md w-full text-center">
            <CardContent className="py-12">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Interview Not Found</h2>
              <p className="text-gray-500 mb-6">
                This interview link is invalid, expired, or the session is not available on this device.
                If you're using a deployed link, make sure the backend is configured so sessions can be fetched across devices.
              </p>
              {(apiHealth || apiHealthError) && (
                <div className="text-left bg-gray-50 border border-gray-200 rounded-lg p-3 mb-6">
                  <p className="text-xs font-medium text-gray-700 mb-1">Diagnostics</p>
                  <p className="text-xs text-gray-600">API base: {getApiBaseUrl() || '(disabled)'}</p>
                  {apiHealth && (
                    <p className="text-xs text-gray-600">API health: ok={String(apiHealth.ok)} mongo={String(apiHealth.mongo)}</p>
                  )}
                  {apiHealth?.ok && apiHealth?.mongo === false && (
                    <p className="text-xs text-yellow-700 mt-1">
                      Backend storage is not configured. Set MONGODB_URI in your deployment and redeploy, then create the session again.
                    </p>
                  )}
                  {apiHealthError && (
                    <p className="text-xs text-red-600">API health error: {apiHealthError}</p>
                  )}
                </div>
              )}
              <Button variant="primary" onClick={() => navigate('/')}>
                Go to Homepage
              </Button>
            </CardContent>
          </Card>
        </div>
      </CandidateLayout>
    );
  }

  if (session.status === 'closed') {
    return (
      <CandidateLayout>
        <div className="min-h-[80vh] flex items-center justify-center p-4">
          <Card className="max-w-md w-full text-center">
            <CardContent className="py-12">
              <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Interview Closed</h2>
              <p className="text-gray-500 mb-6">
                This interview session has been closed and is no longer accepting candidates.
              </p>
              <Button variant="primary" onClick={() => navigate('/')}>
                Go to Homepage
              </Button>
            </CardContent>
          </Card>
        </div>
      </CandidateLayout>
    );
  }

  return (
    <CandidateLayout>
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">{session.title}</h1>
            <p className="text-gray-400">
              {session.questions?.length || 0} questions • Approx. {session.settings?.totalDuration || 30} minutes
            </p>
          </div>

          <Card className="shadow-2xl">
            <CardContent className="p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Register to Begin</h2>

              {errors.form && (
                <Alert type="error" message={errors.form} className="mb-6" />
              )}

              {errors.media && (
                <Alert 
                  type="warning" 
                  message={errors.media} 
                  className="mb-6"
                />
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  label="Full Name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  icon={User}
                  error={errors.name}
                  required
                />

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="you@email.com"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  icon={Mail}
                  error={errors.email}
                  required
                />

                <Input
                  label="Phone Number (Optional)"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                />

                {/* Resume Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Resume (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".txt,.md,.rtf,.pdf,.doc,.docx,text/plain,text/markdown"
                      onChange={handleResumeChange}
                      className="hidden"
                      id="resume-upload"
                    />
                    <label
                      htmlFor="resume-upload"
                      className="flex items-center gap-3 px-4 py-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <FileText className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600">
                        {resume ? resume.name : 'Upload your resume'}
                      </span>
                    </label>
                  </div>
                  {errors.resume && (
                    <p className="mt-1.5 text-sm text-red-600">{errors.resume}</p>
                  )}
                  <p className="mt-1.5 text-xs text-gray-500">
                    Text-based resumes work best. PDF/DOC uploads are analyzed only when browser text extraction succeeds.
                  </p>
                </div>

                {analyzingResume && (
                  <Alert type="info" message="Analyzing resume and creating personalized practice questions..." />
                )}

                {resumeInsights && (
                  <div className="rounded-lg border border-primary-100 bg-primary-50 p-4 space-y-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Resume AI Summary</p>
                      <p className="text-sm text-gray-700 mt-1">{resumeInsights.summary}</p>
                    </div>

                    {resumeInsights.skills?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">Extracted Skills</p>
                        <div className="flex flex-wrap gap-2">
                          {resumeInsights.skills.slice(0, 10).map((skill) => (
                            <span key={skill} className="px-2.5 py-1 rounded-full bg-white text-xs text-primary-700 border border-primary-100">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {resumeInsights.projects?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">Projects Found</p>
                        <div className="space-y-2">
                          {resumeInsights.projects.slice(0, 3).map((project, index) => (
                            <div key={`${project.name}-${index}`} className="rounded-md bg-white border border-primary-100 p-3">
                              <p className="text-sm font-medium text-gray-900">{project.name}</p>
                              <p className="text-xs text-gray-600 mt-1">{project.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {resumeInsights.questions?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">Personalized Practice Questions</p>
                        <ol className="space-y-2">
                          {resumeInsights.questions.slice(0, 4).map((question, index) => (
                            <li key={`${question.text}-${index}`} className="text-sm text-gray-700">
                              {index + 1}. {question.text}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                )}

                {/* Requirements */}
                <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                  <h4 className="font-medium text-gray-900">Requirements</h4>
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-full ${mediaSupport.hasVideo ? 'bg-green-100' : 'bg-red-100'}`}>
                      <Video className={`w-4 h-4 ${mediaSupport.hasVideo ? 'text-green-600' : 'text-red-600'}`} />
                    </div>
                    <span className="text-sm text-gray-600">Camera access required</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-full ${mediaSupport.hasAudio ? 'bg-green-100' : 'bg-red-100'}`}>
                      <Mic className={`w-4 h-4 ${mediaSupport.hasAudio ? 'text-green-600' : 'text-red-600'}`} />
                    </div>
                    <span className="text-sm text-gray-600">Microphone access required</span>
                  </div>
                </div>

                <label className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={integrityConsent}
                    onChange={(event) => setIntegrityConsent(event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600"
                  />
                  <span className="text-sm text-gray-600">
                    I understand that camera, microphone, and environment signals may be analyzed for interview integrity. The system produces a reviewable trust score, does not automatically reject me, and may retain derived events plus occasional verification frames according to the interviewer&apos;s policy.
                  </span>
                </label>
                {errors.consent && <p className="text-sm text-red-600">{errors.consent}</p>}

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  loading={submitting}
                  icon={ArrowRight}
                  iconPosition="right"
                >
                  Start Interview
                </Button>
              </form>

              {/* Privacy Note */}
              <div className="mt-6 flex items-start gap-2 text-xs text-gray-500">
                <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>
                  Your video and audio responses will be recorded and analyzed. By proceeding, 
                  you consent to this data collection, resume-based question personalization, and interview integrity checks.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </CandidateLayout>
  );
};

export default CandidateRegistration;
