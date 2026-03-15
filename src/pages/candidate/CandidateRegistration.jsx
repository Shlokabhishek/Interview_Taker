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
import { isValidEmail } from '../../utils/helpers';
import { checkMediaSupport } from '../../utils/mediaUtils';

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
  const [errors, setErrors] = useState({});
  const [mediaSupport, setMediaSupport] = useState({ hasVideo: false, hasAudio: false });
  const [submitting, setSubmitting] = useState(false);

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

  const handleResumeChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setErrors(prev => ({ ...prev, resume: 'File size must be less than 5MB' }));
        return;
      }
      setResume(file);
      setErrors(prev => ({ ...prev, resume: '' }));
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
        status: 'registered',
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
                This interview link is invalid or has expired. Please check the link and try again.
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
                      accept=".pdf,.doc,.docx"
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
                        {resume ? resume.name : 'Upload your resume (PDF, DOC)'}
                      </span>
                    </label>
                  </div>
                  {errors.resume && (
                    <p className="mt-1.5 text-sm text-red-600">{errors.resume}</p>
                  )}
                </div>

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
                  you consent to this data collection in accordance with our privacy policy.
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
