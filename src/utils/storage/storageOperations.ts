
import { supabase } from '@/integrations/supabase/client';

export const getFilesFromStorage = async () => {
  console.log('Fetching investor data from storage...');
  
  // List files in the investors bucket with more detailed logging
  const { data: files, error: listError } = await supabase.storage
    .from('investors')
    .list('', {
      limit: 100,
      offset: 0,
      sortBy: { column: 'name', order: 'asc' }
    });

  console.log('Storage list response:', { files, error: listError });

  if (listError) {
    console.error('Error listing files:', listError);
    throw new Error(`Failed to access storage bucket: ${listError.message}`);
  }

  if (!files || files.length === 0) {
    console.log('No files found in investors bucket');
    throw new Error('No files found in the investors storage bucket. Please upload an Excel or CSV file with investor data first.');
  }

  console.log('Found files:', files);

  // Filter for Excel and CSV files
  const supportedFiles = files.filter(file => {
    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    const isCSV = fileName.endsWith('.csv');
    const isNotSystemFile = !fileName.startsWith('.') && fileName !== '.emptyfolderplaceholder';
    const hasContent = file.name && file.name.trim() !== '';
    
    console.log(`File: ${file.name}, isExcel: ${isExcel}, isCSV: ${isCSV}, isNotSystemFile: ${isNotSystemFile}, hasContent: ${hasContent}`);
    
    return (isExcel || isCSV) && isNotSystemFile && hasContent;
  });

  console.log('Filtered supported files:', supportedFiles);

  if (supportedFiles.length === 0) {
    throw new Error('No Excel or CSV files found in the investors storage bucket. Please ensure your file has a .xlsx, .xls, or .csv extension.');
  }

  // Get the most recent file (or first one if sorting doesn't work)
  const targetFile = supportedFiles.sort((a, b) => {
    return new Date(b.created_at || b.updated_at || 0).getTime() - new Date(a.created_at || a.updated_at || 0).getTime();
  })[0];
  
  return targetFile;
};

export const downloadFile = async (fileName: string): Promise<{ data: string | ArrayBuffer; isExcel: boolean }> => {
  console.log('Processing file:', fileName);

  const isExcel = fileName.toLowerCase().endsWith('.xlsx') || fileName.toLowerCase().endsWith('.xls');

  // Download the file
  const { data: fileData, error: downloadError } = await supabase.storage
    .from('investors')
    .download(fileName);

  if (downloadError) {
    console.error('Error downloading file:', downloadError);
    throw new Error(`Failed to download file ${fileName}: ${downloadError.message}`);
  }

  console.log('File downloaded successfully, size:', fileData.size);

  if (isExcel) {
    // For Excel files, we need to return the ArrayBuffer
    const buffer = await fileData.arrayBuffer();
    return { data: buffer, isExcel: true };
  } else {
    // For CSV files, convert blob to text
    const text = await fileData.text();
    return { data: text, isExcel: false };
  }
};

// Legacy function for backward compatibility
export const getCSVFilesFromStorage = getFilesFromStorage;
export const downloadCSVFile = async (fileName: string): Promise<string> => {
  const result = await downloadFile(fileName);
  if (result.isExcel) {
    throw new Error('This function only supports CSV files. Use downloadFile for Excel support.');
  }
  return result.data as string;
};
