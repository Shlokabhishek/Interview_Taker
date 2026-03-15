import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, VolumeX, User, Video, Play } from 'lucide-react';
import { Avatar } from '../shared';
import { speakText, stopSpeech } from '../../utils/mediaUtils';

const AIAvatar = ({
  avatarImage,
  avatarVideo, // New prop for video URL
  avatarName = 'AI Interviewer',
  text,
  onSpeechEnd,
  autoSpeak = true,
  showControls = true,
  size = 'lg',
  className = '',
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const utteranceRef = useRef(null);
  const videoRef = useRef(null);

  // Play video if available
  const playVideo = useCallback(() => {
    if (avatarVideo && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setIsVideoPlaying(true);
      setIsSpeaking(true);
    }
  }, [avatarVideo]);

  // Handle video end
  const handleVideoEnd = useCallback(() => {
    setIsVideoPlaying(false);
    setIsSpeaking(false);
    if (onSpeechEnd) onSpeechEnd();
  }, [onSpeechEnd]);

  // Speak the text (fallback when no video)
  const speak = useCallback(() => {
    // If video is available, play video instead
    if (avatarVideo && videoRef.current) {
      playVideo();
      return;
    }

    if (!text || isMuted) {
      if (onSpeechEnd) onSpeechEnd();
      return;
    }

    setIsSpeaking(true);
    
    utteranceRef.current = speakText(text, () => {
      setIsSpeaking(false);
      if (onSpeechEnd) onSpeechEnd();
    });
  }, [text, isMuted, onSpeechEnd, avatarVideo, playVideo]);

  // Stop speaking/playing
  const stop = useCallback(() => {
    stopSpeech();
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setIsSpeaking(false);
    setIsVideoPlaying(false);
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (isSpeaking) {
      stop();
    }
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  }, [isMuted, isSpeaking, stop]);

  // Auto speak/play when text changes
  useEffect(() => {
    if (autoSpeak && (text || avatarVideo)) {
      speak();
    }
    
    return () => {
      stop();
    };
  }, [text, autoSpeak, avatarVideo]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, []);

  const avatarSizes = {
    sm: 'w-48 h-48',
    md: 'w-64 h-64',
    lg: 'w-full aspect-video',
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Live Video Container */}
      <div className="relative w-full bg-gray-900 rounded-lg overflow-hidden shadow-2xl">
        {/* Video Feed */}
        <div className={`relative ${avatarSizes[size]}`}>
          {/* Real Video Playback */}
          {avatarVideo ? (
            <video
              ref={videoRef}
              src={avatarVideo}
              className="w-full h-full object-cover"
              onEnded={handleVideoEnd}
              onPlay={() => { setIsVideoPlaying(true); setIsSpeaking(true); }}
              onPause={() => { setIsVideoPlaying(false); setIsSpeaking(false); }}
              muted={isMuted}
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
                      .map(n => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                </div>
                <User className="w-8 h-8 text-white/40" />
              </div>
            </div>
          )}

          {/* Live Indicator */}
          <div className="absolute top-3 left-3 flex items-center gap-2 bg-red-600 px-3 py-1.5 rounded-full shadow-lg">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-white text-xs font-semibold tracking-wider">LIVE</span>
          </div>

          {/* Interviewer Name Badge */}
          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-3 py-2 rounded-lg">
            <p className="text-white text-sm font-medium">{avatarName}</p>
            <p className="text-gray-300 text-xs">AI Interviewer</p>
          </div>

          {/* Speaking Indicator Overlay */}
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

          {/* Connection Quality Indicator */}
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

      {/* Controls */}
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
              {isMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            
            {!isSpeaking && text && !isMuted && (
              <button
                onClick={speak}
                className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-xs font-medium"
              >
                Replay
              </button>
            )}
          </div>

          <div className="text-xs text-gray-500">
            {isSpeaking ? '🎙️ Speaking...' : isMuted ? '🔇 Muted' : '✓ Connected'}
          </div>
        </div>
      )}

      {/* Current text being spoken - Subtitle Style */}
      {text && (
        <div className="mt-3 p-3 bg-black/80 backdrop-blur-sm rounded-lg">
          <p className="text-white text-sm leading-relaxed text-center">{text}</p>
        </div>
      )}
    </div>
  );
};

export default AIAvatar;
