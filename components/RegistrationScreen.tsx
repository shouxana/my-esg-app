import React, { useState } from 'react';

interface RegistrationScreenProps {
  onRegistrationSuccess?: (userData: { email: string; company: string }) => void;
  onSwitchToLogin: () => void;
}

const RegistrationScreen: React.FC<RegistrationScreenProps> = ({ 
  onRegistrationSuccess,
  onSwitchToLogin 
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !company) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, company }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      onRegistrationSuccess?.(data);
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md w-full max-w-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-center">Register</h2>
      </div>
      <form onSubmit={handleRegister} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        )}
        
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="company" className="block text-sm font-medium text-gray-700">
            Company
          </label>
          <input
            id="company"
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full bg-blue-600 text-white py-2 px-4 rounded-md ${
            isLoading ? 'opacity-50' : 'hover:bg-blue-700'
          }`}
        >
          {isLoading ? 'Registering...' : 'Register'}
        </button>

        <div className="text-center mt-4">
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-blue-600 hover:text-blue-800"
          >
            Already have an account? Login
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegistrationScreen;