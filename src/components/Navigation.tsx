'use client';

import { User } from '@/types/stock';

interface NavigationProps {
  currentPanel: string;
  onPanelChange: (panel: string) => void;
  currentUser: User | null;
}

export default function Navigation({ currentPanel, onPanelChange, currentUser }: NavigationProps) {
  const allNavigationItems = [
    {
      id: 'admin',
      name: 'Admin Panel',
      description: 'Manage users and roles',
      icon: '👥',
      allowedRoles: ['admin']
    },
    {
      id: 'store-manager',
      name: 'Store Manager',
      description: 'Request stock items',
      icon: '📦',
      allowedRoles: ['admin', 'store-manager']
    },
    {
      id: 'warehouse-manager',
      name: 'Warehouse Manager',
      description: 'Process stock requests',
      icon: '🏭',
      allowedRoles: ['admin', 'warehouse-manager']
    }
  ];

  const navigationItems = allNavigationItems.filter(item => 
    currentUser && item.allowedRoles.includes(currentUser.role)
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 min-h-screen" style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}>
        <div className="p-6">
          {/* Brand Header */}
          <div className="mb-8">
            <div className="mb-3">
              <img 
                src="/logo.png" 
                alt="THRUART Logo" 
                className="h-12 w-auto object-contain"
              />
            </div>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Inventory Management</p>
          </div>
          
          <nav className="space-y-2">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onPanelChange(item.id)}
                className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${
                  currentPanel === item.id
                    ? 'shadow-md'
                    : 'hover:shadow-sm'
                }`}
                style={currentPanel === item.id ? {
                  background: 'linear-gradient(135deg, var(--sage-green) 0%, var(--slate) 100%)',
                  color: 'var(--text-inverse)',
                } : {
                  background: 'var(--surface-hover)',
                  color: 'var(--text-secondary)',
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl" style={{ 
                    filter: currentPanel === item.id ? 'none' : 'grayscale(30%)' 
                  }}>
                    {item.icon}
                  </span>
                  <div>
                    <div className="font-semibold text-sm">{item.name}</div>
                    <div className="text-xs mt-0.5" style={{ 
                      opacity: 0.8 
                    }}>
                      {item.description}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 safe-area-bottom" style={{ 
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <nav className="flex justify-around items-center h-16">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onPanelChange(item.id)}
              className={`flex-1 flex flex-col items-center justify-center h-full transition-all duration-200`}
              style={currentPanel === item.id ? {
                color: 'var(--primary)',
                background: 'var(--primary-light)',
                borderTop: '2px solid var(--primary)'
              } : {
                color: 'var(--text-tertiary)',
                borderTop: '2px solid transparent'
              }}
            >
              <span className="text-2xl mb-0.5">{item.icon}</span>
              <span className="text-xs font-medium">{item.name.split(' ')[0]}</span>
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}

