
import * as XLSX from 'xlsx';

export const parseExcelData = (fileBuffer: ArrayBuffer) => {
  console.log('Parsing Excel file, buffer size:', fileBuffer.byteLength);

  if (fileBuffer.byteLength === 0) {
    throw new Error('The uploaded Excel file appears to be empty. Please check your file and upload again.');
  }

  try {
    // Read the workbook
    const workbook = XLSX.read(fileBuffer, { type: 'array' });
    
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('The Excel file contains no worksheets. Please check your file format.');
    }

    // Get the first worksheet
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    console.log('Processing worksheet:', firstSheetName);

    // Convert to JSON array
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1, // Use array of arrays format
      defval: '', // Default value for empty cells
      raw: false // Convert everything to strings
    });

    if (!jsonData || jsonData.length === 0) {
      throw new Error('The Excel worksheet appears to be empty. Please ensure your file has data.');
    }

    if (jsonData.length === 1) {
      throw new Error('The Excel file only contains headers. Please ensure your file has data rows.');
    }

    // Extract headers and data
    const headers = jsonData[0] as string[];
    const dataRows = jsonData.slice(1) as string[][];

    console.log('Excel headers found:', headers);
    console.log('Number of data rows:', dataRows.length);

    // Validate headers
    const possibleNameColumns = headers.filter(header => {
      const lowerHeader = header.toLowerCase();
      return lowerHeader.includes('name') || 
             lowerHeader.includes('company') || 
             lowerHeader.includes('firm') || 
             lowerHeader.includes('organization') ||
             lowerHeader.includes('entity') ||
             lowerHeader.includes('fund');
    });

    console.log('Possible name columns found:', possibleNameColumns);

    if (possibleNameColumns.length === 0) {
      console.warn('No obvious name columns found. Will attempt to use first column with data.');
    }

    // Convert to the same format as CSV parser
    const lines = [
      headers.join(','), // Header line
      ...dataRows.map(row => 
        row.map(cell => {
          // Handle cells with commas by wrapping in quotes
          const cellValue = String(cell || '').trim();
          return cellValue.includes(',') ? `"${cellValue}"` : cellValue;
        }).join(',')
      )
    ];

    return { lines, headers };

  } catch (error: any) {
    console.error('Error parsing Excel file:', error);
    if (error.message.includes('Unsupported file')) {
      throw new Error('Unsupported Excel file format. Please use .xlsx or .xls files.');
    }
    throw new Error(`Failed to parse Excel file: ${error.message}`);
  }
};
