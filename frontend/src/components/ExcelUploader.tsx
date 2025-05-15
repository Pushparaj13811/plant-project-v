import { useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface ExcelUploaderProps {
  onDataParsed: (data: Array<Record<string, unknown>>) => void;
  templateFields: string[];
  isProcessing: boolean;
  uploadSuccess?: boolean;
  uploadStats?: {
    total: number;
    success: number;
    failed: number;
    errors?: string[];
  };
}

interface ExcelRow {
  [key: string]: unknown;
}

const ExcelUploader = ({ 
  onDataParsed, 
  templateFields, 
  isProcessing, 
  uploadSuccess,
  uploadStats 
}: ExcelUploaderProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<unknown[][] | null>(null);
  const [mappedFields, setMappedFields] = useState<Record<string, string>>({});
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParseError(null);
    setPreviewData(null);
    
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      parseExcel(e.target.files[0]);
    }
  };

  const parseExcel = async (file: File) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      
      // Get the first worksheet
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length < 2) {
        setParseError('Excel file must contain at least a header row and one data row');
        return;
      }

      // Extract headers (first row)
      const headers = jsonData[0] as string[];
      setAvailableColumns(headers);
      
      // Create a preview with a few rows
      const preview = jsonData.slice(1, Math.min(6, jsonData.length)) as unknown[][];
      setPreviewData(preview);

      // Auto-map fields based on name similarity
      const initialMapping: Record<string, string> = {};
      templateFields.forEach(field => {
        // Try to find exact match first
        const exactMatch = headers.find(header => 
          header.toLowerCase() === field.toLowerCase()
        );
        
        if (exactMatch) {
          initialMapping[field] = exactMatch;
        } else {
          // Try to find partial match
          const partialMatch = headers.find(header => 
            header.toLowerCase().includes(field.toLowerCase()) || 
            field.toLowerCase().includes(header.toLowerCase())
          );
          
          if (partialMatch) {
            initialMapping[field] = partialMatch;
          }
        }
      });
      
      setMappedFields(initialMapping);
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      setParseError('Failed to parse Excel file. Please make sure it\'s a valid Excel file.');
    }
  };

  const handleFieldMapping = (templateField: string, excelField: string) => {
    setMappedFields(prev => ({
      ...prev,
      [templateField]: excelField
    }));
  };

  const processData = () => {
    if (!previewData || !file) return;
    
    try {
      const data = XLSX.read(file, { type: 'binary' });
      const worksheet = data.Sheets[data.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as ExcelRow[];
      
      // Transform data based on field mapping
      const transformedData = jsonData.map((row: ExcelRow) => {
        const newRow: Record<string, unknown> = {};
        
        Object.entries(mappedFields).forEach(([templateField, excelField]) => {
          if (excelField && row[excelField] !== undefined) {
            newRow[templateField] = row[excelField];
          }
        });
        
        return newRow;
      });
      
      onDataParsed(transformedData);
    } catch (error) {
      console.error('Error processing Excel data:', error);
      setParseError('Failed to process Excel data');
    }
  };

  const isReadyToProcess = () => {
    return (
      file && 
      previewData && 
      previewData.length > 0 && 
      Object.keys(mappedFields).length > 0 &&
      templateFields.every(field => mappedFields[field])
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Excel Data Upload
        </CardTitle>
        <CardDescription>
          Upload an Excel file to import plant data in bulk
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* File Upload */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">
            Select Excel File
          </label>
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={isProcessing}
              className="flex-1"
            />
            {file && (
              <div className="text-sm text-gray-500">
                {file.name}
              </div>
            )}
          </div>
        </div>
        
        {/* Error Message */}
        {parseError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{parseError}</AlertDescription>
          </Alert>
        )}
        
        {/* Field Mapping */}
        {previewData && previewData.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Map Excel Columns to Fields</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templateFields.map(field => (
                <div key={field} className="space-y-1">
                  <label className="block text-sm font-medium">
                    {field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ')}
                  </label>
                  <select
                    value={mappedFields[field] || ''}
                    onChange={(e) => handleFieldMapping(field, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Excel Column</option>
                    {availableColumns.map((column, index) => (
                      <option key={index} value={column}>
                        {column}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            
            {/* Preview Table */}
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Data Preview</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {availableColumns.map((header, index) => (
                        <th
                          key={index}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {previewData.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {availableColumns.map((header, colIndex) => (
                          <td
                            key={colIndex}
                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                          >
                            {String(row[colIndex] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Showing {previewData.length} rows of data preview
              </p>
            </div>
          </div>
        )}
        
        {/* Upload Progress */}
        {isProcessing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Processing...</span>
              <span>Please wait</span>
            </div>
            <Progress value={uploadStats?.total ? (uploadStats.success / uploadStats.total) * 100 : undefined} />
          </div>
        )}
        
        {/* Upload Results */}
        {uploadSuccess !== undefined && (
          <Alert variant={uploadSuccess ? "default" : "destructive"}>
            {uploadSuccess ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              {uploadSuccess ? (
                <span>
                  Successfully uploaded {uploadStats?.success} of {uploadStats?.total} records.
                  {uploadStats?.failed ? ` (${uploadStats.failed} failed)` : ''}
                </span>
              ) : (
                <span>
                  Upload failed. {uploadStats?.errors?.join('. ')}
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      
      <CardFooter>
        <Button 
          onClick={processData} 
          disabled={!isReadyToProcess() || isProcessing}
          className="w-full"
        >
          {isProcessing ? (
            <>Processing...</>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Process Excel Data
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ExcelUploader; 