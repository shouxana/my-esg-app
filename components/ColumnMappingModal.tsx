import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx-js-style';
import {
  ColumnMappingModalProps,
  ColumnMapping,
  DATABASE_COLUMNS,
  DATA_TYPES
} from '@/types/column-mapping';

const ColumnMappingModal: React.FC<ColumnMappingModalProps> = ({ 
  isOpen, 
  onClose, 
  file, 
  onImport 
}) => {
  const [excelColumns, setExcelColumns] = useState<string[]>([]);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [excelData, setExcelData] = useState<any[]>([]);

  useEffect(() => {
    if (file && isOpen) {
      const reader = new FileReader();
      
      reader.onload = async (event: ProgressEvent<FileReader>) => {
        if (event.target?.result) {
          // Convert the result to Uint8Array
          const data = new Uint8Array(event.target.result as ArrayBuffer);
          // Read the workbook
          const workbook = XLSX.read(data, { type: 'array' });
          
          if (workbook.SheetNames.length === 0) {
            console.error('No sheets found in Excel file');
            return;
          }
  
          const firstSheetName = workbook.SheetNames[0];
          const firstSheet = workbook.Sheets[firstSheetName];
          
          try {
            // Explicitly type the JSON data
            const jsonData: Record<string, any>[] = XLSX.utils.sheet_to_json(firstSheet);
            
            if (jsonData.length > 0) {
              // Safely get column names from the first row
              const columns: string[] = Object.keys(jsonData[0]);
              
              // Update state with the processed data
              setExcelColumns(columns);
              setExcelData(jsonData);
              setPreviewData(jsonData.slice(0, 5));
            }
          } catch (error) {
            console.error('Error processing Excel file:', error);
          }
        }
      };
  
      reader.onerror = (error) => {
        console.error('Error reading file:', error);
      };
  
      reader.readAsArrayBuffer(file);
    }
  }, [file, isOpen]);

  useEffect(() => {
    if (excelColumns.length > 0) {
      // Initialize mappings with automatic mapping based on column names
      const initialMappings: ColumnMapping[] = DATABASE_COLUMNS.map(dbCol => {
        const matchingExcelColumn = excelColumns.find(col =>
          col.toLowerCase().replace(/\s/g, '_') === dbCol.name.toLowerCase()
        );
        return {
          excelColumn: matchingExcelColumn || '',
          dbColumn: dbCol.name,
          dataType: dbCol.type
        };
      });
      
      setMappings(initialMappings);
    }
  }, [excelColumns]);

  const handleMappingChange = (dbColumn: string, excelColumn: string) => {
    setMappings(prev => prev.map(m => 
      m.dbColumn === dbColumn ? { ...m, excelColumn } : m
    ));
  };

  const handleDataTypeChange = (dbColumn: string, dataType: string) => {
    setMappings(prev => prev.map(m => 
      m.dbColumn === dbColumn ? { ...m, dataType } : m
    ));
  };

  const handleImport = async () => {
    // Validate required mappings
    const missingRequired = DATABASE_COLUMNS
      .filter(col => col.required)
      .filter(col => !mappings.find(m => m.dbColumn === col.name)?.excelColumn);

    if (missingRequired.length > 0) {
      alert(`Please map required columns: ${missingRequired.map(col => col.name).join(', ')}`);
      return;
    }

    await onImport(mappings, excelData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Map Excel Columns</h2>
          <p className="text-sm text-gray-600 mt-1">Match your Excel columns to the database fields</p>
        </div>

        <div className="p-6 overflow-auto flex-grow">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <h3 className="font-semibold">Database Column</h3>
            <h3 className="font-semibold">Excel Column</h3>
            <h3 className="font-semibold">Data Type</h3>
          </div>

          {DATABASE_COLUMNS.map(dbCol => (
            <div key={dbCol.name} className="grid grid-cols-3 gap-4 mb-4">
              <div className="flex items-center">
                <span className="text-sm">{dbCol.name}</span>
                {dbCol.required && <span className="text-red-500 ml-1">*</span>}
              </div>
              <select
                className="border rounded px-2 py-1 text-sm"
                value={mappings.find(m => m.dbColumn === dbCol.name)?.excelColumn || ''}
                onChange={(e) => handleMappingChange(dbCol.name, e.target.value)}
              >
                <option value="">-- Select Column --</option>
                {excelColumns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
              <select
                className="border rounded px-2 py-1 text-sm"
                value={mappings.find(m => m.dbColumn === dbCol.name)?.dataType || ''}
                onChange={(e) => handleDataTypeChange(dbCol.name, e.target.value)}
              >
                {DATA_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          ))}

          {previewData.length > 0 && (
            <div className="mt-8">
              <h3 className="font-semibold mb-4">Data Preview (First 5 rows)</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      {excelColumns.map(col => (
                        <th key={col} className="px-4 py-2 bg-gray-50 text-left text-xs text-gray-500">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, idx) => (
                      <tr key={idx}>
                        {excelColumns.map(col => (
                          <td key={col} className="px-4 py-2 text-sm border-b">
                            {String(row[col] || '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-md hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Import Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default ColumnMappingModal;