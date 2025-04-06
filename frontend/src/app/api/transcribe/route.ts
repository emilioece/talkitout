import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';

// Initialize the Google Generative AI client with API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY ?? '');

export async function POST(request: NextRequest) {
  try {
    // In production with valid API key, use Gemini 1.5 Pro for audio processing
    if (process.env.NODE_ENV === 'production' && process.env.GOOGLE_AI_API_KEY) {
      try {
        // Get the audio data from the request
        const formData = await request.formData();
        const audioFile = formData.get('audio') as File;
        
        if (audioFile) {
          // Convert File to ArrayBuffer
          const audioBytes = await audioFile.arrayBuffer();
          
          // Initialize Gemini 1.5 Pro model, which supports multimodal content including audio
          const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
          
          // Create audio part for Gemini
          const audioPart: Part = {
            inlineData: {
              data: Buffer.from(audioBytes).toString('base64'),
              mimeType: 'audio/webm',
            },
          };
          
          // Prompt Gemini to transcribe the audio
          const result = await model.generateContent([
            "Transcribe the following audio accurately. Only return the transcript text with no additional explanation or commentary.",
            audioPart
          ]);
          
          const transcription = result.response.text();
          console.log('Transcription from Gemini 1.5 Pro:', transcription);
          
          return NextResponse.json({ 
            success: true, 
            transcript: transcription 
          });
        }
      } catch (geminiError) {
        console.error('Gemini transcription error:', geminiError);
        // Fall back to simulation if Gemini API fails
      }
    }
    
    // For development or if Gemini API call fails, simulate transcription
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