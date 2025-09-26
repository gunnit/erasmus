import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  Shield,
  TrendingUp,
  BarChart3,
  Check,
  Rocket,
  Brain,
  Layers,
  GitBranch,
  Activity
} from 'lucide-react'

const HomePage = () => {
  const navigate = useNavigate()
  const [hoveredCard, setHoveredCard] = useState(null)
  const [scrollY, setScrollY] = useState(0)
  const [counters, setCounters] = useState({
    hours: 0,
    proposals: 0,
    success: 0
  })

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Animated counters
  useEffect(() => {
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setCounters(prev => ({
          hours: Math.min(prev.hours + 2, 60),
          proposals: Math.min(prev.proposals + 50, 1250),
          success: Math.min(prev.success + 3, 98)
        }))
      }, 50)

      setTimeout(() => clearInterval(interval), 2000)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 -z-10">
        <div
          className="absolute top-20 -left-20 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"
          style={{ transform: `translateY(${scrollY * 0.1}px)` }}
        />
        <div
          className="absolute top-60 right-10 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl"
          style={{ transform: `translateY(${scrollY * 0.15}px)` }}
        />
        <div
          className="absolute bottom-40 left-1/3 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl"
          style={{ transform: `translateY(${scrollY * 0.08}px)` }}
        />
      </div>

      {/* Navigation Header with Glass Effect */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100/50">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <div className="group flex items-center space-x-3 cursor-pointer">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl blur group-hover:blur-md transition-all duration-300" />
                  <div className="relative w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <span className="text-white font-bold text-lg">GYG</span>
                  </div>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    Get Your Grant
                  </h1>
                  <p className="text-xs text-gray-500 -mt-0.5">AI-Powered EU Funding</p>
                </div>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#how-it-works" className="relative text-gray-600 hover:text-gray-900 font-medium transition-colors group">
                How It Works
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300" />
              </a>
              <a href="#features" className="relative text-gray-600 hover:text-gray-900 font-medium transition-colors group">
                Features
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300" />
              </a>
              <a href="#pricing" className="relative text-gray-600 hover:text-gray-900 font-medium transition-colors group">
                Pricing
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300" />
              </a>
              <Link
                to="/login"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="relative group overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <span className="relative z-10">Start Free</span>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section with Enhanced Design */}
      <section className="relative pt-32 pb-24 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-5xl mx-auto">
            {/* Animated Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-700 text-sm font-medium mb-8 animate-pulse">
              <Sparkles className="w-4 h-4 mr-2" />
              Powered by GPT-5 • 1,250+ Proposals Generated
              <Shield className="w-4 h-4 ml-2" />
            </div>

            {/* Main Headline with Gradient */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="text-gray-900">Transform </span>
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                60 Hours
              </span>
              <br />
              <span className="text-gray-900">Into </span>
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                30 Minutes
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              AI-powered Erasmus+ grant writing that delivers complete,
              evaluation-optimized KA220-ADU proposals in minutes, not weeks.
            </p>

            {/* CTA Buttons with Animations */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link
                to="/register"
                className="group relative inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <span className="relative z-10 flex items-center">
                  Start Your Application
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
              <button
                onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })}
                className="group relative inline-flex items-center justify-center px-8 py-4 bg-white text-gray-700 rounded-2xl text-lg font-semibold border-2 border-gray-200 hover:border-blue-300 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <Rocket className="mr-2 h-5 w-5 text-blue-600 group-hover:rotate-12 transition-transform" />
                See How It Works
              </button>
            </div>

            {/* Animated Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
              <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200 transform hover:-translate-y-1">
                <Clock className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <div className="text-3xl font-bold text-gray-900">{counters.hours}+ Hours</div>
                <div className="text-sm text-gray-600">Saved Per Application</div>
              </div>
              <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-purple-200 transform hover:-translate-y-1">
                <FileText className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                <div className="text-3xl font-bold text-gray-900">{counters.proposals.toLocaleString()}+</div>
                <div className="text-sm text-gray-600">Proposals Generated</div>
              </div>
              <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-green-200 transform hover:-translate-y-1">
                <Target className="w-8 h-8 text-green-600 mx-auto mb-3" />
                <div className="text-3xl font-bold text-gray-900">{counters.success}%</div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Explainer Section */}
      <section className="py-16 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <div className="inline-flex items-center bg-blue-100 text-blue-700 px-4 py-2 rounded-full mb-4">
              <Zap className="mr-2 w-5 h-5" />
              <span className="font-semibold">Watch How It Works</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              See GYG in Action
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Watch our 5-minute explainer video to understand how our AI-powered system
              transforms weeks of work into just 30 minutes
            </p>
          </div>

          <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="aspect-w-16 aspect-h-9">
              <iframe
                className="w-full h-full"
                style={{ minHeight: '450px' }}
                src="https://www.youtube.com/embed/fUCeDmkRbuw"
                title="Get Your Grant Platform Explainer"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/register')}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition transform hover:scale-105 flex items-center justify-center"
            >
              Try It Yourself <ArrowRight className="ml-2 w-5 h-5" />
            </button>
            <button
              onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition flex items-center justify-center"
            >
              Learn More Details
            </button>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section with Glass Cards */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose GYG?
            </h2>
            <p className="text-xl text-gray-600">
              See the difference AI makes in grant writing
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Without GYG */}
            <div
              className="group relative bg-white/70 backdrop-blur-lg rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-red-100 hover:border-red-200 transform hover:-translate-y-2"
              onMouseEnter={() => setHoveredCard('without')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-orange-50 rounded-3xl opacity-50" />
              <div className="relative">
                <div className="flex items-center mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                    <Clock className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Without GYG</h3>
                </div>
                <ul className="space-y-4">
                  {[
                    '40-60 hours of manual writing',
                    'Complex EU terminology confusion',
                    'Risk of missing evaluation criteria',
                    'Inconsistent narrative across sections'
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start transform transition-transform duration-300" style={{
                      transform: hoveredCard === 'without' ? `translateX(${idx * 2}px)` : 'translateX(0)'
                    }}>
                      <span className="text-red-500 mt-1 mr-3 text-xl">✗</span>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* With GYG */}
            <div
              className="group relative bg-white/70 backdrop-blur-lg rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-green-100 hover:border-green-200 transform hover:-translate-y-2"
              onMouseEnter={() => setHoveredCard('with')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl opacity-50" />
              <div className="relative">
                <div className="flex items-center mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                    <Zap className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">With GYG</h3>
                </div>
                <ul className="space-y-4">
                  {[
                    'Complete application in 30 minutes',
                    'AI handles all technical requirements',
                    'Optimized for maximum scoring',
                    'Coherent, professional narrative'
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start transform transition-transform duration-300" style={{
                      transform: hoveredCard === 'with' ? `translateX(${idx * 2}px)` : 'translateX(0)'
                    }}>
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section with Timeline */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How GYG Works
            </h2>
            <p className="text-xl text-gray-600">
              Three simple steps to your complete application
            </p>
          </div>

          <div className="relative max-w-4xl mx-auto">
            {/* Connection Line */}
            <div className="hidden md:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-300 via-purple-300 to-green-300" />

            <div className="grid md:grid-cols-3 gap-8 relative">
              {/* Step 1 */}
              <div className="group text-center">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
                  <div className="relative w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:scale-110 transition-transform duration-300">
                    <FileText className="w-10 h-10 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  1. Input Your Project
                </h3>
                <p className="text-gray-600">
                  Provide basic details about your project idea, partners, and objectives
                </p>
              </div>

              {/* Step 2 */}
              <div className="group text-center">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
                  <div className="relative w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:scale-110 transition-transform duration-300">
                    <Brain className="w-10 h-10 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  2. AI Generates
                </h3>
                <p className="text-gray-600">
                  GPT-4 creates comprehensive answers for all 27 questions instantly
                </p>
              </div>

              {/* Step 3 */}
              <div className="group text-center">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-600 to-emerald-600 rounded-3xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
                  <div className="relative w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:scale-110 transition-transform duration-300">
                    <CheckCircle className="w-10 h-10 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  3. Review & Export
                </h3>
                <p className="text-gray-600">
                  Review, edit if needed, and export your PDF ready for submission
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid with Modern Cards */}
      <section id="features" className="py-20 bg-gradient-to-br from-gray-50 to-white">
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
            {[
              { icon: Target, color: 'from-blue-500 to-indigo-600', title: 'EU Priority Alignment', desc: 'Automatically aligns with 2025 EU priorities' },
              { icon: BarChart3, color: 'from-purple-500 to-pink-600', title: 'Evaluation Optimized', desc: 'Maximizes points across all criteria' },
              { icon: Shield, color: 'from-green-500 to-emerald-600', title: '100% Compliant', desc: 'Meets all formatting requirements' },
              { icon: Users, color: 'from-orange-500 to-red-600', title: 'Partner Support', desc: 'Handles multi-partner consortiums' },
              { icon: Layers, color: 'from-indigo-500 to-purple-600', title: 'Context Aware', desc: 'Coherent narrative across sections' },
              { icon: Activity, color: 'from-cyan-500 to-blue-600', title: 'Success Tracking', desc: 'Based on winning applications' }
            ].map((feature, idx) => {
              const Icon = feature.icon
              return (
                <div
                  key={idx}
                  className="group relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-gray-200 transform hover:-translate-y-2"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-5 rounded-full -mr-16 -mt-16 group-hover:opacity-10 transition-opacity"
                       style={{backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))`}} />
                  <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {feature.desc}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Simple 2-Tier Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="mx-auto max-w-5xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that fits your needs
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-8">
            {/* Starter Plan */}
            <div className="group relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-200 hover:border-blue-200 p-8 transform hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Starter</h3>
                <div className="flex items-baseline mb-6">
                  <span className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">€49</span>
                  <span className="text-gray-500 ml-2">/30 days</span>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">3 Complete Applications</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">All 27 Questions Answered</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">PDF Export Ready</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Basic Support</span>
                  </li>
                </ul>
                <button
                  onClick={() => navigate('/register')}
                  className="w-full py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl font-semibold hover:from-gray-700 hover:to-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Start Now
                </button>
              </div>
            </div>

            {/* Professional Plan */}
            <div className="group relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-purple-200 p-8 transform hover:-translate-y-2">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                  MOST POPULAR
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-3xl" />
              <div className="relative">
                <h3 className="text-2xl font-bold text-gray-900 mb-2 mt-2">Professional</h3>
                <div className="flex items-baseline mb-6">
                  <span className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">€149</span>
                  <span className="text-gray-500 ml-2">/90 days</span>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 font-medium">15 Applications</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 font-medium">Priority Support</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 font-medium">Custom Templates</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 font-medium">Advanced Analytics</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 font-medium">Team Collaboration</span>
                  </li>
                </ul>
                <button
                  onClick={() => navigate('/register')}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Go Professional
                </button>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link
              to="/pricing"
              className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center group"
            >
              View all pricing options
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials with Modern Cards */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trusted Across Europe
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands of successful applicants using GYG
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { name: 'Maria Schmidt', role: 'Education Coordinator, Berlin', text: 'Cut our application time from 2 weeks to 2 hours. The AI perfectly captured our project vision.' },
              { name: 'João Silva', role: 'NGO Director, Lisbon', text: 'As a first-timer, GYG made the complex process manageable. We submitted with confidence.' },
              { name: 'Anna Kowalski', role: 'Project Manager, Warsaw', text: 'The quality is exceptional. We\'ve used GYG for 3 successful applications now.' }
            ].map((testimonial, idx) => (
              <div key={idx} className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 transform hover:-translate-y-1">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "{testimonial.text}"
                </p>
                <div className="border-t pt-4">
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-600">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section with Gradient */}
      <section className="py-20 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Grant Writing?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands who have transformed their grant writing process
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link
              to="/register"
              className="group relative inline-flex items-center justify-center px-8 py-3 bg-white text-blue-600 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <span className="flex items-center">
                Start Your Free Trial
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-8 py-3 bg-blue-500/20 backdrop-blur-sm text-white rounded-xl text-lg font-semibold hover:bg-blue-400/30 transition-all duration-300 border border-white/30"
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
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
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
                  <a href="mailto:info@getyourgrant.eu" className="hover:text-white transition-colors">
                    info@getyourgrant.eu
                  </a>
                </div>
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-gray-500" />
                  <a href="mailto:support@getyourgrant.eu" className="hover:text-white transition-colors">
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
                  <Link to="/register" className="hover:text-white transition-colors">
                    Erasmus+ AI Assistant
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="hover:text-white transition-colors">
                    All Pricing Plans
                  </Link>
                </li>
                <li>
                  <Link to="/resources" className="hover:text-white transition-colors">
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
                  <a href="/privacy" className="hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="/terms" className="hover:text-white transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="/gdpr" className="hover:text-white transition-colors">
                    GDPR Compliance
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Legal Details Section */}
          <div className="border-t border-gray-800 mt-8 pt-8">
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {/* English Legal Details */}
              <div className="space-y-1 text-xs text-gray-400">
                <h5 className="text-white font-semibold text-sm mb-2">GYG S.R.L. - Company Details</h5>
                <p><span className="text-gray-500">Registered Office:</span> Via Maffei, n. 71, 38067 - Ledro (TN), Italy</p>
                <p><span className="text-gray-500">Business Registry:</span> Chamber of Commerce of Trento</p>
                <p><span className="text-gray-500">VAT & Tax ID:</span> 02767760222</p>
                <p><span className="text-gray-500">Share Capital:</span> €20,000.00 (paid-in €5,000.00)</p>
                <p><span className="text-gray-500">Phone:</span> +39 0464 508583</p>
                <p><span className="text-gray-500">PEC Email:</span> GYG.SRL@PEC.IT</p>
              </div>

              {/* Italian Legal Details */}
              <div className="space-y-1 text-xs text-gray-400">
                <h5 className="text-white font-semibold text-sm mb-2">GYG S.R.L. - Dettagli Societari</h5>
                <p><span className="text-gray-500">Sede:</span> Via Maffei, n. 71, 38067 - Ledro (TN)</p>
                <p><span className="text-gray-500">Reg. Imprese:</span> CCIAA di Trento</p>
                <p><span className="text-gray-500">C.F. e P.Iva:</span> 02767760222</p>
                <p><span className="text-gray-500">Capitale sociale:</span> Euro 20.000,00 versato per Euro 5.000,00</p>
                <p><span className="text-gray-500">Telefono:</span> 0464 - 508583</p>
                <p><span className="text-gray-500">Email PEC:</span> GYG.SRL@PEC.IT</p>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-400">
                © 2025 Get Your Grant - GYG S.R.L. All rights reserved. | Tutti i diritti riservati.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default HomePage