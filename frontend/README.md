# TalkItOut

Develop your soft skills with AI-powered workplace scenario practice.

## Overview

TalkItOut is an interactive web application that helps users practice workplace conflict resolution scenarios with an AI conversation partner. Users can speak naturally into their microphone, receive realistic responses from an AI coworker, and get personalized feedback on their communication effectiveness.

## Features

- **Voice Interaction**: Speak naturally into your microphone to engage with the AI
- **Realistic Scenario**: Practice handling a conversation with a coworker who consistently misses deadlines
- **Text & Voice Responses**: AI responses in both text and voice format
- **Communication Feedback**: Receive detailed feedback after three interactions including strengths, weaknesses, and recommendations

## Tech Stack

- Next.js 15 with App Router
- TailwindCSS for styling
- Web Speech API for speech recognition
- OpenAI's GPT-4o-mini for AI responses
- ElevenLabs for text-to-speech

## Getting Started

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

3. Create a `.env.local` file with your API keys:

```
# For production implementation
OPENAI_API_KEY=your_openai_key
ELEVENLABS_API_KEY=your_elevenlabs_key
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## API Routes

The application uses the following API routes:

- `/api/transcribe` - Handles speech-to-text conversion
- `/api/chat` - Processes conversation with OpenAI
- `/api/speech` - Generates voice responses with ElevenLabs

## Deployment

This is a Vercel-ready project that can be deployed with a simple push to your connected Git repository.

## Note for MVP

This MVP version includes simulated responses for quick demonstration. In a production environment, it would connect to OpenAI's API and ElevenLabs for full functionality.
