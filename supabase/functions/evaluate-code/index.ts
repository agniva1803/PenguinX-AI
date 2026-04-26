import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: claimsData, error: authError } = await supabase.auth.getClaims(authHeader.replace('Bearer ', ''));
    if (authError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { code, language, question, testCases } = await req.json();

    if (typeof code !== 'string' || code.length === 0 || code.length > 20000) {
      return new Response(JSON.stringify({ error: 'Invalid code (1-20000 chars required)' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    if (typeof language !== 'string' || language.length > 50) {
      return new Response(JSON.stringify({ error: 'Invalid language' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const systemPrompt = `You are an expert code reviewer and evaluator. Analyze the submitted code solution and provide comprehensive feedback.

Evaluate the code on:
1. **Correctness**: Does it solve the problem correctly?
2. **Time Complexity**: What is the Big O time complexity?
3. **Space Complexity**: What is the Big O space complexity?
4. **Code Quality**: Is the code clean, readable, and well-structured?
5. **Edge Cases**: Does it handle edge cases properly?
6. **Best Practices**: Does it follow language-specific best practices?

Also simulate running the test cases and determine if they would pass.

Respond in JSON format:
{
  "passed": boolean,
  "score": number (0-100),
  "testResults": [
    {"testCase": 1, "passed": boolean, "actualOutput": "...", "expectedOutput": "..."}
  ],
  "timeComplexity": "O(n)",
  "spaceComplexity": "O(1)",
  "feedback": {
    "correctness": "...",
    "efficiency": "...",
    "codeQuality": "...",
    "improvements": ["suggestion 1", "suggestion 2"]
  },
  "summary": "Brief overall assessment"
}`;

    const userMessage = `
Language: ${language}
Problem: ${question.title}
Description: ${question.description}

Test Cases:
${JSON.stringify(testCases, null, 2)}

Submitted Code:
\`\`\`${language}
${code}
\`\`\`

Please evaluate this solution.`;

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
          { role: "user", content: userMessage }
        ],
        max_tokens: 2048,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", errorText);
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
        passed: false,
        score: 50,
        testResults: [],
        timeComplexity: "Unknown",
        spaceComplexity: "Unknown",
        feedback: {
          correctness: "Could not fully evaluate",
          efficiency: "Please check your code",
          codeQuality: content,
          improvements: []
        },
        summary: "Evaluation completed with limited analysis"
      };
    }

    return new Response(JSON.stringify({ evaluation }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error("Error in evaluate-code function:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
