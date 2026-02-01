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
    const { difficulty, topic, count = 1 } = await req.json();
    
    const systemPrompt = `You are a coding interview question generator. Generate ${count} coding problem(s) at ${difficulty} difficulty level.
${topic ? `Focus on: ${topic}` : 'Cover common interview topics like arrays, strings, algorithms, and data structures.'}

For each question, provide:
1. A unique ID (use format: q_<random_6_chars>)
2. Title
3. Difficulty level
4. Problem description
5. Example inputs and outputs
6. Constraints
7. Test cases (3-5 test cases with input and expected output)
8. Hints (optional)

Respond in JSON format:
{
  "questions": [
    {
      "id": "q_abc123",
      "title": "Two Sum",
      "difficulty": "easy",
      "description": "Problem description here...",
      "examples": [
        {"input": "[2,7,11,15], target = 9", "output": "[0,1]", "explanation": "Because nums[0] + nums[1] == 9"}
      ],
      "constraints": ["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9"],
      "testCases": [
        {"input": {"nums": [2,7,11,15], "target": 9}, "expected": [0,1]},
        {"input": {"nums": [3,2,4], "target": 6}, "expected": [1,2]}
      ],
      "hints": ["Try using a hash map for O(n) solution"]
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
          { role: "user", content: `Generate ${count} ${difficulty} level coding question(s)${topic ? ` about ${topic}` : ''}.` }
        ],
        max_tokens: 2048,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", errorText);
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
  } catch (error: unknown) {
    console.error("Error in generate-coding-questions function:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
