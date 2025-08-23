import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'business_owner' | 'team_member' | 'client';
  avatar?: string;
  permissions?: string[];
  clientId?: string;
  organizationId?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordReset, setIsPasswordReset] = useState(false);

  // Fetch user profile from database with better error handling
  const fetchUserProfile = async (supabaseUser: SupabaseUser): Promise<User | null> => {
    try {
      console.log('🔍 Fetching profile for user:', supabaseUser.id, supabaseUser.email);
      
      // First try to find by auth ID
      let { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      // If not found by ID, try by email
      if (error?.code === 'PGRST116' && supabaseUser.email) {
        console.log('🔍 User not found by ID, trying by email...');
        const { data: emailData, error: emailError } = await supabase
          .from('users')
          .select('*')
          .eq('email', supabaseUser.email)
          .single();
        
        data = emailData;
        error = emailError;
      }

      // If still not found, create a new user profile
      if (error?.code === 'PGRST116') {
        console.log('🔍 User not found, creating new profile...');
        
        const newUserData = {
          id: supabaseUser.id,
          name: supabaseUser.email?.split('@')[0] || 'User',
          email: supabaseUser.email || '',
          role: 'client' // Default role for new users - will trigger client record creation
        };
        
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert(newUserData)
          .select()
          .single();
          
        if (insertError) {
          console.error('❌ Failed to create user profile:', insertError);
          return null;
        }
        
        data = newUser;
        console.log('✅ Created new user profile:', newUser);
      } else if (error) {
        console.error('❌ Profile fetch error:', error);
        return null;
      }

      if (!data) {
        console.log('❌ No profile data found');
        return null;
      }

      // Update the user ID in the database to match Supabase auth ID if different
      if (data.id !== supabaseUser.id) {
        console.log('🔍 Syncing user ID...');
        await supabase
          .from('users')
          .update({ id: supabaseUser.id })
          .eq('email', supabaseUser.email);
        data.id = supabaseUser.id;
      }

      const userProfile: User = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        avatar: data.avatar || undefined,
        permissions: data.permissions || [],
        clientId: data.client_id || undefined,
        organizationId: data.organization_id || undefined
      };

      console.log('✅ Profile loaded successfully (DETAILED):', {
        id: userProfile.id,
        name: userProfile.name,
        email: userProfile.email,
        role: userProfile.role,
        clientId: userProfile.clientId,
        organizationId: userProfile.organizationId,
        rawClientId: data.client_id,
        rawOrganizationId: data.organization_id,
        dataFromDB: data
      });
      return userProfile;

    } catch (error) {
      console.error('❌ Exception in fetchUserProfile:', error);
      return null;
    }
  };

  // Initialize auth state with better performance
  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    // Check if this is a password reset flow
    const urlParams = new URLSearchParams(window.location.search);
    const isResetFlow = urlParams.has('access_token') && urlParams.has('refresh_token') && window.location.pathname === '/reset-password';
    
    if (isResetFlow) {
      setIsPasswordReset(true);
      setLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        console.log('🔍 Initializing auth...');
        
        // Set a reasonable timeout
        timeoutId = setTimeout(() => {
          if (mounted && loading) {
            console.log('⚠️ Auth initialization timeout');
            setLoading(false);
            setUser(null);
          }
        }, 8000); // Reduced from 10 seconds

        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Session error:', error);
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        if (session?.user && mounted) {
          console.log('🔍 Session found, fetching profile...');
          
          // Don't auto-login if this is a password reset flow
          if (isPasswordReset) {
            setUser(null);
            setLoading(false);
            return;
          }
          
          const profile = await fetchUserProfile(session.user);
          
          if (mounted) {
            setUser(profile);
            setLoading(false);
            clearTimeout(timeoutId);
          }
        } else if (mounted) {
          setUser(null);
          setLoading(false);
          clearTimeout(timeoutId);
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    initAuth();

    // Listen for auth changes with debouncing
    let authChangeTimeout: NodeJS.Timeout;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('🔍 Auth state changed:', event);

      // Handle password reset flow
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordReset(true);
        setUser(null);
        setLoading(false);
        return;
      }

      // Clear any existing timeout
      if (authChangeTimeout) {
        clearTimeout(authChangeTimeout);
      }

      // Debounce auth state changes
      authChangeTimeout = setTimeout(async () => {
        if (!mounted) return;

        if (event === 'SIGNED_OUT' || !session?.user) {
          setUser(null);
          setIsPasswordReset(false);
          setLoading(false);
          return;
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Don't auto-login during password reset
          if (isPasswordReset) {
            return;
          }
          
          setLoading(true);
          const profile = await fetchUserProfile(session.user);
          if (mounted) {
            setUser(profile);
            setIsPasswordReset(false);
            setLoading(false);
          }
        }
      }, 300); // 300ms debounce
    });

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      if (authChangeTimeout) clearTimeout(authChangeTimeout);
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array

  const login = async (email: string, password: string): Promise<void> => {
    console.log('🔍 Login attempt for:', email);
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('❌ Login error:', error);
        setLoading(false);
        throw new Error(error.message);
      }
      
      console.log('✅ Login successful');
      // Loading state will be handled by auth state change listener
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    console.log('🔍 Logout initiated');
    
    // If user is already null, no need to logout
    if (!user) {
      console.log('✅ User already logged out');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Logout error:', error);
        // Even if logout fails, clear the local user state
        setUser(null);
        setLoading(false);
        return;
      }
      // User state will be cleared by auth state change listener
    } catch (error) {
      console.error('❌ Logout exception:', error);
      setUser(null);
      setLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    console.log('🔍 Password reset request for:', email);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) {
      console.error('❌ Password reset error:', error);
      throw new Error(error.message);
    }
    
    console.log('✅ Password reset email sent');
  };

  const updatePassword = async (newPassword: string): Promise<void> => {
    console.log('🔍 Password update request');
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      console.error('❌ Password update error:', error);
      throw new Error(error.message);
    }
    
    // Clear password reset state after successful update
    setIsPasswordReset(false);
    
    console.log('✅ Password updated successfully');
  };
  return (
    <AuthContext.Provider value={{ user, loading, login, logout, resetPassword, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
};