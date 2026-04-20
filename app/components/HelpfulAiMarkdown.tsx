"use client";

import type { ComponentProps } from "react";
import Markdown from "react-markdown";

type MdComponents = NonNullable<ComponentProps<typeof Markdown>["components"]>;

const components: MdComponents = {
  p: ({ children }) => <p style={{ margin: "0 0 8px", lineHeight: 1.7 }}>{children}</p>,
  strong: ({ children }) => <strong style={{ fontWeight: 800 }}>{children}</strong>,
  em: ({ children }) => <em style={{ fontStyle: "italic" }}>{children}</em>,
  ul: ({ children }) => (
    <ul style={{ margin: "6px 0 10px", paddingLeft: "1.25em", lineHeight: 1.65 }}>{children}</ul>
  ),
  ol: ({ children }) => (
    <ol style={{ margin: "6px 0 10px", paddingLeft: "1.25em", lineHeight: 1.65 }}>{children}</ol>
  ),
  li: ({ children }) => <li style={{ marginBottom: "4px" }}>{children}</li>,
  h1: ({ children }) => (
    <p style={{ margin: "10px 0 6px", fontSize: "15px", fontWeight: 800 }}>{children}</p>
  ),
  h2: ({ children }) => (
    <p style={{ margin: "10px 0 6px", fontSize: "14px", fontWeight: 800 }}>{children}</p>
  ),
  h3: ({ children }) => (
    <p style={{ margin: "8px 0 4px", fontSize: "14px", fontWeight: 700 }}>{children}</p>
  ),
  pre: ({ children }) => (
    <pre
      style={{
        margin: "8px 0",
        padding: "10px 12px",
        borderRadius: "12px",
        backgroundColor: "rgba(0,0,0,0.06)",
        fontSize: "13px",
        lineHeight: 1.6,
        overflowX: "auto",
      }}
    >
      {children}
    </pre>
  ),
  code: ({ className, children }) => (
    <code
      className={className}
      style={
        className
          ? { fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: "13px" }
          : {
              fontSize: "0.92em",
              backgroundColor: "rgba(0,0,0,0.06)",
              padding: "1px 5px",
              borderRadius: "6px",
            }
      }
    >
      {children}
    </code>
  ),
};

export default function HelpfulAiMarkdown({ text }: { text: string }) {
  return <Markdown components={components}>{text}</Markdown>;
}
