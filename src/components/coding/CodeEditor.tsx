import Editor from "@monaco-editor/react";
import { cn } from "@/lib/utils";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  className?: string;
  readOnly?: boolean;
}

const languageMap: Record<string, string> = {
  python: "python",
  javascript: "javascript",
  typescript: "typescript",
  java: "java",
  cpp: "cpp",
  c: "c",
  go: "go",
  rust: "rust",
};

export function CodeEditor({ 
  value, 
  onChange, 
  language, 
  className,
  readOnly = false 
}: CodeEditorProps) {
  return (
    <div className={cn("border border-border rounded-lg overflow-hidden", className)}>
      <Editor
        height="100%"
        language={languageMap[language] || "javascript"}
        value={value}
        onChange={(val) => onChange(val || "")}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: "on",
          readOnly,
          padding: { top: 16 },
        }}
      />
    </div>
  );
}
