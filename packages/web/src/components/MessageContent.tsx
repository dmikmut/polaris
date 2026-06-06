import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { stripStructuredBlocks } from "../lib/formatMessage";

interface MessageContentProps {
  content: string;
  markdown?: boolean;
}

export function MessageContent({ content, markdown = true }: MessageContentProps) {
  const text = markdown ? stripStructuredBlocks(content) : content;

  if (!text) {
    return <p className="message-empty">No additional details.</p>;
  }

  if (!markdown) {
    return <div className="message-content">{text}</div>;
  }

  return (
    <div className="message-content markdown-body">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </div>
  );
}
