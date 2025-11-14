import axios, { AxiosError } from 'axios';
import Constants from 'expo-constants';
import { HUGGING_FACE_API } from '../constants/config';
import { AIResponse, ApiError } from '../types';

const API_KEY = HUGGING_FACE_API.apiKey || 
  Constants.expoConfig?.extra?.EXPO_PUBLIC_HUGGING_FACE_API_KEY || 
  process.env.EXPO_PUBLIC_HUGGING_FACE_API_KEY || 
  '';

/**
 * Create axios instance with default configuration
 */
const createApiClient = (model: string) => {
  return axios.create({
    baseURL: `${HUGGING_FACE_API.baseUrl}/${model}`,
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });
};

/**
 * Handle API errors
 */
const handleApiError = (error: AxiosError): ApiError => {
  if (error.response) {
    const errorData = error.response.data as any;
    return {
      message: errorData?.error || 'API request failed',
      code: error.response.status.toString(),
      details: error.response.data,
    };
  } else if (error.request) {
    return {
      message: 'No response from server. Please check your internet connection.',
      code: 'NETWORK_ERROR',
    };
  } else {
    return {
      message: error.message || 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
    };
  }
};

/**
 * Retry logic for API requests
 */
const retryRequest = async <T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryRequest(fn, retries - 1, delay * 2);
  }
};

/**
 * Summarize text using BART model
 */
export const summarizeText = async (
  text: string,
  maxLength: number = HUGGING_FACE_API.maxTokens.summarization
): Promise<AIResponse> => {
  if (!API_KEY) {
    return {
      text: 'AI service is not configured. Please add your Hugging Face API key.',
      model: 'error',
    };
  }

  const startTime = Date.now();

  try {
    const apiClient = createApiClient(HUGGING_FACE_API.models.summarization);
    
    const response = await retryRequest(async () => {
      return await apiClient.post('/', {
        inputs: text,
        parameters: {
          max_length: maxLength,
          min_length: 30,
          do_sample: false,
        },
      });
    });

    const processingTime = Date.now() - startTime;
    const summary = response.data[0]?.summary_text || response.data[0]?.generated_text || '';

    return {
      text: summary,
      model: HUGGING_FACE_API.models.summarization,
      processingTime,
    };
  } catch (error) {
    console.error('Summarization error:', error);
    const apiError = handleApiError(error as AxiosError);
    return {
      text: `Sorry, I couldn't summarize the text. ${apiError.message}`,
      model: 'error',
    };
  }
};

/**
 * Answer questions using RoBERTa QA model
 */
export const answerQuestion = async (
  context: string,
  question: string
): Promise<AIResponse> => {
  if (!API_KEY) {
    return {
      text: 'AI service is not configured. Please add your Hugging Face API key.',
      model: 'error',
    };
  }

  const startTime = Date.now();

  try {
    const apiClient = createApiClient(HUGGING_FACE_API.models.qa);
    
    const response = await retryRequest(async () => {
      // RoBERTa QA expects question and context format
      return await apiClient.post('/', {
        inputs: {
          question: question,
          context: context || question // Use question as context if no context provided
        }
      });
    });

    const processingTime = Date.now() - startTime;
    
    // RoBERTa QA returns answer directly
    let answer = '';
    if (typeof response.data === 'object' && response.data) {
      answer = response.data.answer || '';
    } else if (typeof response.data === 'string') {
      answer = response.data;
    }

    return {
      text: answer || 'I apologize, but I could not find an answer. Could you provide more context or rephrase your question?',
      confidence: response.data?.score || 0,
      model: HUGGING_FACE_API.models.qa,
      processingTime,
    };
  } catch (error) {
    console.error('Q&A error:', error);
    const apiError = handleApiError(error as AxiosError);
    return {
      text: `Sorry, I couldn't answer the question. ${apiError.message}`,
      model: 'error',
    };
  }
};

/**
 * Chat with AI model (GPT-2 based models)
 */
export const chat = async (
  message: string,
  maxLength: number = HUGGING_FACE_API.maxTokens.chat
): Promise<AIResponse> => {
  if (!API_KEY) {
    return {
      text: 'AI service is not configured. Please add your Hugging Face API key to use this feature.',
      model: 'error',
    };
  }

  const startTime = Date.now();

  // Try models in order: advanced -> primary -> fallback
  const modelsToTry = [
    HUGGING_FACE_API.models.chatAdvanced,
    HUGGING_FACE_API.models.chat,
    HUGGING_FACE_API.models.chatFallback,
  ];

  for (const modelName of modelsToTry) {
    try {
      const apiClient = createApiClient(modelName);
      
      const response = await retryRequest(async () => {
        return await apiClient.post('/', {
          inputs: message,
          parameters: {
            max_new_tokens: maxLength,
            temperature: 0.7,
            top_p: 0.9,
            do_sample: true,
            return_full_text: false,
          },
        });
      }, 1, 1000); // Single retry per model

      const processingTime = Date.now() - startTime;
      
      // Parse response (GPT models return generated_text)
      let reply = '';
      if (Array.isArray(response.data) && response.data.length > 0) {
        const firstItem = response.data[0];
        if (typeof firstItem === 'string') {
          reply = firstItem;
        } else if (firstItem?.generated_text) {
          // For GPT models, extract only the new text
          const fullText = firstItem.generated_text;
          // Remove the input prompt from response
          reply = fullText.replace(message, '').trim();
          // If reply is empty, use full text
          if (!reply) reply = fullText;
        }
      } else if (typeof response.data === 'object' && response.data) {
        const text = response.data.generated_text || response.data.text || '';
        reply = typeof text === 'string' ? text.replace(message, '').trim() : '';
        if (!reply) reply = text;
      } else if (typeof response.data === 'string') {
        reply = response.data;
      }

      if (reply && reply.trim().length > 0) {
        return {
          text: reply.trim(),
          model: modelName,
          processingTime,
        };
      }
    } catch (error: any) {
      console.error(`Chat error with ${modelName}:`, error);
      
      // If 410 (Gone) or 404, try next model
      if (error.response?.status === 410 || error.response?.status === 404) {
        console.log(`Model ${modelName} unavailable, trying fallback...`);
        continue;
      }
      
      // For other errors, also try fallback
      if (modelName !== modelsToTry[modelsToTry.length - 1]) {
        continue;
      }
    }
  }

  // All models failed, return friendly error
  return {
    text: "I'm currently having trouble connecting to the AI service. Here's what you can try:\n\n1. Check your internet connection\n2. Make sure your API key is valid\n3. The AI service might be busy - try again in a moment\n\nIn the meantime, I can still help if you ask specific questions!",
    model: 'error',
  };
};

/**
 * Generate study plan using AI
 */
export const generateStudyPlan = async (
  courses: string[],
  deadlines: { task: string; date: Date; hours: number }[],
  availableHoursPerDay: number
): Promise<AIResponse> => {
  const prompt = `Create a detailed study plan for the following:

Courses: ${courses.join(', ')}

Upcoming Deadlines:
${deadlines.map(d => `- ${d.task} (Due: ${d.date.toDateString()}, Estimated: ${d.hours}h)`).join('\n')}

Available Study Time: ${availableHoursPerDay} hours per day

Please provide:
1. Daily study schedule
2. Time allocation per course
3. Recommended topics to focus on
4. Study tips for exam preparation`;

  return await chat(prompt, 500);
};

/**
 * Analyze study progress and provide recommendations
 */
export const analyzeStudyProgress = async (
  courseName: string,
  hoursStudied: number,
  targetHours: number,
  daysRemaining: number
): Promise<AIResponse> => {
  const prompt = `Analyze this study progress:

Course: ${courseName}
Hours studied so far: ${hoursStudied}
Target hours: ${targetHours}
Days remaining: ${daysRemaining}

Provide:
1. Progress assessment
2. Hours needed per day to reach the target
3. Recommendations to improve study efficiency`;

  return await chat(prompt, 300);
};

/**
 * Get study recommendations based on course difficulty
 */
export const getStudyRecommendations = async (
  courseName: string,
  difficulty: number,
  upcomingExamDays: number
): Promise<AIResponse> => {
  const difficultyText = ['Very Easy', 'Easy', 'Moderate', 'Hard', 'Very Hard'][difficulty - 1];
  
  const prompt = `Provide study recommendations for:

Course: ${courseName}
Difficulty: ${difficultyText}
Exam in: ${upcomingExamDays} days

Suggest:
1. Daily study duration
2. Key topics to prioritize
3. Study methods for this difficulty level
4. Practice strategies`;

  return await chat(prompt, 350);
};

export default {
  summarizeText,
  answerQuestion,
  chat,
  generateStudyPlan,
  analyzeStudyProgress,
  getStudyRecommendations,
};
