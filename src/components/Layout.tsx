'use client';

import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import Navigation from './Navigation';
import StoreManagerPanel from './StoreManagerPanel';
import WarehouseManagerPanel from './WarehouseManagerPanel';
import AdminPanel from './AdminPanel';
import ToastContainer from './ToastContainer';
import { StockRequestSubmission, WarehouseInventory, StockItem, User } from '@/types/stock';
import * as db from '@/lib/database-client';
import { useToast } from '@/hooks/useToast';
interface LayoutProps {
  authMode: 'legacy' | 'nextauth';
  authenticatedUser?: User | null;
}

export default function Layout({ authMode, authenticatedUser }: LayoutProps) {
  const [currentPanel, setCurrentPanel] = useState('admin');
  const [requests, setRequests] = useState<StockRequestSubmission[]>([]);
  const [inventory, setInventory] = useState<WarehouseInventory[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toasts, removeToast, success, error } = useToast();

  // Load data from database on component mount
  useEffect(() => {
    loadAllData();
  }, []);

  // Set current user when authenticatedUser changes (for NextAuth)
  useEffect(() => {
    if (authMode === 'nextauth' && authenticatedUser) {
      setCurrentUser(authenticatedUser);
      setCurrentPanel(getDefaultPanel(authenticatedUser.role));
    }
  }, [authMode, authenticatedUser]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      
      // Add timeout to prevent infinite loading (increased to 30 seconds)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database timeout')), 30000)
      );
      
      const dataPromise = Promise.all([
        db.getUsers(),
        db.getStockItems(),
        db.getWarehouseInventory(),
        db.getStockRequests()
      ]);
      
      const [usersData, stockItemsData, inventoryData, requestsData] = await Promise.race([
        dataPromise,
        timeoutPromise
      ]) as [any[], any[], any[], any[]];

      setUsers(usersData);
      setStockItems(stockItemsData);
      setInventory(inventoryData);
      setRequests(requestsData);
      
      // Set default user based on auth mode (only if not already set)
      if (authMode === 'legacy' && !currentUser) {
        const defaultUser = usersData.find(u => u.role === 'admin') || usersData[0];
        if (defaultUser) {
          setCurrentUser(defaultUser);
          setCurrentPanel(getDefaultPanel(defaultUser.role));
        }
      } else if (authMode === 'nextauth' && authenticatedUser && !currentUser) {
        setCurrentUser(authenticatedUser);
        setCurrentPanel(getDefaultPanel(authenticatedUser.role));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      
      // Set empty data to allow app to continue
      setUsers([]);
      setStockItems([]);
      setInventory([]);
      setRequests([]);
      
      // Still set a default panel
      if (authMode === 'nextauth' && authenticatedUser) {
        setCurrentUser(authenticatedUser);
        setCurrentPanel(getDefaultPanel(authenticatedUser.role));
      } else {
        setCurrentPanel('admin');
      }
      
      error('Error loading data from database. The app will continue with empty data.');
    } finally {
      setLoading(false);
    }
  };

  const addNewRequest = async (newRequest: StockRequestSubmission) => {
    try {
      await db.createStockRequest(newRequest);
      // Only reload requests (not all data)
      const updatedRequests = await db.getStockRequests();
      setRequests(updatedRequests);
      success('Stock request submitted successfully!');
    } catch (err) {
      console.error('Error creating request:', err);
      error('Error creating stock request. Please try again.');
    }
  };

  const addStock = async (itemId: string, quantity: number) => {
    try {
      await db.addStock(itemId, quantity);
      // Only reload inventory (not all data)
      const updatedInventory = await db.getWarehouseInventory();
      setInventory(updatedInventory);
      success('Stock added successfully!');
    } catch (err) {
      console.error('Error adding stock:', err);
      error('Error adding stock. Please try again.');
    }
  };

  const createNewProduct = async (product: Omit<StockItem, 'id'>, initialQuantity: number) => {
    try {
      await db.createNewProduct(product, initialQuantity);
      // Reload both stock items and inventory
      const [updatedStockItems, updatedInventory] = await Promise.all([
        db.getStockItems(),
        db.getWarehouseInventory()
      ]);
      setStockItems(updatedStockItems);
      setInventory(updatedInventory);
      success(`Product "${product.name}" created successfully!`);
    } catch (err) {
      console.error('Error creating product:', err);
      error('Error creating new product. Please try again.');
    }
  };

  const createUser = async (userData: Omit<User, 'id' | 'createdAt'> & { password?: string }) => {
    try {
      await db.createUser(userData);
      // Only reload users (not all data)
      const updatedUsers = await db.getUsers();
      setUsers(updatedUsers);
      success(`User "${userData.name}" created successfully!`);
    } catch (err) {
      console.error('Error creating user:', err);
      error('Error creating user. Please try again.');
    }
  };

  const updateUser = async (userId: string, updates: Partial<User> & { password?: string }) => {
    try {
      await db.updateUser(userId, updates);
      // Reload users to get the latest data
      const updatedUsers = await db.getUsers();
      setUsers(updatedUsers);
      success('User updated successfully!');
    } catch (err) {
      console.error('Error updating user:', err);
      error('Error updating user. Please try again.');
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await db.deleteUser(userId);
      // Reload users to get the latest data
      const updatedUsers = await db.getUsers();
      setUsers(updatedUsers);
      success('User deleted successfully!');
    } catch (err) {
      console.error('Error deleting user:', err);
      error('Error deleting user. Please try again.');
    }
  };

  const deleteProduct = async (itemId: string) => {
    try {
      await db.deleteProduct(itemId);
      // Reload both stock items and inventory
      const [updatedStockItems, updatedInventory] = await Promise.all([
        db.getStockItems(),
        db.getWarehouseInventory()
      ]);
      setStockItems(updatedStockItems);
      setInventory(updatedInventory);
      success('Product deleted successfully!');
    } catch (err) {
      console.error('Error deleting product:', err);
      error('Error deleting product. Please try again.');
    }
  };

  const deleteRequest = async (requestId: string) => {
    try {
      await db.deleteStockRequest(requestId);
      // Only reload requests (not all data)
      const updatedRequests = await db.getStockRequests();
      setRequests(updatedRequests);
      success('Request deleted successfully!');
    } catch (err) {
      console.error('Error deleting request:', err);
      error('Error deleting request. Please try again.');
    }
  };

  const getDefaultPanel = (role: string) => {
    switch (role) {
      case 'admin': return 'admin';
      case 'warehouse-manager': return 'warehouse-manager';
      case 'store-manager': return 'store-manager';
      default: return 'admin';
    }
  };

  const handleUserChange = (user: User) => {
    setCurrentUser(user);
    setCurrentPanel(getDefaultPanel(user.role));
  };

  const updateRequestStatus = async (requestId: string, newStatus: 'pending' | 'accepted' | 'shipped') => {
    try {
      await db.updateRequestStatus(requestId, newStatus);
      // Reload both requests and inventory to get updated data
      const [updatedRequests, updatedInventory] = await Promise.all([
        db.getStockRequests(),
        db.getWarehouseInventory()
      ]);
      setRequests(updatedRequests);
      setInventory(updatedInventory);
      success(`Request status updated to "${newStatus}"!`);
    } catch (err) {
      console.error('Error updating request status:', err);
      error('Error updating request status. Please try again.');
    }
  };

  const renderPanel = () => {
    switch (currentPanel) {
      case 'admin':
        return (
          <AdminPanel 
            users={users}
            onCreateUser={createUser}
            onUpdateUser={updateUser}
            onDeleteUser={deleteUser}
          />
        );
      case 'store-manager':
        return (
          <StoreManagerPanel 
            requests={requests}
            onRequestSubmit={addNewRequest}
            inventory={inventory}
            stockItems={stockItems}
            currentUser={currentUser}
            onRefreshData={loadAllData}
          />
        );
      case 'warehouse-manager':
        return (
          <WarehouseManagerPanel 
            requests={requests}
            inventory={inventory}
            stockItems={stockItems}
            onUpdateRequestStatus={updateRequestStatus}
            onAddStock={addStock}
            onCreateNewProduct={createNewProduct}
            onDeleteProduct={deleteProduct}
            onDeleteRequest={deleteRequest}
            onRefreshData={loadAllData}
          />
        );
      default:
        return (
          <AdminPanel 
            users={users}
            onCreateUser={createUser}
            onUpdateUser={updateUser}
            onDeleteUser={deleteUser}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 mx-auto mb-4" style={{ 
            border: '3px solid var(--border)',
            borderTopColor: 'var(--primary)'
          }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading data from database...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="flex min-h-screen" style={{ background: 'var(--background)' }}>
        <Navigation 
          currentPanel={currentPanel} 
          onPanelChange={setCurrentPanel}
          currentUser={currentUser}
        />
        <div className="flex-1 pb-16 md:pb-0">
          {/* User Info Header */}
          {authMode === 'legacy' ? (
            /* Legacy User Selector */
            <div className="p-4" style={{ 
              background: 'var(--surface)', 
              borderBottom: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Current User:</span>
                  <select
                    value={currentUser?.id || ''}
                    onChange={(e) => {
                      const user = users.find(u => u.id === e.target.value);
                      if (user) handleUserChange(user);
                    }}
                    className="px-3 py-2 rounded-lg text-sm font-medium"
                    style={{
                      background: 'var(--surface-hover)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.role.replace('-', ' ')})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  Role: <span className="font-semibold" style={{ color: 'var(--primary)' }}>{currentUser?.role.replace('-', ' ')}</span>
                  {currentUser?.storeLocation && (
                    <span> • Store: <span className="font-semibold" style={{ color: 'var(--primary)' }}>{currentUser.storeLocation}</span></span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* NextAuth User Info */
            <div className="p-4" style={{ 
              background: 'var(--surface)', 
              borderBottom: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Logged in as:</span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {authenticatedUser?.name || authenticatedUser?.email}
                  </span>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                    Role: <span className="font-semibold" style={{ color: 'var(--primary)' }}>{currentUser?.role.replace('-', ' ')}</span>
                    {currentUser?.storeLocation && (
                      <span> • Store: <span className="font-semibold" style={{ color: 'var(--primary)' }}>{currentUser.storeLocation}</span></span>
                    )}
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="text-sm font-medium hover:opacity-80 transition-opacity"
                    style={{ color: 'var(--error)' }}
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}
          {renderPanel()}
        </div>
      </div>
    </>
  );
}
