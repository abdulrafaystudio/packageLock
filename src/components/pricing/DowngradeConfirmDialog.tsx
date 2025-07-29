import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DowngradeConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  planName: string;
  currentPlan: string;
}

const DowngradeConfirmDialog = ({
  open,
  onOpenChange,
  onConfirm,
  planName,
  currentPlan
}: DowngradeConfirmDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="animate-scale-in max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-foreground text-center">
            Confirm Plan Downgrade
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground text-center">
            You are about to downgrade from <span className="font-semibold text-foreground">{currentPlan}</span> to <span className="font-semibold text-foreground">{planName}</span>.
            <br /><br />
            <strong>Important:</strong> You will continue to have access to your current {currentPlan} plan features until your subscription period ends. After that, you will only have access to the features included in the {planName} plan.
            <br /><br />
            Are you sure you want to proceed with this downgrade?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center gap-3">
          <AlertDialogCancel className="hover-scale">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground hover-scale"
          >
            Yes, Downgrade
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DowngradeConfirmDialog;