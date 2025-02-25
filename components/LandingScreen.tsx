import React from 'react';
import { Leaf, Users, Scale, FileText, LogOut } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

interface LandingScreenProps {
  onViewSelect: (view: 'environmental' | 'social' | 'governance' | 'export') => void;
  userData: {
    email: string;
    company: string;
    user_name: string;
    user_lastname: string;
  } | null;
  onLogout: () => void;
}

const LandingScreen: React.FC<LandingScreenProps> = ({ onViewSelect, userData, onLogout }) => {
  const router = useRouter();

  // Helper function to format name with proper capitalization
  const formatName = (user_name: string) => {
    if (!user_name) return '';
    try {
      // First decode from URI encoding if needed
      const decodedName = decodeURIComponent(user_name);
      // Format with first letter capitalized
      return decodedName.charAt(0).toUpperCase() + decodedName.slice(1).toLowerCase();
    } catch {
      // If decoding fails, just capitalize first letter
      return user_name.charAt(0).toUpperCase() + user_name.slice(1).toLowerCase();
    }
  };

  // Format both first and last names
  const formattedFirstName = userData?.user_name ? formatName(userData.user_name) : '';
  const formattedLastName = userData?.user_lastname ? formatName(userData.user_lastname) : '';

  const handleViewSelect = (viewId: 'environmental' | 'social' | 'governance' | 'export') => {
    const selectedView = views.find(v => v.id === viewId);
    if (selectedView && !selectedView.isComingSoon) {
      onViewSelect(viewId);
      const params = new URLSearchParams(window.location.search);
      params.set('view', viewId);
      router.push(`${window.location.pathname}?${params.toString()}`);
    }
  };

  const views = [
    {
      id: 'environmental' as const,
      label: 'Environmental',
      icon: Leaf,
      color: 'bg-emerald-600',
      hoverColor: 'hover:bg-emerald-700',
      description: 'Track and manage environmental metrics, carbon footprint, and sustainability initiatives.',
      isComingSoon: false
    },
    {
      id: 'social' as const,
      label: 'Social',
      icon: Users,
      color: 'bg-blue-600',
      hoverColor: 'hover:bg-blue-700',
      description: 'Monitor social impact, employee engagement, and community initiatives.',
      isComingSoon: false
    },
    {
      id: 'governance' as const,
      label: 'Governance',
      icon: Scale,
      color: 'bg-purple-700',
      hoverColor: 'hover:bg-purple-800',
      description: 'Oversee corporate governance, compliance, and risk management.',
      isComingSoon: false
    },
    {
      id: 'export' as const,
      label: 'Generate Report',
      icon: FileText,
      color: 'bg-orange-600/50',
      hoverColor: 'hover:bg-orange-700',
      description: 'Generate and export comprehensive ESG reports based on your data.',
      isComingSoon: true
    }
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <div className="absolute top-4 left-4">
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="mb-6">
            <div className="w-20 h-20 bg-slate-800 rounded-xl mx-auto flex items-center justify-center">
              <span className="text-white text-2xl font-bold">ESG</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Welcome to ESG Dashboard
          </h1>
          <p className="text-lg text-slate-600 mb-2">
            Hello, {formattedFirstName} {formattedLastName}
          </p>
          <p className="text-slate-600">
            Select a module below to start managing your ESG initiatives
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {views.map((view) => {
            const Icon = view.icon;
            return (
              <Card 
                key={view.id}
                className={`relative overflow-hidden transition-shadow ${
                  view.isComingSoon 
                    ? 'cursor-not-allowed opacity-75 bg-gray-50' 
                    : 'hover:shadow-lg cursor-pointer'
                }`}
                onClick={() => !view.isComingSoon && handleViewSelect(view.id)}
              >
                <CardContent className="p-6">
                  <div className={`inline-flex p-3 rounded-lg ${view.color} mb-4 ${
                    view.isComingSoon ? 'opacity-60' : ''
                  }`}>
                    <Icon className={`h-6 w-6 ${view.isComingSoon ? 'text-gray-100' : 'text-white'}`} />
                  </div>
                  <h2 className={`text-xl font-semibold mb-3 flex items-center gap-2 ${
                    view.isComingSoon ? 'text-gray-500' : ''
                  }`}>
                    {view.label}
                    {view.isComingSoon && (
                      <span className="text-xs px-2 py-1 bg-orange-50 text-orange-500 rounded-full font-normal">
                        Coming Soon
                      </span>
                    )}
                  </h2>
                  <p className={`text-sm ${view.isComingSoon ? 'text-gray-400' : 'text-slate-600'}`}>
                    {view.description}
                  </p>
                  <div className={`absolute bottom-0 left-0 w-full h-1 ${view.color} ${
                    view.isComingSoon ? 'opacity-40' : ''
                  }`} />
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* <div className="mt-12 text-center text-sm text-slate-500">
          <p>Reporting for: {userData?.company}</p>
        </div> */}
      </div>
    </div>
  );
};

export default LandingScreen;