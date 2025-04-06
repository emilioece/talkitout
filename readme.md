# TalkItOut 
Develop soft skills with AI-powered workplace scenarios

## Project Overview

TalkItOut is an interactive application that helps you practice and improve your workplace communication skills through simulated scenarios with an AI conversation partner. The application focuses on conflict resolution in professional settings and provides personalized feedback on your communication style.

## How It Works

1. **Start a Scenario**: Begin a simulated workplace conflict scenario where you'll speak with an AI coworker who consistently misses deadlines
2. **Natural Conversation**: Speak naturally into your microphone, and the AI will respond in both text and voice
3. **Skill Assessment**: After three exchanges, receive detailed feedback on your communication strengths, weaknesses, and recommendations for improvement

## Features

- Speech recognition for natural conversation
- Realistic AI responses using OpenAI's GPT-4o-mini
- Text-to-speech voice responses with ElevenLabs
- Detailed feedback on communication effectiveness
- Mobile-friendly interface

## Development

### Tech Stack
- **Frontend**: Next.js 15, React 19, TailwindCSS
- **AI**: OpenAI API (GPT-4o-mini)
- **Voice**: Web Speech API (recognition), ElevenLabs (synthesis)
- **Deployment**: Vercel

### Getting Started

To run the project locally:

1. Navigate to the frontend directory:
```
cd frontend
```

2. Install dependencies:
```
npm install
```

3. Start the development server:
```
npm run dev
```

4. Visit http://localhost:3000 in your browser

## MVP vs. Production

This initial MVP uses simulated responses for quick demonstration purposes. In production, it would connect to:

- OpenAI's API for intelligent conversation processing
- ElevenLabs for realistic voice generation
- Web Speech API for accurate speech recognition

## Deployment

This project is ready for deployment on Vercel with minimal configuration.
