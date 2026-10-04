import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, Circle, Square, Smartphone } from 'lucide-react';
import { Button } from '../shared';
import { getUserMedia, stopMediaStream, createMediaRecorder, blobToBase64 } from '../../services/media';

const VideoRecorder = ({
  onRecordingComplete,
  onRecordingStart,
  maxDuration = 300,
  autoStart = false,
  recordingActive = false,
  showControls = true,
  showPreview = true,
  className = '',
  detectPhone = false,
  onPhoneDetection,
  onIntegrityEvent,
}) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const phoneScanRef = useRef(null);
  const lastPhoneAlertRef = useRef(0);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const audioDataRef = useRef(null);
  const lastAudioSampleRef = useRef(0);
  const durationRef = useRef(0);

  const [stream, setStream] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [phoneWarning, setPhoneWarning] = useState(null);

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
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        const audioContext = new AudioContextClass();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        audioContext.createMediaStreamSource(mediaStream).connect(analyser);
        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        audioDataRef.current = new Uint8Array(analyser.frequencyBinCount);
      }
    } catch (e) {}
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

  const scanForPhoneLikeObject = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || !video.videoWidth || !video.videoHeight) return;

    const canvas = document.createElement('canvas');
    const width = 160;
    const height = Math.max(90, Math.round((video.videoHeight / video.videoWidth) * width));
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);
    const { data } = ctx.getImageData(0, 0, width, height);
    const visited = new Uint8Array(width * height);
    const minArea = Math.round(width * height * 0.008);
    const maxArea = Math.round(width * height * 0.18);

    const isPhonePixel = (index) => {
      const offset = index * 4;
      const r = data[offset];
      const g = data[offset + 1];
      const b = data[offset + 2];
      const brightness = (r + g + b) / 3;
      const contrast = Math.max(r, g, b) - Math.min(r, g, b);
      return brightness < 55 || (brightness > 185 && contrast < 38);
    };

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const start = y * width + x;
        if (visited[start] || !isPhonePixel(start)) continue;

        const stack = [start];
        visited[start] = 1;
        let minX = x;
        let maxX = x;
        let minY = y;
        let maxY = y;
        let area = 0;

        while (stack.length) {
          const current = stack.pop();
          area += 1;
          const cx = current % width;
          const cy = Math.floor(current / width);
          minX = Math.min(minX, cx);
          maxX = Math.max(maxX, cx);
          minY = Math.min(minY, cy);
          maxY = Math.max(maxY, cy);

          const neighbors = [current - 1, current + 1, current - width, current + width];
          for (const next of neighbors) {
            if (next < 0 || next >= width * height || visited[next]) continue;
            const nx = next % width;
            if (Math.abs(nx - cx) > 1) continue;
            if (isPhonePixel(next)) {
              visited[next] = 1;
              stack.push(next);
            }
          }
        }

        const boxWidth = maxX - minX + 1;
        const boxHeight = maxY - minY + 1;
        const aspect = Math.max(boxWidth, boxHeight) / Math.max(1, Math.min(boxWidth, boxHeight));
        const rectangularity = area / Math.max(1, boxWidth * boxHeight);
        const centerY = (minY + maxY) / 2 / height;

        if (
          area >= minArea &&
          area <= maxArea &&
          aspect >= 1.45 &&
          aspect <= 3.8 &&
          rectangularity > 0.42 &&
          centerY > 0.18
        ) {
          const now = Date.now();
          const event = {
            type: 'phone_detected',
            detectedAt: new Date().toISOString(),
            timestamp: new Date().toISOString(),
            confidence: Math.min(0.92, Number((rectangularity * 0.7 + Math.min(aspect, 2.8) / 5).toFixed(2))),
            boundingBox: { x: minX / width, y: minY / height, width: boxWidth / width, height: boxHeight / height },
            reason: 'Phone-like rectangular object detected in camera frame',
          };

          setPhoneWarning(event);
          if (event.confidence >= 0.58 && now - lastPhoneAlertRef.current > 5000) {
            lastPhoneAlertRef.current = now;
            onPhoneDetection?.(event);
            onIntegrityEvent?.(event);
          }
          return;
        }
      }
    }
  }, [onIntegrityEvent, onPhoneDetection]);

  const sampleAudio = useCallback(() => {
    if (!analyserRef.current || !audioDataRef.current) return;
    analyserRef.current.getByteTimeDomainData(audioDataRef.current);
    const energy = audioDataRef.current.reduce((sum, value) => sum + Math.abs(value - 128) / 128, 0) / audioDataRef.current.length;
    const now = Date.now();
    if (energy < 0.035 && now - lastAudioSampleRef.current > 3500) {
      lastAudioSampleRef.current = now;
      onIntegrityEvent?.({ type: 'audio_anomaly', subtype: 'extended_pause', confidence: 0.42, timestamp: new Date().toISOString() });
    }
  }, [onIntegrityEvent]);

  useEffect(() => {
    initializeStream();

    return () => {
      clearTimer();
      if (phoneScanRef.current) {
        clearInterval(phoneScanRef.current);
        phoneScanRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      stopMediaStream(streamRef.current);
      audioContextRef.current?.close?.();
      audioContextRef.current = null;
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

  useEffect(() => {
    if (detectPhone && recordingActive && permissionGranted) {
      phoneScanRef.current = setInterval(scanForPhoneLikeObject, 1500);
      const audioScan = setInterval(sampleAudio, 1000);
      return () => {
        if (phoneScanRef.current) {
          clearInterval(phoneScanRef.current);
          phoneScanRef.current = null;
        }
        clearInterval(audioScan);
      };
    }

    if (phoneScanRef.current) {
      clearInterval(phoneScanRef.current);
      phoneScanRef.current = null;
    }
  }, [detectPhone, permissionGranted, recordingActive, sampleAudio, scanForPhoneLikeObject]);

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

          {phoneWarning && detectPhone && recordingActive && (
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-yellow-500/90 px-3 py-1.5 rounded-full">
              <Smartphone className="w-4 h-4 text-gray-900" />
              <span className="text-gray-900 text-sm font-medium">Possible phone detected</span>
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
