'use client';

import { useState } from 'react';
import { User, UserRole } from '@/types/stock';
import EmptyState from './EmptyState';

interface AdminPanelProps {
  users: User[];
  onCreateUser: (user: Omit<User, 'id' | 'createdAt'> & { password?: string }) => void;
  onUpdateUser: (userId: string, updates: Partial<User> & { password?: string }) => void;
  onDeleteUser: (userId: string) => void;
}

export default function AdminPanel({
  users,
  onCreateUser,
  onUpdateUser,
  onDeleteUser
}: AdminPanelProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editPassword, setEditPassword] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'store-manager' as UserRole,
    storeLocation: '',
    password: ''
  });

  const storeLocations = ['Sydney', 'Melbourne', 'Brisbane'];

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password) return;

    const userData = {
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      password: newUser.password,
      ...(newUser.role === 'store-manager' && newUser.storeLocation && {
        storeLocation: newUser.storeLocation
      })
    };

    onCreateUser(userData);
    setNewUser({ name: '', email: '', role: 'store-manager', storeLocation: '', password: '' });
    setShowCreateForm(false);
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const updates = {
      name: editingUser.name,
      email: editingUser.email,
      role: editingUser.role,
      ...(editingUser.role === 'store-manager' && editingUser.storeLocation && {
        storeLocation: editingUser.storeLocation
      }),
      ...(editPassword && { password: editPassword })
    };

    onUpdateUser(editingUser.id, updates);
    setEditingUser(null);
    setEditPassword('');
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin': 
        return { background: 'var(--error-light)', color: 'var(--error)', border: '1px solid var(--error)' };
      case 'warehouse-manager': 
        return { background: 'var(--info-light)', color: 'var(--info)', border: '1px solid var(--info)' };
      case 'store-manager': 
        return { background: 'var(--success-light)', color: 'var(--success)', border: '1px solid var(--success)' };
      default: 
        return { background: 'var(--surface-hover)', color: 'var(--text-tertiary)', border: '1px solid var(--border)' };
    }
  };

  const formatRole = (role: UserRole) => {
    return role.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Admin Panel</h1>
        <p className="page-subtitle">Manage users and assign roles</p>
        <div className="mt-4 card" style={{ background: 'var(--primary-light)', border: '1px solid var(--primary)' }}>
          <p className="text-sm font-medium" style={{ color: 'var(--primary)' }}>
            <strong>🔒 Security Note:</strong> Admin accounts can only be created through this panel. 
            Public signup is restricted to Store Manager and Warehouse Manager roles for security.
          </p>
        </div>
        <div className="mt-3 text-sm" style={{ color: 'var(--primary)' }}>
          {users.length} total users • {users.filter(u => u.role === 'admin').length} admins • {users.filter(u => u.role === 'warehouse-manager').length} warehouse managers • {users.filter(u => u.role === 'store-manager').length} store managers
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mb-6">
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn-primary"
        >
          Create New User
        </button>
      </div>

        {/* Create User Form */}
        {showCreateForm && (
          <div className="card mb-6">
            <h3 className="card-header">Create New User</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                    className="input"
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                    className="input"
                    placeholder="Enter email address"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">
                    Role
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value as UserRole, storeLocation: '' }))}
                    className="select"
                  >
                    <option value="store-manager">Store Manager</option>
                    <option value="warehouse-manager">Warehouse Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                {newUser.role === 'store-manager' && (
                  <div>
                    <label className="form-label">
                      Store Location
                    </label>
                    <select
                      value={newUser.storeLocation}
                      onChange={(e) => setNewUser(prev => ({ ...prev, storeLocation: e.target.value }))}
                      className="select"
                      required
                    >
                      <option value="">Select store location...</option>
                      {storeLocations.map(location => (
                        <option key={location} value={location}>{location}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="form-label">
                    Password
                  </label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                    className="input"
                    placeholder="Enter password"
                    required
                    minLength={8}
                  />
                  <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                    Password must be at least 8 characters long
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Create User
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Edit User Form */}
        {editingUser && (
          <div className="card mb-6">
            <h3 className="card-header">Edit User</h3>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editingUser.name}
                    onChange={(e) => setEditingUser(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser(prev => prev ? ({ ...prev, email: e.target.value }) : null)}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">
                    Role
                  </label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser(prev => prev ? ({ ...prev, role: e.target.value as UserRole, storeLocation: e.target.value !== 'store-manager' ? undefined : prev.storeLocation }) : null)}
                    className="select"
                  >
                    <option value="store-manager">Store Manager</option>
                    <option value="warehouse-manager">Warehouse Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                {editingUser.role === 'store-manager' && (
                  <div>
                    <label className="form-label">
                      Store Location
                    </label>
                    <select
                      value={editingUser.storeLocation || ''}
                      onChange={(e) => setEditingUser(prev => prev ? ({ ...prev, storeLocation: e.target.value }) : null)}
                      className="select"
                      required
                    >
                      <option value="">Select store location...</option>
                      {storeLocations.map(location => (
                        <option key={location} value={location}>{location}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="form-label">
                    New Password (optional)
                  </label>
                  <input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="input"
                    placeholder="Leave blank to keep current password"
                    minLength={8}
                  />
                  <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                    Leave blank to keep current password. New password must be at least 8 characters.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Update User
                </button>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search */}
        <div className="card">
          <div className="mb-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users by name, email, or role..."
              className="input"
            />
          </div>

          {/* Empty State */}
          {filteredUsers.length === 0 && (
            <EmptyState
              icon="👥"
              title="No users found"
              description={searchTerm ? "Try adjusting your search criteria" : "Create your first user to get started"}
            />
          )}

          {/* Desktop: Users Table */}
          {filteredUsers.length > 0 && (
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-strong)' }}>
                    <th className="table-header">Name</th>
                    <th className="table-header">Email</th>
                    <th className="table-header">Role</th>
                    <th className="table-header">Store Location</th>
                    <th className="table-header">Created</th>
                    <th className="table-header">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => {
                    const roleStyle = getRoleBadgeColor(user.role);
                    return (
                      <tr key={user.id} className="table-row">
                        <td className="table-cell font-semibold">{user.name}</td>
                        <td className="table-cell">{user.email}</td>
                        <td className="table-cell">
                          <span className="badge" style={roleStyle}>
                            {formatRole(user.role)}
                          </span>
                        </td>
                        <td className="table-cell">
                          {user.storeLocation || '-'}
                        </td>
                        <td className="table-cell">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="table-cell">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingUser(user)}
                              className="text-sm font-semibold hover:opacity-80 transition-opacity"
                              style={{ color: 'var(--primary)' }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => onDeleteUser(user.id)}
                              className="text-sm font-semibold hover:opacity-80 transition-opacity"
                              style={{ color: 'var(--error)' }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Mobile: Users Cards */}
          {filteredUsers.length > 0 && (
            <div className="md:hidden space-y-4">
              {filteredUsers.map(user => {
                const roleStyle = getRoleBadgeColor(user.role);
                return (
                  <div 
                    key={user.id} 
                    className="rounded-xl p-4"
                    style={{ 
                      background: 'var(--surface-hover)', 
                      border: '1px solid var(--border)' 
                    }}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
                          {user.name}
                        </h3>
                        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                          {user.email}
                        </p>
                      </div>
                      <span className="badge" style={roleStyle}>
                        {formatRole(user.role)}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      {user.storeLocation && (
                        <div className="flex items-center gap-2 text-sm">
                          <span style={{ color: 'var(--text-tertiary)' }}>Store:</span>
                          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                            {user.storeLocation}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <span style={{ color: 'var(--text-tertiary)' }}>Created:</span>
                        <span style={{ color: 'var(--text-primary)' }}>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div 
                      className="flex gap-2 pt-3"
                      style={{ borderTop: '1px solid var(--border)' }}
                    >
                      <button
                        onClick={() => setEditingUser(user)}
                        className="flex-1 px-4 py-2 text-sm font-semibold rounded-lg transition-all"
                        style={{
                          background: 'linear-gradient(135deg, var(--sage-green) 0%, var(--slate) 100%)',
                          color: 'var(--text-inverse)'
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDeleteUser(user.id)}
                        className="flex-1 px-4 py-2 text-sm font-semibold rounded-lg transition-all"
                        style={{
                          background: 'linear-gradient(135deg, var(--dusty-rose) 0%, var(--taupe) 100%)',
                          color: 'var(--text-inverse)'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
  );
}
