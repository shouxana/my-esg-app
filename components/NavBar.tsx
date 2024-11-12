import React from 'react';

interface NavbarProps {
  email?: string;
  onLogout: () => void;
}

const Navbar = ({ email, onLogout }: NavbarProps) => {
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold">Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">{email}</span>
            <button
              onClick={onLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;