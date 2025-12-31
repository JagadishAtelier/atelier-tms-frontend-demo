import React from "react";

/**
 * Simple fullscreen loading overlay using a public asset:
 * Put your GIF at `public/loading_bg.gif`
 */
export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60">
      <img
        src="/loading_bg.gif"
        alt="Loading..."
        className="w-40 h-40 object-contain"
      />
    </div>
  );
}
