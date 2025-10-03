'use client';

import { useState } from 'react';
import { StockItem, StockRequestSubmission, WarehouseInventory, User } from '@/types/stock';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import QuantityInput from './QuantityInput';

interface PartialAcceptanceModalProps {
  request: StockRequestSubmission;
  stockItems: StockItem[];
  inventory: WarehouseInventory[];
  currentUser: User | null;
  onAccept: (requestId: string, modifiedItems: { itemId: string; requestedQuantity: number }[], warehouseNotes?: string) => Promise<void>;
  onCancel: () => void;
}

export default function PartialAcceptanceModal({
  request,
  stockItems,
  inventory,
  currentUser,
  onAccept,
  onCancel
}: PartialAcceptanceModalProps) {
  const [modifiedItems, setModifiedItems] = useState(request.items.map(item => ({ ...item })));
  const [warehouseNotes, setWarehouseNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // ESC key to close
  useEscapeKey(onCancel, !isProcessing);

  const getAvailableStock = (itemId: string) => {
    const item = inventory.find((inv) => inv.itemId === itemId);
    return item ? item.availableQuantity : 0;
  };

  const getItemName = (itemId: string) => {
    const item = stockItems.find((si) => si.id === itemId);
    return item ? item.name : 'Unknown';
  };

  const getItemSku = (itemId: string) => {
    const item = stockItems.find((si) => si.id === itemId);
    return item ? item.sku : '';
  };

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    setModifiedItems(prev =>
      prev.map(item =>
        item.itemId === itemId
          ? { ...item, requestedQuantity: Math.max(0, newQuantity) }
          : item
      )
    );
  };

  const handleAccept = async () => {
    // Filter out items with 0 quantity
    const validItems = modifiedItems.filter(item => item.requestedQuantity > 0);

    if (validItems.length === 0) {
      alert('Please specify at least one item to fulfill');
      return;
    }

    setIsProcessing(true);
    try {
      await onAccept(request.id, validItems, warehouseNotes || undefined);
      onCancel();
    } catch (error) {
      console.error('Error accepting request:', error);
      alert('Failed to accept request. Please try again.');
      setIsProcessing(false);
    }
  };

  const hasModifications = JSON.stringify(modifiedItems) !== JSON.stringify(request.items) || warehouseNotes;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 md:p-4">
      <div className="bg-white w-full h-full md:rounded-lg md:shadow-xl md:max-w-4xl md:w-full md:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">
              {hasModifications ? 'Partial Acceptance' : 'Accept Request'} #{String(request.requestNumber || 0).padStart(3, '0')}
            </h2>
            <p className="text-sm text-blue-100">
              {request.storeLocation} • Adjust quantities if needed
            </p>
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
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
            ℹ️ You can modify quantities to match available stock. Set to 0 to exclude an item.
          </div>

          {/* Items */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Items to Fulfill</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {modifiedItems.map((item) => {
                const available = getAvailableStock(item.itemId);
                const originalQty = request.items.find(i => i.itemId === item.itemId)?.requestedQuantity || 0;
                const isModified = item.requestedQuantity !== originalQty;
                const insufficient = available < item.requestedQuantity;
                
                return (
                  <div 
                    key={item.itemId} 
                    className={`border rounded-lg p-4 ${
                      insufficient ? 'bg-red-50 border-red-200' : 
                      isModified ? 'bg-yellow-50 border-yellow-200' : 
                      'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="mb-3">
                      <p className="font-medium text-gray-900">{getItemName(item.itemId)}</p>
                      <p className="text-sm text-gray-600">SKU: {getItemSku(item.itemId)}</p>
                      <div className="mt-2 flex justify-between text-sm">
                        <span className="text-gray-700">Original Request:</span>
                        <span className="font-medium text-gray-900">{originalQty}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">Available Stock:</span>
                        <span className={`font-medium ${insufficient ? 'text-red-600' : 'text-green-600'}`}>
                          {available}
                        </span>
                      </div>
                    </div>

                    <div>
                      <QuantityInput
                        label={`Fulfill Quantity ${isModified ? '(Modified)' : ''}`}
                        value={item.requestedQuantity}
                        onChange={(value) => handleQuantityChange(item.itemId, value)}
                        min={0}
                        max={available}
                        disabled={isProcessing}
                      />
                      {available < originalQty && (
                        <button
                          onClick={() => handleQuantityChange(item.itemId, available)}
                          disabled={isProcessing}
                          className="w-full mt-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                        >
                          Use Available ({available})
                        </button>
                      )}
                      {insufficient && item.requestedQuantity > 0 && (
                        <p className="text-xs text-red-600 mt-1 text-center">⚠️ Insufficient stock available</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Warehouse Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Warehouse Notes {hasModifications && <span className="text-blue-600">(Recommended)</span>}
            </label>
            <textarea
              value={warehouseNotes}
              onChange={(e) => setWarehouseNotes(e.target.value)}
              disabled={isProcessing}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Explain any quantity adjustments or special handling..."
            />
          </div>

          {/* Original Comments */}
          {request.comments && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
              <h4 className="text-sm font-medium text-gray-900 mb-1">Store Comments:</h4>
              <p className="text-sm text-gray-600">{request.comments}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-4 flex flex-col md:flex-row md:justify-between md:items-center gap-3">
          <div className="text-sm text-gray-600 text-center md:text-left">
            {hasModifications ? (
              <span className="text-yellow-600 font-medium">⚠️ Quantities modified</span>
            ) : (
              <span>Accepting as requested</span>
            )}
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
              onClick={handleAccept}
              disabled={isProcessing || modifiedItems.every(item => item.requestedQuantity === 0)}
              className="flex-1 md:flex-initial px-6 py-3 md:py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base md:text-sm"
            >
              {isProcessing ? 'Processing...' : '✓ Accept Request'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

