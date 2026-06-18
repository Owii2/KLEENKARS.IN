import React from "react";

interface ButtonProps {

  children: React.ReactNode;

  onClick?: () => void;

  className?: string;

  type?: "button" | "submit";

  disabled?: boolean;

}

export default function Button({

  children,

  onClick,

  className = "",

  type = "button",

  disabled = false,

}: ButtonProps) {

  return (

    <button

      type={type}

      onClick={onClick}

      disabled={disabled}

      className={`

        bg-red-600
        hover:bg-red-700
        disabled:bg-gray-700
        disabled:cursor-not-allowed

        transition
        duration-200

        px-6
        py-3

        rounded-xl

        font-bold

        text-white

        ${className}

      `}

    >

      {children}

    </button>

  );

}