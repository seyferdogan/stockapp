'use client';

import { useState, useEffect } from 'react';
import { StockItem, StockRequestSubmission, WarehouseInventory } from '@/types/stock';
import { useEscapeKey } from '@/hooks/useEscapeKey';

interface EditRequestModalProps {
  request: StockRequestSubmission;
  stockItems: StockItem[];
  inventory: WarehouseInventory[];
  onSave: (requestId: string, updates: {
    items: { itemId: string; requestedQuantity: number }[];
    comments: string;
  }) => Promise<void>;
  onCancel: () => void;
}

export default function EditRequestModal({
  request,
  stockItems,
  inventory,
  onSave,
  onCancel
}: EditRequestModalProps) {
  const [editedItems, setEditedItems] = useState(request.items.map(item => ({ ...item })));
  const [comments, setComments] = useState(request.comments);
  const [isSaving, setIsSaving] = useState(false);

  // ESC key to close
  useEscapeKey(onCancel, !isSaving);

  const getAvailableStock = (itemId: string) => {
    const item = inventory.find((inv) => inv.itemId === itemId);
    return item ? item.availableQuantity : 0;
  };

  const getItemName = (itemId: string) => {
    const item = stockItems.find((si) => si.id === itemId);
    return item ? item.name : 'Unknown';
  };

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    setEditedItems(prev =>
      prev.map(item =>
        item.itemId === itemId
          ? { ...item, requestedQuantity: Math.max(0, newQuantity) }
          : item
      )
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setEditedItems(prev => prev.filter(item => item.itemId !== itemId));
  };

  const handleSave = async () => {
    // Filter out items with 0 quantity
    const validItems = editedItems.filter(item => item.requestedQuantity > 0);

    if (validItems.length === 0) {
      alert('Please add at least one item with quantity > 0');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(request.id, {
        items: validItems,
        comments
      });
      onCancel();
    } catch (error) {
      console.error('Error saving request:', error);
      alert('Failed to save request. Please try again.');
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 md:p-4">
      <div className="bg-white w-full h-full md:rounded-lg md:shadow-xl md:max-w-4xl md:w-full md:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 md:p-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">
              Edit Request #{String(request.requestNumber || 0).padStart(3, '0')}
            </h2>
            <p className="text-sm text-blue-100">{request.storeLocation}</p>
          </div>
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="text-white hover:text-gray-200 text-2xl font-bold leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-800">
            ℹ️ You can edit quantities, remove items, or update comments before the warehouse processes your request.
          </div>

          {/* Items */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Requested Items</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {editedItems.map((item) => {
                const available = getAvailableStock(item.itemId);
                return (
                  <div key={item.itemId} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{getItemName(item.itemId)}</p>
                        <p className="text-sm text-gray-600">Available: {available}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.itemId)}
                        disabled={isSaving}
                        className="text-red-600 hover:text-red-800 font-bold text-lg"
                        title="Remove item"
                      >
                        ×
                      </button>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Quantity</label>
                      <input
                        type="number"
                        min="0"
                        value={item.requestedQuantity}
                        onChange={(e) => handleQuantityChange(item.itemId, parseInt(e.target.value) || 0)}
                        disabled={isSaving}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {editedItems.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No items in request. Add items to continue.
              </div>
            )}
          </div>

          {/* Comments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comments (Optional)
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              disabled={isSaving}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add any special instructions or notes..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-4 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            {editedItems.length} item{editedItems.length !== 1 ? 's' : ''} in request
          </p>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              disabled={isSaving}
              className="flex-1 md:flex-initial px-4 py-3 md:py-2 bg-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base md:text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || editedItems.length === 0}
              className="flex-1 md:flex-initial px-6 py-3 md:py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base md:text-sm"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

