// components/ui/RichTextEditor.tsx
"use client";

import React, { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";

// Dynamically import to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false }) as any;

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Write your article here...",
}) => {
  const quillRef = useRef<any>(null);

  // Add custom toolbar with table, image, link, and AI button placeholders
  const modules = {
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link", "image"],
        [{ script: "sub" }, { script: "super" }],
        ["blockquote", "code-block"],
        [{ align: [] }],
        ["clean"],
        // Custom buttons – placeholders for future AI and table features
        [{ "table": [] }],
      ],
      handlers: {
        // Placeholder handler for image upload – will trigger hidden file input
        image: function () {
          const input = document.createElement("input");
          input.setAttribute("type", "file");
          input.setAttribute("accept", "image/*");
          input.click();
          input.onchange = async () => {
            if (input.files && input.files[0]) {
              const file = input.files[0];
              const formData = new FormData();
              formData.append("file", file);
              const res = await fetch("/api/media/upload", {
                method: "POST",
                body: formData,
              });
              if (res.ok) {
                const { url } = await res.json();
                const range = quillRef.current?.getEditor()?.getSelection();
                quillRef.current?.getEditor()?.insertEmbed(range?.index ?? 0, "image", url);
              } else {
                alert("Image upload failed");
              }
            }
          };
        },
        // Future AI generation placeholder – no-op for now
        ai: () => {
          // Could hook into /api/ai/generate later
          alert("AI generation not implemented yet");
        },
      },
    },
  };

  // Ensure the editor updates when value prop changes externally
  useEffect(() => {
    if (quillRef.current && quillRef.current.getEditor().root.innerHTML !== value) {
      quillRef.current.getEditor().setContents(quillRef.current.getEditor().clipboard.convert(value));
    }
  }, [value]);

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-lg p-2">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        placeholder={placeholder}
        className="text-white"
      />
    </div>
  );
};
