import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';

const TermsOfService = () => {
  const [language, setLanguage] = useState('en');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link
            to="/register"
            className="inline-flex items-center text-blue-100 hover:text-white mb-6 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Registration
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold">Terms of Service</h1>
          <p className="mt-2 text-blue-100">Condizioni Generali di Servizio</p>
          <p className="mt-4 text-sm text-blue-200">Last updated / Ultimo aggiornamento: February 19, 2026</p>

          {/* Language Toggle */}
          <div className="mt-4 flex space-x-2">
            <button
              onClick={() => setLanguage('en')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                language === 'en'
                  ? 'bg-white text-indigo-700'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('it')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                language === 'it'
                  ? 'bg-white text-indigo-700'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Italiano
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {language === 'en' ? <EnglishContent /> : <ItalianContent />}

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>GYG S.R.L. - Via Maffei, n. 71, 38067 - Ledro (TN), Italy</p>
          <p className="mt-1">VAT / P.IVA: 02767760222</p>
          <p className="mt-1">Contact: support@getyourgrant.eu</p>
          <div className="mt-4 flex justify-center space-x-6">
            <Link to="/privacy" className="text-blue-600 hover:text-blue-700">Privacy Policy</Link>
            <Link to="/gdpr" className="text-blue-600 hover:text-blue-700">GDPR Compliance</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const SectionHeading = ({ number, title }) => (
  <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4 flex items-start">
    <span className="text-blue-600 mr-3 font-mono text-lg">{number}.</span>
    {title}
  </h2>
);

const EnglishContent = () => (
  <div className="prose prose-gray max-w-none">
    {/* Table of Contents */}
    <div className="bg-blue-50 rounded-xl p-6 mb-10">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Table of Contents</h3>
      <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
        <li><a href="#en-1" className="hover:underline">Company Information</a></li>
        <li><a href="#en-2" className="hover:underline">Service Description</a></li>
        <li><a href="#en-3" className="hover:underline">Account Registration and Use</a></li>
        <li><a href="#en-4" className="hover:underline">Subscription Plans and Pricing</a></li>
        <li><a href="#en-5" className="hover:underline">Payment Terms</a></li>
        <li><a href="#en-6" className="hover:underline">AI-Generated Content Disclaimer</a></li>
        <li><a href="#en-7" className="hover:underline">Intellectual Property</a></li>
        <li><a href="#en-8" className="hover:underline">User Obligations</a></li>
        <li><a href="#en-9" className="hover:underline">Limitation of Liability</a></li>
        <li><a href="#en-10" className="hover:underline">Service Availability</a></li>
        <li><a href="#en-11" className="hover:underline">Termination</a></li>
        <li><a href="#en-12" className="hover:underline">Modifications to Terms</a></li>
        <li><a href="#en-13" className="hover:underline">Governing Law and Jurisdiction</a></li>
        <li><a href="#en-14" className="hover:underline">Contact Information</a></li>
      </ol>
    </div>

    <p className="text-gray-600 leading-relaxed">
      Welcome to Get Your Grant ("the Service"), operated by GYG S.R.L. By accessing or using the Service,
      you agree to be bound by these Terms of Service ("Terms"). Please read them carefully before using
      the platform.
    </p>

    <SectionHeading number="1" title="Company Information" />
    <div id="en-1" className="bg-gray-50 rounded-lg p-5">
      <p className="text-gray-700"><strong>Company Name:</strong> GYG S.R.L.</p>
      <p className="text-gray-700"><strong>Registered Address:</strong> Via Maffei, n. 71, 38067 - Ledro (TN), Italy</p>
      <p className="text-gray-700"><strong>VAT Number (P.IVA):</strong> 02767760222</p>
      <p className="text-gray-700"><strong>Email:</strong> support@getyourgrant.eu</p>
    </div>

    <SectionHeading number="2" title="Service Description" />
    <div id="en-2">
      <p className="text-gray-600 leading-relaxed">
        Get Your Grant is an AI-powered platform that assists users in completing Erasmus+ KA220-ADU
        (Cooperation Partnerships in Adult Education) grant applications. The Service uses artificial
        intelligence (OpenAI GPT technology) to generate draft responses for the 27 questions of the
        application form based on user-provided project details.
      </p>
      <p className="text-gray-600 leading-relaxed mt-3">
        The Service includes:
      </p>
      <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
        <li>AI-generated draft answers for all 27 application questions</li>
        <li>Real-time progressive generation with section-by-section completion</li>
        <li>A partner library for managing consortium partners</li>
        <li>Partner affinity scoring and web crawling</li>
        <li>PDF export of completed applications</li>
        <li>Proposal management dashboard</li>
      </ul>
    </div>

    <SectionHeading number="3" title="Account Registration and Use" />
    <div id="en-3">
      <p className="text-gray-600 leading-relaxed">
        To use the Service, you must create an account by providing a valid email address, username,
        and password. You are responsible for maintaining the confidentiality of your account
        credentials and for all activities that occur under your account.
      </p>
      <p className="text-gray-600 leading-relaxed mt-3">
        You agree to provide accurate and complete information during registration and to update your
        information as necessary. You must be at least 18 years of age to use the Service.
      </p>
    </div>

    <SectionHeading number="4" title="Subscription Plans and Pricing" />
    <div id="en-4">
      <p className="text-gray-600 leading-relaxed mb-4">
        The Service offers the following subscription plans:
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="border border-blue-200 bg-blue-50 rounded-xl p-5">
          <h4 className="font-bold text-blue-900 text-lg">Starter Plan</h4>
          <p className="text-3xl font-bold text-blue-600 mt-2">EUR 49</p>
          <ul className="mt-3 space-y-1 text-sm text-gray-700">
            <li>Valid for 30 days from activation</li>
            <li>Up to 3 full application generations</li>
            <li>All 27 questions generated per application</li>
            <li>PDF export included</li>
          </ul>
        </div>
        <div className="border border-purple-200 bg-purple-50 rounded-xl p-5">
          <h4 className="font-bold text-purple-900 text-lg">Professional Plan</h4>
          <p className="text-3xl font-bold text-purple-600 mt-2">EUR 149</p>
          <ul className="mt-3 space-y-1 text-sm text-gray-700">
            <li>Valid for 90 days from activation</li>
            <li>Up to 15 full application generations</li>
            <li>All 27 questions generated per application</li>
            <li>PDF export included</li>
            <li>Priority support</li>
          </ul>
        </div>
      </div>
      <p className="text-gray-600 leading-relaxed mt-4">
        Prices are in EUR and inclusive of applicable taxes. Subscription periods begin at the time
        of successful payment and cannot be paused or extended.
      </p>
    </div>

    <SectionHeading number="5" title="Payment Terms" />
    <div id="en-5">
      <p className="text-gray-600 leading-relaxed">
        Payments are processed securely through PayPal. By purchasing a subscription, you agree to
        the following:
      </p>
      <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
        <li>All payments are one-time, non-recurring charges for the selected plan period</li>
        <li>Payments are processed in EUR</li>
        <li><strong>No refunds</strong> will be issued once any generation credit has been used (i.e., once a proposal has been generated using AI)</li>
        <li>If no generation credits have been used, a refund may be requested within 14 days of purchase, in accordance with the EU Consumer Rights Directive</li>
        <li>Unused generation credits expire at the end of the subscription period</li>
      </ul>
    </div>

    <SectionHeading number="6" title="AI-Generated Content Disclaimer" />
    <div id="en-6" className="bg-amber-50 border border-amber-200 rounded-xl p-5">
      <p className="text-gray-700 leading-relaxed font-medium">
        IMPORTANT: All content generated by the Service is provided as draft material only.
      </p>
      <ul className="list-disc list-inside text-gray-700 mt-3 space-y-2">
        <li>AI-generated answers are intended as a starting point and should be reviewed, edited, and adapted by the user before submission to any funding body</li>
        <li>GYG S.R.L. does not guarantee the accuracy, completeness, or suitability of generated content for any specific grant application</li>
        <li>GYG S.R.L. does not guarantee that applications using AI-generated content will be approved or funded</li>
        <li>The user bears sole responsibility for the final content submitted to the European Commission or any National Agency</li>
        <li>Generated content should be verified against the latest Erasmus+ Programme Guide and applicable call documentation</li>
      </ul>
    </div>

    <SectionHeading number="7" title="Intellectual Property" />
    <div id="en-7">
      <p className="text-gray-600 leading-relaxed">
        <strong>Your Content:</strong> You retain full ownership of all content you input into the Service
        (project descriptions, partner information, etc.) and all AI-generated output derived from your
        inputs. You are free to use, modify, and distribute the generated content without restriction.
      </p>
      <p className="text-gray-600 leading-relaxed mt-3">
        <strong>Our Platform:</strong> The Service itself, including its software, design, algorithms,
        prompt engineering, and documentation, remains the intellectual property of GYG S.R.L. You may
        not copy, modify, distribute, or reverse-engineer any part of the platform.
      </p>
    </div>

    <SectionHeading number="8" title="User Obligations" />
    <div id="en-8">
      <p className="text-gray-600 leading-relaxed">You agree to:</p>
      <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
        <li>Use the Service only for lawful purposes related to Erasmus+ grant applications</li>
        <li>Not attempt to circumvent subscription limits or share account credentials</li>
        <li>Not use the Service to generate fraudulent, misleading, or deceptive grant applications</li>
        <li>Not use automated systems (bots, scrapers) to access the Service</li>
        <li>Comply with all applicable laws and regulations, including EU funding regulations</li>
      </ul>
    </div>

    <SectionHeading number="9" title="Limitation of Liability" />
    <div id="en-9">
      <p className="text-gray-600 leading-relaxed">
        To the maximum extent permitted by applicable law:
      </p>
      <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
        <li>GYG S.R.L. shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service</li>
        <li>GYG S.R.L.'s total liability shall not exceed the amount paid by you for the current subscription period</li>
        <li>GYG S.R.L. is not liable for any loss of funding, rejected applications, or missed deadlines resulting from the use of the Service</li>
        <li>GYG S.R.L. is not liable for service interruptions due to maintenance, third-party service failures (including OpenAI or PayPal), or force majeure events</li>
      </ul>
    </div>

    <SectionHeading number="10" title="Service Availability" />
    <div id="en-10">
      <p className="text-gray-600 leading-relaxed">
        We strive to maintain high availability of the Service. However, the Service may be temporarily
        unavailable due to scheduled maintenance, updates, or circumstances beyond our control. We do not
        guarantee uninterrupted access to the Service. Subscription periods are not extended due to
        temporary service unavailability.
      </p>
    </div>

    <SectionHeading number="11" title="Termination" />
    <div id="en-11">
      <p className="text-gray-600 leading-relaxed">
        We may suspend or terminate your account if you violate these Terms. You may request deletion of
        your account at any time by contacting support@getyourgrant.eu. Upon termination, your access to
        the Service will cease, but your data will be handled in accordance with our Privacy Policy and
        applicable data protection laws.
      </p>
    </div>

    <SectionHeading number="12" title="Modifications to Terms" />
    <div id="en-12">
      <p className="text-gray-600 leading-relaxed">
        We reserve the right to modify these Terms at any time. Material changes will be communicated via
        email or through the Service. Continued use of the Service after changes constitutes acceptance of
        the updated Terms. If you do not agree with the changes, you must stop using the Service.
      </p>
    </div>

    <SectionHeading number="13" title="Governing Law and Jurisdiction" />
    <div id="en-13">
      <p className="text-gray-600 leading-relaxed">
        These Terms are governed by and construed in accordance with the laws of the Republic of Italy.
        Any disputes arising from or related to these Terms or the Service shall be subject to the
        exclusive jurisdiction of the courts of Trento, Italy, without prejudice to the consumer's right
        to bring proceedings in the courts of their place of domicile under applicable EU consumer
        protection law.
      </p>
    </div>

    <SectionHeading number="14" title="Contact Information" />
    <div id="en-14" className="bg-gray-50 rounded-lg p-5">
      <p className="text-gray-700">For any questions regarding these Terms, please contact us at:</p>
      <p className="text-gray-700 mt-2"><strong>Email:</strong> support@getyourgrant.eu</p>
      <p className="text-gray-700"><strong>Address:</strong> GYG S.R.L., Via Maffei, n. 71, 38067 - Ledro (TN), Italy</p>
    </div>
  </div>
);

const ItalianContent = () => (
  <div className="prose prose-gray max-w-none">
    {/* Indice */}
    <div className="bg-blue-50 rounded-xl p-6 mb-10">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Indice</h3>
      <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
        <li><a href="#it-1" className="hover:underline">Informazioni sulla Societa</a></li>
        <li><a href="#it-2" className="hover:underline">Descrizione del Servizio</a></li>
        <li><a href="#it-3" className="hover:underline">Registrazione e Utilizzo dell'Account</a></li>
        <li><a href="#it-4" className="hover:underline">Piani di Abbonamento e Prezzi</a></li>
        <li><a href="#it-5" className="hover:underline">Termini di Pagamento</a></li>
        <li><a href="#it-6" className="hover:underline">Avvertenza sui Contenuti Generati dall'IA</a></li>
        <li><a href="#it-7" className="hover:underline">Proprieta Intellettuale</a></li>
        <li><a href="#it-8" className="hover:underline">Obblighi dell'Utente</a></li>
        <li><a href="#it-9" className="hover:underline">Limitazione di Responsabilita</a></li>
        <li><a href="#it-10" className="hover:underline">Disponibilita del Servizio</a></li>
        <li><a href="#it-11" className="hover:underline">Risoluzione</a></li>
        <li><a href="#it-12" className="hover:underline">Modifiche ai Termini</a></li>
        <li><a href="#it-13" className="hover:underline">Legge Applicabile e Foro Competente</a></li>
        <li><a href="#it-14" className="hover:underline">Informazioni di Contatto</a></li>
      </ol>
    </div>

    <p className="text-gray-600 leading-relaxed">
      Benvenuto su Get Your Grant ("il Servizio"), gestito da GYG S.R.L. Accedendo o utilizzando il
      Servizio, l'utente accetta di essere vincolato dalle presenti Condizioni Generali di Servizio
      ("Condizioni"). Si prega di leggerle attentamente prima di utilizzare la piattaforma.
    </p>

    <SectionHeading number="1" title="Informazioni sulla Societa" />
    <div id="it-1" className="bg-gray-50 rounded-lg p-5">
      <p className="text-gray-700"><strong>Ragione Sociale:</strong> GYG S.R.L.</p>
      <p className="text-gray-700"><strong>Sede Legale:</strong> Via Maffei, n. 71, 38067 - Ledro (TN), Italia</p>
      <p className="text-gray-700"><strong>Partita IVA:</strong> 02767760222</p>
      <p className="text-gray-700"><strong>Email:</strong> support@getyourgrant.eu</p>
    </div>

    <SectionHeading number="2" title="Descrizione del Servizio" />
    <div id="it-2">
      <p className="text-gray-600 leading-relaxed">
        Get Your Grant e una piattaforma basata sull'intelligenza artificiale che assiste gli utenti
        nella compilazione delle domande di sovvenzione Erasmus+ KA220-ADU (Partenariati di Cooperazione
        nell'Educazione degli Adulti). Il Servizio utilizza l'intelligenza artificiale (tecnologia OpenAI
        GPT) per generare bozze di risposte per le 27 domande del modulo di candidatura sulla base dei
        dettagli del progetto forniti dall'utente.
      </p>
      <p className="text-gray-600 leading-relaxed mt-3">
        Il Servizio include:
      </p>
      <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
        <li>Risposte generate dall'IA per tutte le 27 domande</li>
        <li>Generazione progressiva in tempo reale sezione per sezione</li>
        <li>Libreria dei partner per la gestione del consorzio</li>
        <li>Punteggio di affinita dei partner e scansione web</li>
        <li>Esportazione PDF delle candidature completate</li>
        <li>Dashboard di gestione delle proposte</li>
      </ul>
    </div>

    <SectionHeading number="3" title="Registrazione e Utilizzo dell'Account" />
    <div id="it-3">
      <p className="text-gray-600 leading-relaxed">
        Per utilizzare il Servizio, e necessario creare un account fornendo un indirizzo email valido,
        un nome utente e una password. L'utente e responsabile del mantenimento della riservatezza delle
        credenziali del proprio account e di tutte le attivita che si svolgono sotto il proprio account.
      </p>
      <p className="text-gray-600 leading-relaxed mt-3">
        L'utente si impegna a fornire informazioni accurate e complete durante la registrazione e ad
        aggiornare le proprie informazioni quando necessario. Per utilizzare il Servizio e necessario
        avere almeno 18 anni.
      </p>
    </div>

    <SectionHeading number="4" title="Piani di Abbonamento e Prezzi" />
    <div id="it-4">
      <p className="text-gray-600 leading-relaxed mb-4">
        Il Servizio offre i seguenti piani di abbonamento:
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="border border-blue-200 bg-blue-50 rounded-xl p-5">
          <h4 className="font-bold text-blue-900 text-lg">Piano Starter</h4>
          <p className="text-3xl font-bold text-blue-600 mt-2">EUR 49</p>
          <ul className="mt-3 space-y-1 text-sm text-gray-700">
            <li>Valido per 30 giorni dall'attivazione</li>
            <li>Fino a 3 generazioni complete</li>
            <li>Tutte le 27 domande per candidatura</li>
            <li>Esportazione PDF inclusa</li>
          </ul>
        </div>
        <div className="border border-purple-200 bg-purple-50 rounded-xl p-5">
          <h4 className="font-bold text-purple-900 text-lg">Piano Professional</h4>
          <p className="text-3xl font-bold text-purple-600 mt-2">EUR 149</p>
          <ul className="mt-3 space-y-1 text-sm text-gray-700">
            <li>Valido per 90 giorni dall'attivazione</li>
            <li>Fino a 15 generazioni complete</li>
            <li>Tutte le 27 domande per candidatura</li>
            <li>Esportazione PDF inclusa</li>
            <li>Supporto prioritario</li>
          </ul>
        </div>
      </div>
      <p className="text-gray-600 leading-relaxed mt-4">
        I prezzi sono in EUR e comprensivi delle tasse applicabili. I periodi di abbonamento iniziano al
        momento del pagamento avvenuto con successo e non possono essere sospesi o prolungati.
      </p>
    </div>

    <SectionHeading number="5" title="Termini di Pagamento" />
    <div id="it-5">
      <p className="text-gray-600 leading-relaxed">
        I pagamenti sono elaborati in modo sicuro tramite PayPal. Acquistando un abbonamento, l'utente accetta quanto segue:
      </p>
      <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
        <li>Tutti i pagamenti sono addebiti una tantum, non ricorrenti, per il periodo del piano selezionato</li>
        <li>I pagamenti sono elaborati in EUR</li>
        <li><strong>Non sono previsti rimborsi</strong> una volta che un credito di generazione e stato utilizzato (cioe una volta che una proposta e stata generata utilizzando l'IA)</li>
        <li>Se nessun credito di generazione e stato utilizzato, puo essere richiesto un rimborso entro 14 giorni dall'acquisto, in conformita con la Direttiva UE sui Diritti dei Consumatori</li>
        <li>I crediti di generazione non utilizzati scadono al termine del periodo di abbonamento</li>
      </ul>
    </div>

    <SectionHeading number="6" title="Avvertenza sui Contenuti Generati dall'IA" />
    <div id="it-6" className="bg-amber-50 border border-amber-200 rounded-xl p-5">
      <p className="text-gray-700 leading-relaxed font-medium">
        IMPORTANTE: Tutti i contenuti generati dal Servizio sono forniti esclusivamente come materiale di bozza.
      </p>
      <ul className="list-disc list-inside text-gray-700 mt-3 space-y-2">
        <li>Le risposte generate dall'IA sono intese come punto di partenza e devono essere riviste, modificate e adattate dall'utente prima dell'invio a qualsiasi ente finanziatore</li>
        <li>GYG S.R.L. non garantisce l'accuratezza, la completezza o l'idoneita dei contenuti generati per alcuna specifica domanda di sovvenzione</li>
        <li>GYG S.R.L. non garantisce che le candidature che utilizzano contenuti generati dall'IA saranno approvate o finanziate</li>
        <li>L'utente e l'unico responsabile del contenuto finale presentato alla Commissione Europea o a qualsiasi Agenzia Nazionale</li>
        <li>I contenuti generati devono essere verificati rispetto all'ultima Guida al Programma Erasmus+ e alla documentazione del bando applicabile</li>
      </ul>
    </div>

    <SectionHeading number="7" title="Proprieta Intellettuale" />
    <div id="it-7">
      <p className="text-gray-600 leading-relaxed">
        <strong>I Vostri Contenuti:</strong> L'utente mantiene la piena proprieta di tutti i contenuti
        immessi nel Servizio (descrizioni del progetto, informazioni sui partner, ecc.) e di tutti i
        risultati generati dall'IA derivati dai propri input. L'utente e libero di utilizzare,
        modificare e distribuire i contenuti generati senza restrizioni.
      </p>
      <p className="text-gray-600 leading-relaxed mt-3">
        <strong>La Nostra Piattaforma:</strong> Il Servizio stesso, inclusi software, design, algoritmi,
        ingegneria dei prompt e documentazione, rimane proprieta intellettuale di GYG S.R.L. Non e
        consentito copiare, modificare, distribuire o decompilare alcuna parte della piattaforma.
      </p>
    </div>

    <SectionHeading number="8" title="Obblighi dell'Utente" />
    <div id="it-8">
      <p className="text-gray-600 leading-relaxed">L'utente si impegna a:</p>
      <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
        <li>Utilizzare il Servizio solo per scopi leciti relativi alle candidature Erasmus+</li>
        <li>Non tentare di aggirare i limiti dell'abbonamento o condividere le credenziali dell'account</li>
        <li>Non utilizzare il Servizio per generare candidature fraudolente, fuorvianti o ingannevoli</li>
        <li>Non utilizzare sistemi automatizzati (bot, scraper) per accedere al Servizio</li>
        <li>Rispettare tutte le leggi e i regolamenti applicabili, inclusi i regolamenti sui finanziamenti UE</li>
      </ul>
    </div>

    <SectionHeading number="9" title="Limitazione di Responsabilita" />
    <div id="it-9">
      <p className="text-gray-600 leading-relaxed">
        Nella misura massima consentita dalla legge applicabile:
      </p>
      <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
        <li>GYG S.R.L. non sara responsabile per danni indiretti, incidentali, speciali, consequenziali o punitivi derivanti dall'uso del Servizio</li>
        <li>La responsabilita totale di GYG S.R.L. non superera l'importo pagato dall'utente per il periodo di abbonamento corrente</li>
        <li>GYG S.R.L. non e responsabile per la perdita di finanziamenti, candidature respinte o scadenze mancate derivanti dall'uso del Servizio</li>
        <li>GYG S.R.L. non e responsabile per interruzioni del servizio dovute a manutenzione, guasti di servizi di terze parti (inclusi OpenAI o PayPal) o eventi di forza maggiore</li>
      </ul>
    </div>

    <SectionHeading number="10" title="Disponibilita del Servizio" />
    <div id="it-10">
      <p className="text-gray-600 leading-relaxed">
        Ci impegniamo a mantenere un'elevata disponibilita del Servizio. Tuttavia, il Servizio potrebbe
        essere temporaneamente non disponibile a causa di manutenzione programmata, aggiornamenti o
        circostanze al di fuori del nostro controllo. Non garantiamo l'accesso ininterrotto al Servizio.
        I periodi di abbonamento non vengono prolungati a causa di temporanea indisponibilita del servizio.
      </p>
    </div>

    <SectionHeading number="11" title="Risoluzione" />
    <div id="it-11">
      <p className="text-gray-600 leading-relaxed">
        Potremmo sospendere o terminare il vostro account in caso di violazione delle presenti Condizioni.
        L'utente puo richiedere la cancellazione del proprio account in qualsiasi momento contattando
        support@getyourgrant.eu. Alla risoluzione, l'accesso al Servizio cessera, ma i dati saranno
        gestiti in conformita con la nostra Informativa sulla Privacy e le leggi applicabili sulla
        protezione dei dati.
      </p>
    </div>

    <SectionHeading number="12" title="Modifiche ai Termini" />
    <div id="it-12">
      <p className="text-gray-600 leading-relaxed">
        Ci riserviamo il diritto di modificare le presenti Condizioni in qualsiasi momento. Le modifiche
        sostanziali saranno comunicate via email o tramite il Servizio. L'uso continuato del Servizio
        dopo le modifiche costituisce accettazione delle Condizioni aggiornate. Se non si accettano le
        modifiche, e necessario cessare l'uso del Servizio.
      </p>
    </div>

    <SectionHeading number="13" title="Legge Applicabile e Foro Competente" />
    <div id="it-13">
      <p className="text-gray-600 leading-relaxed">
        Le presenti Condizioni sono regolate e interpretate in conformita con le leggi della Repubblica
        Italiana. Qualsiasi controversia derivante da o relativa alle presenti Condizioni o al Servizio
        sara soggetta alla giurisdizione esclusiva del Tribunale di Trento, Italia, fatto salvo il
        diritto del consumatore di adire il tribunale del proprio domicilio ai sensi della normativa UE
        a tutela dei consumatori.
      </p>
    </div>

    <SectionHeading number="14" title="Informazioni di Contatto" />
    <div id="it-14" className="bg-gray-50 rounded-lg p-5">
      <p className="text-gray-700">Per qualsiasi domanda riguardante le presenti Condizioni, contattateci a:</p>
      <p className="text-gray-700 mt-2"><strong>Email:</strong> support@getyourgrant.eu</p>
      <p className="text-gray-700"><strong>Indirizzo:</strong> GYG S.R.L., Via Maffei, n. 71, 38067 - Ledro (TN), Italia</p>
    </div>
  </div>
);

export default TermsOfService;
