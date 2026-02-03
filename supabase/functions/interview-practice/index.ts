import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, interviewType, role, answers, questions: inputQuestions, round } = await req.json();
    
    if (action === 'generate' || action === 'generate_questions') {
      const systemPrompt = `You are an expert interviewer. Generate 5 interview questions for a ${interviewType} interview for the role of ${role || 'Software Engineer'}.

Round ${round || 1} focus:
- Round 1: Introduction, background, and behavioral questions
- Round 2: Technical skills and problem-solving
- Round 3: System design and architecture (for senior roles)
- Round 4: Culture fit and leadership

Generate questions appropriate for the round.

Respond in JSON format:
{
  "questions": [
    {
      "id": 1,
      "question": "Tell me about yourself and your experience.",
      "type": "${interviewType}",
      "difficulty": "medium",
      "tips": ["Keep it concise (2-3 minutes)", "Focus on relevant experience"]
    }
  ]
}`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Generate interview questions for round ${round || 1}.` }
          ],
          max_tokens: 2048,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI Gateway error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      let questions;
      try {
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        const jsonString = jsonMatch ? jsonMatch[1] : content;
        questions = JSON.parse(jsonString);
      } catch {
        questions = { questions: [] };
      }

      return new Response(JSON.stringify(questions), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (action === 'evaluate' || action === 'evaluate_answer') {
      // Build a summary of all questions and answers for evaluation
      const qaList = (inputQuestions || []).map((q: { id: string; question: string }, i: number) => {
        const answer = answers?.[q.id] || "";
        return `Question ${i + 1}: ${q.question}\nAnswer: ${answer || "(No answer provided)"}`;
      }).join("\n\n");

      const systemPrompt = `You are an expert interview coach. Evaluate the candidate's interview performance based on all their answers.

Provide feedback on:
1. Content quality and relevance
2. Structure and clarity  
3. Use of STAR method (for behavioral questions)
4. Technical accuracy (for technical questions)
5. Communication skills

Respond in JSON format:
{
  "overallScore": 75,
  "feedback": {
    "communication": "Assessment of communication skills",
    "content": "Assessment of content quality",
    "structure": "Assessment of answer structure",
    "overallRecommendation": "Overall recommendation for improvement"
  },
  "questionFeedback": {
    "question_id": {
      "score": 80,
      "strengths": ["Good example"],
      "improvements": ["Add metrics"],
      "suggestion": "Brief suggestion"
    }
  }
}`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Interview Type: ${interviewType}\n\nQuestions and Answers:\n${qaList}\n\nPlease evaluate this interview performance.` }
          ],
          max_tokens: 2048,
          temperature: 0.5,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI Gateway error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      let evaluation;
      try {
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        const jsonString = jsonMatch ? jsonMatch[1] : content;
        evaluation = JSON.parse(jsonString);
      } catch {
        evaluation = {
          overallScore: 70,
          feedback: {
            communication: "Good effort",
            content: "Satisfactory content",
            structure: "Could improve structure",
            overallRecommendation: content
          },
          questionFeedback: {}
        };
      }

      return new Response(JSON.stringify(evaluation), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error("Error in interview-practice function:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
