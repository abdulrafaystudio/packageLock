
import { parseCSVLine, parseCSVData } from '@/utils/csv/csvParser';
import { parseExcelData } from '@/utils/excel/excelParser';
import { mergeInvestorRows, mapToInvestorProfile, extractInvestorName } from '@/utils/investor/investorDataMapper';
import { getFilesFromStorage, downloadFile } from '@/utils/storage/storageOperations';
import { saveInvestorsToDatabase } from '@/utils/database/investorDatabase';

interface RawInvestorData {
  [key: string]: any;
}

export const processInvestorDataFromStorage = async () => {
  try {
    console.log('Starting investor data processing...');
    
    // Get file from storage (Excel or CSV)
    const targetFile = await getFilesFromStorage();
    
    // Download and parse the file
    const { data, isExcel } = await downloadFile(targetFile.name);
    
    let lines: string[];
    let headers: string[];

    if (isExcel) {
      console.log('Processing Excel file...');
      const { lines: excelLines, headers: excelHeaders } = parseExcelData(data as ArrayBuffer);
      lines = excelLines;
      headers = excelHeaders;
    } else {
      console.log('Processing CSV file...');
      const { lines: csvLines, headers: csvHeaders } = parseCSVData(data as string);
      lines = csvLines;
      headers = csvHeaders;
    }

    // Process data rows
    const rawData: RawInvestorData[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = parseCSVLine(line);
      const row: RawInvestorData = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      // Only add if we have data in at least one of the first few columns
      const hasData = headers.slice(0, 3).some(header => row[header] && row[header].trim());
      if (hasData) {
        rawData.push(row);
      }
    }

    console.log('Parsed raw data:', rawData.length, 'rows');

    if (rawData.length === 0) {
      throw new Error('No valid data rows found in the file. Please check that your file contains data and is properly formatted.');
    }

    // Group by investor name to handle duplicates
    const investorGroups = new Map<string, RawInvestorData[]>();
    
    rawData.forEach(row => {
      const investorName = extractInvestorName(row);
      
      if (investorName) {
        if (!investorGroups.has(investorName)) {
          investorGroups.set(investorName, []);
        }
        const group = investorGroups.get(investorName);
        if (group) {
          group.push(row);
        }
      }
    });

    console.log('Grouped investors:', investorGroups.size, 'unique investors');

    if (investorGroups.size === 0) {
      throw new Error('No valid investor names found in the file. Please ensure your file has proper name columns with data.');
    }

    // Process each group and create investor profiles
    const investorsToInsert = [];
    
    for (const [investorName, rows] of investorGroups) {
      console.log('Processing investor:', investorName, 'with', rows.length, 'rows');
      
      // Merge data from all rows for this investor
      const mergedData = mergeInvestorRows(rows);
      
      // Map to our database structure
      const investorProfile = mapToInvestorProfile(investorName, mergedData);
      
      if (investorProfile) {
        investorsToInsert.push(investorProfile);
      }
    }

    // Save to database
    const result = await saveInvestorsToDatabase(investorsToInsert);
    return result;

  } catch (error) {
    console.error('Error processing investor data:', error);
    throw error;
  }
};
