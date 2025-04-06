"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

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
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  
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
    
    // In a real implementation, we would use the Web Speech API or a similar service
    // For this MVP, we'll simulate with setTimeout
    
    // Logic for starting recording would go here
  };

  const stopRecording = async () => {
    setIsRecording(false);
    setIsProcessing(true);
    
    // For MVP, simulate transcription - in reality would process actual audio
    // Simulate a delay for transcription
    setTimeout(async () => {
      // Simulated transcript - in real app we'd get this from speech recognition API
      const simulatedTranscript = "Hi, I wanted to talk to you about the project deadlines. I've noticed that you've been missing some of them lately, and it's affecting the team's progress.";
      
      setTranscript(simulatedTranscript);
      
      // Add user message
      const updatedMessages: Message[] = [...messages, { role: "user", content: simulatedTranscript }];
      setMessages(updatedMessages);
      
      // Send to API and get response
      try {
        const newInteractionCount = interactionCount + 1;
        setInteractionCount(newInteractionCount);
        
        // In a real implementation, this would be an API call to process with ChatGPT
        // For the MVP, simulate a response
        setTimeout(() => {
          const aiResponse = "I'm sorry about that. I've been struggling with the workload lately. There have been some personal issues that have affected my focus, but I didn't want to make excuses. I should have communicated this better.";
          
          const newMessages: Message[] = [...updatedMessages, { role: "assistant", content: aiResponse }];
          setMessages(newMessages);
          
          // Generate and play audio for the response
          // For MVP, we'll just set a URL but in production would generate with ElevenLabs
          if (audioRef.current) {
            audioRef.current.src = "/sample-audio.mp3"; // Would be an API call to ElevenLabs
            audioRef.current.play()
              .then(() => setIsAudioPlaying(true))
              .catch(err => console.error("Audio playback error:", err));
          }
          
          // Check if we need to generate feedback (after 3 interactions)
          if (newInteractionCount >= 3) {
            generateFeedback();
          }
          
          setIsProcessing(false);
        }, 1500);
        
      } catch (error) {
        console.error("Error processing message:", error);
        setIsProcessing(false);
      }
    }, 1000);
  };

  const generateFeedback = () => {
    // In real implementation, this would be an API call to process the conversation
    // For MVP, we'll simulate feedback
    
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
    }, 2000);
  };

  const playAudio = () => {
    if (audioRef.current) {
      // In a real implementation, we would generate audio for the specific message
      // For MVP, we use a sample audio file
      audioRef.current.src = "/sample-audio.mp3";
      audioRef.current.play()
        .then(() => setIsAudioPlaying(true))
        .catch(err => console.error("Audio playback error:", err));
    }
  };

  const resetConversation = () => {
    setMessages([{
      role: "system",
      content: "Welcome! Press the microphone button to begin the scenario. You'll be speaking with a coworker who has consistently missed deadlines."
    }]);
    setInteractionCount(0);
    setFeedback(null);
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
          
          {feedback ? (
            <button 
              onClick={resetConversation}
              className="text-blue-600 hover:text-blue-800"
            >
              Start New Conversation
            </button>
          ) : (
            <div className="text-sm text-gray-500">
              {interactionCount > 0 && `Interaction ${interactionCount}/3`}
            </div>
          )}
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
                        : "bg-white border border-gray-200"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <p>{message.content}</p>
                      
                      {message.role === "assistant" && (
                        <button 
                          onClick={() => playAudio()}
                          className={`mt-1 ${isAudioPlaying ? "text-blue-500" : "text-gray-400 hover:text-gray-600"}`}
                          aria-label={isAudioPlaying ? "Audio playing" : "Play audio"}
                          disabled={isAudioPlaying}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M11.536 14.01A8.473 8.473 0 0 0 14.026 8a8.473 8.473 0 0 0-2.49-6.01l-.708.707A7.476 7.476 0 0 1 13.025 8c0 2.071-.84 3.946-2.197 5.303l.708.707z"/>
                            <path d="M10.121 12.596A6.48 6.48 0 0 0 12.025 8a6.48 6.48 0 0 0-1.904-4.596l-.707.707A5.483 5.483 0 0 1 11.025 8a5.483 5.483 0 0 1-1.61 3.89l.706.706z"/>
                            <path d="M8.707 11.182A4.486 4.486 0 0 0 10.025 8a4.486 4.486 0 0 0-1.318-3.182L8 5.525A3.489 3.489 0 0 1 9.025 8 3.49 3.49 0 0 1 8 10.475l.707.707zM6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06z"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                )}
                
                {message.role === "system" && (
                  <div className="bg-gray-100 rounded-lg p-3 w-full text-center text-gray-600">
                    {message.content}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Feedback section */}
          {feedback && (
            <div className="bg-white rounded-lg shadow p-4 mb-4">
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
              
              <div className="mb-4">
                <h3 className="text-blue-600 font-medium mb-2">Recommendations</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {feedback.improvements.map((item, index) => (
                    <li key={`improvement-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>
              
              <div className="mt-4 pt-3 border-t">
                <p className="text-gray-700">{feedback.summary}</p>
              </div>
            </div>
          )}

          {/* Transcript display when recording/processing */}
          {(isRecording || isProcessing) && transcript && (
            <div className="bg-gray-100 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-600">
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
            <p className="text-red-500 text-sm">Microphone access denied. Please enable it in your browser settings.</p>
          ) : isProcessing ? (
            <p className="text-gray-500 text-sm">Processing...</p>
          ) : isRecording ? (
            <p className="text-red-500 text-sm">Recording... Click to stop</p>
          ) : !feedback ? (
            <p className="text-gray-500 text-sm">Click the microphone to start speaking</p>
          ) : null}
        </div>
      </footer>

      {/* Hidden audio element for playback */}
      <audio 
        ref={audioRef} 
        onEnded={() => setIsAudioPlaying(false)}
        controls={false}
      />
    </div>
  );
} 