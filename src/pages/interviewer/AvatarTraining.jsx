import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Camera, 
  Mic, 
  Play, 
  Pause, 
  Check, 
  X,
  Image as ImageIcon,
  Volume2,
  User,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  Button, 
  Alert,
  Progress
} from '../../components/shared';
import { AIAvatar } from '../../components/interview';
import { getUserMedia, stopMediaStream, speakText, stopSpeech } from '../../utils/mediaUtils';

const AvatarTraining = () => {
  const { user, updateProfile } = useAuth();
  
  const [step, setStep] = useState(1);
  const [faceImages, setFaceImages] = useState([]);
  const [voiceSamples, setVoiceSamples] = useState([]);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [trained, setTrained] = useState(false);
  
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Handle image upload
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => ({
      id: Date.now() + Math.random(),
      file,
      preview: URL.createObjectURL(file),
    }));
    setFaceImages(prev => [...prev, ...newImages].slice(0, 5));
    
    // Set first image as avatar preview
    if (!avatarPreview && newImages.length > 0) {
      setAvatarPreview(newImages[0].preview);
    }
  };

  // Remove image
  const removeImage = (id) => {
    setFaceImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      if (filtered.length > 0 && avatarPreview) {
        setAvatarPreview(filtered[0].preview);
      } else if (filtered.length === 0) {
        setAvatarPreview(null);
      }
      return filtered;
    });
  };

  // Start camera capture
  const startCamera = async () => {
    const { stream, error } = await getUserMedia(true, false);
    if (stream && videoRef.current) {
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
    }
  };

  // Capture photo from camera
  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);
    
    canvas.toBlob((blob) => {
      const newImage = {
        id: Date.now(),
        file: blob,
        preview: URL.createObjectURL(blob),
      };
      setFaceImages(prev => [...prev, newImage].slice(0, 5));
      
      if (!avatarPreview) {
        setAvatarPreview(newImage.preview);
      }
    }, 'image/jpeg');
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      stopMediaStream(streamRef.current);
      streamRef.current = null;
    }
  };

  // Record voice sample
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const newSample = {
          id: Date.now(),
          blob,
          url: URL.createObjectURL(blob),
        };
        setVoiceSamples(prev => [...prev, newSample].slice(0, 3));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Stop after 10 seconds
      setTimeout(() => {
        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
          setIsRecording(false);
        }
      }, 10000);
    } catch (error) {
      console.error('Error recording voice:', error);
    }
  };

  // Stop voice recording
  const stopVoiceRecording = () => {
    setIsRecording(false);
  };

  // Remove voice sample
  const removeVoiceSample = (id) => {
    setVoiceSamples(prev => prev.filter(s => s.id !== id));
  };

  // Simulate training
  const startTraining = () => {
    setStep(3);
    setTrainingProgress(0);
    
    const interval = setInterval(() => {
      setTrainingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTrained(true);
          
          // Save avatar config
          updateProfile({
            avatarImage: avatarPreview,
            avatarTrained: true,
          });
          
          return 100;
        }
        return prev + 2;
      });
    }, 100);
  };

  // Test avatar
  const testAvatar = () => {
    setIsTesting(true);
    speakText("Hello! I am your AI interviewer. I will be conducting your interview today. Are you ready to begin?", () => {
      setIsTesting(false);
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Avatar Training</h1>
        <p className="text-gray-600 mt-1">
          Train your AI avatar with your face and voice to conduct personalized interviews.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-4">
        {[
          { num: 1, label: 'Face Images' },
          { num: 2, label: 'Voice Samples' },
          { num: 3, label: 'Training' },
        ].map((s, index) => (
          <React.Fragment key={s.num}>
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step >= s.num
                    ? trained && s.num <= step ? 'bg-green-500 text-white' : 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {trained && s.num <= step ? <Check className="w-4 h-4" /> : s.num}
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

      {/* Step 1: Face Images */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Face Images</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert
              type="info"
              title="Tips for best results"
              message="Upload 3-5 clear photos of your face from different angles. Good lighting and a neutral background work best."
            />

            {/* Upload Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors"
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Click to upload images</p>
              <p className="text-sm text-gray-500 mt-1">or drag and drop • PNG, JPG up to 5MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {/* Image Preview Grid */}
            {faceImages.length > 0 && (
              <div className="grid grid-cols-5 gap-4">
                {faceImages.map((image) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={image.preview}
                      alt="Face"
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removeImage(image.id)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Camera Capture Option */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or capture with camera</span>
              </div>
            </div>

            <div className="flex justify-center">
              <Button variant="secondary" icon={Camera} onClick={startCamera}>
                Open Camera
              </Button>
            </div>

            {/* Navigation */}
            <div className="flex justify-end pt-4">
              <Button
                variant="primary"
                onClick={() => setStep(2)}
                disabled={faceImages.length === 0}
              >
                Next: Voice Samples
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Voice Samples */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Record Voice Samples</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert
              type="info"
              title="Recording tips"
              message="Record 2-3 samples of yourself speaking naturally. Read the prompts below for consistent results."
            />

            {/* Recording Prompts */}
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-2">Sample prompt 1:</p>
                <p className="text-gray-700 italic">
                  "Hello and welcome to this interview. I'm excited to learn more about your experience and skills."
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-2">Sample prompt 2:</p>
                <p className="text-gray-700 italic">
                  "Thank you for taking the time to interview with us today. Let's get started with the first question."
                </p>
              </div>
            </div>

            {/* Recording Button */}
            <div className="flex justify-center">
              <button
                onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                  isRecording
                    ? 'bg-red-500 hover:bg-red-600 recording-indicator'
                    : 'bg-primary-600 hover:bg-primary-700'
                }`}
              >
                <Mic className="w-10 h-10 text-white" />
              </button>
            </div>
            <p className="text-center text-sm text-gray-500">
              {isRecording ? 'Recording... Click to stop' : 'Click to start recording (max 10 seconds)'}
            </p>

            {/* Voice Samples List */}
            {voiceSamples.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Recorded Samples ({voiceSamples.length}/3)</h4>
                {voiceSamples.map((sample, index) => (
                  <div key={sample.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <Volume2 className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Voice Sample {index + 1}</p>
                      <audio src={sample.url} controls className="mt-2 w-full" />
                    </div>
                    <button
                      onClick={() => removeVoiceSample(sample.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4">
              <Button variant="secondary" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                variant="primary"
                onClick={startTraining}
                disabled={voiceSamples.length === 0}
              >
                Start Training
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Training */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>{trained ? 'Training Complete!' : 'Training Your Avatar'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <AIAvatar
                avatarImage={avatarPreview}
                avatarName={user?.name || 'AI Interviewer'}
                text={isTesting ? "Hello! I am your AI interviewer." : null}
                autoSpeak={false}
                showControls={false}
                size="lg"
              />
            </div>

            {!trained ? (
              <div className="space-y-4">
                <Progress value={trainingProgress} showLabel animated />
                <p className="text-center text-gray-600">
                  Training your AI avatar... This may take a moment.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <Alert
                  type="success"
                  title="Avatar Ready!"
                  message="Your AI avatar has been trained and is ready to conduct interviews."
                />

                <div className="flex justify-center gap-4">
                  <Button variant="secondary" icon={Play} onClick={testAvatar}>
                    Test Avatar
                  </Button>
                  <Button variant="primary" icon={RefreshCw} onClick={() => {
                    setStep(1);
                    setTrained(false);
                    setFaceImages([]);
                    setVoiceSamples([]);
                    setAvatarPreview(null);
                  }}>
                    Retrain
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AvatarTraining;
