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

// Base system prompt for communication feedback
const BASE_SYSTEM_PROMPT = `I want to practice my conflict resolution skills and I want to role-play a scenario. 
You are a coworker that has been consistently lagging behind project deadlines and I want to confront you about this situation. 
However, you are also a sensitive person, and if I react aggressively or negatively towards you, you will similarly reciprocate. 
I am your coworker who is confronting you about this issue. I will start the conversation and you can respond to me up to three times as we will have a back and forth. 

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

// Extended system prompt when camera is enabled
const CAMERA_ENABLED_SYSTEM_PROMPT = `I want to practice my conflict resolution skills and I want to role-play a scenario. 
You are a coworker that has been consistently lagging behind project deadlines and I want to confront you about this situation. 
However, you are also a sensitive person, and if I react aggressively or negatively towards you, you will similarly reciprocate. 
I am your coworker who is confronting you about this issue. I will start the conversation and you can respond to me up to three times as we will have a back and forth. 

I've also enabled my camera during this conversation, which means you should provide feedback not just on my verbal communication but also on my non-verbal cues and body language that were captured.

Follow these specific guidelines:
1. For your first two responses, stay completely in character as my sensitive coworker who has missed deadlines.
2. After my third message, provide BOTH your in-character response AND comprehensive feedback about how I handled the conversation, including both verbal and non-verbal communication.
3. For the third response, FIRST respond in character, THEN after that response, come out of character and provide feedback.

Structure the feedback section after your third response like this:

VERBAL COMMUNICATION STRENGTHS:
- List 2-3 specific positive aspects of my verbal communication approach
- Focus on what I did well in managing this difficult conversation

VERBAL COMMUNICATION WEAKNESSES:
- List 2-3 specific areas where my verbal approach could be improved
- Be honest but constructive about what I could have done better

NON-VERBAL COMMUNICATION STRENGTHS:
- List 2-3 positive aspects of my body language, posture, facial expressions, and overall physical presentation
- Focus on how my non-verbal cues supported my message

NON-VERBAL COMMUNICATION WEAKNESSES:
- List 2-3 areas where my body language, posture, eye contact, or gestures could be improved
- Be specific about which non-verbal aspects detracted from my message

IMPROVEMENTS:
- Provide 3-4 actionable and specific suggestions for how I could improve both verbal and non-verbal communication
- Include practical tips that would lead to better conflict resolution outcomes

SUMMARY:
A concise paragraph summarizing my overall performance, integrating both verbal and non-verbal aspects, and the most important takeaways for me to remember in future workplace conflicts.

Remember to maintain a professional but supportive tone in your feedback.`;

// Interface for video data structure
interface VideoData {
  frameCount: number;
}

export async function POST(request: NextRequest) {
  try {
    const { messages, interactionCount, videoData, endSession } = await request.json();
    
    // Only filter out system messages from the user input, we'll add our own
    const filteredMessages = messages.filter((msg: Message) => 
      msg.role !== 'system'
    );
    
    // Choose the appropriate system prompt based on whether camera was used
    const systemPrompt = videoData ? CAMERA_ENABLED_SYSTEM_PROMPT : BASE_SYSTEM_PROMPT;
    
    // Create the message array for OpenAI with our system prompt
    const chatMessages = [
      { role: 'system', content: systemPrompt },
      ...filteredMessages
    ];
    
    // If camera was used, add a note about video analysis
    if (videoData && videoData.frameCount > 0) {
      chatMessages.push({
        role: 'system',
        content: `Note: The user had their camera enabled during this conversation and recorded ${videoData.frameCount} frames of video. Please include feedback on likely non-verbal communication based on this fact.`
      });
    }
    
    // Check if we need to generate feedback (session ended or 3+ interactions)
    const shouldGenerateFeedback = endSession || interactionCount >= 3;
    
    // Check if API key is available and try to call OpenAI
    if (process.env.OPENAI_API_KEY) {
      try {
        console.log('Calling OpenAI API with messages:', JSON.stringify(chatMessages));
        
        // If manually ended but insufficient interactions, append a note about early termination
        if (endSession && interactionCount < 3) {
          chatMessages.push({
            role: 'system',
            content: 'Note: The user has chosen to end the session early. Please provide feedback based on the conversation so far.'
          });
        }
        
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: chatMessages,
          temperature: 0.7,
          max_tokens: 1000,
        });
        
        const aiResponse = response.choices[0].message.content || '';
        console.log('Received response from OpenAI:', aiResponse);
        
        // Generate feedback if needed
        if (shouldGenerateFeedback) {
          const feedback = videoData ? parseCameraEnabledFeedback(aiResponse) : parseFeedback(aiResponse);
          
          // Check if video data was provided
          const confidenceFeedback = videoData ? generateConfidenceFeedback(videoData) : null;
          
          return NextResponse.json({
            success: true,
            response: {
              message: aiResponse,
              feedback
            },
            confidenceFeedback,
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
        return simulatedResponse(interactionCount, videoData, endSession);
      }
    } else {
      console.log('No OpenAI API key found, using simulated response');
      return simulatedResponse(interactionCount, videoData, endSession);
    }
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}

// Generate confidence feedback based on video data
function generateConfidenceFeedback(videoData: VideoData) {
  // In a real application, you would send these frames to a computer vision API
  // For this demo, we'll return a simulated analysis
  
  if (!videoData || videoData.frameCount === 0) {
    return null;
  }
  
  // The more frames, the more confident we can be in our analysis
  const frameDuration = videoData.frameCount > 10 ? 'extended' : 'brief';
  
  return {
    posture: frameDuration === 'extended' 
      ? "Your posture was generally upright and engaged during most of the conversation, though you tended to lean back slightly when listening."
      : "Your posture appeared generally upright during the conversation.",
    eyeContact: frameDuration === 'extended'
      ? "You maintained consistent eye contact with the camera, which enhances your credibility and shows engagement." 
      : "You maintained good eye contact with the camera.",
    gestures: frameDuration === 'extended'
      ? "Your hand gestures were natural and helped emphasize key points. You used open palm gestures which convey honesty."
      : "Your hand gestures appeared natural throughout the conversation.",
    facialExpressions: frameDuration === 'extended'
      ? "Your facial expressions conveyed appropriate seriousness about the topic while remaining approachable. Your smile when acknowledging points helped build rapport."
      : "Your facial expressions showed appropriate engagement with the topic.",
    overallConfidence: frameDuration === 'extended'
      ? "You appeared generally confident during the conversation, with room for improvement in moments of hesitation. Your tone and body language aligned well."
      : "You demonstrated moderate confidence in your communication style.",
    recommendations: frameDuration === 'extended'
      ? [
          "Try to reduce fidgeting with hands when discussing challenging points.",
          "Practice maintaining a slightly more relaxed shoulder posture to convey greater confidence.",
          "Consider using more deliberate pauses after making important points to let them sink in.",
          "When making critical points, try leaning slightly forward to emphasize engagement."
        ]
      : [
          "Consider using more hand gestures to emphasize key points in your message.",
          "Practice maintaining a consistent upright posture throughout the conversation.",
          "Work on varying your facial expressions to better convey empathy during difficult conversations."
        ]
  };
}

// Helper function to provide simulated responses when OpenAI is not available
function simulatedResponse(interactionCount: number, videoData?: VideoData, endSession?: boolean) {
  let response;
  let generateFeedback = false;
  let confidenceFeedback = null;
  
  // Generate feedback if session is ended or we've reached 3 interactions
  if (endSession || interactionCount >= 3) {
    // Adjust feedback message based on whether session was completed or ended early
    const earlyEndingNote = endSession && interactionCount < 3 
      ? "\n\nNote: This feedback is based on a partial conversation. For more comprehensive feedback, try completing the full scenario." 
      : "";
    
    if (videoData) {
      // Enhanced feedback for camera-enabled sessions
      response = {
        message: `I understand your perspective, and I appreciate your patience with me. I'll make sure to communicate better about any challenges I'm facing with deadlines in the future.

VERBAL COMMUNICATION STRENGTHS:
- You approached the conversation directly without being confrontational
- You focused on the impact of the behavior rather than attacking the person

VERBAL COMMUNICATION WEAKNESSES:
- You could provide more specific examples of missed deadlines
- The tone could be more empathetic to encourage open communication

NON-VERBAL COMMUNICATION STRENGTHS:
- Your consistent eye contact demonstrated confidence and engagement
- Your upright posture conveyed professionalism and attentiveness

NON-VERBAL COMMUNICATION WEAKNESSES:
- You displayed some nervous gestures that might have undermined your authority
- Your facial expressions occasionally showed frustration that could escalate tension

IMPROVEMENTS:
- Try asking open-ended questions to understand my perspective
- Use more deliberate pauses to emphasize key points and seem more confident
- Maintain a relaxed but engaged posture throughout difficult conversations
- Practice aligning your facial expressions with your verbal message

SUMMARY:
You demonstrated good basic conflict resolution skills through both your words and body language. Your direct but respectful approach was effective, though adding more specific examples and displaying more consistent non-verbal cues would strengthen your message. Focus on integrating empathetic language with confident body language for more effective workplace conversations.${earlyEndingNote}`,
        feedback: {
          strengths: [
            "You approached the conversation directly without being confrontational",
            "You focused on the impact of the behavior rather than attacking the person",
            "Your consistent eye contact demonstrated confidence and engagement"
          ],
          weaknesses: [
            "You could provide more specific examples of missed deadlines",
            "The tone could be more empathetic to encourage open communication",
            "You displayed some nervous gestures that might have undermined your authority"
          ],
          improvements: [
            "Try asking open-ended questions to understand their perspective",
            "Use more deliberate pauses to emphasize key points and seem more confident",
            "Maintain a relaxed but engaged posture throughout difficult conversations",
            "Practice aligning your facial expressions with your verbal message"
          ],
          summary: `You demonstrated good basic conflict resolution skills through both your words and body language. Your direct but respectful approach was effective, though adding more specific examples and displaying more consistent non-verbal cues would strengthen your message. Focus on integrating empathetic language with confident body language for more effective workplace conversations.${earlyEndingNote}`
        }
      };
    } else {
      // Standard feedback for audio-only sessions
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
You demonstrated good basic conflict resolution skills by addressing the issue directly. To improve, focus on being more specific about the problem while showing more empathy and offering concrete solutions.${earlyEndingNote}`,
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
          summary: `You demonstrated good basic conflict resolution skills by addressing the issue directly. To improve, focus on being more specific about the problem while showing more empathy and offering concrete solutions.${earlyEndingNote}`
        }
      };
    }
    
    generateFeedback = true;
    
    // If video data was provided, generate confidence feedback
    if (videoData) {
      confidenceFeedback = generateConfidenceFeedback(videoData);
    }
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
    generateFeedback,
    confidenceFeedback
  });
}

// Parse feedback that includes body language feedback (when camera was enabled)
function parseCameraEnabledFeedback(aiResponse: string) {
  try {
    // Try to extract structured feedback from the response
    const verbalStrengths: string[] = [];
    const verbalWeaknesses: string[] = [];
    const nonVerbalStrengths: string[] = [];
    const nonVerbalWeaknesses: string[] = [];
    const improvements: string[] = [];
    let summary = "";
    
    // Extract VERBAL COMMUNICATION STRENGTHS section
    const verbalStrengthsMatch = aiResponse.match(/VERBAL COMMUNICATION STRENGTHS:([\s\S]+?)(?=VERBAL COMMUNICATION WEAKNESSES:|NON-VERBAL COMMUNICATION STRENGTHS:|$)/);
    if (verbalStrengthsMatch && verbalStrengthsMatch[1]) {
      const strengthsText = verbalStrengthsMatch[1].trim();
      const strengthsItems = strengthsText.split(/\n-|\n•/).map(item => item.trim()).filter(Boolean);
      verbalStrengths.push(...strengthsItems);
    }
    
    // Extract VERBAL COMMUNICATION WEAKNESSES section
    const verbalWeaknessesMatch = aiResponse.match(/VERBAL COMMUNICATION WEAKNESSES:([\s\S]+?)(?=NON-VERBAL COMMUNICATION STRENGTHS:|NON-VERBAL COMMUNICATION WEAKNESSES:|IMPROVEMENTS:|$)/);
    if (verbalWeaknessesMatch && verbalWeaknessesMatch[1]) {
      const weaknessesText = verbalWeaknessesMatch[1].trim();
      const weaknessesItems = weaknessesText.split(/\n-|\n•/).map(item => item.trim()).filter(Boolean);
      verbalWeaknesses.push(...weaknessesItems);
    }
    
    // Extract NON-VERBAL COMMUNICATION STRENGTHS section
    const nonVerbalStrengthsMatch = aiResponse.match(/NON-VERBAL COMMUNICATION STRENGTHS:([\s\S]+?)(?=NON-VERBAL COMMUNICATION WEAKNESSES:|IMPROVEMENTS:|$)/);
    if (nonVerbalStrengthsMatch && nonVerbalStrengthsMatch[1]) {
      const strengthsText = nonVerbalStrengthsMatch[1].trim();
      const strengthsItems = strengthsText.split(/\n-|\n•/).map(item => item.trim()).filter(Boolean);
      nonVerbalStrengths.push(...strengthsItems);
    }
    
    // Extract NON-VERBAL COMMUNICATION WEAKNESSES section
    const nonVerbalWeaknessesMatch = aiResponse.match(/NON-VERBAL COMMUNICATION WEAKNESSES:([\s\S]+?)(?=IMPROVEMENTS:|$)/);
    if (nonVerbalWeaknessesMatch && nonVerbalWeaknessesMatch[1]) {
      const weaknessesText = nonVerbalWeaknessesMatch[1].trim();
      const weaknessesItems = weaknessesText.split(/\n-|\n•/).map(item => item.trim()).filter(Boolean);
      nonVerbalWeaknesses.push(...weaknessesItems);
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
    
    // Combine verbal and non-verbal strengths and weaknesses
    const combinedStrengths = [...verbalStrengths, ...nonVerbalStrengths.map(s => `[Non-verbal] ${s}`)];
    const combinedWeaknesses = [...verbalWeaknesses, ...nonVerbalWeaknesses.map(w => `[Non-verbal] ${w}`)];
    
    // If we couldn't extract structured feedback, return default
    if (combinedStrengths.length === 0 && combinedWeaknesses.length === 0 && improvements.length === 0 && !summary) {
      return defaultCameraEnabledFeedback();
    }
    
    return {
      strengths: combinedStrengths.length > 0 ? combinedStrengths : defaultCameraEnabledFeedback().strengths,
      weaknesses: combinedWeaknesses.length > 0 ? combinedWeaknesses : defaultCameraEnabledFeedback().weaknesses,
      improvements: improvements.length > 0 ? improvements : defaultCameraEnabledFeedback().improvements,
      summary: summary || defaultCameraEnabledFeedback().summary
    };
  } catch (error) {
    console.error('Error parsing camera-enabled feedback:', error);
    return defaultCameraEnabledFeedback();
  }
}

// Helper function to parse feedback from OpenAI response (regular audio-only sessions)
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

// Default feedback if parsing fails (audio-only sessions)
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

// Default camera-enabled feedback when parsing fails
function defaultCameraEnabledFeedback() {
  return {
    strengths: [
      "You approached the conversation directly without being confrontational",
      "You focused on the impact of the behavior rather than attacking the person",
      "[Non-verbal] Your consistent eye contact demonstrated confidence and engagement"
    ],
    weaknesses: [
      "You could provide more specific examples of missed deadlines",
      "The tone could be more empathetic to encourage open communication",
      "[Non-verbal] You displayed some nervous gestures that might have undermined your authority"
    ],
    improvements: [
      "Try asking open-ended questions to understand their perspective",
      "Use more deliberate pauses to emphasize key points and seem more confident",
      "Maintain a relaxed but engaged posture throughout difficult conversations",
      "Practice aligning your facial expressions with your verbal message"
    ],
    summary: "You demonstrated good basic conflict resolution skills through both your words and body language. Your direct but respectful approach was effective, though adding more specific examples and displaying more consistent non-verbal cues would strengthen your message. Focus on integrating empathetic language with confident body language for more effective workplace conversations."
  };
} 