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

const getPreferredVoice = () => {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((voice) => /natural|samantha|zira|google/i.test(voice.name)) ||
    voices.find((voice) => voice.lang?.toLowerCase().startsWith('en-in')) ||
    voices.find((voice) => voice.lang?.toLowerCase().startsWith('en-us')) ||
    voices.find((voice) => voice.lang?.toLowerCase().startsWith('en')) ||
    null
  );
};

// Simple speech synthesis for avatar
export const speakText = (text, onEndOrOptions = null) => {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported');
    const fallbackOnEnd =
      typeof onEndOrOptions === 'function' ? onEndOrOptions : onEndOrOptions?.onEnd;
    if (fallbackOnEnd) fallbackOnEnd();
    return null;
  }

  const options =
    typeof onEndOrOptions === 'function'
      ? { onEnd: onEndOrOptions }
      : onEndOrOptions || {};

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = options.rate || 0.92;
  utterance.pitch = options.pitch || 1;
  utterance.volume = options.volume || 1;

  // Try to use a natural-sounding voice
  const preferredVoice = getPreferredVoice();
  
  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  if (options.onStart) {
    utterance.onstart = options.onStart;
  }
  if (options.onEnd) {
    utterance.onend = options.onEnd;
    utterance.onerror = options.onEnd;
  }

  // Some browsers need a tick after cancel() before the next utterance is spoken.
  setTimeout(() => {
    window.speechSynthesis.speak(utterance);
  }, 25);
  
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
