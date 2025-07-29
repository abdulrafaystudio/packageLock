
import React from 'react';
import { ArrowLeft, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Deal } from '@/hooks/useDeals';

interface CompanyProfileHeaderProps {
  deal: Deal;
}

const CompanyProfileHeader = ({ deal }: CompanyProfileHeaderProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleShare = async () => {
    const currentUrl = window.location.href;
    const shareData = {
      title: deal?.title || 'Company Profile',
      text: `Check out this business opportunity: ${deal?.title || 'Company Profile'}`,
      url: currentUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(currentUrl);
        toast({
          title: "Link Copied!",
          description: "The profile link has been copied to your clipboard.",
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(currentUrl);
        toast({
          title: "Link Copied!",
          description: "The profile link has been copied to your clipboard.",
        });
      } catch (clipboardError) {
        toast({
          title: "Share Failed",
          description: "Unable to share or copy the link.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="flex items-center justify-between mb-8">
      <Button 
        variant="ghost" 
        onClick={() => navigate('/companies')} 
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Companies
      </Button>
      <Button 
        variant="outline" 
        onClick={handleShare}
        className="flex items-center gap-2 bg-violet-500 hover:bg-violet-600 text-white border-violet-500 hover:border-violet-600 hover:!text-white"
      >
        <Share2 className="h-4 w-4" />
        Share
      </Button>
    </div>
  );
};

export default CompanyProfileHeader;
