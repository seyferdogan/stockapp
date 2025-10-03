'use client';

import { useState } from 'react';
import { StockItem, StockRequestSubmission, WarehouseInventory, User } from '@/types/stock';
import StockRequestForm from './StockRequestForm';
import StoreManagerRequests from './StoreManagerRequests';

interface StoreManagerPanelProps {
  requests: StockRequestSubmission[];
  inventory: WarehouseInventory[];
  stockItems: StockItem[];
  currentUser: User | null;
  onRequestSubmit: (request: StockRequestSubmission) => void;
  onRefreshData: () => void;
}

export default function StoreManagerPanel({
  requests,
  inventory,
  stockItems,
  currentUser,
  onRequestSubmit,
  onRefreshData
}: StoreManagerPanelProps) {
  const [activeTab, setActiveTab] = useState<'create' | 'view'>('create');

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header with Tabs */}
        <div className="card mb-6" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ borderBottom: '1px solid var(--border)' }}>
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('create')}
                className="px-6 py-4 text-sm font-medium border-b-2 transition-colors"
                style={activeTab === 'create' ? {
                  borderColor: 'var(--primary)',
                  color: 'var(--primary)',
                  background: 'var(--primary-light)'
                } : {
                  borderColor: 'transparent',
                  color: 'var(--text-secondary)',
                  background: 'transparent'
                }}
              >
                <span className="flex items-center gap-2">
                  <span className="text-xl">➕</span>
                  <span>Create Request</span>
                </span>
              </button>
              <button
                onClick={() => setActiveTab('view')}
                className="px-6 py-4 text-sm font-medium border-b-2 transition-colors"
                style={activeTab === 'view' ? {
                  borderColor: 'var(--primary)',
                  color: 'var(--primary)',
                  background: 'var(--primary-light)'
                } : {
                  borderColor: 'transparent',
                  color: 'var(--text-secondary)',
                  background: 'transparent'
                }}
              >
                <span className="flex items-center gap-2">
                  <span className="text-xl">📋</span>
                  <span>My Requests</span>
                  <span 
                    className="ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium"
                    style={{
                      background: 'var(--surface-hover)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    {currentUser?.storeLocation
                      ? requests.filter(r => r.storeLocation === currentUser.storeLocation).length
                      : requests.length}
                  </span>
                </span>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'create' ? (
          <StockRequestForm
            onRequestSubmit={onRequestSubmit}
            inventory={inventory}
            stockItems={stockItems}
            currentUser={currentUser}
          />
        ) : (
          <StoreManagerRequests
            requests={requests}
            stockItems={stockItems}
            inventory={inventory}
            currentUser={currentUser}
            onRefresh={onRefreshData}
          />
        )}
      </div>
    </div>
  );
}

