'use client';

import { useState } from 'react';
import { StockItem, WarehouseInventory } from '@/types/stock';
import BarcodeScanner from './BarcodeScanner';
import * as db from '@/lib/database-client';
import { useEscapeKey } from '@/hooks/useEscapeKey';

interface ReceiveInventoryProps {
  stockItems: StockItem[];
  inventory: WarehouseInventory[];
  onClose: () => void;
  onComplete: () => void;
}

interface ReceivingItem {
  product: StockItem;
  quantityToAdd: number;
  currentStock: number;
}

export default function ReceiveInventory({
  stockItems,
  inventory,
  onClose,
  onComplete
}: ReceiveInventoryProps) {
  const [showScanner, setShowScanner] = useState(false);
  const [receivingItems, setReceivingItems] = useState<ReceivingItem[]>([]);
  const [currentItem, setCurrentItem] = useState<StockItem | null>(null);
  const [quantityInput, setQuantityInput] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualBarcodeInput, setManualBarcodeInput] = useState('');

  // ESC key to close (only when not scanning and not processing)
  useEscapeKey(onClose, !showScanner && !isProcessing);

  const getCurrentStock = (itemId: string): number => {
    const inventoryItem = inventory.find(item => item.itemId === itemId);
    return inventoryItem ? inventoryItem.availableQuantity : 0;
  };

  const handleBarcodeScanned = async (barcode: string) => {
    setShowScanner(false);
    setError(null);

    try {
      // Look up product by barcode
      const product = await db.getStockItemByBarcode(barcode);

      if (!product) {
        setError(`No product found with barcode: ${barcode}`);
        return;
      }

      // Set current item for quantity input
      setCurrentItem(product);
      setQuantityInput(1);
      setManualBarcodeInput(''); // Clear manual input
    } catch (err) {
      console.error('Error looking up barcode:', err);
      setError('Failed to look up product. Please try again.');
    }
  };

  const handleManualBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualBarcodeInput.trim()) return;

    await handleBarcodeScanned(manualBarcodeInput.trim());
  };

  const handleAddToReceiving = () => {
    if (!currentItem) return;

    const currentStock = getCurrentStock(currentItem.id);

    // Check if item already in receiving list
    const existingIndex = receivingItems.findIndex(
      item => item.product.id === currentItem.id
    );

    if (existingIndex >= 0) {
      // Update existing item
      const updated = [...receivingItems];
      updated[existingIndex].quantityToAdd += quantityInput;
      setReceivingItems(updated);
    } else {
      // Add new item
      setReceivingItems([
        ...receivingItems,
        {
          product: currentItem,
          quantityToAdd: quantityInput,
          currentStock
        }
      ]);
    }

    // Reset for next scan
    setCurrentItem(null);
    setQuantityInput(1);
    setError(null);
  };

  const handleRemoveItem = (productId: string) => {
    setReceivingItems(receivingItems.filter(item => item.product.id !== productId));
  };

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) return;
    
    setReceivingItems(
      receivingItems.map(item =>
        item.product.id === productId
          ? { ...item, quantityToAdd: newQuantity }
          : item
      )
    );
  };

  const handleCompleteReceiving = async () => {
    if (receivingItems.length === 0) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Update inventory for each item
      for (const item of receivingItems) {
        await db.addStock(item.product.id, item.quantityToAdd);
      }

      // Success - notify parent to refresh data
      onComplete();
      onClose();
    } catch (err) {
      console.error('Error completing receiving:', err);
      setError('Failed to update inventory. Please try again.');
      setIsProcessing(false);
    }
  };

  const totalItems = receivingItems.reduce((sum, item) => sum + item.quantityToAdd, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Receive Inventory</h2>
            <p className="text-sm text-blue-100">Scan items to add to inventory</p>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-white hover:text-gray-200 text-2xl font-bold leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-800 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {/* Scan Options */}
          <div className="space-y-4">
            {/* Camera Scan Button */}
            <div className="flex justify-center">
              <button
                onClick={() => setShowScanner(true)}
                disabled={isProcessing}
                className="px-6 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <span className="text-2xl">📷</span>
                <span>Scan with Camera</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">OR</span>
              </div>
            </div>

            {/* Manual Barcode Entry */}
            <form onSubmit={handleManualBarcodeSubmit} className="max-w-md mx-auto">
              <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                Enter Barcode Manually
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualBarcodeInput}
                  onChange={(e) => setManualBarcodeInput(e.target.value)}
                  placeholder="Type or paste barcode here"
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={isProcessing || !manualBarcodeInput.trim()}
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Lookup
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1 text-center">
                Perfect for testing or if camera is not available
              </p>
            </form>
          </div>

          {/* Current Item Being Added */}
          {currentItem && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Add to Receiving</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Product</p>
                  <p className="font-medium text-gray-900">{currentItem.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">SKU</p>
                  <p className="font-medium text-gray-900">{currentItem.sku}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Current Stock</p>
                  <p className="font-medium text-gray-900">{getCurrentStock(currentItem.id)}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Quantity to Add</label>
                  <input
                    type="number"
                    min="1"
                    value={quantityInput}
                    onChange={(e) => setQuantityInput(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddToReceiving}
                  className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
                >
                  Add to List
                </button>
                <button
                  onClick={() => {
                    setCurrentItem(null);
                    setQuantityInput(1);
                    setError(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Receiving List */}
          {receivingItems.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Items to Receive ({receivingItems.length})</h3>
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Product</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">SKU</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-900">Qty to Add</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-900">Current</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-900">New Stock</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receivingItems.map((item) => (
                      <tr key={item.product.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-900">{item.product.name}</td>
                        <td className="py-3 px-4 text-gray-600">{item.product.sku}</td>
                        <td className="py-3 px-4 text-center">
                          <input
                            type="number"
                            min="1"
                            value={item.quantityToAdd}
                            onChange={(e) => handleUpdateQuantity(item.product.id, parseInt(e.target.value) || 1)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-black"
                            disabled={isProcessing}
                          />
                        </td>
                        <td className="py-3 px-4 text-center text-gray-600">{item.currentStock}</td>
                        <td className="py-3 px-4 text-center font-medium text-green-600">
                          {item.currentStock + item.quantityToAdd}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleRemoveItem(item.product.id)}
                            disabled={isProcessing}
                            className="text-red-600 hover:text-red-800 disabled:opacity-50"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600">Total Items to Receive</p>
                    <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{receivingItems.length} unique products</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {receivingItems.length === 0 && !currentItem && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-2">No items added yet</p>
              <p className="text-sm">Use camera scan or manual entry to start receiving inventory</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 bg-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleCompleteReceiving}
            disabled={receivingItems.length === 0 || isProcessing}
            className="px-6 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : `Complete Receiving (${totalItems} items)`}
          </button>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      {showScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScanned}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}

