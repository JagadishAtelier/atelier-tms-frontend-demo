import React from "react";

interface LinkifyProps {
    text?: string;
    className?: string;
}

export function Linkify({ text, className }: LinkifyProps) {
    if (!text) return <span className={className}>—</span>;

    // Regex to find URLs (http/https/www)
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;

    const parts = text.split(urlRegex).filter(part => part);

    return (
        <span className={className}>
            {parts.map((part, i) => {
                if (!part) return null;
                if (part.match(urlRegex)) {
                    const href = part.startsWith("www.") ? `http://${part}` : part;
                    return (
                        <a
                            key={i}
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                            onClick={(e) => e.stopPropagation()} // Prevent card click
                        >
                            {part}
                        </a>
                    );
                }
                return <span key={i}>{part}</span>;
            })}
        </span>
    );
}
