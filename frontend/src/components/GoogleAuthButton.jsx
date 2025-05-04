import React from 'react';

const GoogleAuthButton = ({ isRegister = false }) => {
  return (
    <a 
      href="/api/auth/google" 
      className="google-button"
    >
      <img 
        src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" 
        alt="Google" 
        style={{ width: '20px', height: '20px' }} 
      />
      {isRegister ? 'Register with Google' : 'Continue with Google'}
    </a>
  );
};

export default GoogleAuthButton;