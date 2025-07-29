
import React from 'react';
import { Accordion } from '@/components/ui/accordion';
import { libraryTopics } from '@/data/libraryTopics';
import { useLibraryAccordion } from '@/hooks/useLibraryAccordion';
import LibraryTopicItem from './LibraryTopicItem';

interface LibraryContentProps {
  selectedTopic?: string | null;
}

const LibraryContent = ({ selectedTopic }: LibraryContentProps) => {
  const { openValue, setOpenValue } = useLibraryAccordion(selectedTopic);

  // Reorder topics to show selected topic first
  const orderedTopics = React.useMemo(() => {
    if (!selectedTopic) return libraryTopics;
    
    const selectedTopicData = libraryTopics.find(topic => topic.id === selectedTopic);
    const otherTopics = libraryTopics.filter(topic => topic.id !== selectedTopic);
    
    return selectedTopicData ? [selectedTopicData, ...otherTopics] : libraryTopics;
  }, [selectedTopic]);

  return (
    <div className="max-w-4xl mx-auto">
      <Accordion 
        type="single" 
        collapsible 
        className="space-y-4" 
        value={openValue}
        onValueChange={setOpenValue}
      >
        {orderedTopics.map((topic) => (
          <LibraryTopicItem key={topic.id} topic={topic} />
        ))}
      </Accordion>
    </div>
  );
};

export default LibraryContent;
