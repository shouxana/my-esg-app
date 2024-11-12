import React, { useState, useEffect } from 'react';

interface LoginScreenProps {
  onLoginSuccess?: (userData: { email: string; company: string }) => void;
  onSwitchToRegister: () => void;  // Add this line
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onSwitchToRegister }) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const sessionIsLoggedIn = sessionStorage.getItem('isLoggedIn');
    const sessionUserData = sessionStorage.getItem('userData');
    if (sessionIsLoggedIn === 'true' && sessionUserData) {
      setIsLoggedIn(true);
      onLoginSuccess?.(JSON.parse(sessionUserData));
    }
  }, [onLoginSuccess]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      const userData = {
        email: data.email,
        company: data.company,
      };
      
      setIsLoggedIn(true);
      sessionStorage.setItem('isLoggedIn', 'true');
      sessionStorage.setItem('userData', JSON.stringify(userData));
      onLoginSuccess?.(userData);
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoggedIn) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md w-full max-w-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-center">Login</h2>
      </div>
      <form onSubmit={handleLogin} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        )}
        
        <div className="space-y-2">
          <label 
            htmlFor="email" 
            className="block text-sm font-medium text-gray-700"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="space-y-2">
          <label 
            htmlFor="password" 
            className="block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
        </button>

        <div className="text-center mt-4">
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-blue-600 hover:text-blue-800"
          >
            Need an account? Register
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoginScreen;