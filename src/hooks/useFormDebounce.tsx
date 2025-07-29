
import { useState, useCallback } from 'react';

interface UseFormDebounceOptions {
  delay?: number;
  onSubmit: (data: any) => Promise<void>;
}

export const useFormDebounce = ({ onSubmit }: UseFormDebounceOptions) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const debouncedSubmit = useCallback(async (data: any) => {
    if (isSubmitting) {
      return; // Prevent double submission while already submitting
    }

    setIsSubmitting(true);

    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  }, [onSubmit, isSubmitting]);

  const reset = useCallback(() => {
    setIsSubmitting(false);
  }, []);

  return {
    isSubmitting,
    debouncedSubmit,
    reset,
    canSubmit: !isSubmitting
  };
};
