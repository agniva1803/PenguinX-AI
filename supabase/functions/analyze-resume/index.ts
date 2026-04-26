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

    const { resumeText, targetRole } = await req.json();

    if (typeof resumeText !== 'string' || resumeText.length === 0 || resumeText.length > 50000) {
      return new Response(JSON.stringify({ error: 'Invalid resumeText (1-50000 chars required)' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const safeTargetRole = typeof targetRole === 'string' ? targetRole.slice(0, 200) : '';
    
    const systemPrompt = `You are an expert resume analyzer and career coach. Analyze the provided resume and provide detailed, actionable feedback.

Your analysis should include:
1. **Overall Score** (0-100): Rate the resume's effectiveness
2. **Strengths**: List 3-5 strong points of the resume
3. **Areas for Improvement**: List 3-5 specific areas that need work
4. **ATS Optimization**: Tips to pass Applicant Tracking Systems
5. **Keyword Suggestions**: Industry-relevant keywords to include
6. **Format Recommendations**: Layout and structure improvements
7. **Action Items**: Top 5 priority changes to make

${safeTargetRole ? `The candidate is targeting: ${safeTargetRole}. Tailor your feedback accordingly.` : ''}

Respond in JSON format with the following structure:
{
  "score": number,
  "strengths": string[],
  "improvements": string[],
  "atsOptimization": string[],
  "keywords": string[],
  "formatTips": string[],
  "actionItems": string[],
  "summary": string
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
          { role: "user", content: `Please analyze this resume:\n\n${resumeText}` }
        ],
        max_tokens: 2048,
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Try to parse JSON from the response
    let analysis;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;
      analysis = JSON.parse(jsonString);
    } catch {
      // If parsing fails, return structured response from raw content
      analysis = {
        score: 70,
        strengths: ["Resume submitted for analysis"],
        improvements: ["Please ensure your resume is in a readable format"],
        atsOptimization: ["Include relevant keywords"],
        keywords: [],
        formatTips: ["Use a clean, professional format"],
        actionItems: ["Resubmit with clearer formatting"],
        summary: content
      };
    }

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error("Error in analyze-resume function:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
