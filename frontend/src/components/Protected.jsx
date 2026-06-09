import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/authStore.js';

export default function Protected({ roles, children }) {
  const user = useAuth((s) => s.user);
  if (!user) return <Navigate to="/" replace />;
  if (roles && !roles.includes(user.role_type)) return <Navigate to="/dashboard" replace />;
  return children;
}

