'use client';

import { useState } from 'react';
import { StockRequestSubmission, User } from '@/types/stock';
import { useEscapeKey } from '@/hooks/useEscapeKey';

interface RejectRequestModalProps {
  request: StockRequestSubmission;
  currentUser: User | null;
  onReject: (requestId: string, reason: string) => Promise<void>;
  onCancel: () => void;
}

export default function RejectRequestModal({
  request,
  currentUser,
  onReject,
  onCancel
}: RejectRequestModalProps) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // ESC key to close
  useEscapeKey(onCancel, !isProcessing);

  const commonReasons = [
    'Insufficient stock available',
    'Items out of season',
    'Budget constraints',
    'Duplicate request',
    'Items discontinued',
    'Pending supplier delivery',
  ];

  const handleSelectReason = (reason: string) => {
    setRejectionReason(reason);
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    setIsProcessing(true);
    try {
      await onReject(request.id, rejectionReason);
      onCancel();
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 md:p-4">
      <div className="bg-white w-full h-full md:rounded-lg md:shadow-xl md:max-w-2xl md:w-full md:h-auto overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-red-600 text-white p-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">
              Reject Request #{String(request.requestNumber || 0).padStart(3, '0')}
            </h2>
            <p className="text-sm text-red-100">{request.storeLocation}</p>
          </div>
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="text-white hover:text-gray-200 text-2xl font-bold leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-800">
            ⚠️ This will notify the store manager that their request has been rejected.
          </div>

          {/* Quick Select Reasons */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Common Rejection Reasons (Click to select)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {commonReasons.map((reason) => (
                <button
                  key={reason}
                  onClick={() => handleSelectReason(reason)}
                  disabled={isProcessing}
                  className={`p-3 text-left rounded-md border-2 transition-all ${
                    rejectionReason === reason
                      ? 'border-red-500 bg-red-50 text-red-900'
                      : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <span className="text-sm">{reason}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Rejection Reason (Required)
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              disabled={isProcessing}
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-md text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Provide a clear reason for rejection..."
            />
            <p className="text-xs text-gray-500 mt-1">
              This will be visible to the store manager
            </p>
          </div>

          {/* Request Details */}
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Request Summary:</h4>
            <div className="text-sm space-y-1">
              <p className="text-gray-700">
                <span className="font-medium">Items:</span> {request.items.length}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Submitted:</span> {new Date(request.submittedAt).toLocaleString()}
              </p>
              {request.comments && (
                <div className="mt-2 pt-2 border-t border-gray-300">
                  <p className="font-medium text-gray-900 mb-1">Store Comments:</p>
                  <p className="text-gray-600 italic">{request.comments}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-4 flex flex-col md:flex-row md:justify-between md:items-center gap-3">
          <div className="text-sm text-gray-600 text-center md:text-left">
            This action cannot be undone
          </div>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              disabled={isProcessing}
              className="flex-1 md:flex-initial px-4 py-3 md:py-2 bg-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base md:text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              disabled={isProcessing || !rejectionReason.trim()}
              className="flex-1 md:flex-initial px-6 py-3 md:py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base md:text-sm"
            >
              {isProcessing ? 'Rejecting...' : '❌ Reject Request'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

