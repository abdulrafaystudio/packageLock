
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AdminControlsProps {
  selectedPackage?: string;
  onPackageChange?: (value: string) => void;
  onDownloadAll?: () => void;
  onDownloadFiltered?: () => void;
}

const AdminControls: React.FC<AdminControlsProps> = ({
  selectedPackage = 'all',
  onPackageChange,
  onDownloadAll,
  onDownloadFiltered
}) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAddAdmin = async () => {
    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('add_admin_by_email', {
        user_email: email.trim()
      });

      if (error) throw error;

      if (data) {
        toast({
          title: "Success",
          description: `${email} has been added as an admin`,
        });
        setEmail('');
      } else {
        toast({
          title: "Error",
          description: "User not found or already an admin",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add admin",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mb-6 bg-white dark:bg-gray-800 border-purple-300">
      <CardHeader>
        <CardTitle>Admin Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter email to make admin"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddAdmin()}
          />
          <Button onClick={handleAddAdmin} disabled={isLoading}>
            {isLoading ? 'Adding...' : 'Add Admin'}
          </Button>
        </div>

        {onPackageChange && (
          <div className="flex gap-4 items-center">
            <Select value={selectedPackage} onValueChange={onPackageChange}>
              <SelectTrigger className="w-48 bg-white border-purple-300">
                <SelectValue placeholder="Filter by package" />
              </SelectTrigger>
              <SelectContent className="bg-white border-purple-300">
                <SelectItem value="all">All Packages</SelectItem>
                <SelectItem value="free">Free (Companies)</SelectItem>
                <SelectItem value="freepro">Free Pro (Brokers)</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="premiumpro">Premium Pro</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>

            {onDownloadAll && (
              <Button onClick={onDownloadAll} variant="outline" className="bg-white hover:bg-gray-50 text-gray-900 border-gray-300">
                Download All Users
              </Button>
            )}

            {onDownloadFiltered && selectedPackage !== 'all' && (
              <Button onClick={onDownloadFiltered} variant="outline" className="bg-white hover:bg-gray-50 text-gray-900 border-gray-300">
                Download {selectedPackage} Users
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminControls;
