import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu, X, Home, FileText, BarChart3, Settings as SettingsIcon, LogOut,
  Moon, Sun, Bell, User, ChevronDown, PlusCircle,
  Layers, Sparkles, TrendingUp, BookOpen, Trophy, Target
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { formatDeadlineDate, formatBrusselsTime } from '../../utils/dateUtils';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Proposals', href: '/proposals', icon: FileText },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Erasmus+ Resources', href: '/resources', icon: BookOpen },
  { name: 'Settings', href: '/settings', icon: SettingsIcon },
];

export const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [userStats, setUserStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();


  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationOpen && !event.target.closest('.notification-dropdown')) {
        setNotificationOpen(false);
      }
      if (userMenuOpen && !event.target.closest('.user-menu-dropdown')) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [notificationOpen, userMenuOpen]);

  // Fetch user stats and subscription status
  useEffect(() => {
    const fetchStats = async () => {
      if (user) {
        try {
          setStatsLoading(true);
          const [statsResponse, subscriptionResponse] = await Promise.all([
            api.get('/dashboard/stats').catch(() => ({ data: { stats: {} } })),
            api.get('/payments/subscription-status').catch(() => ({ data: null }))
          ]);

          setUserStats({
            ...statsResponse.data.stats,
            subscription: subscriptionResponse.data
          });
        } catch (error) {
          console.error('Failed to fetch user stats:', error);
        } finally {
          setStatsLoading(false);
        }
      }
    };

    fetchStats();
  }, [user, location.pathname]); // Refetch when navigation changes

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Animated Background Pattern */}
      <div className="fixed inset-0 bg-mesh-gradient opacity-5 pointer-events-none" />
      
      {/* Header */}
      <motion.header 
        className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
      >
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Menu Button */}
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 lg:hidden"
              >
                {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              
              <Link to="/" className="flex items-center ml-4 lg:ml-0">
                <motion.div
                  className="flex items-center space-x-3"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl blur opacity-30 animate-pulse-slow" />
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    Erasmus+ AI
                  </span>
                </motion.div>
              </Link>
            </div>


            {/* Right side items */}
            <div className="flex items-center space-x-4">
              {/* New Proposal Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/new-proposal')}
                className="hidden sm:flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
              >
                <PlusCircle className="w-5 h-5 mr-2" />
                New Proposal
              </motion.button>

              {/* Notifications */}
              <div className="relative notification-dropdown">
                <button
                  onClick={() => setNotificationOpen(!notificationOpen)}
                  className="relative p-2 rounded-xl text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  <Bell className="h-6 w-6" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                </button>

                <AnimatePresence>
                  {notificationOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                          Next Erasmus+ Deadline
                        </h3>
                        <button
                          onClick={() => setNotificationOpen(false)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-3 mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                              <FileText className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              KA220-ADU Adult Education
                            </p>
                            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                              {formatDeadlineDate('2025-03-06')}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {formatBrusselsTime('2025-03-06T12:00:00')}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                        <div className="flex items-start space-x-2">
                          <div className="w-1 h-1 bg-gray-400 rounded-full mt-1.5 flex-shrink-0"></div>
                          <p>Round 1 deadline for Cooperation Partnerships in Adult Education</p>
                        </div>
                        <div className="flex items-start space-x-2">
                          <div className="w-1 h-1 bg-gray-400 rounded-full mt-1.5 flex-shrink-0"></div>
                          <p>Small-scale Partnerships: Same deadline</p>
                        </div>
                        <div className="flex items-start space-x-2">
                          <div className="w-1 h-1 bg-gray-400 rounded-full mt-1.5 flex-shrink-0"></div>
                          <p>Budget: €120,000 - €400,000 per project</p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => {
                            setNotificationOpen(false);
                            navigate('/new-proposal');
                          }}
                          className="w-full px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all"
                        >
                          Start New Application
                        </button>
                      </div>

                      <div className="mt-3 text-xs text-center text-gray-500 dark:text-gray-400">
                        <p>Other upcoming deadlines:</p>
                        <p className="font-medium mt-1">
                          October 2025 - Round 2
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <AnimatePresence mode="wait">
                  {darkMode ? (
                    <motion.div
                      key="sun"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                    >
                      <Sun className="h-6 w-6" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="moon"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                    >
                      <Moon className="h-6 w-6" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>

              {/* User Menu */}
              <div className="relative user-menu-dropdown">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2"
                    >
                      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {user?.email || 'User'}
                        </p>
                      </div>
                      <button
                        onClick={() => navigate('/profile')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Profile
                      </button>
                      <button
                        onClick={() => navigate('/settings')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Settings
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Sidebar */}
      <AnimatePresence>
        {(sidebarOpen || window.innerWidth >= 1024) && (
          <>
            {/* Mobile Overlay */}
            {sidebarOpen && window.innerWidth < 1024 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 bg-black/50 z-30 lg:hidden"
              />
            )}

            {/* Sidebar */}
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={cn(
                "fixed left-0 top-16 bottom-0 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-30",
                "lg:block"
              )}
            >
              <nav className="p-4 space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all",
                        isActive
                          ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                      {isActive && (
                        <motion.div
                          layoutId="activeNav"
                          className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl -z-10"
                        />
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Stats Card */}
              <div className="absolute bottom-4 left-4 right-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/analytics')}
                  className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-4 text-white cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Target className="w-5 h-5" />
                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                      {userStats?.subscription?.plan_type ? userStats.subscription.plan_type.charAt(0).toUpperCase() + userStats.subscription.plan_type.slice(1) : 'No Plan'}
                    </span>
                  </div>

                  {statsLoading ? (
                    <div className="space-y-2">
                      <div className="h-4 bg-white/20 rounded animate-pulse"></div>
                      <div className="h-2 bg-white/20 rounded animate-pulse"></div>
                    </div>
                  ) : (
                    <>
                      <div className="mb-3">
                        <p className="text-sm font-medium">
                          {userStats?.subscription?.proposals_remaining || 0}/{userStats?.subscription?.proposals_limit || 0} Generations
                        </p>
                        <p className="text-xs opacity-80 mt-1">
                          {userStats?.subscription?.proposals_remaining > 0
                            ? `${userStats?.subscription?.proposals_remaining} full applications`
                            : userStats?.subscription?.has_subscription
                              ? 'No generations left'
                              : 'Get a plan to generate'}
                        </p>
                      </div>

                      {/* Progress Bar */}
                      <div className="relative">
                        <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                          <motion.div
                            className={cn(
                              "h-full rounded-full transition-all",
                              userStats?.subscription?.proposals_remaining <= 0
                                ? "bg-gradient-to-r from-yellow-400 to-orange-500"
                                : "bg-gradient-to-r from-green-400 to-emerald-500"
                            )}
                            initial={{ width: 0 }}
                            animate={{
                              width: userStats?.subscription?.proposals_limit > 0
                                ? `${Math.min((((userStats?.subscription?.proposals_limit || 0) - (userStats?.subscription?.proposals_remaining || 0)) / (userStats?.subscription?.proposals_limit || 1)) * 100, 100)}%`
                                : '0%'
                            }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                          />
                        </div>
                      </div>

                      {/* Additional Stats */}
                      <div className="mt-3 pt-3 border-t border-white/20">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-1">
                            <Trophy className="w-3 h-3" />
                            <span>Success Rate</span>
                          </div>
                          <span className="font-semibold">
                            {userStats?.successRate || 0}%
                          </span>
                        </div>
                        {(!userStats?.subscription?.has_subscription || userStats?.subscription?.proposals_remaining <= 0) && (
                          <button
                            onClick={() => navigate('/pricing')}
                            className="w-full mt-2 px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-medium transition-colors">
                            {userStats?.subscription?.has_subscription ? 'Upgrade Plan' : 'Get Started'} →
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </motion.div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className={cn(
        "pt-16 transition-all duration-300",
        "lg:pl-64"
      )}>
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};