import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'warning'
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          confirmBg: 'bg-red-600 hover:bg-red-700',
          titleColor: 'text-red-900'
        };
      case 'info':
        return {
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          confirmBg: 'bg-blue-600 hover:bg-blue-700',
          titleColor: 'text-blue-900'
        };
      default:
        return {
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          confirmBg: 'bg-yellow-600 hover:bg-yellow-700',
          titleColor: 'text-yellow-900'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className={`p-2 ${styles.iconBg} rounded-lg`}>
              <AlertTriangle className={`h-6 w-6 ${styles.iconColor}`} />
            </div>
            <div>
              <h2 className={`text-xl font-semibold ${styles.titleColor}`}>{title}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-700 mb-6">{message}</p>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-4 py-2 text-white rounded-lg transition-colors ${styles.confirmBg}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};