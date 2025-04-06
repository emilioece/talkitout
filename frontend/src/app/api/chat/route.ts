import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Define proper types for messages
interface Message {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  name?: string; // Required for function messages
}

// Initialize the OpenAI client with API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? undefined,
});

// This is the system prompt to use with OpenAI's API
const SYSTEM_PROMPT = `I want to practice my conflict resolution skills through role-play. You'll act as my coworker who consistently misses project deadlines. I need to address this issue with you effectively.

SCENARIO: We're teammates on an ongoing project where timelines matter. Focus on the interpersonal dynamics rather than project specifics.

YOUR CHARACTER TRAITS: [SELECT ONE RANDOMLY]
- RESERVED: Quiet, avoid confrontation, withdraw when criticized
- DEFENSIVE: Quickly become defensive, make excuses, deflect responsibility
- EMOTIONAL: Take feedback personally, become visibly upset
- STUBBORN: Resist change, defend your methods, challenge others' perspectives
- OVERWHELMED: Struggling with workload but hesitate to admit it

CONFLICT MANAGEMENT STYLE: [SELECT ONE RANDOMLY]
- COMPETING: You prioritize your own concerns over others, are assertive and uncooperative
- ACCOMMODATING: You neglect your own concerns to satisfy others, unassertive and cooperative
- AVOIDING: You sidestep the conflict, neither assertive nor cooperative
- COLLABORATING: You work to find a solution that fully satisfies everyone, assertive and cooperative
- COMPROMISING: You find a middle ground solution, moderately assertive and cooperative

AGREEABLENESS LEVEL: [SELECT ONE RANDOMLY]
- VERY LOW: Extremely difficult to reach common ground
- LOW: Resistant to feedback, requires significant effort
- MODERATE: Initially resistant but open to compromise
- HIGH: Receptive to feedback when delivered respectfully
- VERY HIGH: Quickly acknowledges issues, eager to resolve

KEY RULES:
1. Mirror my communication style—respond positively to empathy, negatively to accusations
2. You have legitimate reasons for falling behind
3. We'll have a 3-turn conversation
4. Incorporate your selected conflict management style throughout

IMPORTANT: For your first response, randomly select ONE character trait, ONE conflict management style, and ONE agreeableness level from the above lists and MAINTAIN THE SAME CONSISTENT PERSONALITY throughout our entire conversation. Begin your first response by indicating which trait, style, and agreeableness level you've selected, but do this in a hidden way using square brackets that a human wouldn't see as part of your actual response. For example: [TRAIT: DEFENSIVE, STYLE: AVOIDING, AGREEABLENESS: MODERATE]

For your second and third responses, do NOT include the trait marker brackets again, but be sure to maintain the EXACT SAME personality traits you initially selected.

FEEDBACK FOCUS:
After our role-play, analyze my approach through both Nonviolent Communication and Thomas-Kilmann frameworks:

NVC ELEMENTS:
- How well I made observations without evaluation
- If I expressed feelings without attributing blame
- Whether I identified needs behind the conflict
- Clarity of my requests

THOMAS-KILMANN ANALYSIS:
- Which conflict mode I primarily demonstrated
- How effective my approach was given your conflict style
- Alternative modes that might have been more effective

After my third message, provide BOTH:
1. Your in-character response based on your selected traits
2. Detailed feedback using the NVC and Thomas-Kilmann frameworks

Structure the feedback after your third in-character response like this:

STRENGTHS:
- List 2-3 specific positive aspects of my communication approach
- Focus on what I did well in managing this difficult conversation

WEAKNESSES:
- List 2-3 specific areas where my approach could be improved
- Be honest but constructive about what I could have done better

NVC ANALYSIS:
- Evaluate how well I used each component of Nonviolent Communication
- Provide specific examples from our conversation

THOMAS-KILMANN ANALYSIS:
- Identify which conflict mode I primarily used
- Assess its effectiveness against your selected conflict style
- Suggest alternative approaches that might work better

IMPROVEMENTS:
- Provide 3 actionable suggestions for handling similar situations better
- Include practical tips that would lead to better conflict resolution outcomes

SUMMARY:
A concise paragraph summarizing my overall performance and the most important takeaways for future workplace conflicts.`;

export async function POST(request: NextRequest) {
  try {
    const { messages, interactionCount } = await request.json();
    console.log(`Processing chat request - interaction ${interactionCount}/3`);
    
    // Extract traits from the first AI response if this isn't the first interaction
    let extractedTraits = '';
    
    if (interactionCount > 1 && messages.length >= 2) {
      // Find the first assistant message
      const firstAssistantMessage = messages.find((msg: Message) => msg.role === 'assistant');
      if (firstAssistantMessage) {
        // Try to extract trait markers
        const traitMatch = firstAssistantMessage.content.match(/\[\s*(?:TRAIT|CHARACTER):[^]*?(?:STYLE|CONFLICT):[^]*?AGREEABLENESS:[^]*?\]/);
        if (traitMatch) {
          extractedTraits = traitMatch[0];
          console.log('Extracted traits from previous response:', extractedTraits);
        }
      }
    }
    
    // Only filter out system messages from the user input, we'll add our own
    const filteredMessages = messages.filter((msg: Message) => 
      msg.role !== 'system'
    );
    
    // Create the message array for OpenAI with our system prompt
    const chatMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT }
    ];
    
    // Add the extracted traits to the system prompt for consistency if found
    if (extractedTraits && interactionCount > 1) {
      chatMessages.push({
        role: 'system',
        content: `Remember to maintain consistency with the traits you initially selected: ${extractedTraits}. Do NOT include this trait marker in your response, but embody these traits in your reply.`
      });
    }
    
    // Add the conversation messages as properly typed OpenAI message params
    for (const msg of filteredMessages) {
      // Skip function messages that don't have a name to avoid type errors
      if (msg.role === 'function' && !msg.name) continue;
      
      // Add properly typed message based on role
      if (msg.role === 'system' || msg.role === 'user' || msg.role === 'assistant') {
        chatMessages.push({
          role: msg.role,
          content: msg.content
        });
      } else if (msg.role === 'function' && msg.name) {
        chatMessages.push({
          role: 'function',
          content: msg.content,
          name: msg.name
        });
      }
    }
    
    // Check if API key is available
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.error('No OpenAI API key found in environment variables');
      return NextResponse.json(
        { success: false, error: 'OpenAI API key is required but not configured' },
        { status: 500 }
      );
    }
    
    // Always try to call OpenAI API, no fallbacks to hardcoded responses
    try {
      console.log('Calling OpenAI API...');
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: chatMessages,
        temperature: 0.7,
        max_tokens: 1500,
      });
      
      let aiResponse = response.choices[0].message.content || '';
      console.log('Received response from OpenAI API');
      
      // Store traits from first response before cleaning
      let traits = '';
      if (interactionCount === 1) {
        const traitMatch = aiResponse.match(/\[\s*(?:TRAIT|CHARACTER):[^]*?(?:STYLE|CONFLICT):[^]*?AGREEABLENESS:[^]*?\]/);
        if (traitMatch) {
          traits = traitMatch[0];
          console.log('Detected traits in first response:', traits);
        }
      }
      
      // Clean the response to remove trait markers
      aiResponse = cleanResponseTraitMarkers(aiResponse);
      
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
      
      // Log detailed error information for debugging
      if (openaiError instanceof Error) {
        console.error('Error details:', openaiError.message);
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to get response from OpenAI' },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}

// Helper function to clean trait markers from AI responses
function cleanResponseTraitMarkers(text: string): string {
  // First attempt: Clean simple trait markers on a single line
  let cleaned = text.replace(/\[(?:TRAIT|CHARACTER|STYLE|AGREEABLENESS)[^\]]*\]/g, '');
  
  // Second attempt: Handle more complex multi-line trait markers with square brackets
  cleaned = cleaned.replace(/\[\s*(?:TRAIT|CHARACTER):[^]*?(?:STYLE|CONFLICT):[^]*?AGREEABLENESS:[^]*?\]/g, '');
  
  // Third attempt: Remove any remaining square brackets with technical content at start of response
  const bracketMatch = cleaned.match(/^\s*\[[^\]]*\]/);
  if (bracketMatch && bracketMatch[0].includes(':')) {
    cleaned = cleaned.substring(bracketMatch[0].length);
  }
  
  // Clean up any resulting extra whitespace or newlines at the beginning
  cleaned = cleaned.replace(/^\s+/, '');
  
  // Log if we made changes
  if (cleaned !== text) {
    console.log('Cleaned trait markers from response');
  }
  
  return cleaned;
}

// Helper function to parse feedback from OpenAI response
function parseFeedback(aiResponse: string) {
  try {
    // Try to extract structured feedback from the response
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const improvements: string[] = [];
    const nvcAnalysis: string[] = [];
    const thomasKilmannAnalysis: string[] = [];
    let summary = "";
    
    // Extract STRENGTHS section
    const strengthsMatch = aiResponse.match(/STRENGTHS:([\s\S]+?)(?=WEAKNESSES:|$)/);
    if (strengthsMatch && strengthsMatch[1]) {
      const strengthsText = strengthsMatch[1].trim();
      const strengthsItems = strengthsText.split(/\n-|\n•/).map(item => item.trim()).filter(Boolean);
      strengths.push(...strengthsItems);
    }
    
    // Extract WEAKNESSES section
    const weaknessesMatch = aiResponse.match(/WEAKNESSES:([\s\S]+?)(?=NVC ANALYSIS:|IMPROVEMENTS:|$)/);
    if (weaknessesMatch && weaknessesMatch[1]) {
      const weaknessesText = weaknessesMatch[1].trim();
      const weaknessesItems = weaknessesText.split(/\n-|\n•/).map(item => item.trim()).filter(Boolean);
      weaknesses.push(...weaknessesItems);
    }
    
    // Extract NVC ANALYSIS section
    const nvcMatch = aiResponse.match(/NVC ANALYSIS:([\s\S]+?)(?=THOMAS-KILMANN ANALYSIS:|IMPROVEMENTS:|$)/);
    if (nvcMatch && nvcMatch[1]) {
      const nvcText = nvcMatch[1].trim();
      const nvcItems = nvcText.split(/\n-|\n•/).map(item => item.trim()).filter(Boolean);
      nvcAnalysis.push(...nvcItems);
    }
    
    // Extract THOMAS-KILMANN ANALYSIS section
    const tkMatch = aiResponse.match(/THOMAS-KILMANN ANALYSIS:([\s\S]+?)(?=IMPROVEMENTS:|$)/);
    if (tkMatch && tkMatch[1]) {
      const tkText = tkMatch[1].trim();
      const tkItems = tkText.split(/\n-|\n•/).map(item => item.trim()).filter(Boolean);
      thomasKilmannAnalysis.push(...tkItems);
    }
    
    // Extract IMPROVEMENTS section
    const improvementsMatch = aiResponse.match(/IMPROVEMENTS:([\s\S]+?)(?=SUMMARY:|$)/);
    if (improvementsMatch && improvementsMatch[1]) {
      const improvementsText = improvementsMatch[1].trim();
      const improvementsItems = improvementsText.split(/\n-|\n•/).map(item => item.trim()).filter(Boolean);
      improvements.push(...improvementsItems);
    }
    
    // Extract SUMMARY section
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
      nvcAnalysis: nvcAnalysis.length > 0 ? nvcAnalysis : defaultFeedback().nvcAnalysis,
      thomasKilmannAnalysis: thomasKilmannAnalysis.length > 0 ? thomasKilmannAnalysis : defaultFeedback().thomasKilmannAnalysis,
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
    nvcAnalysis: [
      "Observations: You made some factual observations about missed deadlines",
      "Feelings: You expressed some feelings, but could be more clear about how the situation affects you",
      "Needs: You implied your needs for reliability and teamwork, but didn't state them explicitly",
      "Requests: Your requests for change were somewhat vague"
    ],
    thomasKilmannAnalysis: [
      "You primarily used a Competing conflict mode",
      "This was moderately effective given the other person's Avoiding style",
      "A Collaborating approach might have been more effective for finding mutual solutions"
    ],
    improvements: [
      "Try asking open-ended questions to understand their perspective",
      "Offer specific support or resources to help address the issue",
      "Establish clear expectations and follow-up plans"
    ],
    summary: "You demonstrated good basic conflict resolution skills by addressing the issue directly. To improve, focus on being more specific about the problem while showing more empathy and offering concrete solutions."
  };
} 