import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { FiCheck, FiX, FiZap, FiAward } from 'react-icons/fi';

const PricingPlans = () => {
  const [plans, setPlans] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPricingPlans();
    if (user) {
      fetchSubscriptionStatus();
    }
  }, [user]);

  const fetchPricingPlans = async () => {
    try {
      const response = await api.get('/payments/pricing-plans');
      setPlans(response.data);
    } catch (error) {
      console.error('Error fetching pricing plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await api.get('/payments/subscription-status');
      setSubscriptionStatus(response.data);
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    }
  };

  const handleSelectPlan = async (planType) => {
    if (!user) {
      navigate('/login', { state: { from: '/pricing', planType } });
      return;
    }

    setSelectedPlan(planType);
    // Redirect to payment page
    navigate('/payment', { state: { planType } });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!plans) {
    return (
      <div className="text-center text-gray-500">
        Unable to load pricing plans. Please try again later.
      </div>
    );
  }

  const isPlanActive = (planType) => {
    return subscriptionStatus?.has_subscription &&
           subscriptionStatus?.plan_type === planType &&
           subscriptionStatus?.is_active;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Save 40-60 hours of work on your Erasmus+ grant application with our AI-powered assistant
          </p>
        </div>

        {/* Current Subscription Status */}
        {subscriptionStatus?.has_subscription && (
          <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-green-900">
                  Current Plan: {subscriptionStatus.plan_type?.toUpperCase()}
                </h3>
                <p className="text-green-700">
                  {subscriptionStatus.proposals_remaining} proposals remaining •
                  Expires in {subscriptionStatus.days_remaining} days
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Starter Plan */}
          <div className={`bg-white rounded-2xl shadow-xl p-8 relative ${isPlanActive('starter') ? 'ring-2 ring-green-500' : ''}`}>
            {isPlanActive('starter') && (
              <div className="absolute top-4 right-4">
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  Active
                </span>
              </div>
            )}

            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {plans.starter.name}
                </h2>
                <FiZap className="text-3xl text-blue-500" />
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">
                  €{plans.starter.price}
                </span>
                <span className="text-gray-500 ml-2">
                  / {plans.starter.days} days
                </span>
              </div>

              <p className="text-gray-600 mb-6">
                Perfect for individual applicants working on a single grant application
              </p>
            </div>

            <ul className="space-y-4 mb-8">
              {plans.starter.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <FiCheck className="text-green-500 mt-1 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSelectPlan('starter')}
              disabled={isPlanActive('starter')}
              className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                isPlanActive('starter')
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'
              }`}
            >
              {isPlanActive('starter') ? 'Current Plan' : 'Get Started'}
            </button>
          </div>

          {/* Professional Plan */}
          <div className={`bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl shadow-xl p-8 relative border-2 border-purple-200 ${isPlanActive('professional') ? 'ring-2 ring-green-500' : ''}`}>
            {isPlanActive('professional') && (
              <div className="absolute top-4 right-4">
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  Active
                </span>
              </div>
            )}

            {!isPlanActive('professional') && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </span>
              </div>
            )}

            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {plans.professional.name}
                </h2>
                <FiAward className="text-3xl text-purple-500" />
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">
                  €{plans.professional.price}
                </span>
                <span className="text-gray-500 ml-2">
                  / {plans.professional.days} days
                </span>
              </div>

              <p className="text-gray-600 mb-6">
                Ideal for consultants and organizations helping multiple clients
              </p>
            </div>

            <ul className="space-y-4 mb-8">
              {plans.professional.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <FiCheck className="text-green-500 mt-1 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSelectPlan('professional')}
              disabled={isPlanActive('professional')}
              className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                isPlanActive('professional')
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg transform hover:scale-105'
              }`}
            >
              {isPlanActive('professional') ? 'Current Plan' : 'Go Professional'}
            </button>
          </div>
        </div>

        {/* Value Proposition */}
        <div className="mt-16 text-center">
          <div className="bg-blue-50 rounded-2xl p-8 max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Why Choose Our Service?
            </h3>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div>
                <div className="text-3xl font-bold text-blue-600 mb-2">40-60 hrs</div>
                <p className="text-gray-600">Average time saved per application</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600 mb-2">100%</div>
                <p className="text-gray-600">All 27 questions answered comprehensively</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600 mb-2">30 min</div>
                <p className="text-gray-600">Complete application ready</p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h3>

          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h4 className="font-semibold text-gray-900 mb-2">
                What happens after I use all my proposals?
              </h4>
              <p className="text-gray-600">
                You can upgrade to a higher plan or wait for your subscription to renew.
                Your generated proposals remain accessible even after your subscription expires.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <h4 className="font-semibold text-gray-900 mb-2">
                Can I switch between plans?
              </h4>
              <p className="text-gray-600">
                Yes, you can upgrade from Starter to Professional at any time.
                Your remaining proposals will be added to the new plan.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <h4 className="font-semibold text-gray-900 mb-2">
                Is my payment secure?
              </h4>
              <p className="text-gray-600">
                Yes, all payments are processed securely through PayPal.
                We never store your payment information on our servers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPlans;