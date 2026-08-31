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
        image: () => {
          const input = document.createElement("input");
          input.setAttribute("type", "file");
          input.setAttribute("accept", "image/*");
          input.click();
          input.onchange = async () => {
            const file = input.files ? input.files[0] : null;
            if (file) {
              const formData = new FormData();
              formData.append("file", file);
              const res = await fetch("/api/media/upload", {
                method: "POST",
                body: formData,
              });
              const data = await res.json();
              if (data.url && quillRef.current) {
                const quill = quillRef.current.getEditor();
                const range = quill.getSelection();
                quill.insertEmbed(range.index, "image", data.url);
              }
            }
          };
        },
      },
    },
  };

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "bullet",
    "link",
    "image",
    "script",
    "blockquote",
    "code-block",
    "align",
  ];

  return (
    <div className="rich-text-editor text-white">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        modules={modules}
        formats={formats}
        className="bg-black/40 border border-white/10 rounded-xl"
      />
    </div>
  );
};
