import React from 'react';
import { FormInput, BarChart2, FileText, Home, LogOut } from 'lucide-react';

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  isActive?: boolean;
  onClick: () => void;
  color?: string;
}

const NavItem = ({ icon: Icon, label, isActive, onClick, color = 'text-white' }: NavItemProps) => (
  <div className="relative group">
    <button
      onClick={onClick}
      className={`w-full p-3 rounded-lg flex items-center justify-center transition-all
        ${isActive 
          ? 'bg-white/10 shadow-inner' 
          : 'hover:bg-white/5'
        }
      `}
    >
      <Icon className={`h-5 w-5 ${color}`} />
    </button>
    
    {/* Tooltip */}
    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded
      opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap
      top-1/2 transform -translate-y-1/2 z-50">
      {label}
    </div>
  </div>
);

interface ModuleNavigationProps {
  activeTab: 'input' | 'visuals' | 'pdfs';
  onTabChange: (tab: 'input' | 'visuals' | 'pdfs') => void;
  onReturnHome: () => void;
  onLogout: () => void;
  moduleColor?: string; // To customize the active color based on module
}

const ModuleNavigation: React.FC<ModuleNavigationProps> = ({
  activeTab,
  onTabChange,
  onReturnHome,
  onLogout,
  moduleColor = 'text-blue-400' // Default to blue if no color provided
}) => {
  return (
    <div className="w-16 bg-slate-800 flex flex-col items-center py-6">
      {/* Logo/Brand */}
      <div className="mb-8">
        <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
          <span className="text-white text-sm font-bold">ESG</span>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 w-full space-y-2 px-2">
        <NavItem
          icon={FormInput}
          label="Data Input"
          isActive={activeTab === 'input'}
          onClick={() => onTabChange('input')}
          color={activeTab === 'input' ? moduleColor : 'text-white'}
        />
        <NavItem
          icon={BarChart2}
          label="Visuals"
          isActive={activeTab === 'visuals'}
          onClick={() => onTabChange('visuals')}
          color={activeTab === 'visuals' ? moduleColor : 'text-white'}
        />
        <NavItem
          icon={FileText}
          label="Documents"
          isActive={activeTab === 'pdfs'}
          onClick={() => onTabChange('pdfs')}
          color={activeTab === 'pdfs' ? moduleColor : 'text-white'}
        />
      </div>

      {/* Bottom Actions */}
      <div className="w-full px-2 space-y-2">
        <NavItem
          icon={Home}
          label="Return Home"
          onClick={onReturnHome}
        />
        <NavItem
          icon={LogOut}
          label="Logout"
          onClick={onLogout}
          color="text-red-400"
        />
      </div>
    </div>
  );
};

export default ModuleNavigation;