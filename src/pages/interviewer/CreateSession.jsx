import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Plus,
  Trash2,
  GripVertical,
  Clock,
  Star,
  FileText,
  Tag,
  Sparkles,
  Upload,
  Pencil,
  X,
  RefreshCw,
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
  Alert,
  Loading,
} from '../../components/shared';
import {
  QUESTION_TYPES,
  QUESTION_TYPE_LABELS,
  QUESTION_TYPE_COLORS,
} from '../../utils/helpers';
import {
  generateQuestionsFromJobDescription,
  normalizeQuestion,
  parseKeywordString,
} from '../../utils/questionGenerator';

const createEmptyQuestion = (defaultTimeLimit = 120) => ({
  text: '',
  type: QUESTION_TYPES.TECHNICAL,
  timeLimit: defaultTimeLimit,
  weight: 1,
  isImportant: false,
  expectedKeywords: '',
  evaluationCriteria: '',
});

const baseSessionState = {
  title: '',
  description: '',
  jobDescription: '',
  questions: [],
  settings: {
    totalDuration: 30,
    defaultTimePerQuestion: 120,
    allowLateEntry: true,
    showTimer: true,
    recordVideo: true,
    recordAudio: true,
  },
};

const CreateSession = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { sessions, createSession, updateSession } = useInterview();
  const { user } = useAuth();

  const isEditMode = Boolean(id);
  const existingSession = useMemo(
    () => sessions.find((session) => session.id === id) || null,
    [id, sessions]
  );

  const hydratedRef = useRef(false);
  const questionBankRef = useRef(null);

  const [step, setStep] = useState(1);
  const [sessionData, setSessionData] = useState(baseSessionState);
  const [errors, setErrors] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(createEmptyQuestion());
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [jdFileName, setJdFileName] = useState('');
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [generationError, setGenerationError] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    if (hydratedRef.current) return;
    if (isEditMode && !existingSession) return;

    if (isEditMode && existingSession) {
      const normalizedQuestions = (existingSession.questions || []).map((question, index) =>
        normalizeQuestion(question, {
          order: index + 1,
          defaultTimeLimit:
            existingSession.settings?.defaultTimePerQuestion ||
            baseSessionState.settings.defaultTimePerQuestion,
          source: question?.source || 'manual',
        })
      );

      setSessionData({
        title: existingSession.title || '',
        description: existingSession.description || '',
        jobDescription: existingSession.jobDescription || '',
        questions: normalizedQuestions,
        settings: {
          ...baseSessionState.settings,
          ...(existingSession.settings || {}),
        },
      });
      setJobDescription(existingSession.jobDescription || '');
      setCurrentQuestion(
        createEmptyQuestion(
          existingSession.settings?.defaultTimePerQuestion ||
            baseSessionState.settings.defaultTimePerQuestion
        )
      );
    } else {
      setCurrentQuestion(createEmptyQuestion(baseSessionState.settings.defaultTimePerQuestion));
    }

    hydratedRef.current = true;
  }, [existingSession, isEditMode]);

  useEffect(() => {
    if (!editingQuestionId) {
      setCurrentQuestion((prev) => ({
        ...prev,
        timeLimit:
          Number.isFinite(prev.timeLimit) && prev.timeLimit > 0
            ? prev.timeLimit
            : sessionData.settings.defaultTimePerQuestion,
      }));
    }
  }, [editingQuestionId, sessionData.settings.defaultTimePerQuestion]);

  const questionTypeOptions = useMemo(
    () =>
      Object.entries(QUESTION_TYPE_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
    []
  );

  const questionSummary = useMemo(() => {
    return sessionData.questions.reduce(
      (summary, question) => {
        summary.total += 1;
        summary.bySource[question.source || 'manual'] =
          (summary.bySource[question.source || 'manual'] || 0) + 1;
        summary.byType[question.type] = (summary.byType[question.type] || 0) + 1;
        return summary;
      },
      { total: 0, bySource: {}, byType: {} }
    );
  }, [sessionData.questions]);

  const handleSessionChange = (field, value) => {
    setSessionData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleSettingsChange = (field, value) => {
    setSessionData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value,
      },
    }));
  };

  const handleQuestionChange = (field, value) => {
    setCurrentQuestion((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetQuestionForm = () => {
    setCurrentQuestion(createEmptyQuestion(sessionData.settings.defaultTimePerQuestion));
    setEditingQuestionId(null);
    setErrors((prev) => ({ ...prev, questionText: '', questions: '' }));
  };

  const scrollToQuestionBank = () => {
    questionBankRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const upsertQuestion = () => {
    if (!currentQuestion.text.trim()) {
      setErrors((prev) => ({ ...prev, questionText: 'Question text is required' }));
      return;
    }

    const nextQuestion = normalizeQuestion(
      {
        ...currentQuestion,
        id: editingQuestionId || undefined,
        source: currentQuestion.source || 'manual',
      },
      {
        defaultTimeLimit: sessionData.settings.defaultTimePerQuestion,
      }
    );

    setSessionData((prev) => {
      const questions = editingQuestionId
        ? prev.questions.map((question) =>
            question.id === editingQuestionId ? nextQuestion : question
          )
        : [...prev.questions, nextQuestion];

      return {
        ...prev,
        questions: questions.map((question, index) => ({
          ...question,
          order: index + 1,
        })),
      };
    });

    setActionMessage(editingQuestionId ? 'Question updated.' : 'Question added.');
    resetQuestionForm();
    setTimeout(scrollToQuestionBank, 50);
  };

  const editQuestion = (question) => {
    setEditingQuestionId(question.id);
    setCurrentQuestion({
      text: question.text || '',
      type: question.type || QUESTION_TYPES.TECHNICAL,
      timeLimit: question.timeLimit || sessionData.settings.defaultTimePerQuestion,
      weight: question.weight || 1,
      isImportant: Boolean(question.isImportant),
      expectedKeywords: (question.expectedKeywords || []).join(', '),
      evaluationCriteria: question.evaluationCriteria || '',
      source: question.source || 'manual',
    });
  };

  const removeQuestion = (questionId) => {
    setSessionData((prev) => ({
      ...prev,
      questions: prev.questions
        .filter((question) => question.id !== questionId)
        .map((question, index) => ({ ...question, order: index + 1 })),
    }));

    if (editingQuestionId === questionId) {
      resetQuestionForm();
    }

    setActionMessage('Question removed.');
  };

  const handleJobDescriptionUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const supportedByType = file.type.startsWith('text/');
    const supportedByName = /\.(txt|md|text|rtf)$/i.test(file.name);

    if (!supportedByType && !supportedByName) {
      setGenerationError('Please upload a text-based JD file such as .txt, .md, or .rtf.');
      return;
    }

    try {
      const text = await file.text();
      setJobDescription(text);
      setSessionData((prev) => ({ ...prev, jobDescription: text }));
      setJdFileName(file.name);
      setGenerationError('');
    } catch (error) {
      setGenerationError('Unable to read that file. Please paste the job description instead.');
    } finally {
      event.target.value = '';
    }
  };

  const handleGenerateQuestions = async () => {
    if (!jobDescription.trim()) {
      setGenerationError('Paste or upload a job description before generating questions.');
      return;
    }

    setIsGeneratingQuestions(true);
    setGenerationError('');

    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      const generatedQuestions = generateQuestionsFromJobDescription({
        jobDescription,
        defaultTimeLimit: sessionData.settings.defaultTimePerQuestion,
      });

      if (!generatedQuestions.length) {
        setGenerationError('I could not extract useful signals from that JD. Try adding a longer description.');
        return;
      }

      let addedCount = 0;
      setSessionData((prev) => {
        const existingQuestionTexts = new Set(
          prev.questions.map((question) => question.text.trim().toLowerCase())
        );

        const newQuestions = generatedQuestions.filter(
          (question) => !existingQuestionTexts.has(question.text.trim().toLowerCase())
        );
        addedCount = newQuestions.length;

        const mergedQuestions = [...prev.questions, ...newQuestions].map((question, index) =>
          normalizeQuestion(question, {
            order: index + 1,
            defaultTimeLimit: prev.settings.defaultTimePerQuestion,
            source: question.source || 'generated',
          })
        );

        return {
          ...prev,
          jobDescription,
          questions: mergedQuestions,
        };
      });

      setActionMessage(
        addedCount > 0
          ? `Generated ${addedCount} question${addedCount === 1 ? '' : 's'}.`
          : 'Questions were already present, so nothing new was added.'
      );
      setTimeout(scrollToQuestionBank, 50);
    } catch (error) {
      setGenerationError('Question generation failed. Please try again.');
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const validateStep = (stepNum) => {
    const nextErrors = {};

    if (stepNum === 1 && !sessionData.title.trim()) {
      nextErrors.title = 'Session title is required';
    }

    if (stepNum === 2 && sessionData.questions.length === 0) {
      nextErrors.questions = 'Add at least one question before continuing';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = () => {
    if (!validateStep(2)) return;

    const payload = {
      ...sessionData,
      jobDescription,
      questions: sessionData.questions.map((question, index) =>
        normalizeQuestion(question, {
          order: index + 1,
          defaultTimeLimit: sessionData.settings.defaultTimePerQuestion,
          source: question.source || 'manual',
        })
      ),
      avatarConfig: user?.avatarConfig || existingSession?.avatarConfig || null,
    };

    if (isEditMode && existingSession) {
      updateSession(existingSession.id, payload);
      navigate(`/interviewer/sessions/${existingSession.id}`);
      return;
    }

    const session = createSession({
      ...payload,
      status: 'draft',
    });

    navigate(`/interviewer/sessions/${session.id}`);
  };

  if (isEditMode && !hydratedRef.current) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loading size="lg" text="Loading session editor..." />
      </div>
    );
  }

  if (isEditMode && !existingSession) {
    return (
      <div className="max-w-3xl mx-auto">
        <Alert
          type="error"
          title="Session not found"
          message="This session could not be loaded for editing."
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() =>
            navigate(isEditMode ? `/interviewer/sessions/${existingSession.id}` : '/interviewer/sessions')
          }
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Edit Interview Session' : 'Create Interview Session'}
          </h1>
          <p className="text-gray-600">
            Build your interview flow, combine manual questions with JD-generated prompts, and review everything before candidates join.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {[
          { num: 1, label: 'Basic Info' },
          { num: 2, label: 'Questions' },
          { num: 3, label: 'Settings' },
        ].map((item, index) => (
          <React.Fragment key={item.num}>
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step >= item.num ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {item.num}
              </div>
              <span className={`text-sm ${step >= item.num ? 'text-gray-900' : 'text-gray-500'}`}>
                {item.label}
              </span>
            </div>
            {index < 2 && (
              <div className={`flex-1 h-0.5 ${step > item.num ? 'bg-primary-600' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Session Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Input
              label="Session Title"
              placeholder="e.g., Senior Frontend Engineer Interview"
              value={sessionData.title}
              onChange={(event) => handleSessionChange('title', event.target.value)}
              error={errors.title}
              required
            />

            <Textarea
              label="Description"
              placeholder="Describe the role, interview goal, or hiring stage..."
              value={sessionData.description}
              onChange={(event) => handleSessionChange('description', event.target.value)}
              rows={4}
            />

            <div className="flex justify-end">
              <Button variant="primary" icon={ArrowRight} iconPosition="right" onClick={nextStep}>
                Next: Questions
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <Card className="border-primary-100 bg-gradient-to-br from-primary-50 to-white">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary-600" />
                    Generate Questions from Job Description
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Paste a JD or upload a text file and the system will draft technical, behavioral, scenario-based, and skill-specific questions.
                  </p>
                </div>
                <label className="inline-flex items-center">
                  <input
                    type="file"
                    accept=".txt,.md,.text,.rtf,text/plain,text/markdown"
                    className="hidden"
                    onChange={handleJobDescriptionUpload}
                  />
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-primary-200 bg-white text-primary-700 cursor-pointer hover:bg-primary-50 transition-colors">
                    <Upload className="w-4 h-4" />
                    Upload JD
                  </span>
                </label>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                label="Job Description"
                placeholder="Paste the role summary, responsibilities, required skills, and qualifications here..."
                value={jobDescription}
                onChange={(event) => {
                  setJobDescription(event.target.value);
                  setSessionData((prev) => ({ ...prev, jobDescription: event.target.value }));
                  setGenerationError('');
                }}
                rows={10}
                helperText={jdFileName ? `Loaded from ${jdFileName}` : 'Tip: include responsibilities, required tools, and seniority expectations for stronger questions.'}
              />

              {actionMessage && !generationError && (
                <Alert type="success" message={actionMessage} />
              )}
              {generationError && <Alert type="warning" message={generationError} />}

              <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                  <span className="px-3 py-1 rounded-full bg-white border border-primary-100">Technical</span>
                  <span className="px-3 py-1 rounded-full bg-white border border-primary-100">Behavioral</span>
                  <span className="px-3 py-1 rounded-full bg-white border border-primary-100">Scenario-Based</span>
                  <span className="px-3 py-1 rounded-full bg-white border border-primary-100">Skill-Specific</span>
                </div>
                <Button
                  variant="primary"
                  icon={Sparkles}
                  onClick={handleGenerateQuestions}
                  loading={isGeneratingQuestions}
                >
                  Generate Questions
                </Button>
              </div>
            </CardContent>
          </Card>

          <div ref={questionBankRef}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle>{editingQuestionId ? 'Edit Question' : 'Add Custom Question'}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Manual questions stay fully editable, so HR can fine-tune the interview before publishing.
                  </p>
                </div>
                {editingQuestionId && (
                  <Button variant="ghost" icon={X} onClick={resetQuestionForm}>
                    Cancel Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                label="Question Text"
                placeholder="Enter the interview question..."
                value={currentQuestion.text}
                onChange={(event) => handleQuestionChange('text', event.target.value)}
                error={errors.questionText}
                rows={3}
              />

              <div className="grid sm:grid-cols-3 gap-4">
                <Select
                  label="Question Type"
                  value={currentQuestion.type}
                  onChange={(event) => handleQuestionChange('type', event.target.value)}
                  options={questionTypeOptions}
                />

                <Input
                  label="Time Limit (seconds)"
                  type="number"
                  value={currentQuestion.timeLimit}
                  min={30}
                  max={600}
                  onChange={(event) =>
                    handleQuestionChange(
                      'timeLimit',
                      Number.parseInt(event.target.value, 10) || sessionData.settings.defaultTimePerQuestion
                    )
                  }
                />

                <Input
                  label="Weight (1-5)"
                  type="number"
                  value={currentQuestion.weight}
                  min={1}
                  max={5}
                  onChange={(event) =>
                    handleQuestionChange('weight', Number.parseInt(event.target.value, 10) || 1)
                  }
                />
              </div>

              <Input
                label="Expected Keywords"
                placeholder="react, state management, testing"
                value={currentQuestion.expectedKeywords}
                onChange={(event) => handleQuestionChange('expectedKeywords', event.target.value)}
                helperText="Keywords help the analysis engine evaluate responses later."
              />

              <Textarea
                label="Evaluation Criteria"
                placeholder="What makes a strong answer to this question?"
                value={currentQuestion.evaluationCriteria}
                onChange={(event) => handleQuestionChange('evaluationCriteria', event.target.value)}
                rows={2}
              />

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentQuestion.isImportant}
                  onChange={(event) => handleQuestionChange('isImportant', event.target.checked)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Mark as important question</span>
              </label>

              <Button variant="primary" icon={editingQuestionId ? Save : Plus} onClick={upsertQuestion}>
                {editingQuestionId ? 'Save Question' : 'Add Question'}
              </Button>
            </CardContent>
          </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Question Bank ({questionSummary.total})</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Review, edit, or delete any question before the interview starts.
                  </p>
                </div>
                {errors.questions && <span className="text-sm text-red-600">{errors.questions}</span>}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {questionSummary.total > 0 && (
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">Manual</p>
                    <p className="text-2xl font-semibold text-gray-900">{questionSummary.bySource.manual || 0}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">JD Generated</p>
                    <p className="text-2xl font-semibold text-gray-900">{questionSummary.bySource.generated || 0}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">Important</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {sessionData.questions.filter((question) => question.isImportant).length}
                    </p>
                  </div>
                </div>
              )}

              {sessionData.questions.length > 0 ? (
                <div className="space-y-3">
                  {sessionData.questions.map((question, index) => (
                    <div key={question.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2 text-gray-400">
                        <GripVertical className="w-5 h-5" />
                        <span className="text-sm font-medium">Q{index + 1}</span>
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={QUESTION_TYPE_COLORS[question.type]}>
                            {QUESTION_TYPE_LABELS[question.type]}
                          </Badge>
                          <Badge className={question.source === 'generated' ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-700'}>
                            {question.source === 'generated' ? 'JD Generated' : 'Custom'}
                          </Badge>
                          {question.category && (
                            <Badge className="bg-white text-gray-700 border border-gray-200">
                              {question.category}
                            </Badge>
                          )}
                          {question.isImportant && (
                            <span className="inline-flex items-center gap-1 text-sm text-yellow-700">
                              <Star className="w-4 h-4 fill-yellow-400" />
                              Important
                            </span>
                          )}
                        </div>

                        <p className="text-gray-900">{question.text}</p>

                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {question.timeLimit}s
                          </span>
                          <span>Weight: {question.weight}</span>
                          {question.expectedKeywords?.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Tag className="w-4 h-4" />
                              {question.expectedKeywords.length} keywords
                            </span>
                          )}
                        </div>

                        {question.evaluationCriteria && (
                          <div className="rounded-lg bg-white px-3 py-2 border border-gray-200">
                            <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Evaluation Criteria</p>
                            <p className="text-sm text-gray-700">{question.evaluationCriteria}</p>
                          </div>
                        )}

                        {question.expectedKeywords?.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {parseKeywordString(question.expectedKeywords).map((keyword) => (
                              <span
                                key={`${question.id}-${keyword}`}
                                className="px-2.5 py-1 rounded-full bg-white border border-gray-200 text-xs text-gray-600"
                              >
                                {keyword}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => editQuestion(question)}
                          className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Edit question"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => removeQuestion(question.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete question"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No questions added yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Add custom questions or generate them from a job description.
                  </p>
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
                min={5}
                max={180}
                value={sessionData.settings.totalDuration}
                onChange={(event) =>
                  handleSettingsChange('totalDuration', Number.parseInt(event.target.value, 10) || 30)
                }
              />

              <Input
                label="Default Time Per Question (seconds)"
                type="number"
                min={30}
                max={600}
                value={sessionData.settings.defaultTimePerQuestion}
                onChange={(event) =>
                  handleSettingsChange(
                    'defaultTimePerQuestion',
                    Number.parseInt(event.target.value, 10) || 120
                  )
                }
              />
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Interview Options</h4>

              {[
                ['recordVideo', 'Record candidate video responses'],
                ['recordAudio', 'Record candidate audio responses'],
                ['showTimer', 'Show timer to candidates'],
                ['allowLateEntry', 'Allow candidates to join after session starts'],
              ].map(([field, label]) => (
                <label key={field} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(sessionData.settings[field])}
                    onChange={(event) => handleSettingsChange(field, event.target.checked)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-gray-700">{label}</span>
                </label>
              ))}
            </div>

            <Alert
              type="info"
              title="Interview Flow"
              message="Candidates will see the question on screen, hear it from the AI avatar, and then respond using voice and video."
            />

            <div className="flex justify-between pt-4">
              <Button variant="secondary" icon={ArrowLeft} onClick={prevStep}>
                Back
              </Button>
              <Button variant="primary" icon={isEditMode ? RefreshCw : Save} onClick={handleSubmit}>
                {isEditMode ? 'Update Session' : 'Create Session'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CreateSession;
