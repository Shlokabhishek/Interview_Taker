import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, VolumeX, User } from 'lucide-react';
import { Avatar } from '../shared';
import { speakText, stopSpeech } from '../../utils/mediaUtils';

const AIAvatar = ({
  avatarImage,
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
  const utteranceRef = useRef(null);

  // Speak the text
  const speak = useCallback(() => {
    if (!text || isMuted) {
      if (onSpeechEnd) onSpeechEnd();
      return;
    }

    setIsSpeaking(true);
    
    utteranceRef.current = speakText(text, () => {
      setIsSpeaking(false);
      if (onSpeechEnd) onSpeechEnd();
    });
  }, [text, isMuted, onSpeechEnd]);

  // Stop speaking
  const stop = useCallback(() => {
    stopSpeech();
    setIsSpeaking(false);
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (isSpeaking) {
      stop();
    }
    setIsMuted(!isMuted);
  }, [isMuted, isSpeaking, stop]);

  // Auto speak when text changes
  useEffect(() => {
    if (autoSpeak && text) {
      speak();
    }
    
    return () => {
      stop();
    };
  }, [text, autoSpeak]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, []);

  const avatarSizes = {
    sm: '2xl',
    md: '2xl',
    lg: '3xl',
  };

  const containerSizes = {
    sm: 'w-32 h-32',
    md: 'w-48 h-48',
    lg: 'w-64 h-64',
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Avatar Container */}
      <div className={`relative ${containerSizes[size]}`}>
        {/* Animated rings when speaking */}
        {isSpeaking && (
          <>
            <div className="absolute inset-0 rounded-full bg-primary-400/20 animate-ping" />
            <div className="absolute inset-2 rounded-full bg-primary-400/30 animate-pulse" />
          </>
        )}
        
        {/* Avatar */}
        <div className="absolute inset-4 rounded-full overflow-hidden bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-xl">
          {avatarImage ? (
            <img
              src={avatarImage}
              alt={avatarName}
              className={`w-full h-full object-cover ${isSpeaking ? 'avatar-speaking' : ''}`}
            />
          ) : (
            <div className={`flex flex-col items-center justify-center w-full h-full ${isSpeaking ? 'avatar-speaking' : ''}`}>
              <div className="text-white font-bold text-6xl">
                {avatarName
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
              <User className="w-12 h-12 text-white/60 mt-2" />
            </div>
          )}
        </div>

        {/* Speaking indicator */}
        {isSpeaking && (
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 flex items-center gap-1 bg-primary-600 px-3 py-1 rounded-full">
            <div className="flex items-center gap-0.5">
              <span className="w-1 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-4 bg-white rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
              <span className="w-1 h-5 bg-white rounded-full animate-pulse" style={{ animationDelay: '450ms' }} />
              <span className="w-1 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: '600ms' }} />
            </div>
          </div>
        )}
      </div>

      {/* Name */}
      <h3 className="mt-4 text-lg font-semibold text-gray-900">{avatarName}</h3>
      
      {/* Status */}
      <p className="text-sm text-gray-500">
        {isSpeaking ? 'Speaking...' : isMuted ? 'Muted' : 'Ready'}
      </p>

      {/* Controls */}
      {showControls && (
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={toggleMute}
            className={`p-3 rounded-full transition-colors ${
              isMuted 
                ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>
          
          {!isSpeaking && text && !isMuted && (
            <button
              onClick={speak}
              className="px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors text-sm font-medium"
            >
              Replay
            </button>
          )}
        </div>
      )}

      {/* Current text being spoken */}
      {text && (
        <div className="mt-4 p-4 bg-gray-50 rounded-xl max-w-md text-center">
          <p className="text-gray-700 text-sm leading-relaxed">{text}</p>
        </div>
      )}
    </div>
  );
};

export default AIAvatar;
