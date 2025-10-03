'use client';

import { useState } from 'react';
import { StockRequestSubmission, WarehouseInventory, RequestStatus, StockItem, User } from '@/types/stock';
import InventoryManagement from './InventoryManagement';
import FulfillRequest from './FulfillRequest';
import PartialAcceptanceModal from './PartialAcceptanceModal';
import RejectRequestModal from './RejectRequestModal';
import ConfirmModal from './ConfirmModal';
import * as db from '@/lib/database-client';
import { useSession } from 'next-auth/react';

interface WarehouseManagerPanelProps {
  requests: StockRequestSubmission[];
  inventory: WarehouseInventory[];
  stockItems: StockItem[];
  onUpdateRequestStatus: (requestId: string, newStatus: RequestStatus) => void;
  onAddStock: (itemId: string, quantity: number) => void;
  onCreateNewProduct: (product: Omit<StockItem, 'id'>, initialQuantity: number) => void;
  onDeleteProduct: (itemId: string) => void;
  onDeleteRequest: (requestId: string) => void;
  onRefreshData: () => void;
}

export default function WarehouseManagerPanel({ 
  requests, 
  inventory, 
  stockItems,
  onUpdateRequestStatus,
  onAddStock,
  onCreateNewProduct,
  onDeleteProduct,
  onDeleteRequest,
  onRefreshData
}: WarehouseManagerPanelProps) {
  const { data: session } = useSession();
  const currentUser = session?.user as User | null;
  
  const [activeTab, setActiveTab] = useState<'requests' | 'inventory'>('requests');
  const [fulfillingRequest, setFulfillingRequest] = useState<StockRequestSubmission | null>(null);
  const [acceptingRequest, setAcceptingRequest] = useState<StockRequestSubmission | null>(null);
  const [rejectingRequest, setRejectingRequest] = useState<StockRequestSubmission | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ requestId: string; requestDisplay: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'shipped' | 'rejected' | 'cancelled'>('all');
  const [storeFilter, setStoreFilter] = useState<string>('all');

  const getItemName = (itemId: string) => {
    const item = stockItems.find(item => item.id === itemId);
    return item ? item.name : 'Unknown Item';
  };

  const getItemSku = (itemId: string) => {
    const item = stockItems.find(item => item.id === itemId);
    return item ? item.sku : 'Unknown SKU';
  };

  const getAvailableQuantity = (itemId: string) => {
    const inventoryItem = inventory.find(item => item.itemId === itemId);
    return inventoryItem ? inventoryItem.availableQuantity : 0;
  };


  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case 'pending': 
        return { background: 'var(--warning-light)', color: 'var(--warning)', border: '1px solid var(--warning)' };
      case 'accepted': 
        return { background: 'var(--info-light)', color: 'var(--info)', border: '1px solid var(--info)' };
      case 'shipped': 
        return { background: 'var(--success-light)', color: 'var(--success)', border: '1px solid var(--success)' };
      case 'rejected': 
      case 'cancelled':
        return { background: 'var(--error-light)', color: 'var(--error)', border: '1px solid var(--error)' };
      default: 
        return { background: 'var(--surface-hover)', color: 'var(--text-tertiary)', border: '1px solid var(--border)' };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canAccept = (request: StockRequestSubmission) => {
    return request.status === 'pending' && request.items.every(item => 
      getAvailableQuantity(item.itemId) >= item.requestedQuantity
    );
  };

  const hasInsufficientStock = (request: StockRequestSubmission) => {
    return request.status === 'pending' && request.items.some(item => 
      getAvailableQuantity(item.itemId) < item.requestedQuantity
    );
  };

  const handleDeleteRequest = (requestId: string, requestNumber?: number) => {
    const requestDisplay = requestNumber ? `#${String(requestNumber).padStart(3, '0')}` : `#${requestId.slice(0, 8)}`;
    setDeleteConfirm({ requestId, requestDisplay });
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      onDeleteRequest(deleteConfirm.requestId);
      setDeleteConfirm(null);
    }
  };

  const handleAcceptWithModifications = async (
    requestId: string,
    modifiedItems: { itemId: string; requestedQuantity: number }[],
    warehouseNotes?: string
  ) => {
    try {
      // First update the request items if modified
      const originalRequest = requests.find(r => r.id === requestId);
      if (originalRequest && JSON.stringify(modifiedItems) !== JSON.stringify(originalRequest.items)) {
        await db.updateStockRequest(requestId, { items: modifiedItems });
      }
      
      // Then accept the request with notes
      await db.updateRequestStatus(requestId, 'accepted', {
        processedBy: currentUser?.id,
        warehouseNotes
      });
      
      onRefreshData();
    } catch (error) {
      console.error('Error accepting request:', error);
      throw error;
    }
  };

  const handleRejectRequest = async (requestId: string, reason: string) => {
    try {
      await db.updateRequestStatus(requestId, 'rejected', {
        processedBy: currentUser?.id,
        rejectionReason: reason
      });
      
      onRefreshData();
    } catch (error) {
      console.error('Error rejecting request:', error);
      throw error;
    }
  };

  // Get unique store locations for filter
  const storeLocations = Array.from(new Set(requests.map(r => r.storeLocation)));

  // Apply filters
  const filteredRequests = requests.filter(req => {
    // Status filter
    if (statusFilter !== 'all' && req.status !== statusFilter) return false;
    
    // Store filter
    if (storeFilter !== 'all' && req.storeLocation !== storeFilter) return false;
    
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

  const renderTabContent = () => {
    if (activeTab === 'requests') {
      return (
        <div className="space-y-6">
          {/* Search and Filter */}
          <div className="card space-y-4">
            {/* Search Bar */}
            <div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by request number, store, or comments..."
                className="input"
              />
            </div>

            {/* Filters Row */}
            <div className="flex flex-col md:flex-row gap-4">
              {/* Status Filter */}
              <div className="flex-1">
                <label className="form-label">Status</label>
                <div className="flex flex-wrap gap-2">
                  {(['all', 'pending', 'accepted', 'shipped', 'rejected', 'cancelled'] as const).map(status => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                      style={statusFilter === status ? {
                        background: 'linear-gradient(135deg, var(--sage-green) 0%, var(--slate) 100%)',
                        color: 'var(--text-inverse)'
                      } : {
                        background: 'var(--surface-hover)',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Store Filter */}
              <div className="flex-shrink-0 w-full md:w-48">
                <label className="form-label">Store</label>
                <select
                  value={storeFilter}
                  onChange={(e) => setStoreFilter(e.target.value)}
                  className="select"
                >
                  <option value="all">All Stores</option>
                  {storeLocations.map(store => (
                    <option key={store} value={store}>{store}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Results Count */}
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Showing {filteredRequests.length} of {requests.length} requests
            </div>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-lg font-medium" style={{ color: 'var(--text-secondary)' }}>No requests found</p>
              <p className="text-sm mt-2" style={{ color: 'var(--text-tertiary)' }}>Try adjusting your filters</p>
            </div>
          ) : (
            filteredRequests.map((request) => {
              const statusStyle = getStatusColor(request.status);
              return (
            <div key={request.id} className="card">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                        Request #{request.requestNumber ? String(request.requestNumber).padStart(3, '0') : request.id.slice(0, 8)}
                      </h3>
                      <span className="badge" style={statusStyle}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </div>
                    <div className="text-sm space-y-1" style={{ color: 'var(--text-secondary)' }}>
                      <p><span className="font-medium">Store:</span> {request.storeLocation}</p>
                      <p><span className="font-medium">Submitted:</span> {formatDate(request.submittedAt)}</p>
                      {request.processedAt && (
                        <p><span className="font-medium">Processed:</span> {formatDate(request.processedAt)}</p>
                      )}
                      {request.shippedAt && (
                        <p><span className="font-medium">Shipped:</span> {formatDate(request.shippedAt)}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {request.status === 'pending' && (
                      <>
                        <button
                          onClick={() => setAcceptingRequest(request)}
                          className="btn-primary text-sm"
                        >
                          ✓ Accept Request
                        </button>
                        <button
                          onClick={() => setRejectingRequest(request)}
                          className="btn-danger text-sm"
                        >
                          ✗ Reject
                        </button>
                      </>
                    )}
                    {request.status === 'accepted' && (
                      <>
                        <button
                          onClick={() => setFulfillingRequest(request)}
                          className="btn-accent text-sm flex items-center gap-2"
                        >
                          <span>📦</span>
                          <span>Fulfill Request</span>
                        </button>
                        <button
                          onClick={() => onUpdateRequestStatus(request.id, 'shipped')}
                          className="btn-primary text-sm"
                        >
                          Mark as Shipped
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDeleteRequest(request.id, request.requestNumber)}
                      className="btn-danger text-sm"
                    >
                      Delete Request
                    </button>
                  </div>
                </div>

                {hasInsufficientStock(request) && (
                  <div 
                    className="mb-4 p-3 rounded-md"
                    style={{
                      background: 'var(--error-light)',
                      border: '1px solid var(--error)',
                      color: 'var(--error)'
                    }}
                  >
                    <p className="text-sm font-medium">⚠️ Insufficient stock for some items</p>
                  </div>
                )}

                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Requested Items:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {request.items.map((item) => {
                      const available = getAvailableQuantity(item.itemId);
                      const insufficient = available < item.requestedQuantity;
                      
                      return (
                        <div 
                          key={item.itemId} 
                          className="p-3 rounded-md"
                          style={insufficient ? {
                            border: '1px solid var(--error)',
                            background: 'var(--error-light)'
                          } : {
                            border: '1px solid var(--border)',
                            background: 'var(--surface-hover)'
                          }}
                        >
                          <div className="text-sm">
                            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{getItemName(item.itemId)}</p>
                            <p style={{ color: 'var(--text-secondary)' }}>SKU: {getItemSku(item.itemId)}</p>
                            <div className="mt-1 flex justify-between">
                              <span style={{ color: 'var(--text-primary)' }}>Requested: <span className="font-medium">{item.requestedQuantity}</span></span>
                              <span style={insufficient ? { color: 'var(--error)', fontWeight: '600' } : { color: 'var(--text-primary)' }}>
                                Available: {available}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {request.comments && (
                  <div className="pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                    <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Comments:</h4>
                    <p 
                      className="text-sm p-3 rounded-md"
                      style={{
                        color: 'var(--text-secondary)',
                        background: 'var(--surface-hover)'
                      }}
                    >{request.comments}</p>
                  </div>
                )}
              </div>
            </div>
              );
            })
          )}
        </div>
      );
    } else {
      return (
        <InventoryManagement
          stockItems={stockItems}
          inventory={inventory}
          onAddStock={onAddStock}
          onCreateNewProduct={onCreateNewProduct}
          onDeleteProduct={onDeleteProduct}
          onRefreshData={onRefreshData}
        />
      );
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Warehouse Manager</h1>
        <p className="page-subtitle">Manage stock requests and inventory</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div style={{ borderBottom: '1px solid var(--border)' }}>
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('requests')}
              className="py-2 px-1 border-b-2 font-medium text-sm transition-colors"
              style={activeTab === 'requests' ? {
                borderColor: 'var(--primary)',
                color: 'var(--primary)'
              } : {
                borderColor: 'transparent',
                color: 'var(--text-secondary)'
              }}
            >
              Incoming Requests
              <span 
                className="ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium"
                style={{
                  background: 'var(--surface-hover)',
                  color: 'var(--text-primary)'
                }}
              >
                {requests.filter(r => r.status === 'pending').length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className="py-2 px-1 border-b-2 font-medium text-sm transition-colors"
              style={activeTab === 'inventory' ? {
                borderColor: 'var(--primary)',
                color: 'var(--primary)'
              } : {
                borderColor: 'transparent',
                color: 'var(--text-secondary)'
              }}
            >
              Manage Inventory
              <span 
                className="ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium"
                style={{
                  background: 'var(--surface-hover)',
                  color: 'var(--text-primary)'
                }}
              >
                {stockItems.length}
              </span>
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {renderTabContent()}

      {/* Fulfill Request Modal */}
      {fulfillingRequest && (
        <FulfillRequest
          request={fulfillingRequest}
          stockItems={stockItems}
          inventory={inventory}
          onClose={() => setFulfillingRequest(null)}
          onComplete={() => {
            onRefreshData();
            setFulfillingRequest(null);
          }}
        />
      )}

      {/* Partial Acceptance Modal */}
      {acceptingRequest && (
        <PartialAcceptanceModal
          request={acceptingRequest}
          stockItems={stockItems}
          inventory={inventory}
          currentUser={currentUser}
          onAccept={handleAcceptWithModifications}
          onCancel={() => setAcceptingRequest(null)}
        />
      )}

      {/* Reject Request Modal */}
      {rejectingRequest && (
        <RejectRequestModal
          request={rejectingRequest}
          currentUser={currentUser}
          onReject={handleRejectRequest}
          onCancel={() => setRejectingRequest(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <ConfirmModal
          title="Delete Request"
          message={`Are you sure you want to delete Request ${deleteConfirm.requestDisplay}?\n\nThis action cannot be undone.`}
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
