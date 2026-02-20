import { useState, useEffect, useRef, useCallback } from 'react'
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
  BookOpen,
  ChevronRight,
  Shield,
  BarChart3,
  Check,
  Brain,
  Layers,
  ChevronDown,
  Menu,
  X,
  Play
} from 'lucide-react'
import api from '../services/api'
import styles from './HomePage.module.css'

// Intersection Observer hook for scroll-triggered animations
const useInView = (options = {}) => {
  const ref = useRef(null)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true)
        // Once visible, stop observing to prevent re-animation
        if (ref.current) observer.unobserve(ref.current)
      }
    }, { threshold: 0.15, ...options })

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return [ref, isInView]
}

// Animated counter hook with reliable final value
const useCounter = (target, duration = 1500, startCounting = true) => {
  const [count, setCount] = useState(0)
  const rafRef = useRef(null)

  useEffect(() => {
    if (!startCounting || target === 0) return

    const startTime = performance.now()

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [target, duration, startCounting])

  return count
}

const HomePage = () => {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const [openFaq, setOpenFaq] = useState(null)
  const [videoPlaying, setVideoPlaying] = useState(false)

  // Stats targets from API
  const [statsTargets, setStatsTargets] = useState({
    hours: 40,
    proposals: 1250,
    success: 98,
    countries: 27
  })

  // Intersection observers for scroll animations
  const [statsRef, statsInView] = useInView()
  const [howItWorksRef, howItWorksInView] = useInView()
  const [featuresRef, featuresInView] = useInView()
  const [testimonialsRef, testimonialsInView] = useInView()

  // Animated counters that start when stats section is visible
  const hoursCount = useCounter(statsTargets.hours, 1500, statsInView)
  const proposalsCount = useCounter(statsTargets.proposals, 2000, statsInView)
  const successCount = useCounter(statsTargets.success, 1500, statsInView)
  const countriesCount = useCounter(statsTargets.countries, 1200, statsInView)

  // Calculate days until next Erasmus+ deadline (October 1, 2026)
  const getDeadlineInfo = useCallback(() => {
    const deadline = new Date('2026-10-01T12:00:00+02:00')
    const now = new Date()
    const diffTime = deadline - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return {
      daysLeft: Math.max(0, diffDays),
      deadlineDate: 'October 1, 2026',
      isUrgent: diffDays <= 60
    }
  }, [])

  const deadlineInfo = getDeadlineInfo()

  // Throttled scroll handler for parallax
  useEffect(() => {
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrollY(window.scrollY)
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fetch real statistics from API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await api.getPublicStats()
        setStatsTargets({
          hours: stats.hours_saved || 40,
          proposals: stats.proposals_generated || 1250,
          success: stats.success_rate || 98,
          countries: 27
        })
      } catch (error) {
        // Fallback values already set in initial state
      }
    }
    fetchStats()
  }, [])

  // Close mobile menu on navigation
  const handleNavClick = (e, targetId) => {
    setMobileMenuOpen(false)
    if (targetId) {
      e.preventDefault()
      const el = document.getElementById(targetId)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // FAQ data addressing common grant applicant concerns
  const faqItems = [
    {
      question: 'Is the AI-generated content original and compliant with Erasmus+ guidelines?',
      answer: 'Yes. Every answer is generated fresh for your specific project using GPT-5 trained on successful Erasmus+ applications. The content is original, tailored to your project context, and structured to meet all KA220-ADU evaluation criteria. We ensure proper EU terminology, character limits (2,000-3,000 characters), and alignment with the 2026 Programme Guide.'
    },
    {
      question: 'Can I edit the generated answers before submitting?',
      answer: 'Absolutely. The AI generates a complete first draft for all 27 questions, but you maintain full editorial control. Our review interface lets you edit any answer, regenerate individual questions with different parameters, and ensure the final application reflects your unique project vision. Most users spend 15-20 minutes reviewing and customizing.'
    },
    {
      question: 'What information do I need to provide to get started?',
      answer: 'You need four basic inputs: your project title and idea (2-3 sentences), your lead organization details, at least 3 partner organizations from different EU countries, and your selected EU priorities. The AI handles the rest -- generating comprehensive answers covering relevance, partnership quality, impact, and project management.'
    },
    {
      question: 'How does the system handle the four evaluation criteria sections?',
      answer: 'The AI is specifically trained on the Erasmus+ scoring rubric: Relevance (25 points), Quality of Partnership (20 points), Impact (30 points), and Quality of Implementation (25 points). Each generated answer is optimized to address the exact evaluation criteria that assessors look for, maximizing your score across all sections.'
    },
    {
      question: 'What format is the final output? Can I paste it directly into the EU application form?',
      answer: 'Answers are generated in plain text format matching the exact character limits of each field in the official KA220-ADU application form. You can export the complete application as a PDF for review, or copy individual answers directly into the European Commission\'s online submission portal. Each answer is clearly labeled with its corresponding form field.'
    },
    {
      question: 'Is my project data secure and confidential?',
      answer: 'Yes. We are a registered EU company (GYG S.R.L., Italy) fully compliant with GDPR. Your project data is encrypted in transit and at rest, stored on EU-based servers, and never shared with third parties. We do not use your project data to train AI models. You can delete your account and all associated data at any time.'
    }
  ]

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Subtle Background Elements -- reduced opacity for less distraction */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div
          className="absolute top-20 -left-20 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"
          style={{ transform: `translateY(${scrollY * 0.08}px)` }}
        />
        <div
          className="absolute top-60 right-10 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl"
          style={{ transform: `translateY(${scrollY * 0.12}px)` }}
        />
      </div>

      {/* Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100/80 transition-shadow duration-300"
        style={{ boxShadow: scrollY > 50 ? '0 4px 20px rgba(0,0,0,0.06)' : 'none' }}>
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <img src="/logo.svg" alt="Get Your Grant" className="relative w-10 h-10 rounded-xl shadow-md group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 leading-tight">
                  Get Your Grant
                </h1>
                <p className="text-xs text-gray-500 leading-tight">Erasmus+ AI Assistant</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <a href="#how-it-works" onClick={(e) => handleNavClick(e, 'how-it-works')}
                className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors">
                How It Works
              </a>
              <a href="#features" onClick={(e) => handleNavClick(e, 'features')}
                className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors">
                Features
              </a>
              <a href="#pricing" onClick={(e) => handleNavClick(e, 'pricing')}
                className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors">
                Pricing
              </a>
              <a href="#faq" onClick={(e) => handleNavClick(e, 'faq')}
                className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors">
                FAQ
              </a>
              <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors">
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:from-blue-700 hover:to-indigo-700"
              >
                Start Free
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-100 py-4 space-y-1 animate-slide-down">
              <a href="#how-it-works" onClick={(e) => handleNavClick(e, 'how-it-works')}
                className="block px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg font-medium">
                How It Works
              </a>
              <a href="#features" onClick={(e) => handleNavClick(e, 'features')}
                className="block px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg font-medium">
                Features
              </a>
              <a href="#pricing" onClick={(e) => handleNavClick(e, 'pricing')}
                className="block px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg font-medium">
                Pricing
              </a>
              <a href="#faq" onClick={(e) => handleNavClick(e, 'faq')}
                className="block px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg font-medium">
                FAQ
              </a>
              <div className="border-t border-gray-100 pt-3 mt-3 space-y-2 px-4">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center py-3 text-gray-700 border border-gray-200 rounded-lg font-medium hover:bg-gray-50">
                  Sign In
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold shadow-md">
                  Start Free
                </Link>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative pt-28 sm:pt-32 pb-16 sm:pb-20 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-4xl mx-auto">
            {/* Deadline Urgency Banner */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 text-blue-700 text-sm font-medium mb-6">
              <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>
                Next KA220-ADU Deadline: <strong>{deadlineInfo.deadlineDate}</strong>
                <span className="hidden sm:inline"> -- {deadlineInfo.daysLeft} days left</span>
              </span>
            </div>

            {/* Main Headline -- accurate time claim matching documentation */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-[1.1] tracking-tight">
              <span className="text-gray-900">Complete Your </span>
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Erasmus+
              </span>
              <br className="hidden sm:block" />
              <span className="text-gray-900"> Application in </span>
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                30 Minutes
              </span>
            </h1>

            {/* Subheadline -- specific and benefit-driven */}
            <p className="text-lg sm:text-xl text-gray-600 mb-4 max-w-2xl mx-auto leading-relaxed">
              AI generates evaluation-optimized answers for all 27 KA220-ADU questions.
              What used to take 40-60 hours of manual writing now takes a single session.
            </p>

            {/* Specific value bullets under subheadline */}
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-500 mb-8">
              <span className="flex items-center">
                <Check className="w-4 h-4 text-green-500 mr-1.5" />
                All 27 questions answered
              </span>
              <span className="flex items-center">
                <Check className="w-4 h-4 text-green-500 mr-1.5" />
                Evaluation criteria optimized
              </span>
              <span className="flex items-center">
                <Check className="w-4 h-4 text-green-500 mr-1.5" />
                PDF export ready
              </span>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-12 sm:mb-16">
              <Link
                to="/register"
                className="group inline-flex items-center justify-center px-7 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:from-blue-700 hover:to-indigo-700"
              >
                Start Your Application
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                className="group inline-flex items-center justify-center px-7 py-3.5 bg-white text-gray-700 rounded-xl text-base font-semibold border border-gray-200 hover:border-gray-300 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <Play className="mr-2 h-4 w-4 text-blue-600" />
                See How It Works
              </button>
            </div>

            {/* Stats Grid */}
            <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-3xl mx-auto">
              <div className={`bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 transition-all duration-700 ${statsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">{hoursCount}+</div>
                <div className="text-xs sm:text-sm text-gray-500">Hours Saved</div>
              </div>
              <div className={`bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 transition-all duration-700 delay-100 ${statsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <FileText className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">{proposalsCount.toLocaleString()}+</div>
                <div className="text-xs sm:text-sm text-gray-500">Proposals Generated</div>
              </div>
              <div className={`bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 transition-all duration-700 delay-200 ${statsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <Target className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">{successCount}%</div>
                <div className="text-xs sm:text-sm text-gray-500">Completion Rate</div>
              </div>
              <div className={`bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 transition-all duration-700 delay-300 ${statsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <Globe className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">{countriesCount}+</div>
                <div className="text-xs sm:text-sm text-gray-500">EU Countries</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Erasmus+ Trust Bar */}
      <section className="py-6 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-500">
            <span className="flex items-center font-medium text-gray-600">
              <Shield className="w-4 h-4 mr-2 text-blue-600" />
              GDPR Compliant
            </span>
            <span className="hidden sm:inline text-gray-300">|</span>
            <span className="flex items-center">
              <Award className="w-4 h-4 mr-2 text-yellow-500" />
              KA220-ADU Specialist
            </span>
            <span className="hidden sm:inline text-gray-300">|</span>
            <span className="flex items-center">
              <Globe className="w-4 h-4 mr-2 text-blue-600" />
              EU-Based Company (Italy)
            </span>
            <span className="hidden sm:inline text-gray-300">|</span>
            <span className="flex items-center">
              <BookOpen className="w-4 h-4 mr-2 text-indigo-600" />
              2026 Programme Guide Aligned
            </span>
          </div>
        </div>
      </section>

      {/* Problem/Solution Comparison */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              Why Organizations Choose GYG
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Writing Erasmus+ applications manually is time-consuming and risky.
              AI changes that equation completely.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
            {/* Without GYG */}
            <div className="relative bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-100">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-400 to-orange-400 rounded-t-2xl" />
              <div className="flex items-center mb-5">
                <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mr-4">
                  <Clock className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Manual Process</h3>
              </div>
              <ul className="space-y-3">
                {[
                  '40-60 hours of manual writing per application',
                  'Complex EU jargon and formatting requirements',
                  'Risk of missing evaluation criteria worth 100 points',
                  'Inconsistent narrative across 6 form sections',
                  'No guarantee answers meet character limits'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start">
                    <X className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-600 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* With GYG */}
            <div className="relative bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-green-100">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-emerald-400 rounded-t-2xl" />
              <div className="flex items-center mb-5">
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mr-4">
                  <Zap className="w-6 h-6 text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">With GYG</h3>
              </div>
              <ul className="space-y-3">
                {[
                  'Complete all 27 questions in under 30 minutes',
                  'AI handles EU terminology and formatting automatically',
                  'Optimized for all 4 scoring criteria (100 points)',
                  'Coherent, professional narrative across all sections',
                  'Character-perfect answers with PDF export'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-600 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 sm:py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4" ref={howItWorksRef}>
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              Three Steps to a Complete Application
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From project idea to submission-ready PDF in a single session
            </p>
          </div>

          <div className="relative max-w-5xl mx-auto">
            {/* Connection Line */}
            <div className="hidden md:block absolute top-20 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-blue-200 via-purple-200 to-green-200" />

            <div className="grid md:grid-cols-3 gap-8 sm:gap-10 relative">
              {/* Step 1 */}
              <div className={`text-center transition-all duration-700 ${howItWorksInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <div className="relative inline-block mb-5">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md">
                    1
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Describe Your Project
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Enter your project title, idea, partner organizations, and select EU priorities.
                  Takes about 5 minutes.
                </p>
              </div>

              {/* Step 2 */}
              <div className={`text-center transition-all duration-700 delay-200 ${howItWorksInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <div className="relative inline-block mb-5">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                    <Brain className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-7 h-7 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md">
                    2
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  AI Generates All Answers
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  GPT-5 creates evaluation-optimized answers for all 27 questions with
                  cross-section coherence. Takes about 2 minutes.
                </p>
              </div>

              {/* Step 3 */}
              <div className={`text-center transition-all duration-700 delay-300 ${howItWorksInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <div className="relative inline-block mb-5">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-7 h-7 bg-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md">
                    3
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Review, Edit & Export
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Review each answer, make adjustments if needed, and export
                  your submission-ready PDF. Takes about 20 minutes.
                </p>
              </div>
            </div>
          </div>

          {/* Inline CTA after How It Works */}
          <div className="text-center mt-12">
            <Link
              to="/register"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:from-blue-700 hover:to-indigo-700"
            >
              Try It Now -- It's Free to Start
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Video Explainer Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              See GYG in Action
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Watch how our AI transforms a project idea into a complete
              Erasmus+ application in minutes
            </p>
          </div>

          <div className="relative bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
            {!videoPlaying ? (
              <button
                onClick={() => setVideoPlaying(true)}
                className={`relative w-full ${styles.videoPlaceholder} bg-gradient-to-br from-blue-900 to-indigo-900 flex items-center justify-center group cursor-pointer`}
                aria-label="Play explainer video"
              >
                <div className="absolute inset-0 bg-black/20" />
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/90 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
                    <Play className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600 ml-1" />
                  </div>
                  <p className="mt-4 text-white/80 text-sm font-medium">Watch 5-minute overview</p>
                </div>
              </button>
            ) : (
              <div className={`${styles.videoContainer}`}>
                <iframe
                  className={`w-full ${styles.videoEmbed}`}
                  src="https://www.youtube.com/embed/fUCeDmkRbuw?autoplay=1"
                  title="Get Your Grant Platform Explainer"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-16 sm:py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4" ref={featuresRef}>
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              Built for Erasmus+ Success
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Every feature is designed specifically for the KA220-ADU application process
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: Target,
                color: 'text-blue-600',
                bg: 'bg-blue-50',
                title: '2026 EU Priority Alignment',
                desc: 'Automatically aligns your project with the latest Erasmus+ horizontal and sector-specific priorities from the 2026 Programme Guide.'
              },
              {
                icon: BarChart3,
                color: 'text-purple-600',
                bg: 'bg-purple-50',
                title: 'Scoring Criteria Optimization',
                desc: 'Each answer targets the specific evaluation criteria: Relevance (25pts), Partnership (20pts), Impact (30pts), and Implementation (25pts).'
              },
              {
                icon: Shield,
                color: 'text-green-600',
                bg: 'bg-green-50',
                title: 'Format Compliance',
                desc: 'Answers respect character limits (2,000-3,000 chars), use proper EU terminology, and match the exact field structure of the application form.'
              },
              {
                icon: Users,
                color: 'text-orange-600',
                bg: 'bg-orange-50',
                title: 'Multi-Partner Consortium',
                desc: 'Handles complex partnership structures with partner profiling, role assignment, and automatic cross-referencing across all 27 questions.'
              },
              {
                icon: Layers,
                color: 'text-indigo-600',
                bg: 'bg-indigo-50',
                title: 'Cross-Section Coherence',
                desc: 'The AI maintains a consistent narrative thread from project summary through to dissemination, ensuring evaluators see a unified vision.'
              },
              {
                icon: FileText,
                color: 'text-cyan-600',
                bg: 'bg-cyan-50',
                title: 'PDF Export & Copy',
                desc: 'Export your complete application as a formatted PDF, or copy individual answers directly into the EC submission portal.'
              }
            ].map((feature, idx) => {
              const Icon = feature.icon
              return (
                <div
                  key={idx}
                  className={`bg-white rounded-xl p-5 sm:p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-300 ${featuresInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                  style={{ transitionDelay: `${idx * 100}ms` }}
                >
                  <div className={`w-10 h-10 ${feature.bg} rounded-lg flex items-center justify-center mb-3`}>
                    <Icon className={`w-5 h-5 ${feature.color}`} />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1.5">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Evaluation Criteria Explainer -- unique Erasmus+ value-add */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="mx-auto max-w-5xl px-4">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              Optimized for Every Scoring Criterion
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our AI understands exactly what Erasmus+ evaluators look for in each section
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            {[
              {
                title: 'Relevance',
                points: 25,
                color: 'from-blue-500 to-blue-600',
                barColor: 'bg-blue-500',
                details: 'Project objectives, EU priority alignment, innovation level, and complementarity with other actions'
              },
              {
                title: 'Partnership Quality',
                points: 20,
                color: 'from-purple-500 to-purple-600',
                barColor: 'bg-purple-500',
                details: 'Partner composition, experience, task distribution, and involvement of newcomer organizations'
              },
              {
                title: 'Impact',
                points: 30,
                color: 'from-green-500 to-green-600',
                barColor: 'bg-green-500',
                details: 'Dissemination strategy, sustainability, transferability, and potential reach to target groups'
              },
              {
                title: 'Implementation Quality',
                points: 25,
                color: 'from-orange-500 to-orange-600',
                barColor: 'bg-orange-500',
                details: 'Work plan clarity, resource allocation, monitoring mechanisms, and risk management'
              }
            ].map((criterion, idx) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-5 sm:p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-gray-900">{criterion.title}</h3>
                  <span className={`text-sm font-bold bg-gradient-to-r ${criterion.color} bg-clip-text text-transparent`}>
                    {criterion.points} pts
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full mb-3 overflow-hidden">
                  <div className={`h-full ${criterion.barColor} rounded-full transition-all duration-1000`}
                    style={{ width: `${criterion.points}%` }} />
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{criterion.details}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section id="pricing" className="py-16 sm:py-20 bg-gray-50">
        <div className="mx-auto max-w-5xl px-4">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-gray-600">
              Start with 3 applications or go professional for higher volume
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto mb-8">
            {/* Starter Plan */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8 hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-xl font-bold text-gray-900 mb-1">Starter</h3>
              <p className="text-sm text-gray-500 mb-4">For individual applicants</p>
              <div className="flex items-baseline mb-6">
                <span className="text-4xl font-bold text-gray-900">49</span>
                <span className="text-lg font-semibold text-gray-900 ml-0.5">EUR</span>
                <span className="text-gray-500 ml-2 text-sm">/30 days</span>
              </div>
              <ul className="space-y-3 mb-6">
                {[
                  '3 complete applications',
                  'All 27 questions answered',
                  'PDF export',
                  'Email support'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center text-sm text-gray-600">
                    <Check className="w-4 h-4 text-green-500 mr-2.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate('/register')}
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors duration-300"
              >
                Get Started
              </button>
            </div>

            {/* Professional Plan */}
            <div className="relative bg-white rounded-2xl shadow-lg border-2 border-blue-200 p-6 sm:p-8 hover:shadow-xl transition-shadow duration-300">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1 rounded-full text-xs font-semibold shadow-md">
                  BEST VALUE
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1 mt-1">Professional</h3>
              <p className="text-sm text-gray-500 mb-4">For organizations & consultants</p>
              <div className="flex items-baseline mb-6">
                <span className="text-4xl font-bold text-gray-900">149</span>
                <span className="text-lg font-semibold text-gray-900 ml-0.5">EUR</span>
                <span className="text-gray-500 ml-2 text-sm">/90 days</span>
              </div>
              <ul className="space-y-3 mb-6">
                {[
                  '15 complete applications',
                  'Priority AI generation',
                  'Custom templates',
                  'Advanced analytics',
                  'Priority support'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center text-sm text-gray-600">
                    <Check className="w-4 h-4 text-blue-500 mr-2.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate('/register')}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-md"
              >
                Go Professional
              </button>
            </div>
          </div>

          <p className="text-center text-sm text-gray-500">
            <Link to="/pricing" className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center">
              Compare all plan details
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </p>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 sm:py-20 bg-white" ref={testimonialsRef}>
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              Trusted by Organizations Across Europe
            </h2>
            <p className="text-lg text-gray-600">
              Hear from applicants who transformed their grant writing process
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                name: 'Maria Schmidt',
                role: 'Education Coordinator',
                org: 'Volkshochschule Berlin',
                country: 'Germany',
                text: 'We cut our KA220-ADU application time from 2 weeks of team effort to a single afternoon. The AI perfectly captured our digital literacy project vision and aligned it with the inclusion priority.',
                result: 'Application funded in first round'
              },
              {
                name: 'Joao Silva',
                role: 'NGO Director',
                org: 'Associacao SPEAK',
                country: 'Portugal',
                text: 'As a first-time Erasmus+ applicant, the complexity was overwhelming. GYG walked us through the process and generated answers that our more experienced partners said were better than what they usually write manually.',
                result: 'Score: 87/100'
              },
              {
                name: 'Anna Kowalska',
                role: 'Project Manager',
                org: 'Fundacja Rozwoju',
                country: 'Poland',
                text: 'We have used GYG for 3 applications now. The cross-section coherence is what impressed our evaluators most -- every answer references the same methodology framework consistently.',
                result: '3 successful applications'
              }
            ].map((testimonial, idx) => (
              <div key={idx}
                className={`bg-gray-50 rounded-xl p-6 border border-gray-100 transition-all duration-700 ${testimonialsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ transitionDelay: `${idx * 150}ms` }}
              >
                <div className="flex mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-4">
                  "{testimonial.text}"
                </p>
                {/* Result badge */}
                <div className="inline-flex items-center px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium mb-4">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {testimonial.result}
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="font-semibold text-gray-900 text-sm">{testimonial.name}</div>
                  <div className="text-xs text-gray-500">{testimonial.role}, {testimonial.org}</div>
                  <div className="text-xs text-gray-400">{testimonial.country}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 sm:py-20 bg-gray-50">
        <div className="mx-auto max-w-3xl px-4">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600">
              Common questions from Erasmus+ grant applicants
            </p>
          </div>

          <div className="space-y-3">
            {faqItems.map((item, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                  aria-expanded={openFaq === idx}
                >
                  <span className="text-sm font-semibold text-gray-900 pr-4">{item.question}</span>
                  <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${openFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 -mt-1">
                    <p className="text-sm text-gray-600 leading-relaxed">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 relative overflow-hidden">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />
        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Your Next Erasmus+ Deadline Is Approaching
          </h2>
          <p className="text-lg text-blue-100 mb-3">
            {deadlineInfo.daysLeft} days until the KA220-ADU submission deadline on {deadlineInfo.deadlineDate}.
          </p>
          <p className="text-blue-200 mb-8 text-sm">
            Do not spend weeks writing when AI can deliver a complete, optimized application in 30 minutes.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <Link
              to="/register"
              className="group inline-flex items-center justify-center px-7 py-3.5 bg-white text-blue-600 rounded-xl text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Start Your Application Now
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-7 py-3.5 bg-white/10 backdrop-blur-sm text-white rounded-xl text-base font-semibold hover:bg-white/20 transition-all duration-300 border border-white/20"
            >
              Sign In
            </Link>
          </div>

          <p className="text-blue-200 text-sm">
            No credit card required to get started
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:py-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center space-x-3 mb-4">
                <img src="/logo.svg" alt="GYG" className="w-8 h-8 rounded-lg" />
                <div>
                  <h3 className="text-white font-bold text-sm">Get Your Grant</h3>
                  <p className="text-xs text-gray-500">AI-Powered EU Funding</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                Democratizing access to EU funding through artificial intelligence.
                GYG S.R.L. -- an EU-registered company in Italy.
              </p>
            </div>

            {/* Product Links */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-3">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#how-it-works" onClick={(e) => handleNavClick(e, 'how-it-works')} className="hover:text-white transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#features" onClick={(e) => handleNavClick(e, 'features')} className="hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <Link to="/pricing" className="hover:text-white transition-colors">
                    Pricing Plans
                  </Link>
                </li>
                <li>
                  <a href="#faq" onClick={(e) => handleNavClick(e, 'faq')} className="hover:text-white transition-colors">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-3">Support</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="mailto:support@getyourgrant.eu" className="hover:text-white transition-colors">
                    support@getyourgrant.eu
                  </a>
                </li>
                <li>
                  <a href="mailto:info@getyourgrant.eu" className="hover:text-white transition-colors">
                    info@getyourgrant.eu
                  </a>
                </li>
                <li>
                  <Link to="/resources" className="hover:text-white transition-colors">
                    Erasmus+ Resources
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-3">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/privacy" className="hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/gdpr" className="hover:text-white transition-colors">
                    GDPR Compliance
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Company Legal Details */}
          <div className="border-t border-gray-800 mt-8 pt-6">
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div className="text-xs text-gray-500 space-y-0.5">
                <p className="text-gray-400 font-medium">GYG S.R.L. - Company Details</p>
                <p>Via Maffei, n. 71, 38067 - Ledro (TN), Italy</p>
                <p>VAT & Tax ID: 02767760222 | Chamber of Commerce: Trento</p>
                <p>Share Capital: EUR 20,000.00 (paid-in EUR 5,000.00)</p>
              </div>
              <div className="text-xs text-gray-500 space-y-0.5">
                <p className="text-gray-400 font-medium">GYG S.R.L. - Dettagli Societari</p>
                <p>Sede: Via Maffei, n. 71, 38067 - Ledro (TN)</p>
                <p>C.F. e P.Iva: 02767760222 | Reg. Imprese: CCIAA di Trento</p>
                <p>Capitale sociale: Euro 20.000,00 versato per Euro 5.000,00</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-800">
              <p>
                &copy; 2026 Get Your Grant - GYG S.R.L. All rights reserved. | Tutti i diritti riservati.
              </p>
              <p className="mt-2 sm:mt-0">
                Tel: +39 0464 508583 | PEC: GYG.SRL@PEC.IT
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default HomePage
