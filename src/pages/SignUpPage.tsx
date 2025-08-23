import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Eye, EyeOff, Mail, Lock, User, Phone, MapPin, X, CheckCircle } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';

const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFormVisible, setIsFormVisible] = useState(true);

  // Slideshow images - same as login page
  const slideshowImages = [
    '/images/c1.jpg',
    '/images/c2.jpg',
    '/images/c3.jpg'
  ];

  // Auto-advance slideshow every 5 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        (prevIndex + 1) % slideshowImages.length
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate passwords
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 Starting client registration...');

      // 1. Create Supabase auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name
          }
        }
      });

      if (authError) {
        console.error('❌ Auth signup error:', authError);
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('Failed to create user account');
      }

      console.log('✅ Auth user created:', authData.user.id);

      // 2. Create client record
      const clientData = {
        user_id: authData.user.id,
        name: formData.name,
        email: formData.email,
        phone: '', // Default empty phone
        address: null,
        budget: 0,
        style_preferences: [],
        lead_source: 'Website',
        status: 'inquiry',
        notes: ''
      };

      console.log('🔍 Creating client record:', clientData);

      const { data: clientRecord, error: clientError } = await supabase
        .from('clients')
        .insert(clientData)
        .select()
        .single();

      if (clientError) {
        console.error('❌ Client creation error:', clientError);
        // If client creation fails, we should clean up the auth user
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw new Error('Failed to create client profile: ' + clientError.message);
      }

      console.log('✅ Client record created:', clientRecord);

      // 3. Create user profile record
      const userData = {
        id: authData.user.id,
        name: formData.name,
        email: formData.email,
        role: 'client',
        client_id: clientRecord.id
      };

      console.log('🔍 Creating user profile:', userData);

      const { error: userError } = await supabase
        .from('users')
        .insert(userData);

      if (userError) {
        console.error('❌ User profile creation error:', userError);
        // Note: We don't clean up here as the trigger should handle linking
        console.log('⚠️ User profile creation failed, but auth user exists. Trigger should handle linking.');
      } else {
        console.log('✅ User profile created successfully');
      }

      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (err: any) {
      console.error('❌ Registration failed:', err);
      if (err.message.includes('User already registered')) {
        setError('An account with this email already exists. Please sign in instead or use a different email.');
      } else if (err.message.includes('Password should be at least')) {
        setError('Password must be at least 6 characters long.');
      } else if (err.message.includes('Invalid email')) {
        setError('Please enter a valid email address.');
      } else if (err.message.includes('Signup is disabled')) {
        setError('Account registration is currently disabled. Please contact support.');
      } else {
        setError(err.message || 'Registration failed. Please check your information and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
        {/* Slideshow Background */}
        <div className="absolute inset-0 z-0">
          {slideshowImages.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ${
                index === currentImageIndex ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ backgroundImage: `url(${image})` }}
            />
          ))}
          <div className="absolute inset-0 bg-black bg-opacity-60" />
        </div>

        <div className="w-full max-w-md fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 mx-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Wall Play Studio!</h2>
            <p className="text-gray-600 mb-6">
              Your account has been created successfully. You can now sign in to access your client portal.
            </p>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <LoadingSpinner size="sm" />
              <span>Redirecting to sign in...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Slideshow Background */}
      <div className="absolute inset-0 z-0">
        {slideshowImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ${
              index === currentImageIndex ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ backgroundImage: `url(${image})` }}
          />
        ))}
        <div className="absolute inset-0 bg-black bg-opacity-60" />
      </div>

      {/* Sign Up Form Container */}
      {isFormVisible && (
        <div 
          className="w-full max-w-md fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 group mx-4"
        >
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-6 sm:p-8 relative">
            {/* Hide Button - appears on hover */}
            <button
              onClick={() => setIsFormVisible(false)}
              className="absolute top-2 right-2 sm:top-3 sm:right-3 lg:top-4 lg:right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 touch-manipulation"
              title="Hide form"
            >
              <X className="w-4 h-4" />
            </button>

          {/* Branding Header */}
          <div className="mb-6 text-center">
            <style>{`
              @keyframes colorCycle {
                0% { background-color: #2563eb; }
                20% { background-color: #7c3aed; }
                40% { background-color: #d97706; }
                60% { background-color: #059669; }
                80% { background-color: #dc2626; }
                100% { background-color: #2563eb; }
              }
            `}</style>
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-10 h-10 p-1.5 flex items-center justify-center flex-shrink-0">
                <div className="w-full h-full rounded" style={{
                  animation: 'colorCycle 4s ease-in-out infinite'
                }}></div>
              </div>
              <div className="text-left">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 font-['Montserrat'] tracking-tight leading-tight">
                  Wall Play Studio
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 font-small">Create Your Account

</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <div className="relative">
                <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white touch-manipulation"
                  placeholder="Your full name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white touch-manipulation"
                  placeholder="your.email@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full pl-11 pr-12 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white touch-manipulation"
                  placeholder="Create password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300/60 hover:text-gray-400/80 transition-colors touch-manipulation"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black/95 text-white py-3 rounded-lg font-semibold hover:bg-black/85 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-sm hover:shadow-md touch-manipulation"
            >
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <span>Create Account</span>
              )}
            </button>

            <div className="text-center">
              <Link
                to="/login"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors touch-manipulation"
              >
                Already have an account? Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
      )}

      {/* Show Form Button - appears when form is hidden */}
      {!isFormVisible && (
        <button
          onClick={() => setIsFormVisible(true)}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 px-4 sm:px-6 lg:px-7 py-2 sm:py-2.5 bg-white/10 hover:bg-white/15 backdrop-blur-sm rounded-full shadow-lg border border-white/30 transition-all duration-200 z-20 touch-manipulation"
          title="Show signup form"
        >
          <span className="text-white font-thin text-xs sm:text-sm lg:text-md -mt-1">Sign Up</span>
        </button>
      )}
    </div>
  );
};

export default SignUpPage;