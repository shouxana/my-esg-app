import React from 'react';

type ModalType = 'EMAIL_EXISTS' | 'DUPLICATE_PERSON' | 'SUCCESS' | 'ERROR';

interface ModalData {
  type: ModalType;
  title: string;
  existingEmployee?: {
    full_name: string;
    employee_mail?: string;
  };
  suggestions?: string[];
  message?: string;
}

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  onSelectSuggestion?: (suggestion: string) => void;
  data: ModalData;
  company: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onSelectSuggestion,
  data,
  company
}) => {
  if (!isOpen) return null;

  const renderContent = () => {
    switch (data.type) {
      case 'EMAIL_EXISTS':
        return (
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              This email is already registered for employee:{' '}
              <span className="font-semibold">{data.existingEmployee?.full_name}</span>
            </p>
            
            {data.suggestions && data.suggestions.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-md">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  You might want to try these email suggestions:
                </p>
                <ul className="space-y-1">
                  {data.suggestions.map((suggestion, index) => (
                    <li 
                      key={index}
                      className="text-blue-600 cursor-pointer hover:text-blue-800"
                      onClick={() => onSelectSuggestion?.(suggestion)}
                    >
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );

      case 'DUPLICATE_PERSON':
        return (
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              An employee with the same name and birth date already exists:
            </p>
            <div className="bg-yellow-50 p-4 rounded-md">
              <p className="font-semibold">{data.existingEmployee?.full_name}</p>
              <p className="text-gray-600">{data.existingEmployee?.employee_mail}</p>
            </div>
            <p className="mt-4 text-gray-600">
              Do you want to proceed with adding this employee anyway?
            </p>
          </div>
        );

      default:
        return (
          <div className="mb-6">
            <p className="text-gray-600">{data.message}</p>
          </div>
        );
    }
  };

  const renderButtons = () => {
    switch (data.type) {
      case 'DUPLICATE_PERSON':
        return (
          <div className="flex gap-3">
            <button
              className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
              onClick={onConfirm}
            >
              Proceed Anyway
            </button>
          </div>
        );

      default:
        return (
          <button
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
            onClick={onClose}
          >
            Close
          </button>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-6 w-[600px] max-w-full"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {data.title}
          </h2>
          <div className="text-sm text-gray-500">
            Company: {company.toUpperCase()}
          </div>
        </div>

        {renderContent()}
        {renderButtons()}
      </div>
    </div>
  );
};

export default ConfirmationModal;