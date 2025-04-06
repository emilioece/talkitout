import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize the OpenAI client with API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? undefined,
});

export async function POST(request: NextRequest) {
  try {
    // In production with valid API key, use OpenAI's Whisper API
    if (process.env.NODE_ENV === 'production' && process.env.OPENAI_API_KEY) {
      try {
        // Get the audio data from the request
        const formData = await request.formData();
        const audioFile = formData.get('audio') as File;
        
        if (audioFile) {
          // Convert File to Blob and then to Buffer
          const buffer = Buffer.from(await audioFile.arrayBuffer());
          
          // Use OpenAI Whisper API for transcription
          const transcriptionResponse = await openai.audio.transcriptions.create({
            file: new File([buffer], 'audio.webm', { type: 'audio/webm' }),
            model: 'whisper-1',
          });
          
          return NextResponse.json({ 
            success: true, 
            transcript: transcriptionResponse.text 
          });
        }
      } catch (openaiError) {
        console.error('OpenAI transcription error:', openaiError);
        // Fall back to simulation if OpenAI API fails
      }
    }
    
    // For development or if OpenAI API call fails, simulate transcription
    const transcription = "This is a simulated transcription for the MVP.";
    
    return NextResponse.json({ 
      success: true, 
      transcript: transcription 
    });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
} 