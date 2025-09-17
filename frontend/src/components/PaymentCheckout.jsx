import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { FiCreditCard, FiLock, FiCheck } from 'react-icons/fi';

const PaymentCheckout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [planDetails, setPlanDetails] = useState(null);
  const [paypalReady, setPaypalReady] = useState(false);

  const planType = location.state?.planType || 'starter';

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: '/payment', planType } });
      return;
    }

    fetchPlanDetails();
    loadPayPalScript();
  }, [user, planType]);

  const fetchPlanDetails = async () => {
    try {
      const response = await api.get('/payments/pricing-plans');
      setPlanDetails(response.data[planType]);
    } catch (error) {
      console.error('Error fetching plan details:', error);
      setError('Unable to load plan details. Please try again.');
    }
  };

  const loadPayPalScript = () => {
    // Check if PayPal script is already loaded
    if (window.paypal) {
      setPaypalReady(true);
      return;
    }

    // Load PayPal SDK
    const script = document.createElement('script');
    // You'll need to replace this with your actual PayPal client ID
    script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.REACT_APP_PAYPAL_CLIENT_ID || 'YOUR_SANDBOX_CLIENT_ID'}&currency=EUR`;
    script.async = true;
    script.onload = () => setPaypalReady(true);
    script.onerror = () => setError('Failed to load PayPal. Please refresh and try again.');
    document.body.appendChild(script);
  };

  const handleCreateOrder = async () => {
    try {
      setLoading(true);
      setError(null);

      // Create order on backend
      const response = await api.post('/payments/create-order', {
        plan_type: planType,
        return_url: `${window.location.origin}/payment-success`,
        cancel_url: `${window.location.origin}/payment-cancelled`
      });

      const { order_id, approval_url } = response.data;

      // Redirect to PayPal for payment
      if (approval_url) {
        window.location.href = approval_url;
      } else {
        throw new Error('No approval URL received from PayPal');
      }
    } catch (error) {
      console.error('Error creating PayPal order:', error);
      setError(error.response?.data?.detail || 'Failed to create payment order. Please try again.');
      setLoading(false);
    }
  };

  const renderPayPalButton = () => {
    if (!paypalReady || !window.paypal) {
      return (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading PayPal...</p>
        </div>
      );
    }

    // For now, we'll use a simple button that redirects to PayPal
    // In production, you'd integrate PayPal's button component
    return (
      <button
        onClick={handleCreateOrder}
        disabled={loading}
        className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-4 px-6 rounded-lg transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900 mr-3"></div>
            Processing...
          </>
        ) : (
          <>
            <FiCreditCard className="mr-2" />
            Pay with PayPal
          </>
        )}
      </button>
    );
  };

  if (!planDetails) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Complete Your Purchase
          </h1>
          <div className="flex items-center justify-center text-gray-600">
            <FiLock className="mr-2" />
            <span>Secure Payment via PayPal</span>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Order Summary
          </h2>

          <div className="border-b pb-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {planDetails.name} Plan
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  Valid for {planDetails.days} days
                </p>
              </div>
              <span className="text-2xl font-bold text-gray-900">
                €{planDetails.price}
              </span>
            </div>

            <ul className="space-y-2">
              {planDetails.features.slice(0, 3).map((feature, index) => (
                <li key={index} className="flex items-center text-sm text-gray-600">
                  <FiCheck className="text-green-500 mr-2 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-between items-center mb-6">
            <span className="text-lg font-semibold text-gray-900">
              Total Amount
            </span>
            <span className="text-2xl font-bold text-blue-600">
              €{planDetails.price}
            </span>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* PayPal Button */}
          {renderPayPalButton()}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 mb-2">
              By completing this purchase, you agree to our Terms of Service
            </p>
            <button
              onClick={() => navigate('/pricing')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Cancel and return to pricing
            </button>
          </div>
        </div>

        {/* Security Badge */}
        <div className="text-center">
          <div className="inline-flex items-center bg-gray-100 rounded-lg px-4 py-2">
            <FiLock className="text-green-600 mr-2" />
            <span className="text-sm text-gray-700">
              Your payment information is secure and encrypted
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCheckout;