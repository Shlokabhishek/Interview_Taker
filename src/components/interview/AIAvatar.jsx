import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, User, Video } from 'lucide-react';
import { speakText, stopSpeech } from '../../utils/mediaUtils';

const AIAvatar = ({
  avatarImage,
  avatarVideo,
  avatarName = 'AI Interviewer',
  text,
  onSpeechEnd,
  autoSpeak = true,
  showControls = true,
  showSubtitles = true,
  size = 'lg',
  className = '',
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef(null);
  const activePlaybackIdRef = useRef(0);
  const playbackModeRef = useRef(null);

  const playVideo = useCallback(() => {
    if (avatarVideo && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
      setIsVideoPlaying(true);
    }
  }, [avatarVideo]);

  const stopVisualPlayback = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setIsVideoPlaying(false);
  }, []);

  const finishPlayback = useCallback(
    (playbackId) => {
      if (playbackId !== activePlaybackIdRef.current) return;
      playbackModeRef.current = null;
      stopVisualPlayback();
      setIsSpeaking(false);
      if (onSpeechEnd) onSpeechEnd();
    },
    [onSpeechEnd, stopVisualPlayback]
  );

  const speak = useCallback(() => {
    activePlaybackIdRef.current += 1;
    const playbackId = activePlaybackIdRef.current;

    if (!text && avatarVideo) {
      playbackModeRef.current = 'video';
      setIsSpeaking(true);
      playVideo();
      return;
    }

    if (!text || isMuted) {
      playbackModeRef.current = null;
      stopVisualPlayback();
      setIsSpeaking(false);
      if (onSpeechEnd) onSpeechEnd();
      return;
    }

    setIsSpeaking(true);
    playbackModeRef.current = 'tts';
    if (avatarVideo) {
      playVideo();
    }

    speakText(text, () => {
      finishPlayback(playbackId);
    });
  }, [avatarVideo, finishPlayback, isMuted, onSpeechEnd, playVideo, stopVisualPlayback, text]);

  const stop = useCallback(() => {
    activePlaybackIdRef.current += 1;
    playbackModeRef.current = null;
    stopSpeech();
    stopVisualPlayback();
    setIsSpeaking(false);
  }, [stopVisualPlayback]);

  const toggleMute = useCallback(() => {
    if (isSpeaking) {
      stop();
    }
    setIsMuted((prev) => !prev);
  }, [isSpeaking, stop]);

  useEffect(() => {
    if (autoSpeak && (text || avatarVideo)) {
      speak();
    }

    return () => {
      stop();
    };
  }, [autoSpeak, avatarVideo, speak, stop, text]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  const avatarSizes = {
    sm: 'w-48 h-48',
    md: 'w-64 h-64',
    lg: 'w-full aspect-video',
    inline: 'w-full aspect-video',
  };

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="relative w-full bg-gray-900 rounded-lg overflow-hidden shadow-2xl">
        <div className={`relative ${avatarSizes[size]}`}>
          {avatarVideo ? (
            <video
              ref={videoRef}
              src={avatarVideo}
              className="w-full h-full object-cover"
              onEnded={() => {
                if (playbackModeRef.current === 'video') {
                  finishPlayback(activePlaybackIdRef.current);
                } else {
                  setIsVideoPlaying(false);
                }
              }}
              onPlay={() => setIsVideoPlaying(true)}
              onPause={() => setIsVideoPlaying(false)}
              muted
              playsInline
            />
          ) : avatarImage ? (
            <img
              src={avatarImage}
              alt={avatarName}
              className={`w-full h-full object-cover transition-transform ${
                isSpeaking ? 'scale-105' : 'scale-100'
              }`}
              style={{ transition: 'transform 0.3s ease' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-primary-500/20 flex items-center justify-center mb-4">
                  <div className="text-white font-bold text-4xl">
                    {avatarName
                      .split(' ')
                      .map((part) => part[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                </div>
                <User className="w-8 h-8 text-white/40" />
              </div>
            </div>
          )}

          <div className="absolute top-3 left-3 flex items-center gap-2 bg-red-600 px-3 py-1.5 rounded-full shadow-lg">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-white text-xs font-semibold tracking-wider">LIVE</span>
          </div>

          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-3 py-2 rounded-lg">
            <p className="text-white text-sm font-medium">{avatarName}</p>
            <p className="text-gray-300 text-xs">AI Interviewer</p>
          </div>

          {isSpeaking && (
            <>
              <div className="absolute inset-0 border-4 border-green-500 animate-pulse pointer-events-none" />
              <div className="absolute top-3 right-3 flex items-center gap-2 bg-green-600 px-3 py-1.5 rounded-full shadow-lg">
                <div className="flex items-center gap-0.5">
                  <span className="w-1 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-4 bg-white rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                  <span className="w-1 h-5 bg-white rounded-full animate-pulse" style={{ animationDelay: '450ms' }} />
                  <span className="w-1 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: '600ms' }} />
                </div>
                <span className="text-white text-xs font-semibold">Speaking</span>
              </div>
            </>
          )}

          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2.5 py-1.5 rounded">
            <Video className="w-3.5 h-3.5 text-green-400" />
            <div className="flex items-end gap-0.5">
              <div className="w-0.5 h-2 bg-green-400 rounded-full" />
              <div className="w-0.5 h-3 bg-green-400 rounded-full" />
              <div className="w-0.5 h-4 bg-green-400 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {showControls && (
        <div className="flex items-center justify-between mt-4 px-2">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleMute}
              className={`p-2.5 rounded-full transition-all ${
                isMuted
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {!isSpeaking && (text || avatarVideo) && !isMuted && (
              <button
                onClick={speak}
                className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-xs font-medium"
              >
                Replay
              </button>
            )}
          </div>

          <div className="text-xs text-gray-500">
            {isSpeaking ? 'Speaking...' : isMuted ? 'Muted' : isVideoPlaying ? 'Video Active' : 'Connected'}
          </div>
        </div>
      )}

      {showSubtitles && text && (
        <div className="mt-3 p-3 bg-black/80 backdrop-blur-sm rounded-lg">
          <p className="text-white text-sm leading-relaxed text-center">{text}</p>
        </div>
      )}
    </div>
  );
};

export default AIAvatar;
