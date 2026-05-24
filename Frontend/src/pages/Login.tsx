import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/** Opens the homepage sign-in modal (same UX as the floating popup). */
const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/?signin=1', { replace: true });
  }, [navigate]);

  return null;
};

export default Login;
