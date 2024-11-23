import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface FleetUpdateLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleId: string;
  vehicleNumber: string;
  company: string;
}

interface ChangeLogEntry {
  id: number;
  changed_field: string;
  old_value: string | null;
  new_value: string | null;
  updated_at: string;
}

const FleetUpdateLogModal: React.FC<FleetUpdateLogModalProps> = ({
  isOpen,
  onClose,
  vehicleId,
  vehicleNumber,
  company,
}) => {
  const [changes, setChanges] = useState<ChangeLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchChanges = async () => {
      if (!vehicleId) return;
      
      setIsLoading(true);
      try {
        const response = await fetch(`/api/fleet-logs/${vehicleId}`);
        if (!response.ok) throw new Error('Failed to fetch change log');
        
        const data = await response.json();
        console.log('Fetched change log data:', data);
        setChanges(data);
      } catch (error) {
        console.error('Error fetching change log:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen && vehicleId) {
      fetchChanges();
    }
  }, [isOpen, vehicleId]);

  const formatValue = (value: string | null, field: string): string => {
    if (value === null || value === '') return '-';
    
    // Format dates if the field is a date field
    if (field.includes('date')) {
      try {
        const date = new Date(value);
        return date.toLocaleDateString();
      } catch {
        return value;
      }
    }

    // Format vehicle type changes to be more readable
    if (field === 'vehicle_type_id') {
      return `Type ${value}`;
    }

    return value;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            Change Log for Vehicle: {vehicleNumber}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4 max-h-[70vh] overflow-y-auto">
          {isLoading ? (
            <div className="text-center text-gray-600">Loading...</div>
          ) : changes.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Field</th>
                  <th className="text-left p-2">Old Value</th>
                  <th className="text-left p-2">New Value</th>
                </tr>
              </thead>
              <tbody>
                {changes.map((change) => (
                  <tr key={change.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 text-sm">{change.updated_at}</td>
                    <td className="p-2 text-sm font-medium">{change.changed_field}</td>
                    <td className="p-2 text-sm text-gray-600">
                      {formatValue(change.old_value, change.changed_field)}
                    </td>
                    <td className="p-2 text-sm text-gray-600">
                      {formatValue(change.new_value, change.changed_field)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center text-gray-600 py-8">No changes have been logged for this vehicle</div>
          )}
        </div>

        <div className="p-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default FleetUpdateLogModal;