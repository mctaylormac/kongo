import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className = "", hover = false }: CardProps) {
  return (
    <div
      className={`bg-white/70 backdrop-blur-xl rounded-2xl border border-black/5 overflow-hidden transition-all duration-200 ${
        hover ? "hover:shadow-lg hover:border-black/10" : ""
      } ${className}`}
      style={{
        boxShadow: "0 0 0 0.5px rgba(0,0,0,0.03), 0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }: CardProps) {
  return <div className={`p-6 border-b border-black/5 ${className}`}>{children}</div>;
}

export function CardContent({ children, className = "" }: CardProps) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = "" }: CardProps) {
  return <h3 className={`text-[17px] font-semibold text-[#1D1D1F] ${className}`}>{children}</h3>;
}

export function CardDescription({ children, className = "" }: CardProps) {
  return <p className={`text-[13px] text-[#86868B] mt-1 ${className}`}>{children}</p>;
}
