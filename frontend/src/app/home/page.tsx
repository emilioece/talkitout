"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
      <main className="flex flex-col items-center max-w-2xl">
        <h1 className="text-4xl font-bold mb-4">TalkItOut</h1>
        <p className="text-xl mb-8">
          Develop your soft skills with AI-powered workplace scenario practice.
          Get feedback on your communication style, conflict resolution skills, and body language.
        </p>
        
        <div className="w-24 h-24 bg-gray-200 rounded-full mb-8 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 16 16" className="opacity-70">
            <path d="M5 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
            <path d="M2.165 15.803l.02-.004c1.83-.363 2.948-.842 3.468-1.105A9.06 9.06 0 0 0 8 15c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7c0 1.76.743 3.37 1.97 4.6a10.437 10.437 0 0 1-.524 2.318l-.003.011a10.722 10.722 0 0 1-.244.637c-.079.186.074.394.273.362a21.673 21.673 0 0 0 .693-.125zm.8-3.108a1 1 0 0 0-.287-.801C1.618 10.83 1 9.468 1 8c0-3.192 3.004-6 7-6s7 2.808 7 6c0 3.193-3.004 6-7 6a8.06 8.06 0 0 1-2.088-.272 1 1 0 0 0-.711.074c-.387.196-1.24.57-2.634.893a10.97 10.97 0 0 0 .398-2z"/>
          </svg>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8 w-full">
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-3">Practice Conversations</h2>
            <div className="space-y-2 text-left">
              <p className="flex items-center">
                <span className="mr-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-800">1</span>
                Speak naturally to practice a workplace conflict scenario
              </p>
              <p className="flex items-center">
                <span className="mr-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-800">2</span>
                Get realistic responses from an AI coworker
              </p>
              <p className="flex items-center">
                <span className="mr-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-800">3</span>
                Receive feedback on your communication style and effectiveness
              </p>
            </div>
          </div>
          
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-3">NEW: Body Language Analysis</h2>
            <div className="space-y-2 text-left">
              <p className="flex items-center">
                <span className="mr-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-800">1</span>
                Enable your camera during practice sessions
              </p>
              <p className="flex items-center">
                <span className="mr-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-800">2</span>
                AI analyzes your posture, gestures, and facial expressions
              </p>
              <p className="flex items-center">
                <span className="mr-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-800">3</span>
                Get personalized tips to improve your non-verbal communication
              </p>
            </div>
          </div>
        </div>

        <Link 
          href="/chat" 
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
        >
          Start Practice Session
        </Link>
      </main>
      
      <footer className="mt-16 text-sm text-gray-500">
        © 2024 TalkItOut - Workplace Communication Training
      </footer>
    </div>
  );
} 