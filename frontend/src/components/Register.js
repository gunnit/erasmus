import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, ArrowRight, Rocket, Shield, Mail, User, Lock, Building2, UserCircle, CheckCircle } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    organization: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scrollY, setScrollY] = useState(0);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Calculate password strength
    const password = formData.password;
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;
    setPasswordStrength(strength);
  }, [formData.password]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    const { confirmPassword, ...userData } = formData;
    const result = await register(userData);

    if (result.success) {
      navigate('/dashboard', {
        state: {
          message: 'Welcome! Explore your dashboard and create your first proposal.',
          fromRegistration: true
        }
      });
    } else {
      setError(typeof result.error === 'string' ? result.error : 'Registration failed');
    }

    setLoading(false);
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength === 0) return 'bg-gray-300';
    if (passwordStrength === 1) return 'bg-red-500';
    if (passwordStrength === 2) return 'bg-yellow-500';
    if (passwordStrength === 3) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength === 0) return '';
    if (passwordStrength === 1) return 'Weak';
    if (passwordStrength === 2) return 'Fair';
    if (passwordStrength === 3) return 'Good';
    return 'Strong';
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-12">
      {/* Animated gradient background with floating orbs */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div
          className="absolute top-40 left-20 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse"
          style={{ transform: `translateY(${scrollY * 0.1}px)` }}
        />
        <div
          className="absolute bottom-20 right-20 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl animate-pulse"
          style={{ transform: `translateY(${scrollY * 0.15}px)` }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl animate-pulse"
          style={{ transform: `translate(-50%, -50%) translateY(${scrollY * 0.08}px)` }}
        />
      </div>

      {/* Glass morphism register container */}
      <div className="relative z-10 w-full max-w-lg px-4">
        <div className="bg-white/80 backdrop-blur-xl p-8 md:p-10 rounded-3xl shadow-2xl border border-white/50 transform transition-all duration-500 hover:shadow-3xl">
          {/* Logo and header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl shadow-lg mb-4 transform transition-transform duration-300 hover:scale-110">
              <span className="text-white font-bold text-2xl">GYG</span>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              Start Your Journey
            </h2>
            <p className="text-gray-600">Create your account in 30 seconds</p>
          </div>

          {/* Benefits badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 text-green-700 text-xs font-medium">
              <Rocket className="w-3 h-3 mr-1" />
              Join 1,250+ Grant Winners
              <CheckCircle className="w-3 h-3 ml-1" />
            </div>
          </div>

          {/* Error message with animation */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 animate-pulse">
              <div className="flex items-center">
                <span className="text-red-500 mr-2">⚠</span>
                {error}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-gray-700 text-sm font-semibold mb-2">
                  Email *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-3 bg-white/50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 hover:border-purple-300"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="username" className="block text-gray-700 text-sm font-semibold mb-2">
                  Username *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="username"
                    id="username"
                    autoComplete="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-3 bg-white/50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 hover:border-purple-300"
                    placeholder="johndoe"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="full_name" className="block text-gray-700 text-sm font-semibold mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserCircle className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="full_name"
                    id="full_name"
                    autoComplete="name"
                    value={formData.full_name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-3 bg-white/50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 hover:border-purple-300"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="organization" className="block text-gray-700 text-sm font-semibold mb-2">
                  Organization
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="organization"
                    id="organization"
                    autoComplete="organization"
                    value={formData.organization}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-3 bg-white/50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 hover:border-purple-300"
                    placeholder="Your Organization"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-gray-700 text-sm font-semibold mb-2">
                Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  name="password"
                  id="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-3 bg-white/50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 hover:border-purple-300"
                  placeholder="Strong password"
                  required
                />
              </div>
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Password strength</span>
                    <span className={`text-xs font-medium ${passwordStrength >= 3 ? 'text-green-600' : 'text-gray-600'}`}>
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                      style={{ width: `${(passwordStrength / 4) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-semibold mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Shield className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  name="confirmPassword"
                  id="confirmPassword"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-3 bg-white/50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 hover:border-purple-300"
                  placeholder="Confirm password"
                  required
                />
              </div>
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <div className="mt-1 flex items-center text-green-600">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  <span className="text-xs">Passwords match</span>
                </div>
              )}
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                className="mt-1 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                required
              />
              <label className="ml-2 text-sm text-gray-600">
                I agree to the{' '}
                <Link to="/terms" className="text-purple-600 hover:text-purple-700 font-medium">
                  Terms of Service
                </Link>
                {' '}and{' '}
                <Link to="/privacy" className="text-purple-600 hover:text-purple-700 font-medium">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center">
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5 mr-2" />
                    Create Account
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          </form>

          <div className="mt-8 text-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white/80 text-gray-500">Already have an account?</span>
              </div>
            </div>

            <p className="mt-6">
              <Link
                to="/login"
                className="group inline-flex items-center text-purple-600 hover:text-purple-700 font-semibold transition-colors"
              >
                Sign in instead
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Link>
            </p>
          </div>
        </div>

        {/* Bottom trust indicators */}
        <div className="text-center mt-6 space-y-2">
          <div className="flex items-center justify-center text-sm text-gray-600">
            <Shield className="w-4 h-4 mr-1 text-green-600" />
            SSL Encrypted • GDPR Compliant • Secure Data
          </div>
          <p className="text-sm text-gray-600">
            Questions? Contact{' '}
            <a href="mailto:support@getyourgrant.eu" className="text-purple-600 hover:text-purple-700 font-medium">
              support@getyourgrant.eu
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;