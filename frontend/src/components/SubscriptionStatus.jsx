import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCreditCard, FiClock, FiFileText, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import api from '../services/api';
import { cn } from '../lib/utils';

const SubscriptionStatus = ({ className }) => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await api.get('/payments/subscription-status');
      setSubscription(response.data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      // Set null to show no subscription state
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  const getPlanBadgeColor = (planType) => {
    switch (planType) {
      case 'professional':
        return 'bg-gradient-to-r from-purple-600 to-blue-600';
      case 'starter':
        return 'bg-blue-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getStatusColor = () => {
    if (!subscription?.has_subscription) return 'border-gray-300 bg-gray-50';
    if (subscription.proposals_remaining <= 0) return 'border-orange-300 bg-orange-50';
    if (subscription.days_remaining <= 7) return 'border-yellow-300 bg-yellow-50';
    return 'border-green-300 bg-green-50';
  };

  const getProgressPercentage = () => {
    if (!subscription?.has_subscription) return 0;
    const used = subscription.proposals_limit - subscription.proposals_remaining;
    return (used / subscription.proposals_limit) * 100;
  };

  if (loading) {
    return (
      <div className={cn("bg-white rounded-xl shadow-sm p-6 animate-pulse", className)}>
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  // No subscription state
  if (!subscription || !subscription.has_subscription) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-sm p-6 border border-gray-200", className)}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <FiAlertCircle className="text-orange-500 text-2xl mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">No Active Subscription</h3>
          </div>
        </div>

        <p className="text-gray-600 mb-6">
          Get started with a subscription to generate Erasmus+ proposals with AI. You can still create and save draft proposals.
        </p>

        <button
          onClick={() => navigate('/pricing')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
        >
          <FiCreditCard className="mr-2" />
          View Pricing Plans
        </button>
      </motion.div>
    );
  }

  // Active subscription state
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(`rounded-xl shadow-sm p-6 border-2 ${getStatusColor()}`, className)}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Subscription Status
          </h3>
          <div className="inline-flex items-center">
            <span
              className={`text-xs font-bold text-white px-3 py-1 rounded-full ${getPlanBadgeColor(subscription.plan_type)}`}
            >
              {subscription.plan_type?.toUpperCase()} PLAN
            </span>
          </div>
        </div>
        <FiCheckCircle className="text-green-500 text-2xl" />
      </div>

      {/* AI Generation Credits */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center text-gray-700">
            <FiFileText className="mr-2" />
            <span className="font-medium">AI Generation Credits</span>
          </div>
          <span className="text-sm font-semibold text-gray-900">
            {subscription.proposals_remaining} / {subscription.proposals_limit} remaining
          </span>
        </div>

        <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${100 - getProgressPercentage()}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
          />
        </div>

        {subscription.proposals_remaining <= 2 && subscription.proposals_remaining > 0 && (
          <p className="text-xs text-orange-600 mt-1">
            ⚠️ Only {subscription.proposals_remaining} AI generation{subscription.proposals_remaining > 1 ? 's' : ''} left
          </p>
        )}
      </div>

      {/* Time Remaining */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-gray-700">
            <FiClock className="mr-2" />
            <span className="font-medium">Valid Until</span>
          </div>
          <span className="text-sm font-semibold text-gray-900">
            {new Date(subscription.expires_at).toLocaleDateString()} ({subscription.days_remaining} days)
          </span>
        </div>

        {subscription.days_remaining <= 7 && (
          <p className="text-xs text-yellow-600 mt-1">
            ⚠️ Expires in {subscription.days_remaining} day{subscription.days_remaining > 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {subscription.proposals_remaining > 0 ? (
          <button
            onClick={() => navigate('/project-input')}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
          >
            New Proposal
          </button>
        ) : (
          <button
            onClick={() => navigate('/pricing')}
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
          >
            Upgrade Plan
          </button>
        )}

        <button
          onClick={() => navigate('/pricing')}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm"
        >
          Manage
        </button>
      </div>
    </motion.div>
  );
};

export default SubscriptionStatus;