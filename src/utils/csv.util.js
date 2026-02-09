/**
 * CSV Export Utility
 * Converts JSON data to CSV format for download
 * Dynamically extracts all fields from CSAT Response data
 */

/**
 * Flatten nested object with readable keys
 * @param {Object} obj - Object to flatten
 * @param {string} prefix - Key prefix
 * @returns {Object} Flattened object
 */
const flattenData = (obj, prefix = '') => {
  const result = {};

  if (!obj || typeof obj !== 'object') {
    return result;
  }

  for (const [key, value] of Object.entries(obj)) {
    // Skip internal/technical fields
    if (key.startsWith('_') || key === 'formVersion') continue;

    // Create readable key name
    const readableKey = prefix
      ? `${prefix} - ${formatKeyName(key)}`
      : formatKeyName(key);

    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      !(value instanceof Date)
    ) {
      // Recursively flatten nested objects
      Object.assign(result, flattenData(value, readableKey));
    } else if (typeof value === 'boolean') {
      // Convert boolean to Yes/No
      result[readableKey] = value ? 'Yes' : 'No';
    } else if (value !== null && value !== undefined) {
      result[readableKey] = value;
    }
  }

  return result;
};

/**
 * Convert camelCase/snake_case to Title Case
 */
const formatKeyName = key => {
  return key
    .replace(/([A-Z])/g, ' $1') // camelCase to spaces
    .replace(/_/g, ' ') // snake_case to spaces
    .replace(/\b\w/g, c => c.toUpperCase()) // capitalize first letter of each word
    .trim();
};

/**
 * Format CSAT Response for CSV export
 * Dynamically extracts all fields from the response
 * Normalizes data structure to handle both old and new response formats
 */
const formatCSATResponse = response => {
  const row = {};

  // Department Name (FIRST - for grouping)
  if (response.departmentId && typeof response.departmentId === 'object') {
    row['Department'] = response.departmentId.displayName || response.departmentId.name || '';
  }

  // Brand Name
  if (response.brandId && typeof response.brandId === 'object') {
    row['Brand Name'] = response.brandId.name || '';
  }

  // Client/POC Name and Phone
  if (response.clientId && typeof response.clientId === 'object') {
    row['POC Name'] = response.clientId.name || '';
    row['Phone'] = response.clientId.phone || '';
  }

  // SBU/POD and Leadership
  if (response.sbuId && typeof response.sbuId === 'object') {
    row['SBU/POD'] = response.sbuId.name || '';
    row['Executive VP'] = response.sbuId.executiveVP || '';
    row['Associate VP'] = response.sbuId.associateVP || '';
    row['Creative Director'] = response.sbuId.creativeDirector || '';
  }

  // Cycle Info
  if (response.cycleId && typeof response.cycleId === 'object') {
    row['Cycle'] =
      response.cycleId.name || `Cycle ${response.cycleId.cycleNumber}` || '';
    row['Year'] = response.cycleId.year || '';
  }

  // Response Date
  if (response.submittedAt) {
    const date = new Date(response.submittedAt);
    row['Response Date'] = date.toISOString().split('T')[0];
  }

  // CSAT and NPS calculated scores
  if (response.csat !== undefined) row['CSAT Score'] = response.csat;
  if (response.nps !== undefined) row['NPS Score'] = response.nps;

  // Dynamically extract ALL fields from the data object
  // First, normalize the data structure to handle both old and new formats
  if (response.data) {
    const normalizedData = normalizeResponseData(response.data);
    const flattenedData = flattenData(normalizedData);
    Object.assign(row, flattenedData);
  }

  // Comment/Feedback
  if (response.comment) {
    row['Comment'] = response.comment;
  }

  return row;
};

/**
 * Normalize response data to ensure consistent structure
 * Moves top-level metric fields into coreMetrics for consistency
 * This handles both old format (fields inside coreMetrics) and new format (fields at top level)
 */
const normalizeResponseData = (data) => {
  if (!data || typeof data !== 'object') return data;

  const normalized = { ...data };

  // Fields that may be at top level but should be normalized into coreMetrics
  const metricsToNormalize = [
    'seniorLeadershipInvolvement',
    'strategyExecution',
    'teamResponsiveness',
    'brandUnderstanding',
    'northStarMetrics',
  ];

  // Ensure coreMetrics object exists
  if (!normalized.coreMetrics) {
    normalized.coreMetrics = {};
  } else {
    normalized.coreMetrics = { ...normalized.coreMetrics };
  }

  // Move top-level metrics into coreMetrics (if not already there)
  metricsToNormalize.forEach(field => {
    // If field exists at top level and not in coreMetrics, move it
    if (normalized[field] !== undefined && normalized.coreMetrics[field] === undefined) {
      normalized.coreMetrics[field] = normalized[field];
      delete normalized[field];
    }
    // If field exists in coreMetrics, remove from top level to avoid duplication
    else if (normalized[field] !== undefined && normalized.coreMetrics[field] !== undefined) {
      delete normalized[field];
    }
  });

  return normalized;
};


/**
 * Convert array of objects to CSV string
 * @param {Array} data - Array of objects to convert
 * @returns {string} CSV string
 */
export const jsonToCsv = data => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return 'No data available';
  }

  // Format each response
  const formattedData = data.map(item => formatCSATResponse(item));

  // Get all unique headers from all rows
  const headersSet = new Set();
  formattedData.forEach(obj => {
    Object.keys(obj).forEach(key => headersSet.add(key));
  });

  // Define preferred column order for known fields
  const preferredOrder = [
    'Department',
    'Brand Name',
    'POC Name',
    'Phone',
    'SBU/POD',
    'Executive VP',
    'Associate VP',
    'Creative Director',
    'Cycle',
    'Year',
    'Response Date',
    'CSAT Score',
    'NPS Score',
  ];

  // Sort headers: preferred order first, then alphabetically
  const headers = Array.from(headersSet).sort((a, b) => {
    const aIndex = preferredOrder.indexOf(a);
    const bIndex = preferredOrder.indexOf(b);

    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;

    // For dynamic fields, sort alphabetically
    return a.localeCompare(b);
  });

  // Build CSV
  const csvRows = [];

  // Header row
  csvRows.push(headers.map(h => `"${h}"`).join(','));

  // Data rows
  for (const row of formattedData) {
    const values = headers.map(header => {
      let value = row[header];

      // Handle undefined/null
      if (value === undefined || value === null) {
        value = '';
      }

      // Convert to string
      value = String(value);

      // Escape quotes and wrap in quotes
      value = value.replace(/"/g, '""');

      return `"${value}"`;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
};

/**
 * Convert any array of objects to CSV string (generic, not CSAT-specific)
 * @param {Array} data - Array of objects to convert
 * @param {Object} options - Options for CSV generation
 * @param {Object} options.headerMap - Map of field names to display names
 * @returns {string} CSV string
 */
export const genericJsonToCsv = (data, options = {}) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return 'No data available';
  }

  const { headerMap = {} } = options;

  // Get all unique keys from all objects
  const keysSet = new Set();
  data.forEach(obj => {
    Object.keys(obj).forEach(key => {
      // Skip internal MongoDB fields
      if (!key.startsWith('_') || key === '_id') {
        keysSet.add(key);
      }
    });
  });

  const keys = Array.from(keysSet);

  // Create headers with display names
  const headers = keys.map(key => {
    if (headerMap[key]) return headerMap[key];
    // Convert camelCase to Title Case
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  });

  // Build CSV
  const csvRows = [];

  // Header row
  csvRows.push(headers.map(h => `"${h}"`).join(','));

  // Data rows
  for (const row of data) {
    const values = keys.map(key => {
      let value = row[key];

      // Handle undefined/null
      if (value === undefined || value === null) {
        value = '';
      }

      // Convert to string
      value = String(value);

      // Escape quotes and wrap in quotes
      value = value.replace(/"/g, '""');

      return `"${value}"`;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
};

/**
 * Send CSV response to client
 * @param {Response} res - Express response object
 * @param {Array} data - Data to export
 * @param {string} filename - Filename for download
 */
export const sendCsvResponse = (res, data, filename = 'export.csv') => {
  const csv = jsonToCsv(data);

  // Set headers for file download
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // Send CSV content
  return res.send(csv);
};

/**
 * Send aggregate/generic CSV response to client
 * @param {Response} res - Express response object
 * @param {Array} data - Data to export
 * @param {string} filename - Filename for download
 * @param {Object} options - Options for CSV generation
 */
export const sendAggregateCsvResponse = (res, data, filename = 'export.csv', options = {}) => {
  const csv = genericJsonToCsv(data, options);

  // Set headers for file download
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // Send CSV content
  return res.send(csv);
};

/**
 * Check if export=csv is requested
 * @param {Request} req - Express request object
 * @returns {boolean}
 */
export const isExportCsv = req => {
  return req.query.export === 'csv';
};

/**
 * Generate filename for export
 * @param {string} type - Export type (department, sbu, brand, etc.)
 * @param {string} identifier - Identifier (id or name)
 * @returns {string} Filename
 */
export const generateFilename = (type, identifier = '') => {
  const timestamp = new Date().toISOString().split('T')[0];
  const safeIdentifier = identifier
    .toString()
    .replace(/[^a-zA-Z0-9]/g, '_')
    .toLowerCase();
  return `csat_${type}_${safeIdentifier}_${timestamp}.csv`;
};

export default {
  jsonToCsv,
  genericJsonToCsv,
  sendCsvResponse,
  sendAggregateCsvResponse,
  isExportCsv,
  generateFilename,
};

/**
 * Format BI Export data with department grouping
 * Creates CSV with department headers followed by responses
 * Dynamically extracts all fields from each department's data structure
 * @param {Array} responses - Array of CSAT responses
 * @returns {string} CSV string with department grouping
 */
export const formatBIExportCsv = (responses) => {
  if (!responses || !Array.isArray(responses) || responses.length === 0) {
    return 'No data available';
  }

  // Group responses by department
  const departmentGroups = {};
  responses.forEach((response) => {
    const deptName = response.departmentId?.displayName || response.departmentId?.name || 'Unknown';
    if (!departmentGroups[deptName]) {
      departmentGroups[deptName] = [];
    }
    departmentGroups[deptName].push(response);
  });

  const csvRows = [];

  // Process each department
  Object.keys(departmentGroups).sort().forEach((deptName) => {
    const deptResponses = departmentGroups[deptName];

    // Analyze all responses in this department to get all possible fields
    const allFieldsSet = new Set();

    // Always include these base fields first
    const baseFields = ['Brand Name', 'POC Name', 'Overall Avg', 'NPS', 'Additional Comments'];
    baseFields.forEach(f => allFieldsSet.add(f));

    // Extract all unique fields from data objects
    deptResponses.forEach((response) => {
      if (response.data && typeof response.data === 'object') {
        extractAllFields(response.data, allFieldsSet);
      }
    });

    // Convert to array and sort (base fields first, then alphabetically)
    const headers = Array.from(allFieldsSet);
    const sortedHeaders = [
      ...baseFields,
      ...headers.filter(h => !baseFields.includes(h)).sort()
    ];

    // Add department header row
    csvRows.push(`"${deptName}"`);

    // Add column headers
    csvRows.push(sortedHeaders.map(h => `"${h}"`).join(','));

    // Add data rows for this department
    deptResponses.forEach((response) => {
      const row = [];

      sortedHeaders.forEach((header) => {
        let value = '';

        // Handle base fields
        if (header === 'Brand Name') {
          value = response.brandId?.name || '';
        } else if (header === 'POC Name') {
          value = response.clientId?.name || '';
        } else if (header === 'Overall Avg') {
          value = response.csat !== undefined ? response.csat : '';
        } else if (header === 'NPS') {
          value = response.nps !== undefined ? response.nps : '';
        } else if (header === 'Additional Comments') {
          value = response.data?.feedback?.additionalComments ||
            response.data?.additionalComments ||
            response.comment || '';
        } else {
          // Extract value from data object
          value = extractFieldValue(response.data, header);
        }

        row.push(value);
      });

      // Escape and wrap values
      const escapedRow = row.map(value => {
        let val = String(value !== null && value !== undefined ? value : '');
        val = val.replace(/"/g, '""');
        return `"${val}"`;
      });

      csvRows.push(escapedRow.join(','));
    });

    // Add empty row between departments
    csvRows.push('');
  });

  return csvRows.join('\n');
};

/**
 * Extract all field names from a nested object
 * @param {Object} obj - Object to extract fields from
 * @param {Set} fieldsSet - Set to store field names
 * @param {string} prefix - Prefix for nested fields
 */
const extractAllFields = (obj, fieldsSet, prefix = '') => {
  if (!obj || typeof obj !== 'object') return;

  for (const [key, value] of Object.entries(obj)) {
    // Skip internal fields and unwanted fields
    if (key.startsWith('_') ||
      key === 'formVersion' ||
      key === 'servicesCovered' ||
      key === 'services_covered' ||
      key === 'filledAt' ||
      key === 'filled_at' ||
      key === 'submittedAt' ||
      key === 'submitted_at') {
      continue;
    }

    // Create readable field name
    const fieldName = formatKeyName(key);

    // Skip if formatted name contains these terms
    if (fieldName.toLowerCase().includes('services covered') ||
      fieldName.toLowerCase().includes('filled at')) {
      continue;
    }

    if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      // For nested objects, flatten them
      extractAllFields(value, fieldsSet, fieldName);
    } else {
      // Add the field
      const fullFieldName = prefix ? `${prefix} - ${fieldName}` : fieldName;
      fieldsSet.add(fullFieldName);
    }
  }
};

/**
 * Extract field value from nested object by field name
 * @param {Object} obj - Object to extract from
 * @param {string} fieldName - Field name to find
 * @returns {any} Field value
 */
const extractFieldValue = (obj, fieldName) => {
  if (!obj || typeof obj !== 'object') return '';

  // Try direct match first
  for (const [key, value] of Object.entries(obj)) {
    const formattedKey = formatKeyName(key);

    if (formattedKey === fieldName) {
      if (typeof value === 'boolean') return value ? 'Yes' : 'No';
      if (value !== null && value !== undefined) return value;
      return '';
    }

    // Check nested objects
    if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      // Check if fieldName starts with this key (nested field)
      if (fieldName.startsWith(formattedKey + ' - ')) {
        const remainingFieldName = fieldName.substring(formattedKey.length + 3);
        return extractFieldValue(value, remainingFieldName);
      }
    }
  }

  return '';
};

/**
 * Send BI Export CSV response to client
 * @param {Response} res - Express response object
 * @param {Array} data - Data to export
 * @param {string} filename - Filename for download
 */
export const sendBIExportCsvResponse = (res, data, filename = 'bi_export.csv') => {
  const csv = formatBIExportCsv(data);

  // Set headers for file download
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // Send CSV content
  return res.send(csv);
};
