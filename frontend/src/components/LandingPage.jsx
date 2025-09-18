import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiClock, FiCheck, FiZap, FiAward, FiUsers, FiFileText,
  FiArrowRight, FiTarget, FiTrendingUp, FiShield, FiRefreshCw,
  FiBookOpen, FiGlobe, FiBarChart2, FiCheckCircle
} from 'react-icons/fi';

const LandingPage = () => {
  const navigate = useNavigate();
  const [animatedStats, setAnimatedStats] = useState({
    hours: 0,
    proposals: 0,
    success: 0
  });

  useEffect(() => {
    // Animate stats on mount
    const timer1 = setTimeout(() => {
      const interval = setInterval(() => {
        setAnimatedStats(prev => ({
          hours: Math.min(prev.hours + 2, 60),
          proposals: Math.min(prev.proposals + 50, 1250),
          success: Math.min(prev.success + 4, 98)
        }));
      }, 50);

      setTimeout(() => clearInterval(interval), 2000);
    }, 500);

    return () => clearTimeout(timer1);
  }, []);

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const stagger = {
    visible: { transition: { staggerChildren: 0.1 } }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <FiAward className="text-3xl text-blue-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Erasmus+ AI Assistant
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/pricing" className="text-gray-700 hover:text-blue-600 transition">
                Pricing
              </Link>
              <Link to="/resources" className="text-gray-700 hover:text-blue-600 transition">
                Resources
              </Link>
              <Link
                to="/login"
                className="text-blue-600 hover:text-blue-700 font-medium transition"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-2 rounded-lg hover:shadow-lg transition transform hover:scale-105"
              >
                Start Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="relative overflow-hidden pt-16 pb-20 px-4"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={fadeInUp}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center bg-blue-100 text-blue-700 px-4 py-2 rounded-full mb-6">
              <FiZap className="mr-2" />
              <span className="font-semibold">AI-Powered Grant Writing</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Complete Your Erasmus+ Application in{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                30 Minutes
              </span>
              <br />
              Not 60 Hours
            </h1>

            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Let AI handle the complex KA220-ADU application process. Get comprehensive,
              evaluation-optimized answers for all 27 questions while you focus on your project vision.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/register')}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-lg font-semibold hover:shadow-xl transition transform hover:scale-105 flex items-center justify-center"
              >
                Start Your Application <FiArrowRight className="ml-2" />
              </button>
              <button
                onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 bg-white text-blue-600 rounded-lg text-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition flex items-center justify-center"
              >
                See How It Works
              </button>
            </div>

            <div className="mt-8 text-sm text-gray-500">
              No credit card required • €29 for your first proposal • Cancel anytime
            </div>
          </motion.div>
        </div>

        {/* Animated background elements */}
        <div className="absolute top-20 right-0 w-96 h-96 bg-purple-200 rounded-full opacity-20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200 rounded-full opacity-20 blur-3xl animate-pulse" />
      </motion.section>

      {/* Stats Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="py-16 bg-white"
      >
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-5xl font-bold text-blue-600 mb-2">
              {animatedStats.hours}+
            </div>
            <div className="text-xl text-gray-700">Hours Saved</div>
            <div className="text-gray-500 mt-1">Per Application</div>
          </div>
          <div className="text-center">
            <div className="text-5xl font-bold text-purple-600 mb-2">
              {animatedStats.proposals.toLocaleString()}+
            </div>
            <div className="text-xl text-gray-700">Proposals Generated</div>
            <div className="text-gray-500 mt-1">By Our Users</div>
          </div>
          <div className="text-center">
            <div className="text-5xl font-bold text-green-600 mb-2">
              {animatedStats.success}%
            </div>
            <div className="text-xl text-gray-700">Completion Rate</div>
            <div className="text-gray-500 mt-1">All Questions Answered</div>
          </div>
        </div>
      </motion.section>

      {/* Problem/Solution Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              The Grant Application Problem
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Traditional Erasmus+ applications are overwhelming and time-consuming
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="bg-red-50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-red-900 mb-6 flex items-center">
                <FiClock className="mr-3 text-red-600" />
                Without Our Tool
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <span className="text-red-500 mt-1 mr-3">✗</span>
                  <span className="text-gray-700">40-60 hours of writing and research</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mt-1 mr-3">✗</span>
                  <span className="text-gray-700">Complex EU terminology and requirements</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mt-1 mr-3">✗</span>
                  <span className="text-gray-700">Risk of missing evaluation criteria</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mt-1 mr-3">✗</span>
                  <span className="text-gray-700">Inconsistent answers across sections</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mt-1 mr-3">✗</span>
                  <span className="text-gray-700">Deadline pressure and stress</span>
                </li>
              </ul>
            </div>

            <div className="bg-green-50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-green-900 mb-6 flex items-center">
                <FiCheckCircle className="mr-3 text-green-600" />
                With Erasmus+ AI
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <FiCheck className="text-green-500 mt-1 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Complete application in 30 minutes</span>
                </li>
                <li className="flex items-start">
                  <FiCheck className="text-green-500 mt-1 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">AI handles all technical requirements</span>
                </li>
                <li className="flex items-start">
                  <FiCheck className="text-green-500 mt-1 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Optimized for evaluation scoring</span>
                </li>
                <li className="flex items-start">
                  <FiCheck className="text-green-500 mt-1 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Consistent, coherent narrative</span>
                </li>
                <li className="flex items-start">
                  <FiCheck className="text-green-500 mt-1 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Peace of mind and confidence</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Three simple steps to your complete Erasmus+ application
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              whileHover={{ y: -10 }}
              className="text-center"
            >
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <FiFileText className="text-4xl text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                1. Enter Your Project Details
              </h3>
              <p className="text-gray-600">
                Provide basic information about your project idea, partners, and objectives.
                Our intuitive form guides you through each step.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -10 }}
              className="text-center"
            >
              <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <FiZap className="text-4xl text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                2. AI Generates Your Application
              </h3>
              <p className="text-gray-600">
                Our GPT-4 powered system creates comprehensive, evaluation-optimized answers
                for all 27 application questions.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -10 }}
              className="text-center"
            >
              <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <FiCheckCircle className="text-4xl text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                3. Review and Export
              </h3>
              <p className="text-gray-600">
                Review your complete application, make any edits you want, and export as PDF
                ready for submission.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Success
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to create a winning Erasmus+ application
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition">
              <FiTarget className="text-3xl text-blue-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                EU Priority Alignment
              </h3>
              <p className="text-gray-600">
                Automatically aligns your application with current EU priorities for maximum relevance.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition">
              <FiBarChart2 className="text-3xl text-purple-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Evaluation Optimization
              </h3>
              <p className="text-gray-600">
                Structured to maximize points across all evaluation criteria.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition">
              <FiRefreshCw className="text-3xl text-green-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Context Awareness
              </h3>
              <p className="text-gray-600">
                Each answer builds on previous ones for a coherent narrative.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition">
              <FiShield className="text-3xl text-red-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Compliance Guaranteed
              </h3>
              <p className="text-gray-600">
                All answers meet character limits and formatting requirements.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition">
              <FiUsers className="text-3xl text-indigo-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Multi-Partner Support
              </h3>
              <p className="text-gray-600">
                Handles complex partnerships and consortium applications.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition">
              <FiBookOpen className="text-3xl text-orange-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Learning Resources
              </h3>
              <p className="text-gray-600">
                Access comprehensive guides and best practices for Erasmus+.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Trusted by Organizations Across Europe
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See what our users say about their experience
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <FiAward key={i} className="text-yellow-500" />
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                "Reduced our application time from 2 weeks to 2 hours. The AI understood
                our project perfectly and created compelling answers that secured our funding."
              </p>
              <div className="font-semibold text-gray-900">Maria Schmidt</div>
              <div className="text-sm text-gray-600">Education Coordinator, Berlin</div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <FiAward key={i} className="text-yellow-500" />
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                "As a first-time applicant, this tool was invaluable. It guided me through
                the complex requirements and helped me submit a professional application."
              </p>
              <div className="font-semibold text-gray-900">João Silva</div>
              <div className="text-sm text-gray-600">NGO Director, Lisbon</div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <FiAward key={i} className="text-yellow-500" />
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                "We've used this for 3 applications now. The quality is consistent and the
                time savings allow us to focus on project implementation instead of paperwork."
              </p>
              <div className="font-semibold text-gray-900">Anna Kowalski</div>
              <div className="text-sm text-gray-600">Project Manager, Warsaw</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Choose the plan that fits your needs
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Starter</h3>
              <div className="text-4xl font-bold text-blue-600 mb-4">
                €29
                <span className="text-lg text-gray-500 font-normal">/30 days</span>
              </div>
              <ul className="space-y-3 mb-6 text-left">
                <li className="flex items-center">
                  <FiCheck className="text-green-500 mr-2" />
                  <span>1 Complete Application</span>
                </li>
                <li className="flex items-center">
                  <FiCheck className="text-green-500 mr-2" />
                  <span>All 27 Questions</span>
                </li>
                <li className="flex items-center">
                  <FiCheck className="text-green-500 mr-2" />
                  <span>PDF Export</span>
                </li>
              </ul>
              <button
                onClick={() => navigate('/register')}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Start Now
              </button>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-8 shadow-lg border-2 border-purple-200">
              <div className="bg-purple-600 text-white text-sm px-3 py-1 rounded-full inline-block mb-2">
                MOST POPULAR
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Professional</h3>
              <div className="text-4xl font-bold text-purple-600 mb-4">
                €199
                <span className="text-lg text-gray-500 font-normal">/90 days</span>
              </div>
              <ul className="space-y-3 mb-6 text-left">
                <li className="flex items-center">
                  <FiCheck className="text-green-500 mr-2" />
                  <span>10 Applications</span>
                </li>
                <li className="flex items-center">
                  <FiCheck className="text-green-500 mr-2" />
                  <span>Priority Support</span>
                </li>
                <li className="flex items-center">
                  <FiCheck className="text-green-500 mr-2" />
                  <span>Custom Templates</span>
                </li>
              </ul>
              <button
                onClick={() => navigate('/register')}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition"
              >
                Go Professional
              </button>
            </div>
          </div>

          <Link
            to="/pricing"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            View all pricing options →
          </Link>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <div className="border-b pb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                How accurate is the AI-generated content?
              </h3>
              <p className="text-gray-600">
                Our system uses GPT-4, trained specifically on successful Erasmus+ applications.
                It generates comprehensive, relevant answers that align with evaluation criteria.
                You can always review and edit before submission.
              </p>
            </div>

            <div className="border-b pb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Can I edit the generated answers?
              </h3>
              <p className="text-gray-600">
                Yes! After generation, you have full control to review, edit, and customize every answer.
                The AI provides a strong foundation that you can refine to perfectly match your vision.
              </p>
            </div>

            <div className="border-b pb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                What if I'm not satisfied with the results?
              </h3>
              <p className="text-gray-600">
                We offer a satisfaction guarantee. If the generated application doesn't meet your expectations,
                our support team will work with you to ensure you get the quality you need.
              </p>
            </div>

            <div className="border-b pb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Is my data secure?
              </h3>
              <p className="text-gray-600">
                Absolutely. We use enterprise-grade encryption for all data transmission and storage.
                Your project information is never shared with third parties and you retain full ownership.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Grant Application Process?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of successful applicants who saved weeks of work
          </p>

          <div className="bg-white/10 backdrop-blur rounded-xl p-8 mb-8">
            <div className="grid md:grid-cols-3 gap-6 text-white mb-8">
              <div>
                <FiClock className="text-3xl mb-2 mx-auto" />
                <div className="font-bold">Save 60 Hours</div>
              </div>
              <div>
                <FiGlobe className="text-3xl mb-2 mx-auto" />
                <div className="font-bold">EU Compliant</div>
              </div>
              <div>
                <FiTrendingUp className="text-3xl mb-2 mx-auto" />
                <div className="font-bold">Higher Success Rate</div>
              </div>
            </div>

            <button
              onClick={() => navigate('/register')}
              className="px-12 py-4 bg-white text-blue-600 rounded-lg text-lg font-bold hover:shadow-2xl transition transform hover:scale-105"
            >
              Start Your Free Trial Now
            </button>

            <div className="mt-4 text-sm text-blue-100">
              No credit card required • €29 for your first proposal • Cancel anytime
            </div>
          </div>

          <div className="text-white/80 text-sm">
            Questions? Email us at support@erasmus-ai.com
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <FiAward className="text-2xl text-blue-400" />
                <span className="text-xl font-bold text-white">Erasmus+ AI</span>
              </div>
              <p className="text-sm">
                Your intelligent partner for successful Erasmus+ grant applications.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/pricing" className="hover:text-white transition">Pricing</Link></li>
                <li><Link to="/resources" className="hover:text-white transition">Resources</Link></li>
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#about" className="hover:text-white transition">About Us</a></li>
                <li><a href="#contact" className="hover:text-white transition">Contact</a></li>
                <li><a href="#privacy" className="hover:text-white transition">Privacy Policy</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#faq" className="hover:text-white transition">FAQ</a></li>
                <li><a href="#guide" className="hover:text-white transition">User Guide</a></li>
                <li><a href="mailto:support@erasmus-ai.com" className="hover:text-white transition">Email Support</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>© 2024 Erasmus+ AI Assistant. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;