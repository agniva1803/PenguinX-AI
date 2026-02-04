import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      throw new Error("No file provided");
    }

    const fileName = file.name.toLowerCase();
    let extractedText = "";

    if (fileName.endsWith('.txt')) {
      extractedText = await file.text();
    } else if (fileName.endsWith('.pdf')) {
      const arrayBuffer = await file.arrayBuffer();
      const base64 = base64Encode(arrayBuffer);
      
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { 
              role: "user", 
              content: [
                {
                  type: "text",
                  text: "Extract ALL text content from this PDF resume. Return ONLY the raw text content, preserving the structure and formatting as much as possible. Do not add any commentary or explanations."
                },
                {
                  type: "file",
                  file: {
                    filename: file.name,
                    file_data: `data:application/pdf;base64,${base64}`
                  }
                }
              ]
            }
          ],
          max_tokens: 8192,
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI extraction failed: ${response.status}`);
      }

      const data = await response.json();
      extractedText = data.choices[0].message.content;
    } else if (fileName.endsWith('.docx')) {
      const arrayBuffer = await file.arrayBuffer();
      const base64 = base64Encode(arrayBuffer);
      
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { 
              role: "user", 
              content: [
                {
                  type: "text",
                  text: "Extract ALL text content from this Word document resume. Return ONLY the raw text content, preserving the structure and formatting as much as possible. Do not add any commentary or explanations."
                },
                {
                  type: "file",
                  file: {
                    filename: file.name,
                    file_data: `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${base64}`
                  }
                }
              ]
            }
          ],
          max_tokens: 8192,
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI extraction failed: ${response.status}`);
      }

      const data = await response.json();
      extractedText = data.choices[0].message.content;
    } else {
      throw new Error("Unsupported file format. Please upload PDF, DOCX, or TXT files.");
    }

    return new Response(JSON.stringify({ text: extractedText.trim() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error("Error in parse-resume function:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
