import React from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Zap,
  Clock,
  CheckCircle,
  Users,
  Target,
  Award,
  FileText,
  Globe,
  Star,
  Euro,
  Sparkles,
  BookOpen,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  Shield,
  TrendingUp,
  BarChart3
} from 'lucide-react'

const HomePage = () => {
  const pricingPlans = [
    {
      name: 'Silver Shot',
      price: '500',
      description: 'Production of 1 Small Scale project',
      features: ['User-managed partner search and budget'],
      popular: false
    },
    {
      name: 'Gold Shot',
      price: '1,000',
      description: 'Production of 1 Cooperation Partnerships project',
      features: ['User-managed partner search and budget'],
      popular: true
    },
    {
      name: 'Silver',
      price: '1,500',
      description: 'Production of 5 Small Scale projects',
      features: ['User-managed partner search and budget'],
      popular: false
    },
    {
      name: 'Gold',
      price: '3,000',
      description: 'Production of 5 Cooperation Partnerships projects',
      features: ['User-managed partner search and budget'],
      popular: false
    },
    {
      name: 'Silver Plus',
      price: '3,000',
      description: 'Production of 5 Small Scale projects',
      features: ['Partner search and budget managed by the GYG team'],
      popular: false
    },
    {
      name: 'Gold Plus',
      price: '5,000',
      description: 'Production of 5 Cooperation Partnerships projects',
      features: ['Partner search and budget managed by the GYG team'],
      popular: false
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-lg">GYG</span>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">
                      Get Your Grant
                    </h1>
                    <p className="text-xs text-gray-500 -mt-0.5">AI-Powered EU Funding Solutions</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 font-medium">
                How It Works
              </a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 font-medium">
                Pricing
              </a>
              <a href="#about" className="text-gray-600 hover:text-gray-900 font-medium">
                About
              </a>
              <Link
                to="/login"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Start Free
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section - Simplified and Direct */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-4xl mx-auto">
            {/* Trust Badge */}
            <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-6">
              <Shield className="w-4 h-4 mr-2" />
              Trusted by 1,250+ Organizations
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Complete Your Erasmus+ Application in{' '}
              <span className="text-blue-600">30 Minutes</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Stop spending weeks on grant applications. Our AI generates complete,
              evaluation-optimized KA220-ADU proposals while you focus on your project vision.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-8 py-3 bg-blue-600 text-white rounded-lg text-lg font-semibold hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Start Your Application
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <button
                onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center justify-center px-8 py-3 bg-white text-gray-700 rounded-lg text-lg font-semibold border-2 border-gray-200 hover:border-gray-300 transition-all duration-200"
              >
                See How It Works
              </button>
            </div>

            {/* Key Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="flex items-center justify-center space-x-2 text-gray-700">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="font-medium">Save 60+ Hours</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-gray-700">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium">100% Compliant</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-gray-700">
                <Target className="w-5 h-5 text-purple-600" />
                <span className="font-medium">Priority Aligned</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              The Grant Writing Challenge
            </h2>
            <p className="text-xl text-gray-600">
              Traditional applications take weeks. We've changed that.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Without GYG */}
            <div className="bg-white rounded-2xl p-8 border border-red-100">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mr-3">
                  <Clock className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Without GYG</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <span className="text-red-500 mt-1 mr-3">✗</span>
                  <span className="text-gray-700">40-60 hours of research and writing</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mt-1 mr-3">✗</span>
                  <span className="text-gray-700">Complex EU terminology confusion</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mt-1 mr-3">✗</span>
                  <span className="text-gray-700">Risk of missing evaluation criteria</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mt-1 mr-3">✗</span>
                  <span className="text-gray-700">Inconsistent narrative across sections</span>
                </li>
              </ul>
            </div>

            {/* With GYG */}
            <div className="bg-white rounded-2xl p-8 border border-green-100">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-3">
                  <Zap className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">With GYG</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Complete application in 30 minutes</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">AI handles all technical requirements</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Optimized for maximum scoring</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Coherent, professional narrative</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How GYG Works
            </h2>
            <p className="text-xl text-gray-600">
              Three simple steps to your complete Erasmus+ application
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {/* Step 1 */}
            <div className="relative">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  1. Input Your Project
                </h3>
                <p className="text-gray-600">
                  Provide basic details about your project idea, partners, and objectives
                </p>
              </div>
              {/* Connector */}
              <div className="hidden md:block absolute top-8 left-full w-full">
                <ChevronRight className="w-6 h-6 text-gray-300 -ml-3" />
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  2. AI Generates
                </h3>
                <p className="text-gray-600">
                  Our GPT-4 system creates comprehensive answers for all 27 questions
                </p>
              </div>
              {/* Connector */}
              <div className="hidden md:block absolute top-8 left-full w-full">
                <ChevronRight className="w-6 h-6 text-gray-300 -ml-3" />
              </div>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                3. Review & Export
              </h3>
              <p className="text-gray-600">
                Review, edit if needed, and export your PDF ready for submission
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Built for Success
            </h2>
            <p className="text-xl text-gray-600">
              Every feature designed to maximize your funding chances
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <Target className="w-10 h-10 text-blue-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                EU Priority Alignment
              </h3>
              <p className="text-gray-600 text-sm">
                Automatically aligns with 2025 EU priorities for maximum relevance
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <BarChart3 className="w-10 h-10 text-purple-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Evaluation Optimized
              </h3>
              <p className="text-gray-600 text-sm">
                Structured to maximize points across all evaluation criteria
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <Shield className="w-10 h-10 text-green-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                100% Compliant
              </h3>
              <p className="text-gray-600 text-sm">
                All answers meet character limits and formatting requirements
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <Users className="w-10 h-10 text-orange-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Partner Support
              </h3>
              <p className="text-gray-600 text-sm">
                Handles complex multi-partner consortium applications
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <BookOpen className="w-10 h-10 text-red-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Context Aware
              </h3>
              <p className="text-gray-600 text-sm">
                Each answer builds on previous ones for coherent narrative
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <TrendingUp className="w-10 h-10 text-indigo-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Success Focused
              </h3>
              <p className="text-gray-600 text-sm">
                Based on successful applications and best practices
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that fits your organization's needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-white rounded-2xl border ${
                  plan.popular
                    ? 'border-blue-500 shadow-xl'
                    : 'border-gray-200'
                } p-6`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </div>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-gray-900">€{plan.price}</span>
                    <span className="text-gray-500 ml-2">+ VAT</span>
                  </div>
                </div>

                <p className="text-gray-600 text-center mb-6">
                  {plan.description}
                </p>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/register"
                  className={`block w-full py-3 rounded-lg font-medium text-center transition-all duration-200 ${
                    plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Organizations Across Europe
            </h2>
            <p className="text-xl text-gray-600">
              Join 1,250+ organizations saving time and winning grants
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                "Cut our application time from 2 weeks to 2 hours. The AI perfectly captured our project vision and secured our funding."
              </p>
              <div>
                <div className="font-semibold text-gray-900">Maria Schmidt</div>
                <div className="text-sm text-gray-600">Education Coordinator, Berlin</div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                "As a first-timer, GYG made the complex Erasmus+ process manageable. We submitted a professional application with confidence."
              </p>
              <div>
                <div className="font-semibold text-gray-900">João Silva</div>
                <div className="text-sm text-gray-600">NGO Director, Lisbon</div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                "The quality is exceptional. We've used GYG for 3 successful applications. It's now essential to our grant strategy."
              </p>
              <div>
                <div className="font-semibold text-gray-900">Anna Kowalski</div>
                <div className="text-sm text-gray-600">Project Manager, Warsaw</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About GYG Section */}
      <section id="about" className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                About Get Your Grant
              </h2>
              <p className="text-xl text-gray-600">
                Democratizing access to EU funding through AI innovation
              </p>
            </div>

            <div className="prose prose-lg mx-auto text-gray-700">
              <p className="mb-6">
                Get Your Grant (GYG) brings the power of artificial intelligence to the service of organizations
                seeking Erasmus+ funding. We help you prepare, design, write, and submit effective applications
                for the Erasmus+ programme, dramatically reducing the time and expertise required.
              </p>

              <p className="mb-6">
                Our mission is simple: reduce the burden of grant writing and open up EU funding to all
                changemakers. By combining professional grant writing expertise with cutting-edge AI technology,
                we're increasing the average quality of project proposals across Europe.
              </p>

              <p className="mb-6">
                Currently supporting KA220-ADU Cooperation Partnerships and KA210-ADU Small-Scale Partnerships,
                GYG transforms what traditionally takes 40-60 hours into a streamlined 30-minute process.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-blue-700">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Grant Writing?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join 1,250+ organizations already winning with GYG
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link
              to="/register"
              className="inline-flex items-center justify-center px-8 py-3 bg-white text-blue-600 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-all duration-200 shadow-lg"
            >
              Start Your Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-8 py-3 bg-blue-500 text-white rounded-lg text-lg font-semibold hover:bg-blue-400 transition-all duration-200"
            >
              Sign In
            </Link>
          </div>

          <p className="text-blue-100">
            No credit card required • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold">GYG</span>
                </div>
                <div>
                  <h3 className="text-white font-bold">Get Your Grant</h3>
                  <p className="text-xs text-gray-400">AI-Powered EU Funding Solutions</p>
                </div>
              </div>
              <p className="text-sm mb-4 text-gray-400">
                Democratizing access to EU funding through artificial intelligence.
                Transform your grant writing process and focus on what matters - your project vision.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-gray-500" />
                  <a href="mailto:info@getyourgrant.eu" className="hover:text-white">
                    info@getyourgrant.eu
                  </a>
                </div>
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-gray-500" />
                  <a href="mailto:support@getyourgrant.eu" className="hover:text-white">
                    support@getyourgrant.eu
                  </a>
                </div>
              </div>
            </div>

            {/* Products */}
            <div>
              <h4 className="text-white font-semibold mb-4">Products</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/register" className="hover:text-white transition">
                    Erasmus+ AI Assistant
                  </Link>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-white transition">
                    Pricing Plans
                  </a>
                </li>
                <li>
                  <Link to="/resources" className="hover:text-white transition">
                    Resources
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="/privacy" className="hover:text-white transition">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="/terms" className="hover:text-white transition">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="/gdpr" className="hover:text-white transition">
                    GDPR Compliance
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-sm text-gray-400">
              © 2025 Get Your Grant. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default HomePage