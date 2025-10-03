'use client';

import { useState } from 'react';
import { StockItem, StockRequestSubmission, WarehouseInventory } from '@/types/stock';
import BarcodeScanner from './BarcodeScanner';
import * as db from '@/lib/database-client';
import { useEscapeKey } from '@/hooks/useEscapeKey';

interface FulfillRequestProps {
  request: StockRequestSubmission;
  stockItems: StockItem[];
  inventory: WarehouseInventory[];
  onClose: () => void;
  onComplete: () => void;
}

interface FulfillmentItem {
  itemId: string;
  product: StockItem;
  requestedQty: number;
  fulfilledQty: number;
  status: 'pending' | 'partial' | 'complete';
}

export default function FulfillRequest({
  request,
  stockItems,
  inventory,
  onClose,
  onComplete
}: FulfillRequestProps) {
  const [showScanner, setShowScanner] = useState(false);
  const [manualBarcodeInput, setManualBarcodeInput] = useState('');
  const [currentScan, setCurrentScan] = useState<StockItem | null>(null);
  const [quantityInput, setQuantityInput] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // ESC key to close (only when not scanning and not processing)
  useEscapeKey(onClose, !showScanner && !isProcessing);

  // Initialize fulfillment items from request
  const [fulfillmentItems, setFulfillmentItems] = useState<FulfillmentItem[]>(() =>
    request.items.map(item => {
      const product = stockItems.find(si => si.id === item.itemId);
      return {
        itemId: item.itemId,
        product: product!,
        requestedQty: item.requestedQuantity,
        fulfilledQty: 0,
        status: 'pending' as const
      };
    })
  );

  const getAvailableStock = (itemId: string): number => {
    const inventoryItem = inventory.find(item => item.itemId === itemId);
    return inventoryItem ? inventoryItem.availableQuantity : 0;
  };

  const getRequestedQty = (itemId: string): number => {
    const requestItem = request.items.find(item => item.itemId === itemId);
    return requestItem ? requestItem.requestedQuantity : 0;
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

      // Check if product is in this request
      const requestItem = request.items.find(item => item.itemId === product.id);
      if (!requestItem) {
        setError(`${product.name} is not in this request`);
        return;
      }

      // Get current fulfillment status
      const fulfillmentItem = fulfillmentItems.find(item => item.itemId === product.id);
      const alreadyFulfilled = fulfillmentItem?.fulfilledQty || 0;
      const remaining = requestItem.requestedQuantity - alreadyFulfilled;

      // Set current scan with pre-filled quantity
      setCurrentScan(product);
      setQuantityInput(remaining > 0 ? remaining : requestItem.requestedQuantity);
      setManualBarcodeInput('');
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

  const handleConfirmQuantity = () => {
    if (!currentScan || quantityInput <= 0) return;

    setFulfillmentItems(prev => prev.map(item => {
      if (item.itemId === currentScan.id) {
        const newFulfilledQty = item.fulfilledQty + quantityInput;
        const newStatus = newFulfilledQty >= item.requestedQty ? 'complete' :
                         newFulfilledQty > 0 ? 'partial' : 'pending';
        
        return {
          ...item,
          fulfilledQty: newFulfilledQty,
          status: newStatus
        };
      }
      return item;
    }));

    // Reset for next scan
    setCurrentScan(null);
    setQuantityInput(0);
    setError(null);
  };

  const handleMarkAsShipped = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // Update request status to shipped
      await db.updateRequestStatus(request.id, 'shipped');
      
      // Success - notify parent to refresh
      onComplete();
      onClose();
    } catch (err) {
      console.error('Error marking as shipped:', err);
      setError('Failed to mark as shipped. Please try again.');
      setIsProcessing(false);
    }
  };

  const totalRequested = fulfillmentItems.reduce((sum, item) => sum + item.requestedQty, 0);
  const totalFulfilled = fulfillmentItems.reduce((sum, item) => sum + item.fulfilledQty, 0);
  const progressPercentage = totalRequested > 0 ? Math.round((totalFulfilled / totalRequested) * 100) : 0;
  const allItemsFulfilled = fulfillmentItems.every(item => item.fulfilledQty >= item.requestedQty);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-orange-600 text-white p-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">
              Fulfill Request #{String(request.requestNumber || 0).padStart(3, '0')}
            </h2>
            <p className="text-sm text-orange-100">
              {request.storeLocation} • Scan items to fulfill
            </p>
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
          {!currentScan && (
            <div className="space-y-4">
              {/* Camera Scan Button */}
              <div className="flex justify-center">
                <button
                  onClick={() => setShowScanner(true)}
                  disabled={isProcessing}
                  className="px-6 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <span className="text-2xl">📷</span>
                  <span>Scan Item</span>
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
              </form>
            </div>
          )}

          {/* Current Scan - Quantity Input */}
          {currentScan && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900 text-lg">✅ Product Found</h3>
                <button
                  onClick={() => {
                    setCurrentScan(null);
                    setQuantityInput(0);
                    setError(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Product</p>
                  <p className="font-medium text-gray-900">{currentScan.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">SKU</p>
                  <p className="font-medium text-gray-900">{currentScan.sku}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Barcode</p>
                  <p className="font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded inline-block">
                    {currentScan.barcode}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Available Stock</p>
                  <p className="font-medium text-gray-900">{getAvailableStock(currentScan.id)}</p>
                </div>
              </div>

              <div className="bg-white rounded p-3 mb-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600">Requested</p>
                    <p className="text-lg font-bold text-gray-900">
                      {getRequestedQty(currentScan.id)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Already Fulfilled</p>
                    <p className="text-lg font-bold text-blue-600">
                      {fulfillmentItems.find(item => item.itemId === currentScan.id)?.fulfilledQty || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Remaining</p>
                    <p className="text-lg font-bold text-orange-600">
                      {getRequestedQty(currentScan.id) - (fulfillmentItems.find(item => item.itemId === currentScan.id)?.fulfilledQty || 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Fulfilled Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantityInput}
                  onChange={(e) => setQuantityInput(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-md text-black text-center text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleConfirmQuantity}
                  disabled={quantityInput <= 0}
                  className="flex-1 px-4 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ✓ Confirm
                </button>
                <button
                  onClick={() => {
                    setCurrentScan(null);
                    setQuantityInput(0);
                    setError(null);
                  }}
                  className="px-4 py-3 bg-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Fulfillment Progress */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Fulfillment Progress</h3>
            
            <div className="space-y-3 mb-4">
              {fulfillmentItems.map((item) => (
                <div key={item.itemId} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {item.product.name}
                      </span>
                      <span className={`text-sm font-bold ${
                        item.status === 'complete' ? 'text-green-600' :
                        item.status === 'partial' ? 'text-orange-600' :
                        'text-gray-400'
                      }`}>
                        {item.fulfilledQty}/{item.requestedQty}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          item.status === 'complete' ? 'bg-green-600' :
                          item.status === 'partial' ? 'bg-orange-500' :
                          'bg-gray-300'
                        }`}
                        style={{ width: `${(item.fulfilledQty / item.requestedQty) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-2xl">
                    {item.status === 'complete' ? '✅' :
                     item.status === 'partial' ? '🟡' :
                     '⏳'}
                  </div>
                </div>
              ))}
            </div>

            {/* Overall Progress */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Total Progress</span>
                <span className="text-lg font-bold text-gray-900">
                  {totalFulfilled}/{totalRequested} items ({progressPercentage}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="h-3 rounded-full bg-blue-600 transition-all"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-4 flex flex-col md:flex-row md:justify-between md:items-center gap-3">
          <div className="text-sm text-gray-600 text-center md:text-left">
            {allItemsFulfilled ? (
              <span className="text-green-600 font-medium">✅ All items fulfilled!</span>
            ) : (
              <span>Scan items to continue fulfillment</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 md:flex-initial px-4 py-3 md:py-2 bg-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base md:text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleMarkAsShipped}
              disabled={!allItemsFulfilled || isProcessing}
              className="flex-1 md:flex-initial px-6 py-3 md:py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base md:text-sm"
            >
              {isProcessing ? 'Processing...' : '✓ Mark as Shipped'}
            </button>
          </div>
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

