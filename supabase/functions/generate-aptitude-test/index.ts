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
    const { testType, questionCount = 10 } = await req.json();
    
    const typeDescriptions: Record<string, string> = {
      quantitative: "mathematical and numerical reasoning questions including arithmetic, algebra, percentages, ratios, and data interpretation",
      logical: "logical reasoning questions including patterns, sequences, syllogisms, and analytical puzzles",
      verbal: "verbal ability questions including reading comprehension, vocabulary, grammar, and sentence completion"
    };

    const systemPrompt = `You are an expert aptitude test creator. Generate ${questionCount} ${testType} aptitude questions.

Focus on: ${typeDescriptions[testType] || "general aptitude"}

Each question should:
- Be challenging but fair
- Have exactly 4 options (A, B, C, D)
- Have only one correct answer
- Include a brief explanation for the correct answer

Respond in JSON format:
{
  "questions": [
    {
      "id": 1,
      "question": "The question text here",
      "options": {
        "A": "First option",
        "B": "Second option",
        "C": "Third option",
        "D": "Fourth option"
      },
      "correctAnswer": "A",
      "explanation": "Brief explanation of why this is correct",
      "difficulty": "medium"
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
          { role: "user", content: `Generate ${questionCount} ${testType} aptitude questions for a placement test.` }
        ],
        max_tokens: 4096,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    let test;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;
      test = JSON.parse(jsonString);
    } catch {
      test = { questions: [] };
    }

    return new Response(JSON.stringify(test), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error("Error in generate-aptitude-test function:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
