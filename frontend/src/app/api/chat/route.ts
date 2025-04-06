import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize the OpenAI client with API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? undefined,
});

// This is the system prompt to use with OpenAI's API
const SYSTEM_PROMPT = `I want to practice my conflict resolution skills and I want to role-play a scenario. 
You are a coworker that has been consistently lagging behind project deadlines and I want to confront you about this situation. 
However, you are also a sensitive person, and if I react aggressively or negatively towards you, you will similarly reciprocate. 
I am your coworker who is confronting you about this issue. I will start the conversation and you can respond to me up to three times as we will have a back and forth. 
At the end of these three times, I want you to come out of this character and then critique how I performed in this social scenario. 
Give me specific feedback about how I can improve my soft skills and ensure that both parties come to a satisfied conclusion.`;

export async function POST(request: NextRequest) {
  try {
    const { messages, interactionCount } = await request.json();
    
    // For production implementation
    if (process.env.NODE_ENV === 'production' && process.env.OPENAI_API_KEY) {
      try {
        // Processing messages with OpenAI API
        const chatMessages = [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages.filter((msg: { role: string; content: string }) => msg.role !== 'system')
        ];
        
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: chatMessages,
          temperature: 0.7,
          max_tokens: 800,
        });
        
        const aiResponse = response.choices[0].message.content || '';
        
        // For the last message, extract feedback
        if (interactionCount >= 3) {
          return NextResponse.json({
            success: true,
            response: {
              message: aiResponse,
              feedback: parseFeedback(aiResponse)
            },
            generateFeedback: true
          });
        } else {
          return NextResponse.json({
            success: true,
            response: { message: aiResponse },
            generateFeedback: false
          });
        }
      } catch (openaiError) {
        console.error('OpenAI API error:', openaiError);
        // Fall back to simulated responses if OpenAI API fails
      }
    }
    
    // If not in production or OpenAI call failed, use simulated responses
    let response;
    let generateFeedback = false;
    
    if (interactionCount >= 3) {
      // Generate feedback after 3 interactions
      response = {
        message: "I understand your perspective, and I appreciate your patience with me. I'll make sure to communicate better about any challenges I'm facing with deadlines in the future.",
        feedback: {
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
        }
      };
      generateFeedback = true;
    } else {
      // Regular response during conversation
      const aiResponses = [
        "I'm sorry about that. I've been struggling with the workload lately. There have been some personal issues that have affected my focus, but I didn't want to make excuses. I should have communicated this better.",
        "You're right, and I appreciate your understanding. I'm trying to get better at managing my time. Do you have any suggestions that might help me stay on track?"
      ];
      
      response = {
        message: aiResponses[interactionCount - 1] || "I understand your perspective, and I'll work on improving my timeliness with projects."
      };
    }
    
    return NextResponse.json({ 
      success: true, 
      response,
      generateFeedback
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}

// Helper function to parse feedback from OpenAI response
function parseFeedback(_aiResponse: string) {
  // In a real implementation, you would parse the feedback more intelligently
  // For now, we'll just return a basic structure with default values
  return {
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
  };
} 