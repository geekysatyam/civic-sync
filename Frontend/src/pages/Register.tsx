import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/** Opens the homepage sign-up modal (same UX as the sign-in popup). */
const Register = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/?signup=1', { replace: true });
  }, [navigate]);

  return null;
};

export default Register;
