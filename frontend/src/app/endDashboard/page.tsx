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
    
    if (storedCommunicationFeedback) {
      setCommunicationFeedback(JSON.parse(storedCommunicationFeedback));
    }
    
    if (storedConfidenceFeedback) {
      setConfidenceFeedback(JSON.parse(storedConfidenceFeedback));
    }
    
    // If no feedback is available, redirect back to chat
    if (!storedCommunicationFeedback && !storedConfidenceFeedback) {
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

          {/* Communication skills section */}
          {communicationFeedback && (
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="bg-green-600 text-white px-6 py-4">
                <h2 className="text-xl font-semibold">Communication Skills Analysis</h2>
              </div>
              <div className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-green-700 mb-2">Strengths</h3>
                    <ul className="list-disc pl-5 space-y-2">
                      {communicationFeedback.strengths.map((strength, i) => (
                        <li key={i} className="text-gray-700">{strength}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-red-700 mb-2">Areas for Improvement</h3>
                    <ul className="list-disc pl-5 space-y-2">
                      {communicationFeedback.weaknesses.map((weakness, i) => (
                        <li key={i} className="text-gray-700">{weakness}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-medium text-blue-700 mb-2">Recommended Actions</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    {communicationFeedback.improvements.map((improvement, i) => (
                      <li key={i} className="text-gray-700">{improvement}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Body language section */}
          {confidenceFeedback && (
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="bg-purple-600 text-white px-6 py-4">
                <h2 className="text-xl font-semibold">Body Language & Confidence Analysis</h2>
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
        </div>
      </div>
    </div>
  );
} 