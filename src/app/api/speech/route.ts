import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// ElevenLabs Voice ID - you can change this to any voice ID from your ElevenLabs account
const VOICE_ID = '21m00Tcm4TlvDq8ikWAM';  // Default "Rachel" voice

export async function POST(request: NextRequest) {
  console.log("Speech API called");
  
  try {
    const { text } = await request.json();
    console.log(`Generating speech for text: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
    
    // If we have an ElevenLabs API key
    const apiKey = process.env.ELEVENLABS_API_KEY;
    
    if (apiKey) {
      console.log("ElevenLabs API key found, attempting to generate speech");
      try {
        // Truncate text if it's too long (ElevenLabs has limits)
        const truncatedText = text.length > 5000 ? text.substring(0, 5000) : text;
        
        // Call ElevenLabs API for text-to-speech
        const response = await axios({
          method: 'post',
          url: `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
          headers: {
            'Accept': 'audio/mpeg',
            'xi-api-key': apiKey,
            'Content-Type': 'application/json'
          },
          data: {
            text: truncatedText,
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.5
            }
          },
          responseType: 'arraybuffer',
          timeout: 30000 // 30 second timeout
        });
        
        console.log("Successfully received audio from ElevenLabs");
        // Convert the audio data to base64
        const audioBuffer = Buffer.from(response.data, 'binary');
        const base64Audio = audioBuffer.toString('base64');
        
        // Return as data URL
        return NextResponse.json({
          success: true,
          audioUrl: `data:audio/mpeg;base64,${base64Audio}`
        });
      } catch (elevenLabsError) {
        console.error('ElevenLabs API error:', elevenLabsError);
        
        // More detailed error logging
        if (axios.isAxiosError(elevenLabsError)) {
          const status = elevenLabsError.response?.status;
          const data = elevenLabsError.response?.data;
          console.error(`ElevenLabs API error with status ${status}:`, data);
          
          if (status === 401) {
            console.error("Authentication error - check your ElevenLabs API key");
          } else if (status === 429) {
            console.error("Rate limit exceeded - you've reached your ElevenLabs usage limit");
          }
        }
        
        // Fall back to the sample audio if the API call fails
        console.log('Falling back to sample audio after ElevenLabs error');
      }
    } else {
      console.log('No ElevenLabs API key found, using sample audio');
    }
    
    // For development or if ElevenLabs API call fails, return sample audio
    console.log("Returning sample audio fallback");
    return NextResponse.json({ 
      success: true,
      audioUrl: "/sample-audio.mp3"
    });
  } catch (error) {
    console.error('Speech synthesis error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate speech' },
      { status: 500 }
    );
  }
} 