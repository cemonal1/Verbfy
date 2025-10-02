import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  HomeIcon, 
  UsersIcon, 
  DocumentTextIcon, 
  ClockIcon,
  ChartBarIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

interface AdminSidebarProps {
  className?: string;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ className = '' }) => {
  const router = useRouter();
  const currentPath = router.pathname;

  const navigation = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: HomeIcon,
      current: currentPath === '/admin'
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: UsersIcon,
      current: currentPath === '/admin/users'
    },
    {
      name: 'Teachers',
      href: '/admin/teachers',
      icon: AcademicCapIcon,
      current: currentPath === '/admin/teachers'
    },
    {
      name: 'Materials',
      href: '/admin/materials',
      icon: DocumentTextIcon,
      current: currentPath === '/admin/materials'
    },
    // Payments section hidden (region unsupported)
    {
      name: 'Logs',
      href: '/admin/logs',
      icon: ClockIcon,
      current: currentPath === '/admin/logs'
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: ChartBarIcon,
      current: currentPath === '/analytics'
    }
  ];

  return (
    <div className={`bg-white shadow-sm border-r border-gray-200 ${className}`}>
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Admin Panel</h2>
        <nav className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                  ${item.current
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <Icon
                  className={`
                    mr-3 h-5 w-5 flex-shrink-0
                    ${item.current
                      ? 'text-blue-700'
                      : 'text-gray-400 group-hover:text-gray-500'
                    }
                  `}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      
      {/* Admin Info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-sm font-medium text-white">A</span>
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">Admin</p>
            <p className="text-xs text-gray-500">Platform Administrator</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;