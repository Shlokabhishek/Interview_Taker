import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  ArrowRight,
  Save,
  Plus,
  Trash2,
  GripVertical,
  Clock,
  Star,
  Settings,
  FileText,
  Tag
} from 'lucide-react';
import { useInterview } from '../../contexts/InterviewContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  Button, 
  Input, 
  Textarea, 
  Select, 
  Badge,
  Alert
} from '../../components/shared';
import { QUESTION_TYPES, QUESTION_TYPE_LABELS, QUESTION_TYPE_COLORS, generateId } from '../../utils/helpers';

const CreateSession = () => {
  const navigate = useNavigate();
  const { createSession } = useInterview();
  const { user } = useAuth();
  
  const [step, setStep] = useState(1);
  const [sessionData, setSessionData] = useState({
    title: '',
    description: '',
    questions: [],
    settings: {
      totalDuration: 30,
      defaultTimePerQuestion: 120,
      allowLateEntry: true,
      showTimer: true,
      recordVideo: true,
      recordAudio: true,
    },
  });
  const [errors, setErrors] = useState({});

  // Question form state
  const [currentQuestion, setCurrentQuestion] = useState({
    text: '',
    type: QUESTION_TYPES.TECHNICAL,
    timeLimit: 120,
    weight: 1,
    isImportant: false,
    expectedKeywords: '',
    evaluationCriteria: '',
  });

  const handleSessionChange = (field, value) => {
    setSessionData(prev => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSettingsChange = (field, value) => {
    setSessionData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value,
      },
    }));
  };

  const handleQuestionChange = (field, value) => {
    setCurrentQuestion(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const addQuestion = () => {
    if (!currentQuestion.text.trim()) {
      setErrors({ questionText: 'Question text is required' });
      return;
    }

    const newQuestion = {
      id: generateId(),
      ...currentQuestion,
      expectedKeywords: currentQuestion.expectedKeywords
        .split(',')
        .map(k => k.trim())
        .filter(Boolean),
      order: sessionData.questions.length + 1,
    };

    setSessionData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
    }));

    // Reset form
    setCurrentQuestion({
      text: '',
      type: QUESTION_TYPES.TECHNICAL,
      timeLimit: 120,
      weight: 1,
      isImportant: false,
      expectedKeywords: '',
      evaluationCriteria: '',
    });
    setErrors({});
  };

  const removeQuestion = (questionId) => {
    setSessionData(prev => ({
      ...prev,
      questions: prev.questions
        .filter(q => q.id !== questionId)
        .map((q, index) => ({ ...q, order: index + 1 })),
    }));
  };

  const validateStep = (stepNum) => {
    const newErrors = {};

    if (stepNum === 1) {
      if (!sessionData.title.trim()) {
        newErrors.title = 'Session title is required';
      }
    }

    if (stepNum === 2) {
      if (sessionData.questions.length === 0) {
        newErrors.questions = 'Add at least one question';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const handleSubmit = () => {
    if (!validateStep(2)) return;

    const session = createSession({
      ...sessionData,
      status: 'draft',
      avatarConfig: user?.avatarConfig || null,
    });

    navigate(`/interviewer/sessions/${session.id}`);
  };

  const questionTypeOptions = Object.entries(QUESTION_TYPE_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/interviewer/sessions')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Interview Session</h1>
          <p className="text-gray-600">Set up questions and configure your interview.</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-4">
        {[
          { num: 1, label: 'Basic Info' },
          { num: 2, label: 'Questions' },
          { num: 3, label: 'Settings' },
        ].map((s, index) => (
          <React.Fragment key={s.num}>
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step >= s.num
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {s.num}
              </div>
              <span className={`text-sm ${step >= s.num ? 'text-gray-900' : 'text-gray-500'}`}>
                {s.label}
              </span>
            </div>
            {index < 2 && (
              <div className={`flex-1 h-0.5 ${step > s.num ? 'bg-primary-600' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Session Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Input
              label="Session Title"
              placeholder="e.g., Software Engineer Interview - Q1 2026"
              value={sessionData.title}
              onChange={(e) => handleSessionChange('title', e.target.value)}
              error={errors.title}
              required
            />

            <Textarea
              label="Description"
              placeholder="Describe the purpose of this interview session..."
              value={sessionData.description}
              onChange={(e) => handleSessionChange('description', e.target.value)}
              rows={3}
            />

            <div className="flex justify-end">
              <Button variant="primary" icon={ArrowRight} iconPosition="right" onClick={nextStep}>
                Next: Add Questions
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Questions */}
      {step === 2 && (
        <div className="space-y-6">
          {/* Add Question Form */}
          <Card>
            <CardHeader>
              <CardTitle>Add Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                label="Question Text"
                placeholder="Enter your interview question..."
                value={currentQuestion.text}
                onChange={(e) => handleQuestionChange('text', e.target.value)}
                error={errors.questionText}
                rows={3}
              />

              <div className="grid sm:grid-cols-3 gap-4">
                <Select
                  label="Question Type"
                  value={currentQuestion.type}
                  onChange={(e) => handleQuestionChange('type', e.target.value)}
                  options={questionTypeOptions}
                />

                <Input
                  label="Time Limit (seconds)"
                  type="number"
                  value={currentQuestion.timeLimit}
                  onChange={(e) => handleQuestionChange('timeLimit', parseInt(e.target.value))}
                  min={30}
                  max={600}
                />

                <Input
                  label="Weight (1-5)"
                  type="number"
                  value={currentQuestion.weight}
                  onChange={(e) => handleQuestionChange('weight', parseInt(e.target.value))}
                  min={1}
                  max={5}
                />
              </div>

              <Input
                label="Expected Keywords (comma-separated)"
                placeholder="react, javascript, typescript, hooks..."
                value={currentQuestion.expectedKeywords}
                onChange={(e) => handleQuestionChange('expectedKeywords', e.target.value)}
                helperText="Keywords to look for in candidate answers"
              />

              <Textarea
                label="Evaluation Criteria"
                placeholder="What makes a good answer to this question?"
                value={currentQuestion.evaluationCriteria}
                onChange={(e) => handleQuestionChange('evaluationCriteria', e.target.value)}
                rows={2}
              />

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentQuestion.isImportant}
                    onChange={(e) => handleQuestionChange('isImportant', e.target.checked)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Mark as important question</span>
                </label>
              </div>

              <Button variant="primary" icon={Plus} onClick={addQuestion}>
                Add Question
              </Button>
            </CardContent>
          </Card>

          {/* Questions List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Questions ({sessionData.questions.length})</CardTitle>
                {errors.questions && (
                  <span className="text-sm text-red-600">{errors.questions}</span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {sessionData.questions.length > 0 ? (
                <div className="space-y-3">
                  {sessionData.questions.map((question, index) => (
                    <div
                      key={question.id}
                      className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2 text-gray-400">
                        <GripVertical className="w-5 h-5" />
                        <span className="text-sm font-medium">Q{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-900">{question.text}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <Badge className={QUESTION_TYPE_COLORS[question.type]}>
                            {QUESTION_TYPE_LABELS[question.type]}
                          </Badge>
                          <span className="flex items-center gap-1 text-sm text-gray-500">
                            <Clock className="w-4 h-4" />
                            {question.timeLimit}s
                          </span>
                          {question.isImportant && (
                            <span className="flex items-center gap-1 text-sm text-yellow-600">
                              <Star className="w-4 h-4 fill-yellow-400" />
                              Important
                            </span>
                          )}
                          {question.expectedKeywords?.length > 0 && (
                            <span className="flex items-center gap-1 text-sm text-gray-500">
                              <Tag className="w-4 h-4" />
                              {question.expectedKeywords.length} keywords
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => removeQuestion(question.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No questions added yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="secondary" icon={ArrowLeft} onClick={prevStep}>
              Back
            </Button>
            <Button variant="primary" icon={ArrowRight} iconPosition="right" onClick={nextStep}>
              Next: Settings
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Settings */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Interview Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <Input
                label="Total Interview Duration (minutes)"
                type="number"
                value={sessionData.settings.totalDuration}
                onChange={(e) => handleSettingsChange('totalDuration', parseInt(e.target.value))}
                min={5}
                max={180}
              />

              <Input
                label="Default Time Per Question (seconds)"
                type="number"
                value={sessionData.settings.defaultTimePerQuestion}
                onChange={(e) => handleSettingsChange('defaultTimePerQuestion', parseInt(e.target.value))}
                min={30}
                max={600}
              />
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Interview Options</h4>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sessionData.settings.recordVideo}
                  onChange={(e) => handleSettingsChange('recordVideo', e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-gray-700">Record candidate video responses</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sessionData.settings.recordAudio}
                  onChange={(e) => handleSettingsChange('recordAudio', e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-gray-700">Record candidate audio responses</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sessionData.settings.showTimer}
                  onChange={(e) => handleSettingsChange('showTimer', e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-gray-700">Show timer to candidates</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sessionData.settings.allowLateEntry}
                  onChange={(e) => handleSettingsChange('allowLateEntry', e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-gray-700">Allow candidates to join after session starts</span>
              </label>
            </div>

            <Alert
              type="info"
              title="Video & Audio Recording"
              message="Candidates will answer using both video and audio. Their responses will be transcribed and analyzed by AI."
            />

            <div className="flex justify-between pt-4">
              <Button variant="secondary" icon={ArrowLeft} onClick={prevStep}>
                Back
              </Button>
              <Button variant="primary" icon={Save} onClick={handleSubmit}>
                Create Session
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CreateSession;
