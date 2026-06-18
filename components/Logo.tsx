import Link from "next/link";
import Image from "next/image";

interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
}

export default function Logo({ width = 260, height, className = "" }: LogoProps) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center ${className}`}
      aria-label="Kleenkars"
    >
      <Image
        src="/logo.png"
        alt="Kleenkars"
        width={width}
        height={height || Math.round(width * 0.32)}
        priority={width > 150}
        className="h-auto max-w-full object-contain"
      />
    </Link>
  );
}
