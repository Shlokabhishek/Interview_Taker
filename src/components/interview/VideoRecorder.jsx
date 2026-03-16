import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, Circle, Square } from 'lucide-react';
import { Button } from '../shared';
import { getUserMedia, stopMediaStream, createMediaRecorder, blobToBase64 } from '../../utils/mediaUtils';

const VideoRecorder = ({
  onRecordingComplete,
  onRecordingStart,
  maxDuration = 300,
  autoStart = false,
  recordingActive = false,
  showControls = true,
  showPreview = true,
  className = '',
}) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const durationRef = useRef(0);

  const [stream, setStream] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const syncVideoElement = useCallback((mediaStream) => {
    if (videoRef.current) {
      videoRef.current.srcObject = mediaStream || null;
    }
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const initializeStream = useCallback(async () => {
    if (streamRef.current) {
      syncVideoElement(streamRef.current);
      return streamRef.current;
    }

    setError(null);
    const { stream: mediaStream, error: mediaError } = await getUserMedia(true, true);

    if (mediaError || !mediaStream) {
      setError(`Failed to access camera/microphone: ${mediaError || 'Unknown error'}`);
      return null;
    }

    streamRef.current = mediaStream;
    setStream(mediaStream);
    setPermissionGranted(true);
    syncVideoElement(mediaStream);
    return mediaStream;
  }, [syncVideoElement]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    clearTimer();
    setIsRecording(false);
    setIsPaused(false);
  }, [clearTimer]);

  const startTimer = useCallback(() => {
    clearTimer();
    timerRef.current = setInterval(() => {
      setDuration((prev) => {
        const next = prev + 1;
        durationRef.current = next;
        if (next >= maxDuration) {
          stopRecording();
          return maxDuration;
        }
        return next;
      });
    }, 1000);
  }, [clearTimer, maxDuration, stopRecording]);

  const startRecording = useCallback(async () => {
    if (isRecording) return;

    const activeStream = streamRef.current || (await initializeStream());
    if (!activeStream) return;

    chunksRef.current = [];
    durationRef.current = 0;
    setDuration(0);

    const recorder = createMediaRecorder(activeStream);
    if (!recorder) {
      setError('Failed to create media recorder');
      return;
    }

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'video/webm' });
      const base64 = await blobToBase64(blob);

      if (onRecordingComplete) {
        onRecordingComplete({
          blob,
          base64,
          duration: durationRef.current,
          type: recorder.mimeType || 'video/webm',
        });
      }
    };

    mediaRecorderRef.current = recorder;
    recorder.start(1000);
    setIsRecording(true);
    setIsPaused(false);
    startTimer();

    if (onRecordingStart) {
      onRecordingStart();
    }
  }, [initializeStream, isRecording, onRecordingComplete, onRecordingStart, startTimer]);

  const togglePause = useCallback(() => {
    if (!mediaRecorderRef.current) return;

    if (isPaused) {
      mediaRecorderRef.current.resume();
      startTimer();
    } else {
      mediaRecorderRef.current.pause();
      clearTimer();
    }

    setIsPaused((prev) => !prev);
  }, [clearTimer, isPaused, startTimer]);

  const toggleVideo = useCallback(() => {
    const activeStream = streamRef.current;
    if (!activeStream) return;

    const videoTrack = activeStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setVideoEnabled(videoTrack.enabled);
    }
  }, []);

  const toggleAudio = useCallback(() => {
    const activeStream = streamRef.current;
    if (!activeStream) return;

    const audioTrack = activeStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setAudioEnabled(audioTrack.enabled);
    }
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    initializeStream();

    return () => {
      clearTimer();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      stopMediaStream(streamRef.current);
      streamRef.current = null;
    };
  }, [clearTimer, initializeStream]);

  useEffect(() => {
    syncVideoElement(stream);
  }, [stream, syncVideoElement]);

  useEffect(() => {
    const shouldRecord = recordingActive || autoStart;
    if (shouldRecord && permissionGranted && !isRecording) {
      startRecording();
    }
    if (!shouldRecord && isRecording) {
      stopRecording();
    }
  }, [autoStart, permissionGranted, isRecording, recordingActive, startRecording, stopRecording]);

  return (
    <div className={`relative ${className}`}>
      {showPreview && (
        <div className="relative bg-gray-900 rounded-xl overflow-hidden aspect-video">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover transform scale-x-[-1]"
          />

          {isRecording && (
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-full">
              <Circle className="w-3 h-3 text-red-500 fill-red-500 recording-indicator" />
              <span className="text-white text-sm font-medium">
                {formatTime(duration)} / {formatTime(maxDuration)}
              </span>
            </div>
          )}

          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-3">
            <button
              onClick={toggleAudio}
              className={`p-3 rounded-full transition-colors ${
                audioEnabled ? 'bg-white/20 hover:bg-white/30' : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              {audioEnabled ? <Mic className="w-5 h-5 text-white" /> : <MicOff className="w-5 h-5 text-white" />}
            </button>

            <button
              onClick={toggleVideo}
              className={`p-3 rounded-full transition-colors ${
                videoEnabled ? 'bg-white/20 hover:bg-white/30' : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              {videoEnabled ? <Video className="w-5 h-5 text-white" /> : <VideoOff className="w-5 h-5 text-white" />}
            </button>
          </div>

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

      {showControls && permissionGranted && (
        <div className="flex items-center justify-center gap-4 mt-4">
          {!isRecording ? (
            <Button variant="danger" icon={Circle} onClick={startRecording}>
              Start Recording
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={togglePause}>
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
              <Button variant="danger" icon={Square} onClick={stopRecording}>
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
