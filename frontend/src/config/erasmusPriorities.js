import {
  Users, Globe, Leaf, Vote, TrendingUp, BookOpen, MapPin,
  GraduationCap, Users as Users2, Shield, Heart, Building2,
  Target, Briefcase, ChevronRight, CheckCircle
} from 'lucide-react';

/**
 * Complete Erasmus+ 2025 Priorities Configuration
 * Including all 4 Horizontal Priorities and 8 Adult Education Sector-Specific Priorities
 */

export const ERASMUS_PRIORITIES_2025 = {
  horizontal: [
    {
      code: 'HP-01',
      name: 'Inclusion and Diversity',
      icon: Users,
      color: 'from-purple-500 to-pink-500',
      description: 'Promoting equal opportunities and access for people with fewer opportunities',
      details: 'Addresses physical, mental, educational, cultural, social, economic, and geographical barriers that prevent participation',
      evaluation: 'High impact on proposal scoring when targeting disadvantaged groups'
    },
    {
      code: 'HP-02',
      name: 'Digital Transformation',
      icon: Globe,
      color: 'from-blue-500 to-cyan-500',
      description: 'Supporting digital readiness, resilience, and capacity',
      details: 'Developing digital skills and competences for all ages, creating high-performing digital education ecosystems',
      evaluation: 'Essential for projects involving online learning or digital tools'
    },
    {
      code: 'HP-03',
      name: 'Environment and Fight Against Climate Change',
      icon: Leaf,
      color: 'from-green-500 to-emerald-500',
      description: 'Supporting green transition and sustainability',
      details: 'Developing green skills, promoting sustainable practices, and encouraging environmentally responsible behavior',
      evaluation: 'Increasingly important priority with bonus points for green travel'
    },
    {
      code: 'HP-04',
      name: 'Participation in Democratic Life',
      icon: Vote,
      color: 'from-orange-500 to-red-500',
      description: 'Active citizenship and civic engagement',
      details: 'Promoting EU common values, developing critical thinking and media literacy, fostering civic participation',
      evaluation: 'Strong alignment with EU core values and democratic principles'
    }
  ],
  adultEducation: [
    {
      code: 'AE-01',
      name: 'Increasing Take-up and Inclusiveness',
      icon: TrendingUp,
      color: 'from-indigo-500 to-purple-500',
      description: 'Empowering adults to participate in training and reducing skills gaps',
      details: 'Building on individual learning accounts, addressing labor market shortages, promoting inclusive learning',
      evaluation: 'Critical for addressing adult participation rates and EU skills agenda'
    },
    {
      code: 'AE-02',
      name: 'Improving Learning Availability',
      icon: BookOpen,
      color: 'from-teal-500 to-blue-500',
      description: 'Creating flexible learning offers adapted to adult needs',
      details: 'Developing digital and blended learning, supporting validation through micro-credentials, flexible pathways',
      evaluation: 'High relevance for innovative and accessible learning solutions'
    },
    {
      code: 'AE-03',
      name: 'Local Learning Environments',
      icon: MapPin,
      color: 'from-rose-500 to-orange-500',
      description: 'Supporting community learning centers and local initiatives',
      details: 'Promoting social inclusion through local learning, exploiting digital technologies for community engagement',
      evaluation: 'Strong for community-based and locally embedded projects'
    },
    {
      code: 'AE-04',
      name: 'Creating Upskilling Pathways',
      icon: ChevronRight,
      color: 'from-yellow-500 to-amber-500',
      description: 'Enhancing key competences for adults with low skill levels',
      details: 'Developing guidance services, creating progression routes, supporting career transitions and lifelong learning',
      evaluation: 'Directly addresses EU upskilling pathways initiative'
    },
    {
      code: 'AE-05',
      name: 'Educator Development',
      icon: GraduationCap,
      color: 'from-cyan-500 to-teal-500',
      description: 'Improving competences of educators and adult education staff',
      details: 'Supporting innovative teaching methods, strengthening motivational and advisory roles, green and digital skills',
      evaluation: 'Essential for systemic impact and quality improvement'
    },
    {
      code: 'AE-06',
      name: 'Intergenerational Learning',
      icon: Users,
      color: 'from-pink-500 to-rose-500',
      description: 'Creating learning opportunities across age groups',
      details: 'Building understanding between generations, strengthening social cohesion, sharing knowledge and experiences',
      evaluation: 'Innovative approach with strong social impact potential'
    },
    {
      code: 'AE-07',
      name: 'Quality Assurance',
      icon: Shield,
      color: 'from-gray-500 to-slate-600',
      description: 'Developing quality assurance mechanisms for adult education',
      details: 'Creating monitoring methodologies, tracking learner progress, measuring effectiveness and outcomes',
      evaluation: 'Important for sustainability and systemic change'
    },
    {
      code: 'AE-08',
      name: 'Supporting Ukrainian Refugees',
      icon: Heart,
      color: 'from-blue-400 to-yellow-400',
      description: 'Inclusive approaches for refugee integration and support',
      details: 'Language learning facilities, psycho-social support, inclusive pedagogical approaches for displaced persons',
      evaluation: 'Special priority with high relevance to current EU needs'
    }
  ]
};

/**
 * Helper function to get all priorities as a flat array
 */
export const getAllPriorities = () => {
  return [
    ...ERASMUS_PRIORITIES_2025.horizontal,
    ...ERASMUS_PRIORITIES_2025.adultEducation
  ];
};

/**
 * Helper function to get priority by code
 */
export const getPriorityByCode = (code) => {
  return getAllPriorities().find(p => p.code === code);
};

/**
 * Helper function to get priority type
 */
export const getPriorityType = (code) => {
  if (code.startsWith('HP-')) return 'Horizontal';
  if (code.startsWith('AE-')) return 'Adult Education';
  return 'Unknown';
};

/**
 * Validation rules for priority selection
 */
export const PRIORITY_RULES = {
  minSelection: 1,
  maxSelection: 3,
  requirementText: 'Select 1-3 priorities (at least one horizontal OR one sector-specific)',
  evaluationNote: 'Projects must address at least one priority to be eligible for funding'
};

export default ERASMUS_PRIORITIES_2025;