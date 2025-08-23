import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, LogIn, Mail, Lock, X, Sofa } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';

const LoginPage: React.FC = () => {
  const { login, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFormVisible, setIsFormVisible] = useState(true);

  // Slideshow images - using high-quality interior design images from Pexels
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

    try {
      await login(email, password);
    } catch (err: any) {
      console.error('❌ Login failed:', err);
      if (err.message.includes('Invalid login credentials') || err.message.includes('Invalid email or password')) {
        setError('The email or password you entered is incorrect. Please double-check your credentials and try again.');
      } else if (err.message.includes('Email not confirmed') || err.message.includes('confirm')) {
        setError('Please check your email and confirm your account before signing in.');
      } else if (err.message.includes('Too many requests') || err.message.includes('rate limit')) {
        setError('Too many login attempts. Please wait a few minutes before trying again.');
      } else if (err.message.includes('User not found') || err.message.includes('not found')) {
        setError('No account found with this email address. Please check your email or sign up for a new account.');
      } else if (err.message.includes('Wrong password') || err.message.includes('password')) {
        setError('The password you entered is incorrect. Please try again or reset your password.');
      } else {
        setError('Login failed. Please check your email and password, then try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordLoading(true);
    setError('');

    try {
      await resetPassword(forgotPasswordEmail);
      setForgotPasswordSuccess(true);
    } catch (err: any) {
      console.error('❌ Password reset failed:', err);
      if (err.message.includes('User not found')) {
        setError('No account found with this email address. Please check your email or sign up for a new account.');
      } else if (err.message.includes('Email rate limit exceeded')) {
        setError('Too many reset requests. Please wait before requesting another reset email.');
      } else {
        setError(err.message || 'Failed to send reset email. Please check your email address and try again.');
      }
    } finally {
      setForgotPasswordLoading(false);
    }
  };
  
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
        {/* Black tint overlay for better text readability */}
        <div className="absolute inset-0 bg-black bg-opacity-60" />
      </div>

      {/* Login Form Container */}
      {isFormVisible && (
        <div 
          className="w-full max-w-sm sm:max-w-md fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 group mx-4 sm:mx-0"
        >
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-4 sm:p-6 lg:p-8 relative">
            {/* Hide Button - appears on hover */}
            <button
              onClick={() => setIsFormVisible(false)}
              className="absolute top-2 right-2 sm:top-3 sm:right-3 lg:top-4 lg:right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 touch-manipulation"
              title="Hide form"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Branding Header */}
            <div className="mb-4 sm:mb-6 lg:mb-8 text-center">
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
              <div className="flex items-center justify-center space-x-3 mb-4 sm:mb-6">
                <div className="w-10 h-10 p-1.5 flex items-center justify-center flex-shrink-0">
                  <div className="w-full h-full rounded" style={{
                    animation: 'colorCycle 4s ease-in-out infinite'
                  }}></div>
                </div>
                <div className="text-left">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 font-['Montserrat'] tracking-tight leading-tight">
                    Wall Play Studio
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 font-small">Sign In to Your Account</p>
                </div>
              </div>
            </div>

            {!showForgotPassword ? (
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white touch-manipulation"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-12 py-2.5 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white touch-manipulation"
                      placeholder="Enter your password"
                      required
                      minLength={6}
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
                  className="w-full bg-black text-white py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-black/85 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-sm hover:shadow-md touch-manipulation"
                >
                  {loading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <span>Sign In</span>
                    </>
                  )}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(true);
                      setForgotPasswordEmail(email);
                      setError('');
                    }}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors touch-manipulation"
                  >
                    Forgot your password?
                  </button>
                </div>

                <div className="text-center">
                  <Link
                    to="/signup"
                    className="text-gray-600 hover:text-gray-700 text-sm font-medium transition-colors touch-manipulation"
                  >
                    Don't have an account? Sign up
                  </Link>
                </div>
              </form>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {!forgotPasswordSuccess ? (
                  <>

                    <form onSubmit={handleForgotPassword} className="space-y-4 sm:space-y-6">
                      <div>
                        <label htmlFor="forgotEmail" className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="email"
                            id="forgotEmail"
                            value={forgotPasswordEmail}
                            onChange={(e) => setForgotPasswordEmail(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white touch-manipulation"
                            placeholder="Enter your email"
                            required
                          />
                        </div>
                      </div>

                      {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                          <p className="text-red-600 text-sm font-medium">{error}</p>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={forgotPasswordLoading}
                        className="w-full bg-black/95 text-white py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-black/85 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-sm hover:shadow-md touch-manipulation"
                      >
                        {forgotPasswordLoading ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <span>Send Reset Link</span>
                        )}
                      </button>

                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setShowForgotPassword(false);
                            setError('');
                            setForgotPasswordEmail('');
                          }}
                          className="text-gray-600 hover:text-gray-700 text-sm font-medium transition-colors touch-manipulation"
                        >
                          Back to Sign In
                        </button>
                      </div>
                    </form>
                  </>
                ) : (
                  <div className="text-center space-y-4 sm:space-y-6">
                    <div>
                      <p className="text-gray-600 text-sm mb-4">
                        We've sent a password reset link to <strong>{forgotPasswordEmail}</strong>
                      </p>
                      <p className="text-gray-500 text-xs">
                        Reset your password by clicking your profile once you are logged in.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowForgotPassword(false);
                        setForgotPasswordSuccess(false);
                        setForgotPasswordEmail('');
                        setError('');
                      }}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors touch-manipulation"
                    >
                      Back to Sign In
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Show Form Button - appears when form is hidden */}
      {!isFormVisible && (
        <button
          onClick={() => setIsFormVisible(true)}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 px-4 sm:px-6 lg:px-7 py-2 sm:py-2.5 bg-white/10 hover:bg-white/15 backdrop-blur-sm rounded-full shadow-lg border border-white/30 transition-all duration-200 z-20 touch-manipulation"
          title="Show login form"
        >
          <span className="text-white font-thin text-xs sm:text-sm lg:text-md -mt-1">Sign In</span>
        </button>
      )}
    </div>
  );
};

export default LoginPage;