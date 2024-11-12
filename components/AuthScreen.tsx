import React, { useState } from 'react';
import LoginScreen from './LoginScreen';
import RegistrationScreen from './RegistrationScreen';

interface AuthScreenProps {
  onAuthSuccess?: (userData: { email: string; company: string }) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [showLogin, setShowLogin] = useState(true);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      {showLogin ? (
        <LoginScreen
          onLoginSuccess={onAuthSuccess}
          onSwitchToRegister={() => setShowLogin(false)}
        />
      ) : (
        <RegistrationScreen
          onRegistrationSuccess={onAuthSuccess}
          onSwitchToLogin={() => setShowLogin(true)}
        />
      )}
    </div>
  );
};

export default AuthScreen;