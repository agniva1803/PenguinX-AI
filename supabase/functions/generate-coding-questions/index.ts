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

    const { difficulty, topic, count = 1 } = await req.json();

    const allowedDiff = ['easy', 'medium', 'hard'];
    if (typeof difficulty !== 'string' || !allowedDiff.includes(difficulty)) {
      return new Response(JSON.stringify({ error: 'Invalid difficulty' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const safeTopic = typeof topic === 'string' ? topic.slice(0, 200) : '';
    const rawCount = Number(count);
    const safeCount = Number.isFinite(rawCount) ? Math.min(Math.max(Math.floor(rawCount), 1), 5) : 1;
    
    const difficultyGuide: Record<string, string> = {
      easy: `
- Simple array/string traversals, basic math operations
- Time complexity: O(n) or O(n log n)
- Examples: Two Sum, Valid Parentheses, Reverse String, Palindrome Check
- Should be solvable in 10-15 minutes`,
      medium: `
- Require understanding of data structures (hash maps, stacks, queues, trees)
- May need two-pointer, sliding window, or BFS/DFS techniques
- Time complexity challenges, often require O(n) when naive is O(n²)
- Examples: 3Sum, LRU Cache, Binary Tree Level Order, Longest Substring Without Repeating
- Should be solvable in 20-30 minutes`,
      hard: `
- Complex algorithmic problems requiring advanced techniques
- Dynamic Programming, Graph algorithms (Dijkstra, Bellman-Ford), Advanced Tree operations
- Segment Trees, Tries, Union-Find, Topological Sort
- Multiple constraints to optimize simultaneously
- Examples: Word Ladder II, Median of Two Sorted Arrays, Regular Expression Matching, Merge K Sorted Lists
- May require mathematical insights or non-obvious observations
- Should challenge experienced programmers, taking 30-45+ minutes`
    };
    
    const systemPrompt = `You are an expert coding interview question generator for FAANG-level interviews. Generate ${safeCount} coding problem(s) at STRICTLY ${difficulty.toUpperCase()} difficulty level.

DIFFICULTY REQUIREMENTS for ${difficulty.toUpperCase()}:
${difficultyGuide[difficulty] || difficultyGuide.medium}

${topic ? `TOPIC FOCUS: ${safeTopic}` : 'Cover common interview topics like arrays, strings, algorithms, and data structures.'}

CRITICAL RULES:
1. The difficulty MUST match "${difficulty}". Do NOT generate easier problems.
2. Use plain text only - NO LaTeX, NO math symbols like $, \\le, \\ge, \\sum. Write "less than or equal to" instead of \\le.
3. Use simple variable names like "n", "nums", "target" - avoid mathematical notation.
4. All JSON strings must be properly escaped. Use regular quotes and avoid special characters.

For each question, provide:
1. A unique ID (use format: q_<random_6_chars>)
2. Title (creative, descriptive name)
3. Difficulty level (MUST be "${difficulty}")
4. Problem description (clear, detailed, real-world context when possible)
5. Example inputs and outputs (2-3 examples with explanations)
6. Constraints (realistic bounds, use plain English like "n is between 1 and 10000")
7. Test cases (4-6 test cases including edge cases)
8. Hints (2-3 progressive hints)

Respond ONLY with valid JSON (no markdown code blocks):
{
  "questions": [
    {
      "id": "q_abc123",
      "title": "Problem Title",
      "difficulty": "${difficulty}",
      "description": "Detailed problem description...",
      "examples": [
        {"input": "example input", "output": "expected output", "explanation": "Why this is the answer"}
      ],
      "constraints": ["1 <= n <= 10000", "constraint 2"],
      "testCases": [
        {"input": {"param1": "value1"}, "expected": "expectedValue"}
      ],
      "hints": ["Hint 1", "Hint 2"]
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
          { role: "user", content: `Generate ${safeCount} ${difficulty} level coding question(s)${topic ? ` about ${safeTopic}` : ''}.` }
        ],
        max_tokens: 8192,
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
    console.log("AI Response length:", content.length);
    
    let questions;
    try {
      // Try multiple JSON extraction patterns
      let jsonString = content;
      
      // Pattern 1: JSON in code blocks
      const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        jsonString = codeBlockMatch[1];
      } else {
        // Pattern 2: Find JSON object directly
        const jsonObjectMatch = content.match(/\{[\s\S]*"questions"[\s\S]*\}/);
        if (jsonObjectMatch) {
          jsonString = jsonObjectMatch[0];
        }
      }
      
      // Clean up common issues before parsing
      jsonString = jsonString
        .trim()
        // Fix unescaped special characters in strings - replace $..$ math notation
        .replace(/\$([^$]+)\$/g, '$1')
        // Fix any unescaped backslashes that aren't valid escape sequences
        .replace(/\\(?!["\\/bfnrtu])/g, '\\\\');
      
      questions = JSON.parse(jsonString);
      console.log("Parsed questions count:", questions.questions?.length || 0);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Content preview:", content.substring(0, 500));
      
      // Fallback: try to extract any valid JSON array of questions
      try {
        const fallbackMatch = content.match(/"questions"\s*:\s*\[([\s\S]*?)\]/);
        if (fallbackMatch) {
          const cleanedArray = fallbackMatch[1]
            .replace(/\$([^$]+)\$/g, '$1')
            .replace(/\\(?!["\\/bfnrtu])/g, '\\\\');
          questions = { questions: JSON.parse(`[${cleanedArray}]`) };
          console.log("Fallback parsed questions count:", questions.questions?.length || 0);
        } else {
          questions = { questions: [] };
        }
      } catch {
        questions = { questions: [] };
      }
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
