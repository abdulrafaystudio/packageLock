
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, CheckCircle, AlertCircle, Loader2, FileText, RefreshCw, Plus, Wrench } from 'lucide-react';
import { processInvestorDataFromStorage } from '@/utils/processInvestorData';
import { cleanupInvestorData } from '@/utils/database/investorDataCleanup';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const ProcessInvestorData = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [processedCount, setProcessedCount] = useState<number | null>(null);
  const [cleanupResults, setCleanupResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastProcessedFile, setLastProcessedFile] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    const isCSV = fileName.endsWith('.csv');

    if (!isExcel && !isCSV) {
      setError('Please upload an Excel file (.xlsx, .xls) or CSV file (.csv).');
      toast({
        title: "Error",
        description: "Please upload an Excel file (.xlsx, .xls) or CSV file (.csv).",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const fileExtension = isExcel ? '.xlsx' : '.csv';
      const uploadFileName = `investors_${Date.now()}${fileExtension}`;
      
      const { error: uploadError } = await supabase.storage
        .from('investors')
        .upload(uploadFileName, file);

      if (uploadError) {
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }

      setUploadedFile(uploadFileName);
      toast({
        title: "Success!",
        description: `${isExcel ? 'Excel' : 'CSV'} file uploaded successfully. You can now process the data.`,
      });
    } catch (err: any) {
      console.error('Error uploading file:', err);
      setError(err.message || 'Failed to upload file');
      toast({
        title: "Upload Error",
        description: err.message || 'Failed to upload file',
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleProcessData = async () => {
    setIsProcessing(true);
    setError(null);
    setProcessedCount(null);

    try {
      console.log('Starting investor data processing...');
      const result = await processInvestorDataFromStorage();
      
      if (result && result.length > 0) {
        setProcessedCount(result.length);
        setLastProcessedFile(new Date().toLocaleString());
        toast({
          title: "Success!",
          description: `Successfully processed ${result.length} new investor profiles.`,
        });
      } else {
        setError('No new investor data was processed. All investors may already exist in the database.');
        toast({
          title: "Info",
          description: "No new investor data was processed. All investors may already exist in the database.",
          variant: "default",
        });
      }
    } catch (err: any) {
      console.error('Error processing investor data:', err);
      let errorMessage = 'An error occurred while processing the data';
      
      if (err.message?.includes('No files found')) {
        errorMessage = 'No files found in the investors storage bucket. Please upload a CSV file first using the upload button above.';
      } else if (err.message?.includes('No CSV files found')) {
        errorMessage = 'No CSV files found in the investors storage bucket. Please upload a CSV file with investor data.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDataCleanup = async () => {
    setIsCleaningUp(true);
    setError(null);
    setCleanupResults(null);

    try {
      console.log('Starting data cleanup...');
      const result = await cleanupInvestorData();
      
      if (result.success) {
        setCleanupResults(result);
        toast({
          title: "Cleanup Complete!",
          description: `${result.fixedCount} investors fixed, ${result.errorCount} errors encountered.`,
        });
      } else {
        setError(result.message);
        toast({
          title: "Cleanup Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error('Error during cleanup:', err);
      const errorMessage = err.message || 'An error occurred during data cleanup';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsCleaningUp(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Process Investor Data
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload Section */}
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
          <div className="text-center">
            <Plus className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Upload Excel or CSV File
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Upload an Excel (.xlsx, .xls) or CSV file with investor data
            </p>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
              disabled={isUploading}
            />
            <label htmlFor="file-upload">
              <Button
                variant="outline"
                disabled={isUploading}
                className="cursor-pointer"
                asChild
              >
                <span>
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Choose Excel/CSV File
                    </>
                  )}
                </span>
              </Button>
            </label>
          </div>
          {uploadedFile && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <p className="text-sm text-green-700 dark:text-green-300">
                  File uploaded: {uploadedFile}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p className="mb-2">This tool will:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Process uploaded Excel (.xlsx, .xls) or CSV files from the storage bucket</li>
            <li>Merge duplicate investor entries</li>
            <li>Create investor profiles in the database</li>
            <li>Skip investors that already exist (based on name)</li>
            <li>Display the new investor profiles on the Investors page</li>
          </ul>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="flex items-start gap-2">
            <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                File Requirements:
              </p>
              <ul className="text-blue-700 dark:text-blue-300 space-y-1">
                <li>• <strong>Excel files (.xlsx, .xls):</strong> Standard Excel format with data in the first sheet</li>
                <li>• <strong>CSV files (.csv):</strong> Comma-separated values format</li>
                <li>• Must include at least a name or company column</li>
                <li>• Supported columns: name, company_name, email, phone, location, website, etc.</li>
                <li>• The system will automatically map common column variations</li>
                <li>• Headers should be in the first row</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Data Cleanup Section */}
        <div className="border-t pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Wrench className="h-5 w-5 text-blue-600" />
            <h3 className="font-medium text-gray-900 dark:text-white">Data Quality Cleanup</h3>
          </div>
          
          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg mb-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                  Clean Up Data Issues:
                </p>
                <ul className="text-amber-700 dark:text-amber-300 space-y-1">
                  <li>• Fix corrupted investor names</li>
                  <li>• Clean mixed data in location fields</li>
                  <li>• Remove invalid contact information</li>
                  <li>• Correct misplaced email and phone data</li>
                </ul>
              </div>
            </div>
          </div>

          <Button 
            onClick={handleDataCleanup} 
            disabled={isCleaningUp}
            variant="outline"
            className="w-full"
          >
            {isCleaningUp ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Cleaning Up Data...
              </>
            ) : (
              <>
                <Wrench className="h-4 w-4 mr-2" />
                Clean Up Investor Data
              </>
            )}
          </Button>
        </div>

        <Button 
          onClick={handleProcessData} 
          disabled={isProcessing}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing CSV File...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Process Investor Data
            </>
          )}
        </Button>

        {processedCount !== null && (
          <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div className="text-green-700 dark:text-green-300">
              <p className="font-medium">Successfully processed {processedCount} new investor profiles!</p>
              {lastProcessedFile && (
                <p className="text-sm opacity-80">Processed at: {lastProcessedFile}</p>
              )}
              <p className="text-sm opacity-80 mt-1">
                Visit the <a href="/investors" className="underline font-medium">Investors page</a> to view the imported profiles.
              </p>
            </div>
          </div>
        )}

        {cleanupResults && (
          <div className="flex items-start gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-blue-700 dark:text-blue-300">
              <p className="font-medium">Data cleanup completed successfully!</p>
              <p className="text-sm opacity-80 mt-1">
                Fixed {cleanupResults.fixedCount} investors out of {cleanupResults.totalIssues} with issues.
              </p>
              {cleanupResults.errorCount > 0 && (
                <p className="text-sm opacity-80">
                  {cleanupResults.errorCount} errors encountered during cleanup.
                </p>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="text-red-700 dark:text-red-300">
              <p className="font-medium mb-1">Error:</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-2">
          <p>
            <strong>How to use:</strong> Upload a CSV file using the button above, then click "Process Investor Data" to import the data into your database.
          </p>
          <p>
            <strong>Troubleshooting:</strong> If you're getting "No files found" errors after uploading, 
            wait a moment and try processing again as file uploads may take a few seconds to appear.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProcessInvestorData;
