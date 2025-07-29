
import { useEffect, useState } from 'react';

export const useLibraryAccordion = (selectedTopic?: string | null) => {
  const [openValue, setOpenValue] = useState<string>('');

  useEffect(() => {
    if (selectedTopic) {
      setOpenValue(selectedTopic);
      // Scroll to top when redirected with a specific topic
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedTopic]);

  return {
    openValue,
    setOpenValue
  };
};
