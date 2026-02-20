import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, FileText, CreditCard, BarChart3, Search,
  ChevronLeft, ChevronRight, Gift, X, Eye
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Skeleton } from './ui/Skeleton';
import api from '../services/api';
import toast from 'react-hot-toast';
import { cn, fadeInVariants, staggerContainer } from '../lib/utils';

const TABS = [
  { id: 'stats', label: 'Overview', icon: BarChart3 },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'proposals', label: 'Proposals', icon: FileText },
  { id: 'payments', label: 'Payments', icon: CreditCard },
];

const PAGE_SIZE = 15;

// --- Sub-components ---

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <motion.div variants={fadeInVariants}>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
              <p className="text-3xl font-bold mt-1 text-gray-900 dark:text-white">{value}</p>
            </div>
            <div className={cn('p-3 rounded-xl', color)}>
              <Icon className="w-6 h-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function Pagination({ skip, limit, total, onPageChange }) {
  const currentPage = Math.floor(skip / limit) + 1;
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-sm text-gray-500">
        Showing {skip + 1}-{Math.min(skip + limit, total)} of {total}
      </p>
      <div className="flex items-center gap-2">
        <button
          disabled={currentPage <= 1}
          onClick={() => onPageChange(skip - limit)}
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed dark:border-gray-700 dark:hover:bg-gray-800"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium px-3">
          {currentPage} / {totalPages}
        </span>
        <button
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(skip + limit)}
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed dark:border-gray-700 dark:hover:bg-gray-800"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    refunded: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    draft: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    generated: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    submitted: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  };

  return (
    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', colors[status] || colors.draft)}>
      {status || 'unknown'}
    </span>
  );
}

// --- Grant Credits Modal ---

function GrantCreditsModal({ user, onClose, onGranted }) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const num = parseInt(amount, 10);
    if (!num || num <= 0) {
      toast.error('Enter a positive number');
      return;
    }
    setLoading(true);
    try {
      const result = await api.grantCredits(user.id, num, note);
      toast.success(`Granted ${num} credits to ${user.email}`);
      onGranted(result);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to grant credits');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Grant Credits</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Adding credits to <strong>{user.email}</strong> (currently {user.proposals_remaining})
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. 5"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Note (optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Reason for granting credits"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Granting...' : 'Grant Credits'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// --- User Detail Modal ---

function UserDetailModal({ userId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const result = await api.getAdminUser(userId);
        setData(result);
      } catch (err) {
        toast.error('Failed to load user details');
        onClose();
      } finally {
        setLoading(false);
      }
    })();
  }, [userId, onClose]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 w-full max-w-lg mx-4">
          <Skeleton className="h-6 w-48 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">User Details</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div className="text-gray-500">Email</div><div className="font-medium dark:text-white">{data.email}</div>
            <div className="text-gray-500">Username</div><div className="font-medium dark:text-white">{data.username}</div>
            <div className="text-gray-500">Full Name</div><div className="font-medium dark:text-white">{data.full_name || '-'}</div>
            <div className="text-gray-500">Organization</div><div className="font-medium dark:text-white">{data.organization || '-'}</div>
            <div className="text-gray-500">Plan</div><div className="font-medium dark:text-white">{data.subscription_plan || 'None'}</div>
            <div className="text-gray-500">Credits</div><div className="font-medium dark:text-white">{data.proposals_remaining}</div>
            <div className="text-gray-500">Proposals</div><div className="font-medium dark:text-white">{data.proposal_count}</div>
            <div className="text-gray-500">Registered</div><div className="font-medium dark:text-white">{data.created_at ? new Date(data.created_at).toLocaleDateString() : '-'}</div>
          </div>

          {data.payments?.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Payment History</h4>
              <div className="space-y-2">
                {data.payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
                    <div>
                      <span className="font-medium dark:text-white">{p.currency} {p.amount}</span>
                      <span className="text-gray-500 ml-2 text-xs">{p.description || ''}</span>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// --- Main Admin Panel ---

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Users tab state
  const [users, setUsers] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersSkip, setUsersSkip] = useState(0);
  const [usersSearch, setUsersSearch] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);
  const [grantTarget, setGrantTarget] = useState(null);
  const [detailUserId, setDetailUserId] = useState(null);

  // Proposals tab state
  const [proposals, setProposals] = useState([]);
  const [proposalsTotal, setProposalsTotal] = useState(0);
  const [proposalsSkip, setProposalsSkip] = useState(0);
  const [proposalsSearch, setProposalsSearch] = useState('');
  const [proposalsLoading, setProposalsLoading] = useState(false);

  // Payments tab state
  const [payments, setPayments] = useState([]);
  const [paymentsTotal, setPaymentsTotal] = useState(0);
  const [paymentsSkip, setPaymentsSkip] = useState(0);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  // Fetch stats
  useEffect(() => {
    (async () => {
      try {
        const data = await api.getAdminStats();
        setStats(data);
      } catch (err) {
        toast.error('Failed to load admin stats');
      } finally {
        setStatsLoading(false);
      }
    })();
  }, []);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const data = await api.getAdminUsers(usersSkip, PAGE_SIZE, usersSearch);
      setUsers(data.users);
      setUsersTotal(data.total);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  }, [usersSkip, usersSearch]);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
  }, [activeTab, fetchUsers]);

  // Fetch proposals
  const fetchProposals = useCallback(async () => {
    setProposalsLoading(true);
    try {
      const data = await api.getAdminProposals(proposalsSkip, PAGE_SIZE, proposalsSearch);
      setProposals(data.proposals);
      setProposalsTotal(data.total);
    } catch (err) {
      toast.error('Failed to load proposals');
    } finally {
      setProposalsLoading(false);
    }
  }, [proposalsSkip, proposalsSearch]);

  useEffect(() => {
    if (activeTab === 'proposals') fetchProposals();
  }, [activeTab, fetchProposals]);

  // Fetch payments
  const fetchPayments = useCallback(async () => {
    setPaymentsLoading(true);
    try {
      const data = await api.getAdminPayments(paymentsSkip, PAGE_SIZE);
      setPayments(data.payments);
      setPaymentsTotal(data.total);
    } catch (err) {
      toast.error('Failed to load payments');
    } finally {
      setPaymentsLoading(false);
    }
  }, [paymentsSkip]);

  useEffect(() => {
    if (activeTab === 'payments') fetchPayments();
  }, [activeTab, fetchPayments]);

  // Debounced search for users
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'users') {
        setUsersSkip(0);
        fetchUsers();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [usersSearch]); // eslint-disable-line

  // Debounced search for proposals
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'proposals') {
        setProposalsSkip(0);
        fetchProposals();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [proposalsSearch]); // eslint-disable-line

  const handleCreditsGranted = (result) => {
    // Update the user row in the local list
    setUsers((prev) =>
      prev.map((u) =>
        u.id === result.user_id ? { ...u, proposals_remaining: result.new_credits } : u
      )
    );
  };

  const renderSkeleton = (rows = 5) => (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-lg" />
      ))}
    </div>
  );

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeInVariants}>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
          Admin Panel
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage users, proposals, and payments</p>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div variants={fadeInVariants} className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all',
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </motion.div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {/* --- STATS TAB --- */}
        {activeTab === 'stats' && (
          <motion.div
            key="stats"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {statsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 rounded-xl" />
                ))}
              </div>
            ) : stats ? (
              <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Users" value={stats.total_users} icon={Users} color="bg-blue-500" />
                <StatCard label="Total Proposals" value={stats.total_proposals} icon={FileText} color="bg-indigo-500" />
                <StatCard label="Revenue" value={`EUR ${stats.total_revenue.toFixed(2)}`} icon={CreditCard} color="bg-green-500" />
                <StatCard label="Active Subscriptions" value={stats.active_subscriptions} icon={BarChart3} color="bg-purple-500" />
              </motion.div>
            ) : (
              <p className="text-gray-500">Failed to load stats.</p>
            )}
          </motion.div>
        )}

        {/* --- USERS TAB --- */}
        {activeTab === 'users' && (
          <motion.div
            key="users"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={usersSearch}
                onChange={(e) => setUsersSearch(e.target.value)}
                placeholder="Search by email, username, name, or organization..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <Card>
              <CardContent className="p-0">
                {usersLoading ? (
                  <div className="p-4">{renderSkeleton()}</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                          <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                          <th className="text-left px-4 py-3 font-medium text-gray-500">Username</th>
                          <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Organization</th>
                          <th className="text-left px-4 py-3 font-medium text-gray-500">Plan</th>
                          <th className="text-right px-4 py-3 font-medium text-gray-500">Credits</th>
                          <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Registered</th>
                          <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                            <td className="px-4 py-3 dark:text-white">
                              {u.email}
                              {u.is_admin && (
                                <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded text-xs font-medium">Admin</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{u.username}</td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400 hidden md:table-cell">{u.organization || '-'}</td>
                            <td className="px-4 py-3">
                              <StatusBadge status={u.subscription_plan || 'none'} />
                            </td>
                            <td className="px-4 py-3 text-right font-medium dark:text-white">{u.proposals_remaining}</td>
                            <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                              {u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => setDetailUserId(u.id)}
                                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700"
                                  title="View details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setGrantTarget(u)}
                                  className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 hover:text-blue-700"
                                  title="Grant credits"
                                >
                                  <Gift className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {users.length === 0 && (
                          <tr>
                            <td colSpan="7" className="px-4 py-8 text-center text-gray-500">No users found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Pagination
              skip={usersSkip}
              limit={PAGE_SIZE}
              total={usersTotal}
              onPageChange={setUsersSkip}
            />
          </motion.div>
        )}

        {/* --- PROPOSALS TAB --- */}
        {activeTab === 'proposals' && (
          <motion.div
            key="proposals"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={proposalsSearch}
                onChange={(e) => setProposalsSearch(e.target.value)}
                placeholder="Search by title or user email..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <Card>
              <CardContent className="p-0">
                {proposalsLoading ? (
                  <div className="p-4">{renderSkeleton()}</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                          <th className="text-left px-4 py-3 font-medium text-gray-500">ID</th>
                          <th className="text-left px-4 py-3 font-medium text-gray-500">Title</th>
                          <th className="text-left px-4 py-3 font-medium text-gray-500">User</th>
                          <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                          <th className="text-right px-4 py-3 font-medium text-gray-500">Quality</th>
                          <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {proposals.map((p) => (
                          <tr key={p.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                            <td className="px-4 py-3 text-gray-500">#{p.id}</td>
                            <td className="px-4 py-3 font-medium dark:text-white max-w-xs truncate">{p.title || 'Untitled'}</td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{p.user_email}</td>
                            <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                            <td className="px-4 py-3 text-right font-medium dark:text-white">
                              {p.quality_score ? `${Math.round(p.quality_score)}%` : '-'}
                            </td>
                            <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                              {p.created_at ? new Date(p.created_at).toLocaleDateString() : '-'}
                            </td>
                          </tr>
                        ))}
                        {proposals.length === 0 && (
                          <tr>
                            <td colSpan="6" className="px-4 py-8 text-center text-gray-500">No proposals found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Pagination
              skip={proposalsSkip}
              limit={PAGE_SIZE}
              total={proposalsTotal}
              onPageChange={setProposalsSkip}
            />
          </motion.div>
        )}

        {/* --- PAYMENTS TAB --- */}
        {activeTab === 'payments' && (
          <motion.div
            key="payments"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <Card>
              <CardContent className="p-0">
                {paymentsLoading ? (
                  <div className="p-4">{renderSkeleton()}</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                          <th className="text-left px-4 py-3 font-medium text-gray-500">ID</th>
                          <th className="text-left px-4 py-3 font-medium text-gray-500">User</th>
                          <th className="text-right px-4 py-3 font-medium text-gray-500">Amount</th>
                          <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                          <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Method</th>
                          <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">PayPal Order</th>
                          <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((p) => (
                          <tr key={p.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                            <td className="px-4 py-3 text-gray-500">#{p.id}</td>
                            <td className="px-4 py-3 dark:text-white">{p.user_email}</td>
                            <td className="px-4 py-3 text-right font-medium dark:text-white">{p.currency} {p.amount}</td>
                            <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                            <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{p.payment_method || '-'}</td>
                            <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell max-w-[120px] truncate">{p.paypal_order_id || '-'}</td>
                            <td className="px-4 py-3 text-gray-500">
                              {p.created_at ? new Date(p.created_at).toLocaleDateString() : '-'}
                            </td>
                          </tr>
                        ))}
                        {payments.length === 0 && (
                          <tr>
                            <td colSpan="7" className="px-4 py-8 text-center text-gray-500">No payments found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Pagination
              skip={paymentsSkip}
              limit={PAGE_SIZE}
              total={paymentsTotal}
              onPageChange={setPaymentsSkip}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {grantTarget && (
          <GrantCreditsModal
            user={grantTarget}
            onClose={() => setGrantTarget(null)}
            onGranted={handleCreditsGranted}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {detailUserId && (
          <UserDetailModal
            userId={detailUserId}
            onClose={() => setDetailUserId(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminPanel;
