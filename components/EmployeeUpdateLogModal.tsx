'use client';

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface ChangeLog {
  changed_field: string;
  old_value: string;
  new_value: string;
  updated_at: string;
}

interface EmployeeUpdateLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  employeeName: string;
  company: string;
}

const EmployeeUpdateLogModal: React.FC<EmployeeUpdateLogModalProps> = ({
  isOpen,
  onClose,
  employeeId,
  employeeName,
  company
}) => {
  const [changes, setChanges] = useState<ChangeLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChanges = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`/api/employee-changes/${employeeId}?company=${encodeURIComponent(company)}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch changes');
        }
        
        const data = await response.json();
        
        // Filter changes for the specific company
        const filteredChanges = data.filter((change: ChangeLog) => {
          // Add any company-specific filtering logic here if needed
          return true;
        });
        
        setChanges(filteredChanges);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch changes');
        console.error('Error fetching changes:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen && employeeId && company) {
      fetchChanges();
    }
  }, [isOpen, employeeId, company]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[800px] max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            Change Log for {employeeName}
          </h2>
          <div className="text-sm text-gray-500">
            Company: {company.toUpperCase()}
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        ) : error ? (
          <div className="text-red-500 text-center py-4">
            {error}
          </div>
        ) : changes.length === 0 ? (
          <div className="text-gray-500 text-center py-4">
            No changes found for this employee
          </div>
        ) : (
          <div className="overflow-y-auto flex-grow">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Field</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Old Value</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">New Value</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Updated At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {changes.map((change, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2">{change.changed_field}</td>
                    <td className="px-4 py-2">{change.old_value || '-'}</td>
                    <td className="px-4 py-2">{change.new_value || '-'}</td>
                    <td className="px-4 py-2">
                      {new Date(change.updated_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeUpdateLogModal;