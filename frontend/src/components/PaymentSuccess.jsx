import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { FiCheckCircle, FiArrowRight } from 'react-icons/fi';

const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [processing, setProcessing] = useState(true);
  const [error, setError] = useState(null);
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Get order ID from URL params
    const urlParams = new URLSearchParams(location.search);
    const orderId = urlParams.get('token');

    if (orderId) {
      capturePayment(orderId);
    } else {
      setError('No payment information found. Please contact support.');
      setProcessing(false);
    }
  }, [user, location]);

  const capturePayment = async (orderId) => {
    try {
      const response = await api.post('/payments/capture-order', {
        order_id: orderId
      });

      if (response.data.success) {
        setSubscriptionDetails(response.data.subscription);
        setProcessing(false);

        // Refresh user data after successful payment
        // This would typically trigger a context update
        setTimeout(() => {
          navigate('/dashboard');
        }, 5000);
      } else {
        throw new Error('Payment capture failed');
      }
    } catch (error) {
      console.error('Error capturing payment:', error);
      setError(error.response?.data?.detail || 'Payment processing failed. Please contact support.');
      setProcessing(false);
    }
  };

  if (processing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900">Processing your payment...</h2>
          <p className="text-gray-600 mt-2">Please wait while we confirm your subscription</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Processing Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/pricing')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Return to Pricing
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <FiCheckCircle className="text-5xl text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h1>
          <p className="text-gray-600">
            Your subscription is now active
          </p>
        </div>

        {/* Subscription Details */}
        {subscriptionDetails && (
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Subscription Details
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Plan:</span>
                <span className="font-semibold text-gray-900">
                  {subscriptionDetails.plan_type?.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Proposals Available:</span>
                <span className="font-semibold text-gray-900">
                  {subscriptionDetails.proposals_limit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Valid Until:</span>
                <span className="font-semibold text-gray-900">
                  {new Date(subscriptionDetails.expires_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Next Steps */}
        <div className="bg-blue-50 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            What's Next?
          </h3>
          <ul className="space-y-3">
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">1.</span>
              <span className="text-gray-700">
                Go to your dashboard to start generating proposals
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">2.</span>
              <span className="text-gray-700">
                Enter your project details and let AI generate comprehensive answers
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">3.</span>
              <span className="text-gray-700">
                Review, edit, and export your completed application
              </span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            Go to Dashboard
            <FiArrowRight className="ml-2" />
          </button>
          <button
            onClick={() => navigate('/project-input')}
            className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Start First Proposal
          </button>
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Redirecting to dashboard in 5 seconds...
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;