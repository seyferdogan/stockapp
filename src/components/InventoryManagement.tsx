'use client';

import { useState } from 'react';
import { StockItem, WarehouseInventory } from '@/types/stock';
import BarcodeScanner from './BarcodeScanner';
import ReceiveInventory from './ReceiveInventory';
import ConfirmModal from './ConfirmModal';

interface InventoryManagementProps {
  stockItems: StockItem[];
  inventory: WarehouseInventory[];
  onAddStock: (itemId: string, quantity: number) => void;
  onCreateNewProduct: (product: Omit<StockItem, 'id'>, initialQuantity: number) => void;
  onDeleteProduct: (itemId: string) => void;
  onRefreshData: () => void;
}

export default function InventoryManagement({
  stockItems,
  inventory,
  onAddStock,
  onCreateNewProduct,
  onDeleteProduct,
  onRefreshData
}: InventoryManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddNew, setShowAddNew] = useState(false);
  const [showRestock, setShowRestock] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showReceiving, setShowReceiving] = useState(false);
  const [scanTarget, setScanTarget] = useState<'newProduct' | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ itemId: string; itemName: string } | null>(null);
  
  // New product form state
  const [newProduct, setNewProduct] = useState({
    name: '',
    sku: '',
    barcode: '',
    initialQuantity: 0
  });
  
  // Restock form state
  const [restockForm, setRestockForm] = useState({
    selectedItemId: '',
    quantity: 0
  });

  const getAvailableQuantity = (itemId: string) => {
    const inventoryItem = inventory.find(item => item.itemId === itemId);
    return inventoryItem ? inventoryItem.availableQuantity : 0;
  };

  const getStockLevel = (quantity: number) => {
    if (quantity === 0) return { level: 'out', color: 'bg-red-100 text-red-800', text: 'Out of Stock' };
    if (quantity < 20) return { level: 'low', color: 'bg-red-100 text-red-800', text: 'Low Stock' };
    if (quantity < 50) return { level: 'medium', color: 'bg-yellow-100 text-yellow-800', text: 'Medium Stock' };
    return { level: 'good', color: 'bg-green-100 text-green-800', text: 'Good Stock' };
  };

  const filteredItems = stockItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.barcode && item.barcode.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreateNewProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.sku) return;

    const product: Omit<StockItem, 'id'> = {
      name: newProduct.name,
      sku: newProduct.sku.toUpperCase(),
      barcode: newProduct.barcode || undefined
    };

    onCreateNewProduct(product, newProduct.initialQuantity);
    setNewProduct({ name: '', sku: '', barcode: '', initialQuantity: 0 });
    setShowAddNew(false);
  };

  const handleRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockForm.selectedItemId || restockForm.quantity <= 0) return;

    onAddStock(restockForm.selectedItemId, restockForm.quantity);
    setRestockForm({ selectedItemId: '', quantity: 0 });
    setShowRestock(false);
  };

  const handleScanBarcode = (target: 'newProduct') => {
    setScanTarget(target);
    setShowBarcodeScanner(true);
  };

  const handleBarcodeScanned = (barcode: string) => {
    if (scanTarget === 'newProduct') {
      setNewProduct(prev => ({ ...prev, barcode }));
    }
    setShowBarcodeScanner(false);
    setScanTarget(null);
  };

  const handleDeleteProduct = (itemId: string, itemName: string) => {
    setDeleteConfirm({ itemId, itemName });
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      onDeleteProduct(deleteConfirm.itemId);
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={() => setShowReceiving(true)}
          className="px-4 py-2 bg-purple-600 text-white font-medium rounded-md hover:bg-purple-700 transition-colors flex items-center gap-2"
        >
          <span>📦</span>
          <span>Receive Inventory</span>
        </button>
        <button
          onClick={() => setShowAddNew(!showAddNew)}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          Add New Product
        </button>
        <button
          onClick={() => setShowRestock(!showRestock)}
          className="px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors"
        >
          Restock Existing
        </button>
      </div>

      {/* Add New Product Form */}
      {showAddNew && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Product</h3>
          <form onSubmit={handleCreateNewProduct} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter product name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SKU
                </label>
                <input
                  type="text"
                  value={newProduct.sku}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, sku: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter SKU"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Barcode (optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newProduct.barcode}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, barcode: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Scan or enter barcode"
                  />
                  <button
                    type="button"
                    onClick={() => handleScanBarcode('newProduct')}
                    className="px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors whitespace-nowrap"
                  >
                    📷 Scan
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Initial Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  value={newProduct.initialQuantity}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, initialQuantity: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                Create Product
              </button>
              <button
                type="button"
                onClick={() => setShowAddNew(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Restock Form */}
      {showRestock && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Restock Existing Product</h3>
          <form onSubmit={handleRestock} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Product
                </label>
                <select
                  value={restockForm.selectedItemId}
                  onChange={(e) => setRestockForm(prev => ({ ...prev, selectedItemId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a product...</option>
                  {stockItems.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.sku}) - Current: {getAvailableQuantity(item.id)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity to Add
                </label>
                <input
                  type="number"
                  min="1"
                  value={restockForm.quantity}
                  onChange={(e) => setRestockForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter quantity"
                  required
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors"
              >
                Add Stock
              </button>
              <button
                type="button"
                onClick={() => setShowRestock(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products by name, SKU, or barcode..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Desktop: Inventory Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">Product Name</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">SKU</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Barcode</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Current Stock</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => {
                const quantity = getAvailableQuantity(item.id);
                const stockLevel = getStockLevel(quantity);
                
                return (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900">{item.name}</td>
                    <td className="py-3 px-4 text-gray-600">{item.sku}</td>
                    <td className="py-3 px-4 text-gray-600 font-mono text-sm">
                      {item.barcode ? (
                        <span className="bg-gray-100 px-2 py-1 rounded">{item.barcode}</span>
                      ) : (
                        <span className="text-gray-400 italic">No barcode</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-900 font-medium">{quantity}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockLevel.color}`}>
                        {stockLevel.text}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleDeleteProduct(item.id, item.name)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 rounded transition-colors"
                        title={`Delete ${item.name}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile: Inventory Cards */}
        <div className="md:hidden space-y-4">
          {filteredItems.map(item => {
            const quantity = getAvailableQuantity(item.id);
            const stockLevel = getStockLevel(quantity);
            
            return (
              <div key={item.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-base">{item.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">SKU: {item.sku}</p>
                    {item.barcode && (
                      <p className="text-sm text-gray-600 font-mono mt-1">
                        Barcode: {item.barcode}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteProduct(item.id, item.name)}
                    className="text-red-600 hover:text-red-800 p-2 rounded transition-colors"
                    title={`Delete ${item.name}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <div className="text-center flex-1">
                    <p className="text-xs text-gray-600 mb-1">Stock</p>
                    <p className="text-2xl font-bold text-gray-900">{quantity}</p>
                  </div>
                  <div className="flex-1 flex justify-center">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${stockLevel.color}`}>
                      {stockLevel.text}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      {showBarcodeScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScanned}
          onClose={() => {
            setShowBarcodeScanner(false);
            setScanTarget(null);
          }}
        />
      )}

      {/* Receive Inventory Modal */}
      {showReceiving && (
        <ReceiveInventory
          stockItems={stockItems}
          inventory={inventory}
          onClose={() => setShowReceiving(false)}
          onComplete={() => {
            onRefreshData();
            setShowReceiving(false);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <ConfirmModal
          title="Delete Product"
          message={`Are you sure you want to delete "${deleteConfirm.itemName}"?\n\nThis will remove the product and all its inventory permanently.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          confirmColor="red"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}

