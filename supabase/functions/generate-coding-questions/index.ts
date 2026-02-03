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
    
    const systemPrompt = `You are an expert coding interview question generator for FAANG-level interviews. Generate ${count} coding problem(s) at STRICTLY ${difficulty.toUpperCase()} difficulty level.

DIFFICULTY REQUIREMENTS for ${difficulty.toUpperCase()}:
${difficultyGuide[difficulty] || difficultyGuide.medium}

${topic ? `TOPIC FOCUS: ${topic}` : 'Cover common interview topics like arrays, strings, algorithms, and data structures.'}

CRITICAL: The difficulty MUST match "${difficulty}". Do NOT generate easier problems. Each problem must be appropriately challenging for the specified level.

For each question, provide:
1. A unique ID (use format: q_<random_6_chars>)
2. Title (creative, descriptive name)
3. Difficulty level (MUST be "${difficulty}")
4. Problem description (clear, detailed, real-world context when possible)
5. Example inputs and outputs (2-3 examples with explanations)
6. Constraints (realistic bounds)
7. Test cases (4-6 test cases including edge cases)
8. Hints (2-3 progressive hints)

Respond in JSON format:
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
      "constraints": ["constraint 1", "constraint 2"],
      "testCases": [
        {"input": {"param1": value1}, "expected": expectedValue}
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
