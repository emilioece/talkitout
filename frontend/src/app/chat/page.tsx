"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { VideoCameraSlashIcon, VideoCameraIcon } from "@heroicons/react/24/outline";

// Web Speech API types
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
  interpretation: unknown;
  emma: Document | null;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((event: Event) => void) | null;
  onstart: ((event: Event) => void) | null;
}

type Message = {
  role: "user" | "assistant" | "system";
  content: string;
};

type Feedback = {
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  summary: string;
};

type ConfidenceFeedback = {
  posture: string;
  eyeContact: string;
  gestures: string;
  facialExpressions: string;
  overallConfidence: string;
  recommendations: string[];
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "system",
      content: "Welcome! Press the microphone button to begin the scenario. You'll be speaking with a coworker who has consistently missed deadlines."
    }
  ]);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [interactionCount, setInteractionCount] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);
  
  // Camera-related states
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState<boolean | null>(null);
  const [recordedFrames, setRecordedFrames] = useState<ImageData[]>([]);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [confidenceFeedback, setConfidenceFeedback] = useState<ConfidenceFeedback | null>(null);
  
  // Add new state for session management and navigation
  const [sessionEnded, setSessionEnded] = useState(false);
  const router = useRouter();
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentPlayingMessageRef = useRef<string>("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const frameIntervalRef = useRef<number | null>(null);
  
  // Add a new ref to track the play promise state
  const playPromiseRef = useRef<Promise<void> | null>(null);
  
  // First, add new state variables for tracking camera position
  const [cameraPosition, setCameraPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [cameraCorner, setCameraCorner] = useState<'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'>('bottom-right');
  const dragStartPositionRef = useRef({ x: 0, y: 0 });
  const cameraDivRef = useRef<HTMLDivElement | null>(null);
  
  // Utility function to safely check if camera is available
  const isCameraAvailable = async (): Promise<boolean> => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return false;
    }
    
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.some(device => device.kind === 'videoinput');
    } catch (e) {
      console.error("Error checking for camera availability:", e);
      return false;
    }
  };

  // Update the setupVideoElement function to use the playPromiseRef for locking play operations
  const setupVideoElement = (stream: MediaStream) => {
    console.log("Setting up video element with stream:", stream.id);
    console.log("Video element exists:", !!videoRef.current);
    
    // Safety check
    if (!videoRef.current) {
      console.error("Video element is not available");
      
      // Create video element programmatically if needed
      const container = document.getElementById('camera-container');
      if (container) {
        console.log("Creating video element programmatically");
        const video = document.createElement('video');
        video.autoplay = true;
        video.playsInline = true;
        video.muted = true;
        video.className = "w-full h-full rounded-lg object-cover";
        video.style.minHeight = "120px";
        
        // Clear container and append new video
        container.innerHTML = '';
        container.appendChild(video);
        
        // Update ref
        videoRef.current = video;
        
        // Try again with the new element
        setupVideoElement(stream);
        return;
      } else {
        console.error("Camera container not found");
        return;
      }
    }
    
    try {
      // IMPORTANT: We need to wait for any existing play promise to resolve or reject before proceeding
      const safeSetupVideo = async () => {
        try {
          // If there's a pending play promise, wait for it to complete first
          if (playPromiseRef.current) {
            console.log("Waiting for existing play promise to resolve...");
            try {
              await playPromiseRef.current;
            } catch (err) {
              console.log("Previous play promise rejected, but we can continue:", err);
            }
            playPromiseRef.current = null;
          }
          
          if (!videoRef.current) return;
          
          // Ensure we're working with a clean state
          try {
            // Pause and reset the video element first
            videoRef.current.pause();
            
            // Set all properties BEFORE calling play()
            videoRef.current.style.display = "block";
            videoRef.current.srcObject = stream;
            videoRef.current.muted = true;
            videoRef.current.setAttribute('playsinline', 'true');
            
            // Make sure element is visible and has correct styling
            videoRef.current.style.opacity = '1';
            
            // Wait a small amount of time for the srcObject to be processed
            await new Promise(resolve => setTimeout(resolve, 50));
            
            console.log("Playing video...");
            // Store the play promise in the ref so we can track it
            const playPromise = videoRef.current.play();
            playPromiseRef.current = playPromise;
            
            // Handle the play promise
            if (playPromise !== undefined) {
              try {
                await playPromise;
                console.log("Video playback started successfully");
                // Reset the ref once completed successfully
                if (playPromiseRef.current === playPromise) {
                  playPromiseRef.current = null;
                }
              } catch (err) {
                console.error("Error playing video:", err);
                // Reset the ref when there's an error
                if (playPromiseRef.current === playPromise) {
                  playPromiseRef.current = null;
                }
                
                // Try iOS/Safari specific fixes
                const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
                if (isIOS) {
                  console.log("iOS device detected, trying alternative approach");
                  
                  // Detach current srcObject but keep the reference
                  const currentStream = videoRef.current.srcObject;
                  videoRef.current.srcObject = null;
                  
                  // Wait a bit
                  await new Promise(resolve => setTimeout(resolve, 100));
                  
                  if (videoRef.current) {
                    // Re-attach the same stream
                    videoRef.current.srcObject = currentStream;
                    videoRef.current.muted = true;
                    
                    // Wait another short delay
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                    // Try to play again with a user interaction simulation
                    try {
                      // Add controls temporarily
                      videoRef.current.controls = true;
                      
                      // Wait for iOS to recognize controls
                      await new Promise(resolve => setTimeout(resolve, 50));
                      
                      // Remove controls and try playing
                      videoRef.current.controls = false;
                      const retryPlayPromise = videoRef.current.play();
                      playPromiseRef.current = retryPlayPromise;
                      
                      await retryPlayPromise;
                      console.log("iOS fallback play succeeded");
                      playPromiseRef.current = null;
                    } catch (iosError) {
                      console.error("iOS fallback play failed:", iosError);
                      playPromiseRef.current = null;
                      alert("Could not play camera feed. Please tap on the video area to enable the camera.");
                    }
                  }
                } else {
                  alert("Could not play camera feed. Please check your browser settings and try again.");
                }
              }
            } else {
              console.log("Play promise not supported, continuing anyway");
              // Still clear the ref since we won't get a promise resolution
              playPromiseRef.current = null;
            }
          } catch (setupError) {
            console.error("Error during video element setup:", setupError);
            playPromiseRef.current = null;
          }
        } catch (outerError) {
          console.error("Unexpected error in safeSetupVideo:", outerError);
          playPromiseRef.current = null;
        }
      };
      
      // Start the async setup process
      safeSetupVideo();
    } catch (err) {
      console.error("Error setting up video element:", err);
      playPromiseRef.current = null;
      alert("Failed to display camera feed. Please try again or use a different browser.");
    }
  };
  
  // Diagnostic function to test camera and provide detailed feedback
  const testCameraSupport = async () => {
    console.log("Testing camera support...");
    
    // Check for basic mediaDevices API
    if (!navigator.mediaDevices) {
      console.error("MediaDevices API not supported in this browser");
      return false;
    }
    
    try {
      // Check if we can enumerate devices
      if (typeof navigator.mediaDevices.enumerateDevices !== 'function') {
        console.error("Cannot enumerate devices - API not supported");
        return false;
      }
      
      // List all media devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      console.log(`Found ${videoDevices.length} video input devices:`);
      videoDevices.forEach((device, index) => {
        console.log(`Device ${index + 1}: ${device.label || 'Label not available'}`);
      });
      
      if (videoDevices.length === 0) {
        console.error("No video input devices found");
        return false;
      }
      
      return true;
    } catch (err) {
      console.error("Error testing camera support:", err);
      return false;
    }
  };

  // Add this new direct video initialization function after setupVideoElement function
  const initializeVideoDirectly = () => {
    console.log("Attempting direct video initialization");
    if (!videoRef.current || !videoStreamRef.current) {
      console.error("Missing video element or stream for direct initialization");
      return;
    }
    
    try {
      // First, make sure the video element is visible and ready
      videoRef.current.style.display = "block";
      videoRef.current.style.opacity = "1";
      
      // Set important attributes for iOS/mobile compatibility
      videoRef.current.setAttribute('autoplay', '');
      videoRef.current.setAttribute('playsinline', '');
      videoRef.current.setAttribute('muted', '');
      videoRef.current.muted = true;
      
      // For some browsers, creating a new video element can help
      const container = document.getElementById('camera-container');
      if (container) {
        // Keep a reference to the stream
        const stream = videoStreamRef.current;
        
        // Create a completely new video element
        const newVideo = document.createElement('video');
        newVideo.autoplay = true;
        newVideo.playsInline = true;
        newVideo.muted = true;
        newVideo.className = "w-full h-full object-cover";
        newVideo.style.minHeight = "120px";
        
        // Find the video container inside the camera container
        const videoContainer = container.querySelector('.relative');
        if (videoContainer) {
          // Replace only the video element, not the entire container
          const oldVideo = videoContainer.querySelector('video');
          if (oldVideo) {
            videoContainer.replaceChild(newVideo, oldVideo);
            
            // Update the ref to point to the new element
            videoRef.current = newVideo;
            
            // Directly set srcObject and attempt to play without promise tracking
            newVideo.srcObject = stream;
            
            // Force play with a small timeout
            setTimeout(() => {
              if (newVideo.paused) {
                const playAttempt = newVideo.play();
                console.log("Direct play attempt initiated");
                
                if (playAttempt) {
                  playAttempt.catch(err => {
                    console.error("Direct play failed:", err);
                    
                    // If autoplay is blocked, show a clickable overlay
                    const playButton = document.createElement('button');
                    playButton.className = "absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 text-white z-20";
                    playButton.innerHTML = `
                      <div class="flex flex-col items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Tap to enable camera</span>
                      </div>
                    `;
                    
                    playButton.onclick = () => {
                      newVideo.play().catch(e => console.error("User-initiated play failed:", e));
                      playButton.remove();
                    };
                    
                    videoContainer.appendChild(playButton);
                  });
                }
              }
            }, 100);
          }
        }
      }
    } catch (err) {
      console.error("Error in direct video initialization:", err);
    }
  };

  // Add these functions for handling dragging functionality
  const handleDragStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!cameraDivRef.current) return;
    
    setIsDragging(true);
    
    // Get the starting position for mouse or touch
    if ('touches' in e) {
      // Touch event
      dragStartPositionRef.current = {
        x: e.touches[0].clientX - cameraDivRef.current.getBoundingClientRect().left,
        y: e.touches[0].clientY - cameraDivRef.current.getBoundingClientRect().top
      };
    } else {
      // Mouse event
      dragStartPositionRef.current = {
        x: e.clientX - cameraDivRef.current.getBoundingClientRect().left,
        y: e.clientY - cameraDivRef.current.getBoundingClientRect().top
      };
    }
    
    // Add event listeners for drag movement and end
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('touchmove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchend', handleDragEnd);
  };

  const handleDragMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging || !cameraDivRef.current) return;
    
    // Prevent default behavior to avoid text selection during drag
    e.preventDefault();
    
    // Get the current window dimensions
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Get camera dimensions
    const cameraWidth = cameraDivRef.current.offsetWidth;
    const cameraHeight = cameraDivRef.current.offsetHeight;
    
    // Calculate new position based on mouse/touch position
    let newX, newY;
    
    if ('touches' in e) {
      // Touch event
      newX = e.touches[0].clientX - dragStartPositionRef.current.x;
      newY = e.touches[0].clientY - dragStartPositionRef.current.y;
    } else {
      // Mouse event
      newX = e.clientX - dragStartPositionRef.current.x;
      newY = e.clientY - dragStartPositionRef.current.y;
    }
    
    // Constrain to window bounds
    newX = Math.max(0, Math.min(windowWidth - cameraWidth, newX));
    newY = Math.max(0, Math.min(windowHeight - cameraHeight, newY));
    
    // Update position
    setCameraPosition({ x: newX, y: newY });
    
    // Update the element position directly for smooth dragging
    cameraDivRef.current.style.left = `${newX}px`;
    cameraDivRef.current.style.top = `${newY}px`;
    cameraDivRef.current.style.right = 'auto';
    cameraDivRef.current.style.bottom = 'auto';
  };

  const handleDragEnd = () => {
    if (!isDragging || !cameraDivRef.current) return;
    
    // Remove event listeners
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('touchmove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    document.removeEventListener('touchend', handleDragEnd);
    
    // Snap to the nearest corner
    snapToNearestCorner();
    
    setIsDragging(false);
  };

  const snapToNearestCorner = () => {
    if (!cameraDivRef.current) return;
    
    // Get window dimensions
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Get camera dimensions and position
    const cameraWidth = cameraDivRef.current.offsetWidth;
    const cameraHeight = cameraDivRef.current.offsetHeight;
    const cameraRect = cameraDivRef.current.getBoundingClientRect();
    
    // Calculate distance to each corner
    const distanceToTopLeft = Math.sqrt(Math.pow(cameraRect.left, 2) + Math.pow(cameraRect.top, 2));
    const distanceToTopRight = Math.sqrt(Math.pow(windowWidth - cameraRect.right, 2) + Math.pow(cameraRect.top, 2));
    const distanceToBottomLeft = Math.sqrt(Math.pow(cameraRect.left, 2) + Math.pow(windowHeight - cameraRect.bottom, 2));
    const distanceToBottomRight = Math.sqrt(Math.pow(windowWidth - cameraRect.right, 2) + Math.pow(windowHeight - cameraRect.bottom, 2));
    
    // Find the minimum distance
    const minDistance = Math.min(distanceToTopLeft, distanceToTopRight, distanceToBottomLeft, distanceToBottomRight);
    
    // Snap to the nearest corner
    if (minDistance === distanceToTopLeft) {
      cameraDivRef.current.style.left = '16px';
      cameraDivRef.current.style.top = '80px'; // Adjusted to avoid header
      cameraDivRef.current.style.right = 'auto';
      cameraDivRef.current.style.bottom = 'auto';
      setCameraCorner('top-left');
    } else if (minDistance === distanceToTopRight) {
      cameraDivRef.current.style.right = '16px';
      cameraDivRef.current.style.top = '80px'; // Adjusted to avoid header
      cameraDivRef.current.style.left = 'auto';
      cameraDivRef.current.style.bottom = 'auto';
      setCameraCorner('top-right');
    } else if (minDistance === distanceToBottomLeft) {
      cameraDivRef.current.style.left = '16px';
      cameraDivRef.current.style.bottom = '80px';
      cameraDivRef.current.style.right = 'auto';
      cameraDivRef.current.style.top = 'auto';
      setCameraCorner('bottom-left');
    } else {
      cameraDivRef.current.style.right = '16px';
      cameraDivRef.current.style.bottom = '80px';
      cameraDivRef.current.style.left = 'auto';
      cameraDivRef.current.style.top = 'auto';
      setCameraCorner('bottom-right');
    }
  };

  // Update the toggleCamera function to ensure we correctly handle the video element
  const toggleCamera = async () => {
    console.log("Toggling camera, current state:", cameraEnabled);
    console.log("Video element exists:", !!videoRef.current);
    
    try {
      // If we're turning camera off
      if (cameraEnabled) {
        console.log("Turning camera off...");
        
        // First, wait for any pending play operations to complete
        if (playPromiseRef.current) {
          try {
            console.log("Waiting for pending play promise before turning off camera...");
            await playPromiseRef.current;
          } catch (err) {
            console.log("Play promise rejected, continuing with camera shutdown:", err);
          }
          playPromiseRef.current = null;
        }
        
        // Now it's safe to clean up the video element and stream
        if (videoRef.current) {
          console.log("Cleaning up video element...");
          // Pause the video first
          try {
            videoRef.current.pause();
          } catch (err) {
            console.error("Error pausing video:", err);
          }
          
          // Clear srcObject safely
          try {
            videoRef.current.srcObject = null;
            videoRef.current.style.display = "none";
          } catch (err) {
            console.error("Error clearing video srcObject:", err);
          }
        }
        
        // Then stop all tracks in the stream
        if (videoStreamRef.current) {
          console.log("Stopping all tracks...");
          const tracks = videoStreamRef.current.getTracks();
          for (const track of tracks) {
            try {
              console.log(`Stopping track: ${track.kind} (${track.readyState})`);
              track.stop();
            } catch (err) {
              console.error(`Error stopping track ${track.kind}:`, err);
            }
          }
          videoStreamRef.current = null;
        }
        
        // Clear recording interval if active
        if (frameIntervalRef.current) {
          clearInterval(frameIntervalRef.current);
          frameIntervalRef.current = null;
        }
        
        // Update state
        setCameraEnabled(false);
        setIsRecordingVideo(false);
        console.log("Camera turned off");
        return;
      }
      
      // If we're turning camera on
      console.log("Turning camera on...");
      
      // Run diagnostic test first
      const cameraSupported = await testCameraSupport();
      if (!cameraSupported) {
        console.warn("Camera support appears to be limited");
        // Continue anyway, as the diagnostic might be too strict
      }
      
      // Clear any existing streams first
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach(track => track.stop());
        videoStreamRef.current = null;
      }
      
      try {
        // Detect device type
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        console.log("Device detected as:", isMobile ? (isIOS ? "iOS" : "Android") : "desktop");
        
        // Try to use the same camera that Facetime is using
        let facetimeStream;
        try {
          // Request with exact constraints to try to get the active Facetime camera
          facetimeStream = await navigator.mediaDevices.getUserMedia({
            video: { 
              facingMode: "user",
              width: { ideal: 640 },
              height: { ideal: 480 }
            },
            audio: false
          });
        } catch (err) {
          console.log("Could not access Facetime camera with specific constraints, trying generic constraints");
        }
        
        // If we couldn't get the Facetime camera specifically, use any available camera
        const stream = facetimeStream || await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
        
        if (!stream) {
          throw new Error("Failed to get media stream");
        }
        
        // Check if we got video tracks
        const videoTracks = stream.getVideoTracks();
        console.log("Video tracks obtained:", videoTracks.length);
        console.log("Tracks:", videoTracks.map(t => `${t.label} (${t.readyState})`));
        
        if (videoTracks.length === 0) {
          throw new Error("No video tracks found in the media stream");
        }
        
        // Store stream reference and update state
        videoStreamRef.current = stream;
        setCameraPermissionGranted(true);
        setCameraEnabled(true);
        
        // No delay, initialize video directly after state update
        setTimeout(() => {
          initializeVideoDirectly();
        }, 50);
        
      } catch (err) {
        handleCameraError(err);
      }
    } catch (error) {
      console.error("Unexpected error in toggleCamera:", error);
      alert("An unexpected error occurred while accessing the camera. Please try again.");
      setCameraEnabled(false);
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach(track => track.stop());
        videoStreamRef.current = null;
      }
    }
  };
  
  // Add a helper function to handle camera errors
  const handleCameraError = (err: unknown) => {
    console.error("Camera access error:", err);
    
    // Extract error details
    const error = err as { name?: string; message?: string };
    const errorName = error.name || 'UnknownError';
    const errorMessage = error.message || 'Unknown error';
    
    console.error(`Camera error type: ${errorName}, message: ${errorMessage}`);
    
    // Handle specific error cases
    if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
      alert("Camera access was denied. Please allow camera access in your browser settings.");
    } else if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
      alert("No camera found. Please connect a camera and try again.");
    } else if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
      alert("Camera is in use by another application. Please close other apps that might be using your camera.");
    } else if (errorName === 'OverconstrainedError') {
      // Try with minimal constraints as fallback
      console.log("Trying minimal camera constraints as fallback...");
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(minimalStream => {
          videoStreamRef.current = minimalStream;
          setCameraPermissionGranted(true);
          setCameraEnabled(true);
          
          setTimeout(() => {
            if (videoRef.current) {
              setupVideoElement(minimalStream);
            }
          }, 150);
        })
        .catch(fallbackError => {
          console.error("Fallback camera access failed:", fallbackError);
          alert("Could not access camera with minimal settings. Please try a different browser.");
          setCameraEnabled(false);
          setCameraPermissionGranted(false);
        });
      return;
    } else {
      alert(`Camera error: ${errorMessage}. Please try again or use a different browser.`);
    }
    
    // Clean up any partial stream
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach(track => track.stop());
      videoStreamRef.current = null;
    }
    
    // Reset state
    setCameraEnabled(false);
    setCameraPermissionGranted(false);
  };
  
  // Initialize Web Speech API
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // @ts-expect-error - Web Speech API types are not fully supported in TypeScript
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        if (recognitionRef.current) {
          recognitionRef.current.continuous = true;
          recognitionRef.current.interimResults = true;
          
          recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
            const transcript = Array.from(event.results)
              .map((result) => result[0])
              .map((result) => result.transcript)
              .join('');
              
            setTranscript(transcript);
          };
          
          recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('Speech recognition error', event.error);
            setIsRecording(false);
          };
        }
      }
    }
  }, []);
  
  // Handle microphone permissions
  const requestMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setPermissionGranted(true);
    } catch (err) {
      console.error("Microphone permission denied:", err);
      setPermissionGranted(false);
    }
  };
  
  // Fix for camera access and display issues
  useEffect(() => {
    // Check if camera is enabled but video isn't displaying
    if (cameraEnabled && videoRef.current && !videoRef.current.srcObject) {
      console.log("Camera is enabled but video not displaying, attempting to reinitialize...");
      const reinitializeCamera = async () => {
        try {
          // Attempt to get camera access again
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              width: { ideal: 640 }, // Lower resolution for better compatibility
              height: { ideal: 480 },
              facingMode: "user"
            } 
          });
          
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoStreamRef.current = stream;
            
            // Force a redraw by toggling display style
            videoRef.current.style.display = "none";
            setTimeout(() => {
              if (videoRef.current) {
                videoRef.current.style.display = "block";
                videoRef.current.play()
                  .then(() => console.log("Camera reinitialized successfully"))
                  .catch((err: Error) => console.error("Failed to play video after reinitialization:", err));
              }
            }, 100);
          }
        } catch (err: unknown) {
          const error = err as Error;
          console.error("Failed to reinitialize camera:", error);
          setCameraEnabled(false);
        }
      };
      
      reinitializeCamera();
    }
  }, [cameraEnabled]);
  
  // Handle camera permissions with improved error handling
  const requestCameraPermission = async () => {
    console.log("Requesting camera permission...");
    try {
      // First check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error("Camera API not supported in this browser");
        alert("Your browser doesn't support camera access. Please try a different browser.");
        setCameraPermissionGranted(false);
        return null;
      }
      
      // Try with lower resolution first for better compatibility
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user"
        } 
      });
      
      console.log("Camera permission granted, stream obtained:", stream.id);
      console.log("Video tracks:", stream.getVideoTracks().map(t => `${t.label} (${t.readyState})`));
      
      setCameraPermissionGranted(true);
      return stream;
    } catch (err: unknown) {
      console.error("Camera permission denied or error:", err);
      
      // Provide more specific error messages
      const error = err as { name?: string; message?: string };
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        alert("Camera access was denied. Please allow camera access in your browser settings to use this feature.");
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        alert("No camera found. Please connect a camera and try again.");
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        alert("Camera is in use by another application. Please close other apps that might be using your camera.");
      } else {
        alert(`Camera error: ${error.message || "Unknown error"}. Please try again.`);
      }
      
      setCameraPermissionGranted(false);
      return null;
    }
  };
  
  // Function to capture video frames during recording
  const startFrameCapture = () => {
    if (!canvasRef.current || !videoRef.current) return;
    
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;
    
    setRecordedFrames([]);
    setIsRecordingVideo(true);
    
    // Capture a frame every 500ms (2 frames per second)
    frameIntervalRef.current = window.setInterval(() => {
      if (videoRef.current) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const frameData = context.getImageData(0, 0, canvas.width, canvas.height);
        setRecordedFrames(prev => [...prev, frameData]);
      }
    }, 500);
  };
  
  const stopFrameCapture = () => {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    setIsRecordingVideo(false);
  };
  
  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    requestMicPermission();
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      // Handle audio completion
      audioRef.current.onended = () => {
        console.log('Audio playback ended');
        setIsAudioPlaying(false);
        currentPlayingMessageRef.current = "";
      };
      
      // Handle errors
      audioRef.current.onerror = (e) => {
        console.error('Audio playback error:', e);
        setIsAudioPlaying(false);
        currentPlayingMessageRef.current = "";
      };
      
      // Handle successful play
      audioRef.current.onplay = () => {
        console.log('Audio playback started');
        setIsAudioPlaying(true);
      };
      
      // Handle pause
      audioRef.current.onpause = () => {
        console.log('Audio playback paused');
        setIsAudioPlaying(false);
      };
    }
  }, []);

  const toggleRecording = async () => {
    if (!permissionGranted) {
      await requestMicPermission();
      return;
    }
    
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    setTranscript("");
    
    // Start Web Speech API recording
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
      }
    }
    
    // Start video frame capture if camera is enabled
    if (cameraEnabled) {
      startFrameCapture();
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    setIsProcessing(true);
    
    // Stop Web Speech API recording
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    // Stop video frame capture if camera is enabled
    if (cameraEnabled) {
      stopFrameCapture();
    }
    
    // For MVP, if we don't have a transcript, use a simulated one
    const finalTranscript = transcript || 
      "Hi, I wanted to talk to you about the project deadlines. I've noticed that you've been missing some of them lately, and it's affecting the team's progress.";
    
    // Add user message
    const updatedMessages: Message[] = [...messages, { role: "user", content: finalTranscript }];
    setMessages(updatedMessages);
    
    // Send to API and get response
    try {
      const newInteractionCount = interactionCount + 1;
      setInteractionCount(newInteractionCount);
      
      // Show typing indicator
      setIsTyping(true);
      
      console.log(`Sending message to chat API (interaction ${newInteractionCount}/3)`);
      
      // Get response from the ChatGPT API
      const chatResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          messages: updatedMessages,
          interactionCount: newInteractionCount,
          // Send frame count if camera was used
          videoData: cameraEnabled ? { frameCount: recordedFrames.length } : null
        }),
      });
      
      if (!chatResponse.ok) {
        throw new Error(`Chat API returned ${chatResponse.status}`);
      }
      
      const chatData = await chatResponse.json();
      console.log('Received response from chat API:', chatData);
      
      if (chatData.success) {
        const aiResponse = chatData.response.message;
        
        // Add assistant message
        const newMessages: Message[] = [...updatedMessages, { role: "assistant", content: aiResponse }];
        setMessages(newMessages);
        
        // Hide typing indicator
        setIsTyping(false);
        
        // Process confidence feedback if it's available
        if (chatData.confidenceFeedback) {
          setConfidenceFeedback(chatData.confidenceFeedback);
        }
        
        // Automatically play audio for the response
        if (autoPlayEnabled) {
          console.log('Auto-play enabled, playing response audio');
          await playResponseAudio(aiResponse);
        }
        
        // Generate feedback if it's the final message
        if (chatData.generateFeedback && chatData.response.feedback) {
          generateFeedback(chatData.response.feedback);
          
          // If we also have video data, analyze it
          if (cameraEnabled && recordedFrames.length > 0) {
            analyzeVideoData();
          }
        }
      }
      
    } catch (error) {
      console.error('Error processing chat:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const playResponseAudio = async (text: string) => {
    try {
      // If we are already playing this message, toggle pause/play
      if (currentPlayingMessageRef.current === text && audioRef.current) {
        if (audioRef.current.paused) {
          console.log('Resuming audio playback');
          await audioRef.current.play()
            .catch(err => {
              console.error("Audio resume error:", err);
              setIsAudioPlaying(false);
            });
        } else {
          console.log('Pausing audio playback');
          audioRef.current.pause();
        }
        return;
      }
      
      // Stop any currently playing audio
      if (audioRef.current && !audioRef.current.paused) {
        console.log('Stopping previous audio playback');
        audioRef.current.pause();
        setIsAudioPlaying(false);
      }
      
      // Start new audio process
      setIsAudioPlaying(true); // Show loading state immediately
      currentPlayingMessageRef.current = text;
      
      console.log('Requesting audio for message:', text.substring(0, 30) + '...');
      
      // Call the speech API to generate audio
      const response = await fetch('/api/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      
      const data = await response.json();
      
      if (data.success && audioRef.current) {
        console.log('Received audio data, setting up source');
        
        // Create a new Audio element to avoid any stale state issues
        audioRef.current.src = data.audioUrl;
        
        // The onplay event will set isAudioPlaying to true
        console.log('Starting audio playback');
        await audioRef.current.play()
          .catch(err => {
            console.error("Audio playback start error:", err);
            setIsAudioPlaying(false);
            currentPlayingMessageRef.current = "";
          });
      } else {
        console.error("Failed to get audio URL from speech API");
        setIsAudioPlaying(false);
        currentPlayingMessageRef.current = "";
      }
    } catch (error) {
      console.error("Error generating audio:", error);
      setIsAudioPlaying(false);
      currentPlayingMessageRef.current = "";
    }
  };

  // Analyze video data to generate confidence feedback
  const analyzeVideoData = async () => {
    try {
      if (!cameraEnabled || recordedFrames.length === 0) return;
      
      // For demonstration, we'll use a simulated confidence feedback
      // In a real implementation, you would send the frames to an API for analysis
      
      const simulatedConfidenceFeedback: ConfidenceFeedback = {
        posture: "Your posture was generally upright and engaged during the conversation.",
        eyeContact: "You maintained good eye contact with the camera, which enhances your credibility.",
        gestures: "Your hand gestures were natural and helped emphasize key points.",
        facialExpressions: "Your facial expressions conveyed appropriate seriousness about the topic while remaining approachable.",
        overallConfidence: "You appeared generally confident during the conversation, with room for improvement in moments of hesitation.",
        recommendations: [
          "Try to reduce fidgeting, which was noticed occasionally throughout the conversation.",
          "Practice maintaining a slightly more relaxed shoulder posture to convey greater confidence.",
          "Consider using more deliberate hand gestures to emphasize your key points."
        ]
      };
      
      setConfidenceFeedback(simulatedConfidenceFeedback);
      
    } catch (error) {
      console.error('Error analyzing video data:', error);
    }
  };

  const generateFeedback = (apiFeedback?: Feedback) => {
    if (apiFeedback) {
      setFeedback(apiFeedback);
      return;
    }
    
    // Fallback to simulated feedback if none provided from API
    setTimeout(() => {
      setFeedback({
        strengths: [
          "You approached the conversation directly without being confrontational",
          "You focused on the impact of the behavior rather than attacking the person"
        ],
        weaknesses: [
          "You could provide more specific examples of missed deadlines",
          "The tone could be more empathetic to encourage open communication"
        ],
        improvements: [
          "Try asking open-ended questions to understand their perspective",
          "Offer specific support or resources to help address the issue",
          "Establish clear expectations and follow-up plans"
        ],
        summary: "You demonstrated good basic conflict resolution skills by addressing the issue directly. To improve, focus on being more specific about the problem while showing more empathy and offering concrete solutions."
      });
    }, 1000);
  };

  const playAudio = (messageText: string) => {
    playResponseAudio(messageText)
      .catch(err => {
        console.error("Error playing response audio:", err);
        setIsAudioPlaying(false);
        currentPlayingMessageRef.current = "";
      });
  };

  // Function to end current session and navigate to results dashboard
  const endSession = async () => {
    setIsProcessing(true);
    
    try {
      // Stop any ongoing recording
      if (isRecording) {
        // Stop speech recognition
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
        
        // Stop video recording
        if (cameraEnabled && frameIntervalRef.current) {
          clearInterval(frameIntervalRef.current);
          frameIntervalRef.current = null;
          setIsRecordingVideo(false);
        }
        
        setIsRecording(false);
      }
      
      // Get feedback based on current interaction state
      const chatResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          messages,
          interactionCount: Math.max(interactionCount, 3), // Ensure we get feedback
          videoData: cameraEnabled ? { frameCount: recordedFrames.length } : null,
          endSession: true // Signal that session was ended manually
        }),
      });
      
      if (chatResponse.ok) {
        const chatData = await chatResponse.json();
        
        if (chatData.success) {
          // Process feedback
          if (chatData.response.feedback) {
            setFeedback(chatData.response.feedback);
            // Store in sessionStorage for the endDashboard to retrieve
            sessionStorage.setItem('communicationFeedback', JSON.stringify(chatData.response.feedback));
          }
          
          // Process confidence feedback if available
          if (chatData.confidenceFeedback) {
            setConfidenceFeedback(chatData.confidenceFeedback);
            // Store in sessionStorage for the endDashboard to retrieve
            sessionStorage.setItem('confidenceFeedback', JSON.stringify(chatData.confidenceFeedback));
          }
          
          // Generate a unique session ID for this completed session
          const sessionId = Date.now().toString();
          sessionStorage.setItem('lastSessionId', sessionId);
          
          // Mark session as ended and redirect to results dashboard
          setSessionEnded(true);
          
          // Redirect to the endDashboard with the session ID
          router.push(`/endDashboard?sessionId=${sessionId}`);
        }
      }
    } catch (error) {
      console.error('Error ending session:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Updated reset function to reset session state
  const resetConversation = () => {
    setMessages([{
      role: "system",
      content: "Welcome! Press the microphone button to begin the scenario. You'll be speaking with a coworker who has consistently missed deadlines."
    }]);
    setTranscript("");
    setIsRecording(false);
    setIsProcessing(false);
    setInteractionCount(0);
    setFeedback(null);
    setConfidenceFeedback(null);
    setRecordedFrames([]);
    setSessionEnded(false);
  };

  // Add a useEffect hook to monitor camera state and video element
  useEffect(() => {
    if (cameraEnabled && videoStreamRef.current) {
      console.log("Camera enabled, attempting direct initialization");
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        initializeVideoDirectly();
      }, 50);
    }
  }, [cameraEnabled]);

  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      console.log("Component unmounting, cleaning up camera resources");
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-screen max-h-screen bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">
          &larr; Back to Home
        </Link>
        <h1 className="text-xl font-semibold">TalkItOut Practice Session</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setAutoPlayEnabled(!autoPlayEnabled)}
            className={`px-3 py-1 rounded-md ${
              autoPlayEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}
          >
            {autoPlayEnabled ? 'Auto-play On' : 'Auto-play Off'}
          </button>
          <button
            onClick={toggleCamera}
            className={`flex items-center justify-center w-12 h-12 rounded-full text-white ${
              cameraEnabled ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
            } transition-colors`}
            aria-label={cameraEnabled ? "Turn off camera" : "Turn on camera"}
            title={cameraEnabled ? "Turn off camera" : "Turn on camera"}
          >
            {cameraEnabled ? (
              <VideoCameraSlashIcon className="w-6 h-6" />
            ) : (
              <VideoCameraIcon className="w-6 h-6" />
            )}
          </button>
        </div>
      </header>

      {/* Main content area with chat */}
      <div className="flex-grow overflow-hidden relative">
        {/* Chat message area */}
        <div className="h-full flex flex-col overflow-hidden">
          {/* Messages container */}
          <div className="flex-grow overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              message.role !== 'system' && (
                <div 
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-md p-3 rounded-lg ${
                      message.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-br-none' 
                        : 'bg-gray-200 text-gray-800 rounded-bl-none'
                    }`}
                  >
                    <p>{message.content}</p>
                    {message.role === 'assistant' && (
                      <button 
                        onClick={() => playAudio(message.content)}
                        className="mt-2 text-xs underline"
                      >
                        {isAudioPlaying && currentPlayingMessageRef.current === message.content 
                          ? 'Pause' 
                          : 'Play'}
                      </button>
                    )}
                  </div>
                </div>
              )
            ))}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="max-w-md p-3 rounded-lg bg-gray-200 text-gray-800 rounded-bl-none">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input area */}
          <div className="p-4 border-t border-gray-200 bg-white">
            {feedback || sessionEnded ? (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-gray-700">Redirecting to results dashboard...</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="flex w-full justify-between mb-4">
                  <div className="w-32"></div> {/* Spacer for balance */}
                  <div className="flex-grow">
                    <div className="text-gray-700 text-center">
                      {isRecording ? (
                        <div>
                          <p className="font-medium">Recording... Speak naturally.</p>
                          <p className="text-sm text-gray-500">{transcript || "Waiting for speech..."}</p>
                        </div>
                      ) : isProcessing ? (
                        <p className="font-medium">Processing...</p>
                      ) : (
                        <p>Press the microphone button and speak to respond to the scenario.</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={endSession}
                    disabled={isProcessing || messages.length <= 1}
                    className={`w-32 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors ${
                      (isProcessing || messages.length <= 1) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    End Session
                  </button>
                </div>
                
                {/* Centered mic button */}
                <button
                  onClick={toggleRecording}
                  disabled={isProcessing}
                  aria-label={isRecording ? "Stop recording" : "Start recording"}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                    isRecording 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isRecording ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M5 3.5h6A1.5 1.5 0 0 1 12.5 5v6a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 11V5A1.5 1.5 0 0 1 5 3.5z"/>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5z"/>
                      <path d="M10 8a2 2 0 1 1-4 0V3a2 2 0 1 1 4 0v5zM8 0a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V3a3 3 0 0 0-3-3z"/>
                    </svg>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* FaceTime-style camera container with draggable functionality */}
        {cameraEnabled && (
          <div 
            id="camera-container"
            ref={cameraDivRef}
            className={`absolute shadow-lg rounded-lg overflow-hidden z-10 bg-black cursor-move ${isDragging ? 'opacity-70' : 'opacity-100'}`}
            style={{ 
              width: '256px',
              height: '192px',
              transition: isDragging ? 'none' : 'all 0.2s ease-in-out',
              ...(cameraCorner === 'bottom-right' ? { bottom: '80px', right: '16px' } : {}),
              ...(cameraCorner === 'bottom-left' ? { bottom: '80px', left: '16px' } : {}),
              ...(cameraCorner === 'top-right' ? { top: '80px', right: '16px' } : {}),
              ...(cameraCorner === 'top-left' ? { top: '80px', left: '16px' } : {})
            }}
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
          >
            <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-black/50 to-transparent z-20 flex items-center justify-center">
              <div className="w-16 h-1 rounded-full bg-white/30 mt-1"></div>
            </div>
            
            <div className="relative w-full h-full">
              <video 
                ref={videoRef}
                autoPlay 
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ minHeight: "120px" }}
                onLoadedData={() => console.log("Video loaded data")}
                onPlay={() => console.log("Video started playing")}
                onError={(e) => console.error("Video element error:", e)}
              />
              
              {/* Loading indicator */}
              <div 
                className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50"
                style={{ display: videoRef.current?.srcObject ? 'none' : 'flex' }}
              >
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mb-2"></div>
                  <span className="text-white text-sm">Loading camera...</span>
                </div>
              </div>
              
              {/* Recording indicator */}
              {isRecordingVideo && (
                <div className="absolute top-8 right-2 flex items-center bg-black bg-opacity-60 text-white text-sm px-2 py-1 rounded-md">
                  <span className="w-3 h-3 rounded-full bg-red-500 mr-1 animate-pulse"></span>
                  <span>Recording</span>
                </div>
              )}
              
              {/* Camera label */}
              <div className="absolute top-8 left-2 text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
                Camera Feed
              </div>
            </div>
            
            {/* Hidden canvas for frame capture during recording */}
            <canvas 
              ref={canvasRef} 
              className="hidden" 
              width="640" 
              height="480" 
            />
          </div>
        )}
      </div>
      
      {/* Hidden audio player for TTS */}
      <audio ref={audioRef} className="hidden" />
    </div>
  );
} 