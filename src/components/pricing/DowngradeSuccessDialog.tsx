import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DowngradeSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planName: string;
  effectiveDate: string;
  isError?: boolean;
  errorMessage?: string;
}

const DowngradeSuccessDialog = ({
  open,
  onOpenChange,
  planName,
  effectiveDate,
  isError = false,
  errorMessage
}: DowngradeSuccessDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="animate-scale-in max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-foreground text-center">
            {isError ? 'Downgrade Failed' : 'Downgrade Scheduled'}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground text-center">
            {isError ? (
              errorMessage || 'Failed to process downgrade. Please try again or contact support.'
            ) : (
              <>
                Your downgrade to <span className="font-semibold text-foreground">{planName}</span> plan has been scheduled for <span className="font-semibold text-foreground">{effectiveDate}</span>.
                <br /><br />
                You'll continue to have access to your current plan features until then.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center">
          <AlertDialogAction 
            onClick={() => onOpenChange(false)}
            className="hover-scale bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            OK
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DowngradeSuccessDialog;