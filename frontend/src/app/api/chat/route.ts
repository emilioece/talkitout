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

Follow these specific guidelines:
1. For your first two responses, stay completely in character as my sensitive coworker who has missed deadlines.
2. After my third message, provide BOTH your in-character response AND feedback about how I handled the conversation.
3. For the third response, FIRST respond in character, THEN after that response, come out of character and provide feedback.

Structure the feedback section after your third response like this:

STRENGTHS:
- List 2-3 specific positive aspects of my communication approach
- Focus on what I did well in managing this difficult conversation

WEAKNESSES:
- List 2-3 specific areas where my approach could be improved
- Be honest but constructive about what I could have done better

IMPROVEMENTS:
- Provide 3 actionable and specific suggestions for how I could handle similar situations better
- Include practical tips that would lead to better conflict resolution outcomes

SUMMARY:
A concise paragraph summarizing my overall performance and the most important takeaways for me to remember in future workplace conflicts.

Remember to maintain a professional but supportive tone in your feedback.`;

export async function POST(request: NextRequest) {
  try {
    const { messages, interactionCount } = await request.json();
    
    // Only filter out system messages from the user input, we'll add our own
    const filteredMessages = messages.filter((msg: { role: string; content: string }) => 
      msg.role !== 'system'
    );
    
    // Create the message array for OpenAI with our system prompt
    const chatMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...filteredMessages
    ];
    
    // Check if API key is available and try to call OpenAI
    if (process.env.OPENAI_API_KEY) {
      try {
        console.log('Calling OpenAI API with messages:', JSON.stringify(chatMessages));
        
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: chatMessages,
          temperature: 0.7,
          max_tokens: 1000,
        });
        
        const aiResponse = response.choices[0].message.content || '';
        console.log('Received response from OpenAI:', aiResponse);
        
        // For the last message, extract feedback
        if (interactionCount >= 3) {
          const feedback = parseFeedback(aiResponse);
          return NextResponse.json({
            success: true,
            response: {
              message: aiResponse,
              feedback
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
        return simulatedResponse(interactionCount);
      }
    } else {
      console.log('No OpenAI API key found, using simulated response');
      return simulatedResponse(interactionCount);
    }
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}

// Helper function to provide simulated responses when OpenAI is not available
function simulatedResponse(interactionCount: number) {
  let response;
  let generateFeedback = false;
  
  if (interactionCount >= 3) {
    // Generate feedback after 3 interactions
    response = {
      message: `I understand your perspective, and I appreciate your patience with me. I'll make sure to communicate better about any challenges I'm facing with deadlines in the future.

STRENGTHS:
- You approached the conversation directly without being confrontational
- You focused on the impact of the behavior rather than attacking the person

WEAKNESSES:
- You could provide more specific examples of missed deadlines
- The tone could be more empathetic to encourage open communication

IMPROVEMENTS:
- Try asking open-ended questions to understand my perspective
- Offer specific support or resources to help address the issue
- Establish clear expectations and follow-up plans

SUMMARY:
You demonstrated good basic conflict resolution skills by addressing the issue directly. To improve, focus on being more specific about the problem while showing more empathy and offering concrete solutions.`,
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
}

// Helper function to parse feedback from OpenAI response
function parseFeedback(aiResponse: string) {
  try {
    // Try to extract structured feedback from the response
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const improvements: string[] = [];
    let summary = "";
    
    // Extract STRENGTHS section - using m flag instead of s flag
    const strengthsMatch = aiResponse.match(/STRENGTHS:([\s\S]+?)(?=WEAKNESSES:|$)/);
    if (strengthsMatch && strengthsMatch[1]) {
      const strengthsText = strengthsMatch[1].trim();
      const strengthsItems = strengthsText.split(/\n-|\n•/).map(item => item.trim()).filter(Boolean);
      strengths.push(...strengthsItems);
    }
    
    // Extract WEAKNESSES section - using m flag instead of s flag
    const weaknessesMatch = aiResponse.match(/WEAKNESSES:([\s\S]+?)(?=IMPROVEMENTS:|$)/);
    if (weaknessesMatch && weaknessesMatch[1]) {
      const weaknessesText = weaknessesMatch[1].trim();
      const weaknessesItems = weaknessesText.split(/\n-|\n•/).map(item => item.trim()).filter(Boolean);
      weaknesses.push(...weaknessesItems);
    }
    
    // Extract IMPROVEMENTS section - using m flag instead of s flag
    const improvementsMatch = aiResponse.match(/IMPROVEMENTS:([\s\S]+?)(?=SUMMARY:|$)/);
    if (improvementsMatch && improvementsMatch[1]) {
      const improvementsText = improvementsMatch[1].trim();
      const improvementsItems = improvementsText.split(/\n-|\n•/).map(item => item.trim()).filter(Boolean);
      improvements.push(...improvementsItems);
    }
    
    // Extract SUMMARY section - using m flag instead of s flag
    const summaryMatch = aiResponse.match(/SUMMARY:([\s\S]+?)$/);
    if (summaryMatch && summaryMatch[1]) {
      summary = summaryMatch[1].trim();
    }
    
    // If we couldn't extract structured feedback, return default
    if (strengths.length === 0 && weaknesses.length === 0 && improvements.length === 0 && !summary) {
      return defaultFeedback();
    }
    
    return {
      strengths: strengths.length > 0 ? strengths : defaultFeedback().strengths,
      weaknesses: weaknesses.length > 0 ? weaknesses : defaultFeedback().weaknesses,
      improvements: improvements.length > 0 ? improvements : defaultFeedback().improvements,
      summary: summary || defaultFeedback().summary
    };
  } catch (error) {
    console.error('Error parsing feedback:', error);
    return defaultFeedback();
  }
}

// Default feedback if parsing fails
function defaultFeedback() {
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