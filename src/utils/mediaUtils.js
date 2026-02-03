// Media utilities for recording and processing

// Check for media device support
export const checkMediaSupport = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const hasVideo = devices.some(device => device.kind === 'videoinput');
    const hasAudio = devices.some(device => device.kind === 'audioinput');
    
    return { hasVideo, hasAudio, supported: hasVideo || hasAudio };
  } catch (error) {
    console.error('Error checking media support:', error);
    return { hasVideo: false, hasAudio: false, supported: false };
  }
};

// Get user media stream
export const getUserMedia = async (video = true, audio = true) => {
  try {
    const constraints = {
      video: video ? {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user',
      } : false,
      audio: audio ? {
        echoCancellation: true,
        noiseSuppression: true,
      } : false,
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    return { stream, error: null };
  } catch (error) {
    console.error('Error getting user media:', error);
    return { stream: null, error: error.message };
  }
};

// Stop all tracks in a stream
export const stopMediaStream = (stream) => {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
};

// Create media recorder
export const createMediaRecorder = (stream, mimeType = 'video/webm') => {
  const options = { mimeType };
  
  // Check for supported types
  const types = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4',
  ];

  let selectedType = types.find(type => MediaRecorder.isTypeSupported(type)) || '';
  
  if (selectedType) {
    options.mimeType = selectedType;
  }

  try {
    return new MediaRecorder(stream, options);
  } catch (error) {
    console.error('Error creating media recorder:', error);
    return null;
  }
};

// Convert blob to base64
export const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Create download link for blob
export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Simple speech synthesis for avatar
export const speakText = (text, onEnd = null) => {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported');
    if (onEnd) onEnd();
    return null;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9;
  utterance.pitch = 1;
  utterance.volume = 1;

  // Try to use a natural-sounding voice
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(v => 
    v.name.includes('Natural') || 
    v.name.includes('Google') ||
    v.lang.startsWith('en')
  );
  
  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }

  window.speechSynthesis.speak(utterance);
  
  return utterance;
};

// Stop speech
export const stopSpeech = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

// Simple speech recognition
export const createSpeechRecognition = () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  return recognition;
};

// Process image for face detection (placeholder for face-api.js integration)
export const processImageForFace = async (imageData) => {
  // This would integrate with face-api.js for real face detection
  // For now, return a placeholder validation
  return {
    detected: true,
    confidence: 0.95,
    landmarks: null,
  };
};

// Create avatar image from uploaded images
export const createAvatarPreview = (imageFiles) => {
  if (!imageFiles || imageFiles.length === 0) return null;
  
  // Return the first image as preview
  return URL.createObjectURL(imageFiles[0]);
};
