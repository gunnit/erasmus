import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, Target, Award, Rocket, BookOpen, Globe, Sparkles } from 'lucide-react';
import { Card, CardContent } from './ui/Card';

const ChiSiamo = () => {
  const timelineEvents = [
    {
      date: 'Dicembre 2023',
      title: 'La Nascita dell\'Idea',
      description: 'Identificazione della necessità di semplificare il processo di candidatura Erasmus+ KA220-ADU',
      icon: Sparkles,
      color: 'from-blue-500 to-indigo-600'
    },
    {
      date: 'Gennaio 2024',
      title: 'Ricerca e Analisi',
      description: 'Studio approfondito dei criteri di valutazione e delle best practices nelle candidature di successo',
      icon: BookOpen,
      color: 'from-indigo-500 to-purple-600'
    },
    {
      date: 'Marzo 2024',
      title: 'Sviluppo del Prototipo',
      description: 'Creazione della prima versione del sistema AI per la generazione automatica delle risposte',
      icon: Rocket,
      color: 'from-purple-500 to-pink-600'
    },
    {
      date: 'Maggio 2024',
      title: 'Test con Partner',
      description: 'Collaborazione con 10 organizzazioni partner per testare e perfezionare il sistema',
      icon: Users,
      color: 'from-pink-500 to-red-600'
    },
    {
      date: 'Luglio 2024',
      title: 'Prima Candidatura di Successo',
      description: 'Il nostro sistema aiuta la prima organizzazione a ottenere un finanziamento Erasmus+',
      icon: Award,
      color: 'from-green-500 to-teal-600'
    },
    {
      date: 'Settembre 2024',
      title: 'Espansione Internazionale',
      description: 'Lancio del sistema in 5 paesi europei con traduzione multilingue',
      icon: Globe,
      color: 'from-teal-500 to-cyan-600'
    },
    {
      date: 'Novembre 2024',
      title: 'Milestone: 50 Progetti Finanziati',
      description: 'Raggiungimento di 50 progetti approvati utilizzando il nostro sistema',
      icon: Target,
      color: 'from-cyan-500 to-blue-600'
    },
    {
      date: 'Gennaio 2025',
      title: 'Integrazione AI Avanzata',
      description: 'Implementazione di GPT-4 e miglioramento dell\'accuratezza delle risposte del 40%',
      icon: Sparkles,
      color: 'from-blue-500 to-indigo-600'
    },
    {
      date: 'Marzo 2025',
      title: 'Partnership Strategiche',
      description: 'Collaborazione con agenzie nazionali Erasmus+ per formazione e supporto',
      icon: Users,
      color: 'from-indigo-500 to-purple-600'
    },
    {
      date: 'Maggio 2025',
      title: 'Piattaforma 2.0',
      description: 'Lancio della nuova versione con dashboard analytics e gestione multi-progetto',
      icon: Rocket,
      color: 'from-purple-500 to-pink-600'
    },
    {
      date: 'Luglio 2025',
      title: '100+ Organizzazioni Attive',
      description: 'Oltre 100 organizzazioni utilizzano attivamente la piattaforma in tutta Europa',
      icon: Globe,
      color: 'from-pink-500 to-red-600'
    },
    {
      date: 'Settembre 2025',
      title: 'Conferenza Europea sull\'Innovazione',
      description: 'Presentazione dei risultati e best practices alla conferenza annuale Erasmus+ a Bruxelles',
      icon: Award,
      color: 'from-green-500 to-teal-600'
    }
  ];

  const stats = [
    { label: 'Progetti Finanziati', value: '87+', icon: Award },
    { label: 'Ore Risparmiate', value: '3,480+', icon: Calendar },
    { label: 'Partner Attivi', value: '120+', icon: Users },
    { label: 'Tasso di Successo', value: '92%', icon: Target }
  ];

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Hero Section */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 py-20"
      >
        <div className="absolute inset-0 bg-mesh-gradient opacity-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeIn} className="text-center">
            <h1 className="text-5xl font-bold text-white mb-6">Chi Siamo</h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Innovatori nell'educazione europea, semplifichiamo l'accesso ai fondi Erasmus+
              attraverso l'intelligenza artificiale avanzata
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Mission Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerContainer}
        className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
      >
        <motion.div variants={fadeIn} className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">La Nostra Missione</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Democratizzare l'accesso ai finanziamenti europei per l'educazione degli adulti,
            riducendo il tempo di compilazione delle candidature da 60 ore a soli 30 minuti.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                variants={fadeIn}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className="text-center">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-sm text-gray-600 mt-1">{stat.label}</div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* Timeline Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerContainer}
        className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
      >
        <motion.div variants={fadeIn} className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            La Nostra Storia: Dall'Idea all'Impatto
          </h2>
          <p className="text-lg text-gray-600">
            Un percorso di innovazione continua dal dicembre 2023 a settembre 2025
          </p>
        </motion.div>

        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 hidden md:block" />

          {/* Timeline Events */}
          <div className="space-y-12">
            {timelineEvents.map((event, index) => {
              const Icon = event.icon;
              const isLeft = index % 2 === 0;

              return (
                <motion.div
                  key={event.date}
                  variants={fadeIn}
                  className={`relative flex items-center ${
                    isLeft ? 'md:flex-row' : 'md:flex-row-reverse'
                  } flex-col md:flex`}
                >
                  {/* Content */}
                  <div className={`w-full md:w-5/12 ${isLeft ? 'md:text-right md:pr-8' : 'md:text-left md:pl-8'}`}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Card className="shadow-lg hover:shadow-xl transition-shadow">
                        <CardContent className="p-6">
                          <div className={`flex items-center mb-3 ${isLeft ? 'md:justify-end' : ''}`}>
                            <div className={`p-2 rounded-full bg-gradient-to-r ${event.color}`}>
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <span className="ml-3 text-sm font-semibold text-gray-500">
                              {event.date}
                            </span>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {event.title}
                          </h3>
                          <p className="text-gray-600">
                            {event.description}
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </div>

                  {/* Center Dot */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white border-4 border-indigo-600 rounded-full hidden md:block" />

                  {/* Spacer */}
                  <div className="w-full md:w-5/12" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerContainer}
        className="py-16 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.div variants={fadeIn}>
            <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <CardContent className="p-12">
                <h2 className="text-3xl font-bold mb-4">
                  Unisciti alla Rivoluzione Erasmus+
                </h2>
                <p className="text-xl mb-8 text-blue-100">
                  Trasforma il tuo progetto in realtà in soli 30 minuti
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors"
                >
                  Inizia Ora
                </motion.button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
};

export default ChiSiamo;