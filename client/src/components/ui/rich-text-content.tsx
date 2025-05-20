import { FC } from 'react';
import { cn } from '@/lib/utils';

interface RichTextContentProps {
  content: string;
  className?: string;
}

export const RichTextContent: FC<RichTextContentProps> = ({ content, className }) => {
  // Check if content appears to already be HTML (contains HTML tags)
  const isHtml = content && (
    content.includes('<p>') || 
    content.includes('<h') || 
    content.includes('<ul>') || 
    content.includes('<ol>') || 
    content.includes('<div') ||
    content.includes('<br')
  );

  // Handle undefined or null content
  if (!content) {
    return <div className={cn('prose prose-sm max-w-none', className)}></div>;
  }

  // If it's HTML, render with dangerouslySetInnerHTML
  // If it's plain text, format paragraphs properly
  if (isHtml) {
    return (
      <div 
        className={cn('prose prose-sm max-w-none', className)}
        dangerouslySetInnerHTML={{ __html: content }} 
      />
    );
  } else {
    // For plain text, split by newlines and render as paragraphs
    return (
      <div className={cn('prose prose-sm max-w-none', className)}>
        {content.split('\n').map((paragraph, index) => (
          paragraph ? <p key={index}>{paragraph}</p> : <br key={index} />
        ))}
      </div>
    );
  }
};