import React from 'react';
import { Navigate } from 'react-router';
import { useAppState } from '../../hooks/useAppState';
import type { UserRole } from '../../types';
import { Loader2 } from '../../lib/icons';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
}

/**
 * RoleGuard component protects routes based on user roles.
 * It checks the current userRole from AppState and either renders the children
 * or redirects to a safe page (default: /).
 */
export function RoleGuard({ 
  children, 
  allowedRoles, 
  redirectTo = "/" 
}: RoleGuardProps) {
  const { userRole, isLoading, isAuthenticated } = useAppState();

  // Show loader while app state is initializing (e.g. fetching profile from Supabase)
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#5CB338]" />
      </div>
    );
  }

  // Not authenticated? Back to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Role not allowed? Redirect to default dashboard
  if (!allowedRoles.includes(userRole)) {
    console.warn(`Access denied for role: ${userRole}. Required: ${allowedRoles.join(', ')}`);
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
