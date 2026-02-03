import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Mic, MicOff, Video, VideoOff, Circle, Square } from 'lucide-react';
import { Button } from '../shared';
import { getUserMedia, stopMediaStream, createMediaRecorder, blobToBase64 } from '../../utils/mediaUtils';

const VideoRecorder = ({
  onRecordingComplete,
  onRecordingStart,
  maxDuration = 300, // 5 minutes default
  autoStart = false,
  showControls = true,
  showPreview = true,
  className = '',
}) => {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Initialize media stream
  const initializeStream = useCallback(async () => {
    setError(null);
    const { stream: mediaStream, error: mediaError } = await getUserMedia(true, true);
    
    if (mediaError) {
      setError(`Failed to access camera/microphone: ${mediaError}`);
      return false;
    }

    setStream(mediaStream);
    setPermissionGranted(true);
    
    if (videoRef.current) {
      videoRef.current.srcObject = mediaStream;
    }

    return true;
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    if (!stream) {
      const success = await initializeStream();
      if (!success) return;
    }

    chunksRef.current = [];
    const recorder = createMediaRecorder(stream);
    
    if (!recorder) {
      setError('Failed to create media recorder');
      return;
    }

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const base64 = await blobToBase64(blob);
      
      if (onRecordingComplete) {
        onRecordingComplete({
          blob,
          base64,
          duration,
          type: 'video/webm',
        });
      }
    };

    mediaRecorderRef.current = recorder;
    recorder.start(1000); // Collect data every second
    setIsRecording(true);
    setDuration(0);

    // Start timer
    timerRef.current = setInterval(() => {
      setDuration(prev => {
        if (prev >= maxDuration) {
          stopRecording();
          return prev;
        }
        return prev + 1;
      });
    }, 1000);

    if (onRecordingStart) {
      onRecordingStart();
    }
  }, [stream, initializeStream, maxDuration, duration, onRecordingComplete, onRecordingStart]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsRecording(false);
    setIsPaused(false);
  }, []);

  // Pause/Resume recording
  const togglePause = useCallback(() => {
    if (!mediaRecorderRef.current) return;

    if (isPaused) {
      mediaRecorderRef.current.resume();
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      mediaRecorderRef.current.pause();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    setIsPaused(!isPaused);
  }, [isPaused]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  }, [stream]);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
      }
    }
  }, [stream]);

  // Format duration
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Initialize on mount
  useEffect(() => {
    initializeStream();
    
    return () => {
      if (stream) {
        stopMediaStream(stream);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Auto start recording
  useEffect(() => {
    if (autoStart && permissionGranted && !isRecording) {
      startRecording();
    }
  }, [autoStart, permissionGranted]);

  // Update video element when stream changes
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className={`relative ${className}`}>
      {/* Video Preview */}
      {showPreview && (
        <div className="relative bg-gray-900 rounded-xl overflow-hidden aspect-video">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover transform scale-x-[-1]"
          />
          
          {/* Recording indicator */}
          {isRecording && (
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-full">
              <Circle className="w-3 h-3 text-red-500 fill-red-500 recording-indicator" />
              <span className="text-white text-sm font-medium">
                {formatTime(duration)} / {formatTime(maxDuration)}
              </span>
            </div>
          )}

          {/* Media controls overlay */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-3">
            <button
              onClick={toggleAudio}
              className={`p-3 rounded-full transition-colors ${
                audioEnabled ? 'bg-white/20 hover:bg-white/30' : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              {audioEnabled ? (
                <Mic className="w-5 h-5 text-white" />
              ) : (
                <MicOff className="w-5 h-5 text-white" />
              )}
            </button>
            
            <button
              onClick={toggleVideo}
              className={`p-3 rounded-full transition-colors ${
                videoEnabled ? 'bg-white/20 hover:bg-white/30' : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              {videoEnabled ? (
                <Video className="w-5 h-5 text-white" />
              ) : (
                <VideoOff className="w-5 h-5 text-white" />
              )}
            </button>
          </div>

          {/* Error overlay */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90">
              <div className="text-center p-6">
                <VideoOff className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-white text-sm">{error}</p>
                <Button
                  variant="primary"
                  size="sm"
                  className="mt-4"
                  onClick={initializeStream}
                >
                  Retry
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recording Controls */}
      {showControls && permissionGranted && (
        <div className="flex items-center justify-center gap-4 mt-4">
          {!isRecording ? (
            <Button
              variant="danger"
              icon={Circle}
              onClick={startRecording}
            >
              Start Recording
            </Button>
          ) : (
            <>
              <Button
                variant="secondary"
                onClick={togglePause}
              >
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
              <Button
                variant="danger"
                icon={Square}
                onClick={stopRecording}
              >
                Stop Recording
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoRecorder;
