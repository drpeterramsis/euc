import React from 'react';
import { Navigate } from 'react-router-dom';
import { User } from '../types';

interface ProtectedRouteProps {
  user: User | null;
  roleRequired?: string;
  children: React.ReactElement;
}

export default function ProtectedRoute({ user, roleRequired, children }: ProtectedRouteProps) {
  if (!user) {
    return <Navigate to="/login" />;
  }

  if (roleRequired && user.role !== roleRequired) {
    return <Navigate to="/" />;
  }

  return children;
}
