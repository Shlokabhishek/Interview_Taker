import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, Video, Square, Check, X, Upload } from 'lucide-react';
import { Button, Alert } from '../components/shared';

const PhoneRecording = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [error, setError] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Get session info
  const sessionData = localStorage.getItem(`recording_session_${sessionId}`);
  const session = sessionData ? JSON.parse(sessionData) : null;

  useEffect(() => {
    if (!session) {
      setError('Invalid recording link. Please get a new link from your computer.');
    }
  }, [session]);

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 1280, height: 720 },
        audio: true
      });
      
      if (videoRef.current) {
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        setError('');
      }
    } catch (err) {
      console.error('Camera error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera permission denied. Please allow camera and microphone access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else if (err.name === 'NotSupportedError' || err.name === 'TypeError') {
        setError('Camera access requires HTTPS. Please use the "Upload Video" option instead.');
      } else {
        setError('Could not access camera. Please use the "Upload Video" option below.');
      }
    }
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      const videoUrl = URL.createObjectURL(file);
      setRecordedVideo(videoUrl);
      setError('');
    } else {
      setError('Please select a valid video file.');
    }
  };

  // Start recording
  const startRecording = () => {
    if (!streamRef.current) return;

    const chunks = [];
    const mediaRecorder = new MediaRecorder(streamRef.current);

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const videoUrl = URL.createObjectURL(blob);
      setRecordedVideo(videoUrl);
      
      // Stop camera
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setCameraActive(false);
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);

    // Start timer
    recordingTimerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
  };

  // Upload video
  const uploadVideo = async () => {
    if (recordedVideo) {
      try {
        // Convert blob URL to actual blob
        const response = await fetch(recordedVideo);
        const blob = await response.blob();
        
        // Convert blob to base64 for storage
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result;
          
          // Store video data in localStorage
          localStorage.setItem(`recording_video_${sessionId}`, JSON.stringify({
            videoData: base64data,
            uploadedAt: new Date().toISOString(),
            mimeType: blob.type
          }));
          
          setUploaded(true);
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        setError('Failed to upload video. Please try again.');
        console.error('Upload error:', err);
      }
    }
  };

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-6 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid Link</h1>
          <p className="text-gray-600">
            This recording link is invalid or has expired. Please get a new link from your computer.
          </p>
        </div>
      </div>
    );
  }

  if (uploaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-6 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Video Uploaded!</h1>
          <p className="text-gray-600 mb-4">
            Your video has been successfully uploaded. You can now return to your computer to continue training your avatar.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              The video should appear on your computer within a few seconds. If it doesn't, please try again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-white text-lg font-semibold">Phone Recording</h1>
          {session && (
            <p className="text-gray-400 text-sm mt-1">Recording for {session.userName}</p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {error && (
          <Alert type="error" message={error} onClose={() => setError('')} />
        )}

        {/* Video Preview/Recording */}
        {!recordedVideo ? (
          <div className="bg-black rounded-xl overflow-hidden aspect-video relative">
            {cameraActive ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                
                {/* Recording Indicator */}
                {isRecording && (
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 px-4 py-2 rounded-full animate-pulse">
                    <div className="w-3 h-3 bg-white rounded-full" />
                    <span className="text-white font-semibold">REC</span>
                    <span className="text-white font-mono">{formatTime(recordingTime)}</span>
                  </div>
                )}

                {/* Instructions */}
                {!isRecording && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 px-6 py-3 rounded-lg">
                    <p className="text-white text-center text-sm">
                      Tap the red button to start recording
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center px-4">
                  <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Camera className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-400 mb-2">Camera not started</p>
                  <p className="text-gray-500 text-xs mb-6">Camera access requires browser permissions</p>
                  <div className="space-y-3">
                    <button
                      onClick={startCamera}
                      className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold block w-full max-w-xs mx-auto"
                    >
                      Start Camera
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-3 bg-gray-700 text-white rounded-lg font-semibold block w-full max-w-xs mx-auto flex items-center justify-center gap-2"
                    >
                      <Upload className="w-5 h-5" />
                      Upload Video Instead
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Preview Recorded Video */
          <div className="bg-black rounded-xl overflow-hidden aspect-video relative">
            <video
              src={recordedVideo}
              controls
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Instructions Card */}
        <div className="bg-gray-800 rounded-xl p-4">
          <h3 className="text-white font-semibold mb-3">📝 Recording Instructions:</h3>
          <ol className="text-gray-300 text-sm space-y-2 list-decimal list-inside">
            <li>Record or upload a video from your phone</li>
            <li>Position camera at face level with good lighting</li>
            <li>Speak clearly and look at the camera</li>
            <li>Read the sample script or introduce yourself</li>
            <li>Keep the recording between 10-30 seconds</li>
          </ol>
          
          {/* HTTPS Notice */}
          <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3 mt-4">
            <p className="text-yellow-200 text-xs">
              <strong>⚠️ Camera Permission Issue?</strong><br/>
              If camera doesn't work, use your phone's camera app to record a video, then tap "Upload Video Instead" to upload it.
            </p>
          </div>
        </div>

        {/* Sample Script */}
        <div className="bg-blue-900/30 border border-blue-700 rounded-xl p-4">
          <h4 className="text-blue-200 font-semibold mb-2">Sample Script:</h4>
          <p className="text-blue-100 text-sm italic leading-relaxed">
            "Hello! I'm [Your Name], and I'll be your interviewer today. Thank you for taking the time to interview with us. 
            I'm going to ask you a few questions about your experience and skills. Please take your time and answer as thoroughly as you'd like."
          </p>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4 pb-8">
          {!recordedVideo ? (
            <>
              {!isRecording && cameraActive && (
                <button
                  onClick={startRecording}
                  className="w-20 h-20 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-colors shadow-lg"
                >
                  <div className="w-8 h-8 bg-white rounded-full" />
                </button>
              )}
              {isRecording && (
                <button
                  onClick={stopRecording}
                  className="w-20 h-20 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-colors shadow-lg animate-pulse"
                >
                  <Square className="w-8 h-8 text-white fill-white" />
                </button>
              )}
            </>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setRecordedVideo(null);
                  setRecordingTime(0);
                  startCamera();
                }}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold"
              >
                Record Again
              </button>
              <button
                onClick={uploadVideo}
                className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold flex items-center gap-2"
              >
                <Upload className="w-5 h-5" />
                Upload Video
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhoneRecording;
