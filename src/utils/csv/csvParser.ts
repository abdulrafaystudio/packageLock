
export const parseCSVLine = (line: string): string[] => {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current.trim());
  return values;
};

export const parseCSVData = (text: string) => {
  console.log('File content preview (first 500 chars):', text.substring(0, 500));
  console.log('File content length:', text.length);

  if (!text.trim()) {
    throw new Error('The uploaded file appears to be empty. Please check your CSV file and upload again.');
  }

  // Parse CSV data - improved parsing
  const lines = text.split(/\r?\n/).filter(line => line.trim());
  console.log('Total lines found:', lines.length);
  
  if (lines.length === 0) {
    throw new Error('The uploaded file appears to be empty or contains no readable content.');
  }

  if (lines.length === 1) {
    throw new Error('The uploaded file only contains headers. Please ensure your CSV file has data rows.');
  }

  // Get headers from first line
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);
  console.log('Headers found:', headers);
  console.log('Number of columns detected:', headers.length);

  // Enhanced validation - look for any column that could contain a name
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

  // Log header mapping suggestions
  console.log('=== COLUMN MAPPING SUGGESTIONS ===');
  headers.forEach((header, index) => {
    console.log(`Column ${index + 1}: "${header}" - Possible field: ${suggestFieldMapping(header)}`);
  });

  return { lines, headers };
};

// Helper function to suggest field mappings for debugging
const suggestFieldMapping = (columnName: string): string => {
  const lower = columnName.toLowerCase();
  
  if (lower.includes('name') || lower.includes('company') || lower.includes('firm')) {
    return 'name/company_name';
  } else if (lower.includes('description') || lower.includes('about') || lower.includes('overview')) {
    return 'description';
  } else if (lower.includes('type') || lower.includes('category')) {
    return 'type';
  } else if (lower.includes('location') || lower.includes('address') || lower.includes('city')) {
    return 'location';
  } else if (lower.includes('website') || lower.includes('url')) {
    return 'website';
  } else if (lower.includes('email')) {
    return 'email';
  } else if (lower.includes('phone')) {
    return 'phone';
  } else if (lower.includes('founded') || lower.includes('year')) {
    return 'founded_year';
  } else if (lower.includes('industry') || lower.includes('sector')) {
    return 'preferred_industries';
  } else if (lower.includes('geography') || lower.includes('region')) {
    return 'preferred_geography';
  } else if (lower.includes('investment') && lower.includes('min')) {
    return 'min_investment_amount';
  } else if (lower.includes('investment') && lower.includes('max')) {
    return 'max_investment_amount';
  }
  
  return 'unknown - will be ignored';
};
