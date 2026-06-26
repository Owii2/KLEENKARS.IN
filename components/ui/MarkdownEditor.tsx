// components/ui/MarkdownEditor.tsx
"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = "Write your article in markdown...",
}) => {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-lg p-2">
      <div className="flex justify-end mb-2 space-x-2">
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="text-sm text-blue-400 underline"
        >
          {showPreview ? "Edit" : "Preview"}
        </button>
      </div>
      {showPreview ? (
        <div className="prose prose-invert max-w-none">
          <ReactMarkdown>{value || placeholder}</ReactMarkdown>
        </div>
      ) : (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={10}
          className="w-full p-2 rounded bg-white/10 backdrop-blur-sm text-white focus:outline-none resize-vertical"
        />
      )}
    </div>
  );
};
