"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

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

export default function EndDashboard() {
  const [communicationFeedback, setCommunicationFeedback] = useState<Feedback | null>(null);
  const [confidenceFeedback, setConfidenceFeedback] = useState<ConfidenceFeedback | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');

  useEffect(() => {
    // Retrieve data from sessionStorage instead of directly from query params
    // This allows us to store more complex data structures between pages
    const storedCommunicationFeedback = sessionStorage.getItem('communicationFeedback');
    const storedConfidenceFeedback = sessionStorage.getItem('confidenceFeedback');
    const cameraWasUsed = sessionStorage.getItem('cameraWasUsed') === 'true';
    
    if (storedCommunicationFeedback) {
      setCommunicationFeedback(JSON.parse(storedCommunicationFeedback));
    }
    
    // Only set confidence feedback if camera was actually used
    if (storedConfidenceFeedback && cameraWasUsed) {
      setConfidenceFeedback(JSON.parse(storedConfidenceFeedback));
    } else {
      // Clear confidence feedback if camera wasn't used
      setConfidenceFeedback(null);
    }
    
    // If no feedback is available, redirect back to chat
    if (!storedCommunicationFeedback) {
      // Show a brief loading state instead of instantly redirecting
      setTimeout(() => {
        router.push('/chat');
      }, 1500);
    } else {
      setIsLoading(false);
    }
  }, [router, sessionId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-700">Loading your session results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">
            &larr; Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-center">Session Results</h1>
          <div className="w-24"></div> {/* Spacer for balance */}
        </header>

        <div className="space-y-8">
          {/* Overall performance card */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="bg-blue-600 text-white px-6 py-4">
              <h2 className="text-xl font-semibold">Overall Performance</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                {communicationFeedback?.summary || "No overall assessment available."}
              </p>
              <div className="flex flex-wrap justify-center gap-4 mt-8">
                <Link 
                  href="/chat" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Practice Again
                </Link>
                <button
                  onClick={() => window.print()}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-2 rounded-lg transition-colors"
                >
                  Save Results
                </button>
              </div>
            </div>
          </div>

          {/* Communication skills section - using new component */}
          {communicationFeedback && (
            <CommunicationFeedbackCard feedback={communicationFeedback} />
          )}

          {/* Body language section - only show if confidence feedback exists */}
          {confidenceFeedback && (
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="bg-purple-600 text-white px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold">Body Language & Confidence Analysis</h2>
                <span className="text-xs px-2 py-1 bg-purple-800 rounded">Camera Enabled</span>
              </div>
              <div className="p-6">
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="text-lg font-medium text-purple-700 mb-2">Posture & Gestures</h3>
                    <p className="text-gray-700 mb-2"><span className="font-medium">Posture:</span> {confidenceFeedback.posture}</p>
                    <p className="text-gray-700 mb-2"><span className="font-medium">Gestures:</span> {confidenceFeedback.gestures}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-purple-700 mb-2">Eye Contact & Expressions</h3>
                    <p className="text-gray-700 mb-2"><span className="font-medium">Eye Contact:</span> {confidenceFeedback.eyeContact}</p>
                    <p className="text-gray-700 mb-2"><span className="font-medium">Facial Expressions:</span> {confidenceFeedback.facialExpressions}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-purple-700 mb-2">Overall Confidence Assessment</h3>
                  <p className="text-gray-700 mb-4">{confidenceFeedback.overallConfidence}</p>
                  
                  <h3 className="text-lg font-medium text-purple-700 mb-2">Recommendations for Improvement</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    {confidenceFeedback.recommendations.map((rec, i) => (
                      <li key={i} className="text-gray-700">{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          {/* Show a note when camera wasn't used */}
          {!confidenceFeedback && (
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="bg-gray-600 text-white px-6 py-4">
                <h2 className="text-xl font-semibold">Body Language Analysis</h2>
              </div>
              <div className="p-6 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-700">
                  Camera was not enabled during this session. Enable your camera during practice to receive feedback on your body language and confidence.
                </p>
                <Link 
                  href="/chat" 
                  className="inline-block mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Try Again with Camera
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Add a new component for dynamic communication feedback display
const CommunicationFeedbackCard = ({ feedback }: { feedback: Feedback }) => {
  // Function to check if feedback is about the "missed deadlines" scenario
  const isMissedDeadlinesScenario = () => {
    const keyTerms = ['deadline', 'late', 'missing', 'behind schedule', 'on time', 'timely'];
    const allText = [
      ...feedback.strengths,
      ...feedback.weaknesses, 
      ...feedback.improvements,
      feedback.summary
    ].join(' ').toLowerCase();
    
    return keyTerms.some(term => allText.includes(term));
  };
  
  // Get appropriate scenario title
  const getScenarioTitle = () => {
    if (isMissedDeadlinesScenario()) {
      return "Addressing Missed Deadlines";
    } else {
      return "Difficult Conversation Handling";
    }
  };
  
  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="bg-green-600 text-white px-6 py-4">
        <h2 className="text-xl font-semibold">Communication Skills Analysis: {getScenarioTitle()}</h2>
      </div>
      <div className="p-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-green-700 mb-2">Strengths</h3>
            <ul className="list-disc pl-5 space-y-2">
              {feedback.strengths.map((strength, i) => (
                <li key={i} className="text-gray-700">{strength}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-medium text-red-700 mb-2">Areas for Improvement</h3>
            <ul className="list-disc pl-5 space-y-2">
              {feedback.weaknesses.map((weakness, i) => (
                <li key={i} className="text-gray-700">{weakness}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-medium text-blue-700 mb-2">Recommended Actions</h3>
          <ul className="list-disc pl-5 space-y-2">
            {feedback.improvements.map((improvement, i) => (
              <li key={i} className="text-gray-700">{improvement}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}; 