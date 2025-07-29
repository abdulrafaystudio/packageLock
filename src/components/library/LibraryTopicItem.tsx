
import React from 'react';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface LibraryTopicItemProps {
  topic: {
    id: string;
    title: string;
    content: string;
  };
}

const LibraryTopicItem = ({ topic }: LibraryTopicItemProps) => {
  return (
    <AccordionItem 
      key={topic.id} 
      value={topic.id} 
      className="border border-gray-200 dark:border-gray-600 rounded-lg px-6 bg-white dark:bg-gray-700"
    >
      <AccordionTrigger className="text-lg font-semibold text-gray-900 dark:text-white text-left hover:no-underline data-[state=open]:text-gray-900 dark:data-[state=open]:text-white">
        {topic.title}
      </AccordionTrigger>
      <AccordionContent className="text-gray-600 dark:text-gray-300 leading-relaxed pb-4 whitespace-pre-line">
        {topic.content}
      </AccordionContent>
    </AccordionItem>
  );
};

export default LibraryTopicItem;
