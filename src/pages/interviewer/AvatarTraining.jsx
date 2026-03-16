import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, 
  Camera, 
  Mic, 
  Play, 
  Pause, 
  Check, 
  X,
  Video,
  Square,
  Volume2,
  User,
  RefreshCw,
  StopCircle,
  Smartphone,
  Copy,
  ExternalLink,
  QrCode,
  Home
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useInterview } from '../../contexts/InterviewContext';
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
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const { applyAvatarConfigToMySessions } = useInterview();
  
  const [step, setStep] = useState(1);
  const [trainingMode, setTrainingMode] = useState('video'); // 'video' or 'photo'
  const [avatarVideo, setAvatarVideo] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [faceImages, setFaceImages] = useState([]);
  const [voiceSamples, setVoiceSamples] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isVideoRecording, setIsVideoRecording] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [trained, setTrained] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [recordingSessionId, setRecordingSessionId] = useState(null);
  
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingTimerRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        stopMediaStream(streamRef.current);
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  // Handle video file upload
  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const videoUrl = URL.createObjectURL(file);
      setAvatarVideo(videoUrl);
      // Get thumbnail from video
      const video = document.createElement('video');
      video.src = videoUrl;
      video.currentTime = 0.5;
      video.onloadeddata = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        setAvatarPreview(canvas.toDataURL('image/jpeg'));
      };
    }
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => ({
      id: Date.now() + Math.random(),
      file,
      preview: URL.createObjectURL(file),
    }));
    setFaceImages(prev => [...prev, ...newImages].slice(0, 5));
    
    if (!avatarPreview && newImages.length > 0) {
      setAvatarPreview(newImages[0].preview);
    }
  };

  // Remove image
  const removeImage = (id) => {
    setFaceImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      if (filtered.length > 0) {
        setAvatarPreview(filtered[0].preview);
      } else if (filtered.length === 0 && !avatarVideo) {
        setAvatarPreview(null);
      }
      return filtered;
    });
  };

  // Start camera for video recording
  const startVideoCamera = async () => {
    setCameraOpen(true);
    setRecordingTime(0);
    
    setTimeout(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 1280, height: 720, facingMode: 'user' }, 
          audio: true 
        });
        
        if (videoRef.current) {
          streamRef.current = stream;
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Camera error:', error);
        alert('Could not access camera and microphone. Please check permissions.');
        setCameraOpen(false);
      }
    }, 100);
  };

  // Start recording video
  const startVideoRecording = () => {
    if (!streamRef.current) return;

    const chunks = [];
    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: 'video/webm;codecs=vp9,opus'
    });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const videoUrl = URL.createObjectURL(blob);
      setAvatarVideo(videoUrl);
      
      // Get thumbnail
      setTimeout(() => {
        if (videoRef.current) {
          const canvas = document.createElement('canvas');
          canvas.width = videoRef.current.videoWidth || 640;
          canvas.height = videoRef.current.videoHeight || 480;
          canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
          setAvatarPreview(canvas.toDataURL('image/jpeg'));
        }
      }, 100);
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsVideoRecording(true);

    // Start timer
    recordingTimerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  // Stop recording video
  const stopVideoRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsVideoRecording(false);
    
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (isVideoRecording) {
      stopVideoRecording();
    }
    if (streamRef.current) {
      stopMediaStream(streamRef.current);
      streamRef.current = null;
    }
    setCameraOpen(false);
    setRecordingTime(0);
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

  // Start training
  const startTraining = () => {
    setStep(2);
    setTrainingProgress(0);
    
    const interval = setInterval(() => {
      setTrainingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTrained(true);
          
          // Save avatar config to user profile
          const newAvatarConfig = {
            avatarVideo: avatarVideo,
            avatarImage: avatarPreview,
            avatarName: user?.name || 'AI Interviewer',
            trainingMode: trainingMode,
            trainedAt: new Date().toISOString(),
          };

          updateProfile({ avatarConfig: newAvatarConfig, avatarTrained: true });
          applyAvatarConfigToMySessions(newAvatarConfig);
          
          return 100;
        }
        return prev + 2;
      });
    }, 50);
  };

  // Test avatar
  const testAvatar = () => {
    setIsTesting(true);
  };

  // Format recording time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get current page URL for phone recording
  const getPhoneRecordingLink = () => {
    // Use network IP for cross-device access
    const baseUrl = 'http://10.180.18.214:3002';
    return `${baseUrl}/phone-recording/${recordingSessionId}`;
  };

  // Copy link to clipboard
  const copyLinkToClipboard = () => {
    navigator.clipboard.writeText(getPhoneRecordingLink());
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  // Generate QR code URL using external service
  const getQRCodeUrl = () => {
    const link = encodeURIComponent(getPhoneRecordingLink());
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${link}`;
  };

  // Open phone modal and generate session
  const openPhoneModal = () => {
    const sessionId = `phone-rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setRecordingSessionId(sessionId);
    localStorage.setItem(`recording_session_${sessionId}`, JSON.stringify({
      userId: user?.id,
      userName: user?.name,
      createdAt: new Date().toISOString()
    }));
    setShowPhoneModal(true);
  };

  // Check for uploaded video from phone
  useEffect(() => {
    const checkInterval = setInterval(() => {
      if (recordingSessionId) {
        const videoData = localStorage.getItem(`recording_video_${recordingSessionId}`);
        if (videoData) {
          try {
            const { videoData: base64data, mimeType } = JSON.parse(videoData);
            
            // Convert base64 to blob
            const byteString = atob(base64data.split(',')[1]);
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
              ia[i] = byteString.charCodeAt(i);
            }
            const blob = new Blob([ab], { type: mimeType || 'video/webm' });
            const videoUrl = URL.createObjectURL(blob);
            
            setAvatarVideo(videoUrl);
            
            // Get thumbnail
            const video = document.createElement('video');
            video.src = videoUrl;
            video.currentTime = 0.5;
            video.onloadeddata = () => {
              const canvas = document.createElement('canvas');
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              canvas.getContext('2d').drawImage(video, 0, 0);
              setAvatarPreview(canvas.toDataURL('image/jpeg'));
            };
            
            // Clean up
            localStorage.removeItem(`recording_video_${recordingSessionId}`);
            setShowPhoneModal(false);
            clearInterval(checkInterval);
          } catch (err) {
            console.error('Error processing phone video:', err);
          }
        }
      }
    }, 2000);

    return () => clearInterval(checkInterval);
  }, [recordingSessionId]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Avatar Training</h1>
        <p className="text-gray-600 mt-1">
          Record yourself to create a realistic video avatar that will conduct interviews.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-4">
        {[
          { num: 1, label: 'Record Video' },
          { num: 2, label: 'Training' },
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
            {index < 1 && (
              <div className={`flex-1 h-0.5 ${step > s.num ? 'bg-primary-600' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Record Video */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Record Your Interviewer Video</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert
              type="info"
              title="Recording Tips"
              message="Record yourself introducing yourself and asking a sample question. Speak clearly, look at the camera, and ensure good lighting. This video will be shown to candidates during interviews."
            />

            {/* Video Preview */}
            {avatarVideo && (
              <div className="space-y-4">
                <div className="relative bg-gray-900 rounded-xl overflow-hidden aspect-video">
                  <video
                    src={avatarVideo}
                    controls
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => {
                      setAvatarVideo(null);
                      setAvatarPreview(null);
                    }}
                    className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">Video recorded successfully!</span>
                </div>
              </div>
            )}

            {/* Recording Options */}
            {!avatarVideo && (
              <>
                <div className="grid md:grid-cols-3 gap-4">
                  {/* Record Video Button */}
                  <div
                    onClick={startVideoCamera}
                    className="border-2 border-dashed border-primary-300 rounded-xl p-6 text-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors"
                  >
                    <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Video className="w-7 h-7 text-primary-600" />
                    </div>
                    <p className="text-gray-900 font-semibold">Record Video</p>
                    <p className="text-xs text-gray-500 mt-1">Use webcam to record</p>
                  </div>

                  {/* Phone Recording Button */}
                  <div
                    onClick={openPhoneModal}
                    className="border-2 border-dashed border-green-300 rounded-xl p-6 text-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition-colors"
                  >
                    <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Smartphone className="w-7 h-7 text-green-600" />
                    </div>
                    <p className="text-gray-900 font-semibold">Use Phone</p>
                    <p className="text-xs text-gray-500 mt-1">Record with your phone</p>
                  </div>

                  {/* Upload Video Button */}
                  <div
                    onClick={() => videoInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Upload className="w-7 h-7 text-gray-600" />
                    </div>
                    <p className="text-gray-900 font-semibold">Upload Video</p>
                    <p className="text-xs text-gray-500 mt-1">MP4, WebM up to 50MB</p>
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Sample Script */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <h4 className="font-semibold text-blue-900 mb-2">📝 Sample Script to Read:</h4>
                  <p className="text-blue-800 italic leading-relaxed">
                    "Hello! I'm [Your Name], and I'll be your interviewer today. Thank you for taking the time to interview with us. 
                    I'm going to ask you a few questions about your experience and skills. Please take your time and answer as thoroughly as you'd like. 
                    Let's begin with our first question..."
                  </p>
                </div>
              </>
            )}

            {/* Navigation */}
            <div className="flex justify-end pt-4">
              <Button
                variant="primary"
                onClick={startTraining}
                disabled={!avatarVideo}
              >
                Continue to Training
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Training */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>{trained ? 'Training Complete!' : 'Processing Your Avatar'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="max-w-2xl mx-auto">
              <AIAvatar
                avatarVideo={isTesting ? avatarVideo : null}
                avatarImage={avatarPreview}
                avatarName={user?.name || 'AI Interviewer'}
                text={isTesting ? null : null}
                autoSpeak={isTesting}
                showControls={false}
                size="lg"
                onSpeechEnd={() => setIsTesting(false)}
              />
            </div>

            {!trained ? (
              <div className="space-y-4">
                <Progress value={trainingProgress} showLabel animated />
                <p className="text-center text-gray-600">
                  Processing your video avatar... This may take a moment.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <Alert
                  type="success"
                  title="Avatar Ready!"
                  message="Your video avatar has been processed and is ready to conduct interviews. Candidates will see your video during the interview."
                />

                <div className="flex justify-center gap-4">
                  <Button variant="secondary" icon={Play} onClick={testAvatar}>
                    Preview Avatar
                  </Button>
                  <Button variant="primary" icon={Home} onClick={() => navigate('/dashboard')}>
                    Continue to Home Page
                  </Button>
                  <Button variant="primary" icon={RefreshCw} onClick={() => {
                    setStep(1);
                    setTrained(false);
                    setAvatarVideo(null);
                    setAvatarPreview(null);
                    setIsTesting(false);
                  }}>
                    Record New Video
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Camera/Recording Modal */}
      {cameraOpen && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl max-w-4xl w-full overflow-hidden">
            {/* Video Preview */}
            <div className="relative aspect-video bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              
              {/* Recording Indicator */}
              {isVideoRecording && (
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 px-4 py-2 rounded-full animate-pulse">
                  <div className="w-3 h-3 bg-white rounded-full" />
                  <span className="text-white font-semibold">REC</span>
                  <span className="text-white font-mono">{formatTime(recordingTime)}</span>
                </div>
              )}

              {/* Close Button */}
              <button
                onClick={stopCamera}
                className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Instructions */}
              {!isVideoRecording && !avatarVideo && (
                <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-black/70 px-6 py-3 rounded-lg">
                  <p className="text-white text-center">
                    Position yourself in frame, then click record to start
                  </p>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="p-6 bg-gray-800 flex items-center justify-center gap-4">
              {!isVideoRecording ? (
                <>
                  <Button
                    variant="secondary"
                    onClick={stopCamera}
                    className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
                  >
                    Cancel
                  </Button>
                  <button
                    onClick={startVideoRecording}
                    className="w-16 h-16 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-colors shadow-lg"
                  >
                    <div className="w-6 h-6 bg-white rounded-full" />
                  </button>
                  <Button
                    variant="secondary"
                    icon={Camera}
                    onClick={capturePhoto}
                    className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
                  >
                    Photo
                  </Button>
                </>
              ) : (
                <button
                  onClick={() => {
                    stopVideoRecording();
                    stopCamera();
                  }}
                  className="w-16 h-16 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-colors shadow-lg animate-pulse"
                >
                  <Square className="w-6 h-6 text-white fill-white" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Phone Recording Modal */}
      {showPhoneModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Record with Your Phone</h3>
              <button
                onClick={() => setShowPhoneModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-xl shadow-lg border-2 border-gray-100">
                <img
                  src={getQRCodeUrl()}
                  alt="QR Code"
                  className="w-48 h-48"
                />
              </div>
              <p className="text-sm text-gray-600 mt-3 text-center">
                Scan this QR code with your phone camera
              </p>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-gray-500">or share the link</span>
              </div>
            </div>

            {/* Link Copy Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={getPhoneRecordingLink()}
                  readOnly
                  className="flex-1 px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-700 truncate"
                />
                <button
                  onClick={copyLinkToClipboard}
                  className={`px-4 py-3 rounded-lg font-medium transition-all ${
                    linkCopied
                      ? 'bg-green-500 text-white'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
                >
                  {linkCopied ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
              {linkCopied && (
                <p className="text-sm text-green-600 text-center">Link copied to clipboard!</p>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-green-600" />
                How to record on your phone:
              </h4>
              <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                <li>Scan the QR code or open the link on your phone</li>
                <li>This opens a special recording page on any browser</li>
                <li>Grant camera and microphone permissions</li>
                <li>Record yourself asking a sample interview question</li>
                <li>The video will automatically sync back to this page</li>
              </ol>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                <p className="text-xs text-blue-800">
                  💡 <strong>Tip:</strong> Keep this page open while recording on your phone. The video will appear here automatically when you finish recording.
                </p>
              </div>
            </div>

            {/* Alternative: Direct Upload */}
            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 mb-3 text-center">
                Already recorded on your phone? Upload the video directly:
              </p>
              <Button
                variant="secondary"
                icon={Upload}
                onClick={() => {
                  setShowPhoneModal(false);
                  videoInputRef.current?.click();
                }}
                className="w-full"
              >
                Upload Video from Phone
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvatarTraining;
