import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface FleetUpdateLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleId: string;
  vehicleNumber: string;
  company: string;
}

const FleetUpdateLogModal: React.FC<FleetUpdateLogModalProps> = ({
  isOpen,
  onClose,
  vehicleId,
  vehicleNumber,
  company,
}) => {
  const [changes, setChanges] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchChanges = async () => {
      if (!vehicleId) return;
      
      setIsLoading(true);
      try {
        const response = await fetch(`/api/fleet-logs/${vehicleId}?company=${encodeURIComponent(company)}`);
        if (!response.ok) throw new Error('Failed to fetch change log');
        
        const data = await response.json();
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
  }, [isOpen, vehicleId, company]);

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
                {changes.map((change, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2">{change.updated_at}</td>
                    <td className="p-2">{change.changed_field}</td>
                    <td className="p-2">{change.old_value || '-'}</td>
                    <td className="p-2">{change.new_value || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center text-gray-600">No changes logged</div>
          )}
        </div>

        <div className="p-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default FleetUpdateLogModal;