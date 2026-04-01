"use client";

import React from "react";

export default function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-transition">
      <style jsx global>{`
        @keyframes fadeInSlideUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .page-transition {
          animation: fadeInSlideUp 0.2s ease-out forwards;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
        }
      `}</style>
      {children}
    </div>
  );
}
