'use client';

import { useState } from 'react';
import { StockItem, StockRequestSubmission, WarehouseInventory, User } from '@/types/stock';
import EditRequestModal from './EditRequestModal';
import ConfirmModal from './ConfirmModal';
import * as db from '@/lib/database-client';

interface StoreManagerRequestsProps {
  requests: StockRequestSubmission[];
  stockItems: StockItem[];
  inventory: WarehouseInventory[];
  currentUser: User | null;
  onRefresh: () => void;
}

export default function StoreManagerRequests({
  requests,
  stockItems,
  inventory,
  currentUser,
  onRefresh
}: StoreManagerRequestsProps) {
  const [editingRequest, setEditingRequest] = useState<StockRequestSubmission | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState<{ requestId: string; requestDisplay: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'shipped' | 'rejected' | 'cancelled'>('all');

  // Filter requests for current user's store
  const myRequests = currentUser?.storeLocation
    ? requests.filter(req => req.storeLocation === currentUser.storeLocation)
    : currentUser?.role === 'admin'
    ? requests
    : [];

  // Apply search and filters
  const filteredRequests = myRequests.filter(req => {
    // Status filter
    if (statusFilter !== 'all' && req.status !== statusFilter) return false;
    
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const requestNumber = String(req.requestNumber || '').padStart(3, '0');
      const matchesNumber = requestNumber.includes(searchLower);
      const matchesStore = req.storeLocation.toLowerCase().includes(searchLower);
      const matchesComments = req.comments.toLowerCase().includes(searchLower);
      
      if (!matchesNumber && !matchesStore && !matchesComments) return false;
    }
    
    return true;
  });

  const getItemName = (itemId: string) => {
    const item = stockItems.find(si => si.id === itemId);
    return item ? item.name : 'Unknown Item';
  };

  const getItemSku = (itemId: string) => {
    const item = stockItems.find(si => si.id === itemId);
    return item ? item.sku : '';
  };

  const handleEditRequest = async (requestId: string, updates: any) => {
    try {
      await db.updateStockRequest(requestId, updates);
      onRefresh();
    } catch (error) {
      console.error('Error updating request:', error);
      throw error;
    }
  };

  const handleCancelRequest = (requestId: string, requestNumber?: number) => {
    const requestDisplay = requestNumber ? `#${String(requestNumber).padStart(3, '0')}` : `#${requestId.slice(0, 8)}`;
    setCancelConfirm({ requestId, requestDisplay });
  };

  const confirmCancel = async () => {
    if (!cancelConfirm) return;

    try {
      await db.updateRequestStatus(cancelConfirm.requestId, 'cancelled');
      onRefresh();
      setCancelConfirm(null);
    } catch (error) {
      console.error('Error cancelling request:', error);
      // Error will be shown via toast from parent
      setCancelConfirm(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'accepted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'accepted': return '✅';
      case 'shipped': return '📦';
      case 'rejected': return '❌';
      case 'cancelled': return '🚫';
      default: return '❓';
    }
  };

  if (!currentUser) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-600">Please log in to view your requests.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">My Requests</h2>
        <p className="text-gray-600 mb-4">
          View and manage your stock requests for {currentUser.storeLocation || 'all locations'}
        </p>

        {/* Search and Filter */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by request number, store, or comments..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex flex-wrap gap-2">
            {(['all', 'pending', 'accepted', 'shipped', 'rejected', 'cancelled'] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          {/* Results Count */}
          <div className="text-sm text-gray-600">
            Showing {filteredRequests.length} of {myRequests.length} requests
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500 text-lg">No requests found</p>
            <p className="text-gray-400 text-sm mt-2">
              Create a new stock request to get started
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <div
                key={request.id}
                className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Request #{String(request.requestNumber || 0).padStart(3, '0')}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(request.status)}`}>
                        {getStatusIcon(request.status)} {request.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Submitted: {new Date(request.submittedAt).toLocaleString()}
                    </p>
                    {request.processedAt && (
                      <p className="text-sm text-gray-600">
                        Processed: {new Date(request.processedAt).toLocaleString()}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {request.status === 'pending' && (
                      <>
                        <button
                          onClick={() => setEditingRequest(request)}
                          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleCancelRequest(request.id, request.requestNumber)}
                          className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-400 transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Items:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {request.items.map((item) => (
                      <div key={item.itemId} className="bg-gray-50 rounded-md p-3 text-sm">
                        <p className="font-medium text-gray-900">{getItemName(item.itemId)}</p>
                        <p className="text-gray-600">SKU: {getItemSku(item.itemId)}</p>
                        <p className="text-gray-900 font-medium mt-1">
                          Quantity: {item.requestedQuantity}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Comments */}
                {request.comments && (
                  <div className="pt-3 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Comments:</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded-md">
                      {request.comments}
                    </p>
                  </div>
                )}

                {/* Rejection Reason */}
                {request.status === 'rejected' && request.rejectionReason && (
                  <div className="pt-3 border-t border-gray-200 mt-3">
                    <h4 className="text-sm font-medium text-red-900 mb-1">Rejection Reason:</h4>
                    <p className="text-sm text-red-800 bg-red-50 p-3 rounded-md border border-red-200">
                      {request.rejectionReason}
                    </p>
                  </div>
                )}

                {/* Warehouse Notes */}
                {request.warehouseNotes && (
                  <div className="pt-3 border-t border-gray-200 mt-3">
                    <h4 className="text-sm font-medium text-blue-900 mb-1">Warehouse Notes:</h4>
                    <p className="text-sm text-blue-800 bg-blue-50 p-3 rounded-md border border-blue-200">
                      {request.warehouseNotes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingRequest && (
        <EditRequestModal
          request={editingRequest}
          stockItems={stockItems}
          inventory={inventory}
          onSave={handleEditRequest}
          onCancel={() => setEditingRequest(null)}
        />
      )}

      {/* Cancel Confirmation Modal */}
      {cancelConfirm && (
        <ConfirmModal
          title="Cancel Request"
          message={`Are you sure you want to cancel Request ${cancelConfirm.requestDisplay}?\n\nThis action cannot be undone.`}
          confirmLabel="Cancel Request"
          cancelLabel="Keep Request"
          confirmColor="red"
          onConfirm={confirmCancel}
          onCancel={() => setCancelConfirm(null)}
        />
      )}
    </div>
  );
}

