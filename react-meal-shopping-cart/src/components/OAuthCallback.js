import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const OAuthCallback = ({ onLoginSuccess }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const role = searchParams.get('role') || 'user'; // Optional: pass role in URL too

    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      if (onLoginSuccess) onLoginSuccess();
      navigate('/'); // Redirect to home
    } else {
      // Handle error
      navigate('/?error=auth_failed');
    }
  }, [searchParams, navigate, onLoginSuccess]);

  return <div>Processing login...</div>;
};

export default OAuthCallback;