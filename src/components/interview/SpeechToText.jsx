import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { createSpeechRecognition } from '../../utils/mediaUtils';

const SpeechToText = ({
  onTranscript,
  onInterimTranscript,
  isListening: externalListening,
  onListeningChange,
  language = 'en-US',
  showVisualizer = true,
  className = '',
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);

  // Initialize speech recognition
  useEffect(() => {
    const recognition = createSpeechRecognition();
    
    if (!recognition) {
      setError('Speech recognition is not supported in this browser');
      return;
    }

    recognition.lang = language;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (finalTranscript) {
        setTranscript(prev => prev + ' ' + finalTranscript);
        if (onTranscript) onTranscript(finalTranscript);
      }

      setInterimTranscript(interim);
      if (onInterimTranscript) onInterimTranscript(interim);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'no-speech') {
        setError(`Speech recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      // Restart if still supposed to be listening
      if (isListening) {
        try {
          recognition.start();
        } catch (e) {
          // Ignore errors on restart
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore
        }
      }
    };
  }, [language]);

  // Audio level visualization
  const startAudioVisualization = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateLevel = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setAudioLevel(Math.min(100, average * 1.5));
        
        animationRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch (err) {
      console.error('Error starting audio visualization:', err);
    }
  }, []);

  const stopAudioVisualization = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  // Start listening
  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    
    setError(null);
    setTranscript('');
    setInterimTranscript('');
    
    try {
      recognitionRef.current.start();
      setIsListening(true);
      if (onListeningChange) onListeningChange(true);
      
      if (showVisualizer) {
        startAudioVisualization();
      }
    } catch (err) {
      console.error('Error starting recognition:', err);
    }
  }, [onListeningChange, showVisualizer, startAudioVisualization]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    
    try {
      recognitionRef.current.stop();
      setIsListening(false);
      if (onListeningChange) onListeningChange(false);
      stopAudioVisualization();
    } catch (err) {
      console.error('Error stopping recognition:', err);
    }
  }, [onListeningChange, stopAudioVisualization]);

  // Handle external control
  useEffect(() => {
    if (externalListening !== undefined) {
      if (externalListening && !isListening) {
        startListening();
      } else if (!externalListening && isListening) {
        stopListening();
      }
    }
  }, [externalListening]);

  // Cleanup
  useEffect(() => {
    return () => {
      stopListening();
      stopAudioVisualization();
    };
  }, []);

  return (
    <div className={className}>
      {/* Visualizer */}
      {showVisualizer && isListening && (
        <div className="flex items-center justify-center gap-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-primary-500 rounded-full transition-all duration-75"
              style={{
                height: `${Math.max(8, audioLevel * (0.5 + Math.random() * 0.5))}px`,
              }}
            />
          ))}
        </div>
      )}

      {/* Status */}
      <div className="flex items-center justify-center gap-2">
        {isListening ? (
          <>
            <div className="w-3 h-3 bg-red-500 rounded-full recording-indicator" />
            <span className="text-sm text-gray-600">Listening...</span>
          </>
        ) : (
          <>
            <Mic className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">Click to start speaking</span>
          </>
        )}
      </div>

      {/* Transcript display */}
      {(transcript || interimTranscript) && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-gray-700">
            {transcript}
            <span className="text-gray-400 italic">{interimTranscript}</span>
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      {/* Manual toggle */}
      <button
        onClick={isListening ? stopListening : startListening}
        className={`mt-4 p-4 rounded-full transition-all ${
          isListening
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-primary-500 hover:bg-primary-600 text-white'
        }`}
      >
        {isListening ? (
          <MicOff className="w-6 h-6" />
        ) : (
          <Mic className="w-6 h-6" />
        )}
      </button>
    </div>
  );
};

export default SpeechToText;
