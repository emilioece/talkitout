"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

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
  nvcAnalysis?: string[];
  thomasKilmannAnalysis?: string[];
  improvements: string[];
  summary: string;
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
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentPlayingMessageRef = useRef<string>("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
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
  
  useEffect(() => {
    requestMicPermission();
  }, []);

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
  };

  const stopRecording = async () => {
    setIsRecording(false);
    setIsProcessing(true);
    
    // Stop Web Speech API recording
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    // For MVP, if we don't have a transcript, use a simulated one
    const finalTranscript = transcript || 
      "Hi, I wanted to talk to you about the project deadlines. I've noticed that you've been missing some of them lately, and it's affecting the team's progress.";
    
    // Add user message
    const updatedMessages: Message[] = [...messages, { role: "user", content: finalTranscript }];
    setMessages(updatedMessages);
    
    // Scroll to the latest message
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    
    // Send to API and get response
    try {
      const newInteractionCount = interactionCount + 1;
      setInteractionCount(newInteractionCount);
      
      // Show typing indicator
      setIsTyping(true);
      
      console.log(`Sending message to chat API (interaction ${newInteractionCount}/3)`);
      
      // Get response from the OpenAI API
      const chatResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          messages: updatedMessages,
          interactionCount: newInteractionCount 
        }),
      });
      
      const chatData = await chatResponse.json();
      
      if (!chatResponse.ok) {
        throw new Error(`Chat API error: ${chatData.error || chatResponse.status}`);
      }
      
      if (!chatData.success) {
        throw new Error(`Chat API returned unsuccessful: ${chatData.error || 'Unknown error'}`);
      }
      
      console.log('Received response from chat API:', chatData);
      
      const aiResponse = chatData.response.message;
      
      // Add assistant message
      const newMessages: Message[] = [...updatedMessages, { role: "assistant", content: aiResponse }];
      setMessages(newMessages);
      
      // Hide typing indicator
      setIsTyping(false);
      
      // Automatically play audio for the response
      if (autoPlayEnabled) {
        console.log('Auto-play enabled, playing response audio');
        await playResponseAudio(aiResponse);
      }
      
      // Check if we need to generate feedback (after 3 interactions)
      if (newInteractionCount >= 3 && chatData.generateFeedback && chatData.response.feedback) {
        console.log('Generating feedback after final interaction');
        generateFeedback(chatData.response.feedback);
      }
      
      setIsProcessing(false);
    } catch (error) {
      console.error("Error processing message:", error);
      
      // Hide typing indicator
      setIsTyping(false);
      setIsProcessing(false);
      
      // Show error message to user as a system message
      const errorMessage = error instanceof Error ? error.message : 'Failed to get response';
      const systemErrorMessage = `Error: ${errorMessage}. Please ensure your OpenAI API key is configured correctly and try again.`;
      
      // Add system error message
      const newMessages: Message[] = [
        ...updatedMessages, 
        { 
          role: "system", 
          content: systemErrorMessage
        }
      ];
      setMessages(newMessages);
      
      // Reset interaction count if this was an API error
      if (errorMessage.includes('OpenAI')) {
        setInteractionCount(interactionCount);
      }
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
        nvcAnalysis: [
          "You approached the conversation directly without being confrontational",
          "You focused on the impact of the behavior rather than attacking the person"
        ],
        thomasKilmannAnalysis: [
          "You approached the conversation directly without being confrontational",
          "You focused on the impact of the behavior rather than attacking the person"
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

  const resetConversation = () => {
    setMessages([{
      role: "system",
      content: "Welcome! Press the microphone button to begin the scenario. You'll be speaking with a coworker who has consistently missed deadlines."
    }]);
    setInteractionCount(0);
    setFeedback(null);
    setTranscript("");
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link href="/home" className="text-xl font-semibold flex items-center">
            <span className="text-blue-600">Talk</span>
            <span>ItOut</span>
          </Link>
          
          <div className="flex items-center gap-4">
            {/* Auto-play toggle */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">Auto-play:</span>
              <button 
                onClick={() => setAutoPlayEnabled(!autoPlayEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                  autoPlayEnabled ? 'bg-blue-600' : 'bg-gray-300'
                }`}
                aria-pressed={autoPlayEnabled}
                aria-label="Toggle auto-play"
              >
                <span 
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    autoPlayEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`} 
                />
              </button>
            </div>
            
            {feedback ? (
              <button 
                onClick={resetConversation}
                className="text-blue-600 hover:text-blue-800"
              >
                Start New Conversation
              </button>
            ) : (
              <div className="text-sm text-gray-700">
                {interactionCount > 0 && `Interaction ${interactionCount}/3`}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto">
          {/* Chat messages */}
          <div className="space-y-4 mb-4">
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role !== "system" && (
                  <div 
                    className={`rounded-lg p-3 max-w-[80%] ${
                      message.role === "user" 
                        ? "bg-blue-600 text-white" 
                        : "bg-white border border-gray-200 text-black"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <p>{message.content}</p>
                      
                      {message.role === "assistant" && (
                        <button 
                          onClick={() => playAudio(message.content)}
                          className={`mt-1 ${
                            isAudioPlaying && currentPlayingMessageRef.current === message.content 
                              ? "text-blue-500" 
                              : "text-gray-600 hover:text-gray-800"
                          }`}
                          aria-label={
                            isAudioPlaying && currentPlayingMessageRef.current === message.content 
                              ? "Pause audio" 
                              : "Play audio"
                          }
                        >
                          {isAudioPlaying && currentPlayingMessageRef.current === message.content ? (
                            // Pause icon
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                              <path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5zm5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z"/>
                            </svg>
                          ) : (
                            // Play icon 
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                              <path d="M11.536 14.01A8.473 8.473 0 0 0 14.026 8a8.473 8.473 0 0 0-2.49-6.01l-.708.707A7.476 7.476 0 0 1 13.025 8c0 2.071-.84 3.946-2.197 5.303l.708.707z"/>
                              <path d="M10.121 12.596A6.48 6.48 0 0 0 12.025 8a6.48 6.48 0 0 0-1.904-4.596l-.707.707A5.483 5.483 0 0 1 11.025 8a5.483 5.483 0 0 1-1.61 3.89l.706.706z"/>
                              <path d="M8.707 11.182A4.486 4.486 0 0 0 10.025 8a4.486 4.486 0 0 0-1.318-3.182L8 5.525A3.489 3.489 0 0 1 9.025 8 3.49 3.49 0 0 1 8 10.475l.707.707zM6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06z"/>
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )}
                
                {message.role === "system" && (
                  <div className="bg-gray-100 rounded-lg p-3 w-full text-center text-black font-medium">
                    {message.content}
                  </div>
                )}
              </div>
            ))}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-lg p-3 max-w-[80%]">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '600ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Feedback section */}
          {feedback && (
            <div className="bg-white rounded-lg shadow p-4 mb-4 text-black">
              <h2 className="text-lg font-semibold mb-3">Conversation Feedback</h2>
              
              <div className="mb-4">
                <h3 className="text-green-600 font-medium mb-2">Strengths</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {feedback.strengths.map((item, index) => (
                    <li key={`strength-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>
              
              <div className="mb-4">
                <h3 className="text-red-600 font-medium mb-2">Areas for Improvement</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {feedback.weaknesses.map((item, index) => (
                    <li key={`weakness-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>
              
              {feedback.nvcAnalysis && feedback.nvcAnalysis.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-purple-600 font-medium mb-2">Nonviolent Communication Analysis</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {feedback.nvcAnalysis.map((item, index) => (
                      <li key={`nvc-${index}`}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {feedback.thomasKilmannAnalysis && feedback.thomasKilmannAnalysis.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-teal-600 font-medium mb-2">Thomas-Kilmann Conflict Mode Analysis</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {feedback.thomasKilmannAnalysis.map((item, index) => (
                      <li key={`tk-${index}`}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="mb-4">
                <h3 className="text-blue-600 font-medium mb-2">Recommendations</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {feedback.improvements.map((item, index) => (
                    <li key={`improvement-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>
              
              <div className="mt-4 pt-3 border-t">
                <p className="text-gray-800">{feedback.summary}</p>
              </div>
            </div>
          )}

          {/* Live transcription display */}
          {isRecording && transcript && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4">
              <p className="text-sm text-black">
                <span className="font-medium">Live transcription:</span> {transcript}
              </p>
            </div>
          )}

          {/* Transcript display when processing */}
          {!isRecording && isProcessing && transcript && (
            <div className="bg-gray-100 rounded-lg p-3 mb-4">
              <p className="text-sm text-black">
                <span className="font-medium">Transcript:</span> {transcript}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer with recording button */}
      <footer className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto flex justify-center">
          {!feedback && (
            <button
              onClick={toggleRecording}
              disabled={isProcessing || !permissionGranted}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                permissionGranted === false
                  ? "bg-gray-300 cursor-not-allowed"
                  : isRecording
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {permissionGranted === false ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M10.706 3.294A12.545 12.545 0 0 0 8 3C5.259 3 2.723 3.882.663 5.379a.485.485 0 0 0-.048.736.518.518 0 0 0 .668.05A11.448 11.448 0 0 1 8 4c.63 0 1.249.05 1.852.148l.854-.854zM8 6c-1.905 0-3.68.56-5.166 1.526a.48.48 0 0 0-.063.745.525.525 0 0 0 .652.065 8.448 8.448 0 0 1 3.51-1.27L8 6zm2.596 1.404.785-.785c.63.24 1.227.545 1.785.907a.482.482 0 0 1 .063.745.525.525 0 0 1-.652.065 8.462 8.462 0 0 0-1.98-.932zM8 10l.933-.933a6.455 6.455 0 0 1 2.013.637c.285.145.326.525.1.75-.226.23-.551.123-.75-.102a5.46 5.46 0 0 0-2.296-.765L8 10z"/>
                  <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L13.707 12.999a.5.5 0 0 1-.707.707L2.146 2.854z"/>
                </svg>
              ) : isRecording ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="white" viewBox="0 0 16 16">
                  <path d="M5 3a5 5 0 0 0 0 10h6a5 5 0 0 0 0-10H5z"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="white" viewBox="0 0 16 16">
                  <path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5z"/>
                  <path d="M10 8a2 2 0 1 1-4 0V3a2 2 0 1 1 4 0v5zM8 0a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V3a3 3 0 0 0-3-3z"/>
                </svg>
              )}
            </button>
          )}
        </div>
        
        {/* Status text */}
        <div className="text-center mt-3">
          {permissionGranted === false ? (
            <p className="text-red-500 text-sm font-medium">Microphone access denied. Please enable it in your browser settings.</p>
          ) : isProcessing ? (
            <p className="text-gray-700 text-sm font-medium">Processing...</p>
          ) : isRecording ? (
            <p className="text-red-500 text-sm font-medium">Recording... Click to stop</p>
          ) : !feedback ? (
            <p className="text-gray-700 text-sm font-medium">Click the microphone to start speaking</p>
          ) : null}
        </div>
      </footer>

      {/* Hidden audio element for playback */}
      <audio 
        ref={audioRef} 
        preload="auto"
        controls={false}
      />
    </div>
  );
} 