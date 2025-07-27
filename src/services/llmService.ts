export interface LLMConfig {
  apiKey: string;
  model: 'meta-llama/llama-3.2-90b-vision-instruct' | 'deepseek/deepseek-chat';
  baseUrl?: string;
}

export interface LLMResponse {
  content: string;
  model: string;
}

export interface ProblemAnalysis {
  type: string;
  approach: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  concepts: string[];
  solution: string;
  explanation: string;
  steps: Array<{
    step: number;
    action: string;
    reasoning: string;
    result: string;
  }>;
}

export interface GeneratedProblem {
  problem: string;
  type: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  hints: string[];
  solution: string;
}

export class LLMService {
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = {
      ...config,
      baseUrl: config.baseUrl || 'https://openrouter.ai/api/v1'
    };
  }

  private async makeRequest(messages: Array<{role: string; content: string}>): Promise<string> {
    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`LLM API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  async parseNaturalLanguage(input: string): Promise<string> {
    const messages = [
      {
        role: 'system',
        content: `You are a mathematical expression parser. Convert natural language math problems into proper mathematical notation.

Examples:
- "find the derivative of x squared plus 3x" → "d/dx(x^2 + 3x)"
- "integrate x squared from 0 to 5" → "integral(x^2, x, 0, 5)"
- "what is the derivative of sine of x" → "d/dx(sin(x))"
- "solve x squared plus 2x equals 8" → "x^2 + 2x = 8"

Only return the mathematical expression, nothing else.`
      },
      {
        role: 'user',
        content: input
      }
    ];

    return await this.makeRequest(messages);
  }

  async analyzeProblem(expression: string): Promise<ProblemAnalysis> {
    const messages = [
      {
        role: 'system',
        content: `You are an expert mathematics tutor. Analyze the given mathematical expression and provide a detailed breakdown.

Return a JSON object with this structure:
{
  "type": "problem type (e.g., derivative, integral, equation)",
  "approach": "recommended solution method",
  "difficulty": "beginner|intermediate|advanced",
  "concepts": ["list", "of", "key", "concepts"],
  "solution": "final answer",
  "explanation": "detailed explanation of the approach",
  "steps": [
    {
      "step": 1,
      "action": "what to do",
      "reasoning": "why we do it",
      "result": "what we get"
    }
  ]
}`
      },
      {
        role: 'user',
        content: `Analyze this mathematical expression: ${expression}`
      }
    ];

    const response = await this.makeRequest(messages);
    try {
      return JSON.parse(response);
    } catch {
      throw new Error('Failed to parse LLM response');
    }
  }

  async enhanceExplanation(expression: string, currentSolution: string): Promise<string> {
    const messages = [
      {
        role: 'system',
        content: `You are an expert mathematics tutor. Provide a clear, detailed explanation of the mathematical solution.
        
Focus on:
- Why each step is necessary
- Mathematical concepts and rules being applied
- Common mistakes to avoid
- Intuitive understanding

Be conversational but precise.`
      },
      {
        role: 'user',
        content: `Expression: ${expression}
Current solution: ${currentSolution}

Provide an enhanced explanation of this solution.`
      }
    ];

    return await this.makeRequest(messages);
  }

  async provideTutoring(expression: string, userQuestion: string): Promise<string> {
    const messages = [
      {
        role: 'system',
        content: `You are a patient mathematics tutor. Help the student understand the concept without giving away the complete solution immediately.

Provide:
- Hints and guidance
- Questions to help them think
- Explanations of relevant concepts
- Encouragement

Be supportive and educational.`
      },
      {
        role: 'user',
        content: `I'm working on: ${expression}
My question: ${userQuestion}`
      }
    ];

    return await this.makeRequest(messages);
  }

  async generateProblem(type: string, difficulty: 'beginner' | 'intermediate' | 'advanced'): Promise<GeneratedProblem> {
    const messages = [
      {
        role: 'system',
        content: `Generate a mathematical problem of the specified type and difficulty.

Return a JSON object:
{
  "problem": "the problem statement",
  "type": "problem type",
  "difficulty": "difficulty level",
  "hints": ["hint1", "hint2", "hint3"],
  "solution": "complete solution with steps"
}`
      },
      {
        role: 'user',
        content: `Generate a ${difficulty} level ${type} problem.`
      }
    ];

    const response = await this.makeRequest(messages);
    try {
      return JSON.parse(response);
    } catch {
      throw new Error('Failed to parse generated problem');
    }
  }

  async chatAssistance(context: string, userMessage: string): Promise<string> {
    const messages = [
      {
        role: 'system',
        content: `You are a helpful mathematics assistant. Answer questions about math concepts, provide explanations, and help with problem-solving.

Current context: ${context}

Be helpful, accurate, and educational.`
      },
      {
        role: 'user',
        content: userMessage
      }
    ];

    return await this.makeRequest(messages);
  }
}