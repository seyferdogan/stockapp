'use client';

import { useState } from 'react';
import { StockRequest, StockRequestSubmission, WarehouseInventory, StockItem, User } from '@/types/stock';

interface StockRequestFormProps {
  onRequestSubmit: (request: StockRequestSubmission) => void;
  inventory: WarehouseInventory[];
  stockItems: StockItem[];
  currentUser: User | null;
}

export default function StockRequestForm({ onRequestSubmit, inventory, stockItems, currentUser }: StockRequestFormProps) {
  const [requests, setRequests] = useState<Record<string, number>>({});
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStore, setSelectedStore] = useState('Sydney'); // Default store for admins

  const storeLocations = ['Sydney', 'Melbourne', 'Brisbane'];
  const isAdmin = currentUser?.role === 'admin';
  const effectiveStoreLocation = isAdmin ? selectedStore : currentUser?.storeLocation;

  const handleQuantityChange = (itemId: string, quantity: string) => {
    const numQuantity = parseInt(quantity) || 0;
    if (numQuantity === 0) {
      const newRequests = { ...requests };
      delete newRequests[itemId];
      setRequests(newRequests);
    } else {
      setRequests(prev => ({
        ...prev,
        [itemId]: numQuantity
      }));
    }
  };

  const generateRequestId = () => {
    return 'req-' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate store location (either assigned or selected by admin)
    if (!effectiveStoreLocation) {
      // Toast will be shown by parent component
      console.error('No store location selected');
      setIsSubmitting(false);
      return;
    }

    // Create new request
    const newRequest: StockRequestSubmission = {
      id: generateRequestId(),
      storeLocation: effectiveStoreLocation,
      items: Object.entries(requests).map(([itemId, quantity]) => ({
        itemId,
        requestedQuantity: quantity
      })),
      comments,
      status: 'pending',
      submittedAt: new Date().toISOString()
    };

    console.log('Stock request submitted:', newRequest);
    
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Add to shared state
    onRequestSubmit(newRequest);
    
    // Toast notification handled by parent component
    setRequests({});
    setComments('');
    setIsSubmitting(false);
  };

  const totalItems = Object.keys(requests).length;

  // Show error if user doesn't have store location assigned (except for admins)
  if (!currentUser?.storeLocation && currentUser?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-900 mb-2">Access Restricted</h2>
            <p className="text-red-700">
              You don't have a store location assigned to your account. Please contact an administrator to assign you to a store location.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Stock Request</h1>
        <p className="page-subtitle">Select items and quantities you need for your store</p>
        <div className="mt-2 text-sm font-medium" style={{ color: 'var(--primary)' }}>
          Store Location: {effectiveStoreLocation || 'Not Selected'} • {totalItems} items selected
        </div>
        
        {isAdmin && (
          <div className="mt-4">
            <label className="form-label">
              Select Store Location (Admin Override):
            </label>
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="select"
            >
              {storeLocations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
          {stockItems.map((item) => (
            <div
              key={item.id}
              className="card hover:shadow-md transition-shadow"
              style={{ padding: '1rem' }}
            >
              <div className="mb-3">
                <h3 className="font-medium text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                  {item.name}
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>SKU: {item.sku}</p>
              </div>
              
              <div className="flex items-center">
                <label htmlFor={`quantity-${item.id}`} className="sr-only">
                  Quantity for {item.name}
                </label>
                <input
                  id={`quantity-${item.id}`}
                  type="number"
                  min="0"
                  placeholder="0"
                  value={requests[item.id] || ''}
                  onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                  className="input text-sm"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="card mb-6">
          <label htmlFor="comments" className="form-label">
            Comments (optional)
          </label>
          <textarea
            id="comments"
            rows={4}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Add any special instructions or notes about your request..."
            className="input"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={totalItems === 0 || isSubmitting}
            className="btn-primary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : `Submit Request (${totalItems} items)`}
          </button>
        </div>
      </form>
    </div>
  );
}
