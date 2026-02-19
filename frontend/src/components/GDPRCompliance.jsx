import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Server, FileCheck, AlertTriangle, Mail } from 'lucide-react';

const GDPRCompliance = () => {
  const [language, setLanguage] = useState('en');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link
            to="/"
            className="inline-flex items-center text-blue-100 hover:text-white mb-6 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Home
          </Link>
          <div className="flex items-center space-x-3 mb-2">
            <Shield className="w-8 h-8" />
            <h1 className="text-3xl sm:text-4xl font-bold">GDPR Compliance</h1>
          </div>
          <p className="mt-2 text-blue-100">Conformita al GDPR</p>
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
          <p className="mt-1">Privacy: privacy@getyourgrant.eu | Support: support@getyourgrant.eu</p>
          <div className="mt-4 flex justify-center space-x-6">
            <Link to="/terms" className="text-blue-600 hover:text-blue-700">Terms of Service</Link>
            <Link to="/privacy" className="text-blue-600 hover:text-blue-700">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const SectionHeading = ({ number, title, icon: Icon }) => (
  <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4 flex items-center">
    {Icon && <Icon className="w-6 h-6 text-blue-600 mr-3" />}
    <span className="text-blue-600 mr-3 font-mono text-lg">{number}.</span>
    {title}
  </h2>
);

const EnglishContent = () => (
  <div className="prose prose-gray max-w-none">
    {/* Introduction Banner */}
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-10">
      <div className="flex items-start space-x-4">
        <Shield className="w-10 h-10 text-blue-600 flex-shrink-0 mt-1" />
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Our Commitment to Data Protection</h3>
          <p className="text-gray-700 leading-relaxed">
            GYG S.R.L. is committed to protecting the personal data of all users in full compliance with
            the General Data Protection Regulation (EU) 2016/679 ("GDPR"). This page provides an overview
            of how we implement GDPR requirements across our platform and operations.
          </p>
        </div>
      </div>
    </div>

    {/* Table of Contents */}
    <div className="bg-gray-50 rounded-xl p-6 mb-10">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Table of Contents</h3>
      <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
        <li><a href="#en-g1" className="hover:underline">How We Comply with GDPR</a></li>
        <li><a href="#en-g2" className="hover:underline">Data Processing Activities Overview</a></li>
        <li><a href="#en-g3" className="hover:underline">Security Measures</a></li>
        <li><a href="#en-g4" className="hover:underline">Sub-Processor List</a></li>
        <li><a href="#en-g5" className="hover:underline">Data Transfer Safeguards</a></li>
        <li><a href="#en-g6" className="hover:underline">How to Exercise Your Rights</a></li>
        <li><a href="#en-g7" className="hover:underline">Complaint Procedure</a></li>
        <li><a href="#en-g8" className="hover:underline">Contact Us</a></li>
      </ol>
    </div>

    <SectionHeading number="1" title="How We Comply with GDPR" icon={Shield} />
    <div id="en-g1">
      <p className="text-gray-600 leading-relaxed mb-4">
        As a company registered and operating in Italy within the European Union, GYG S.R.L. is fully
        subject to the GDPR. We have implemented the following measures to ensure compliance:
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        {[
          { title: 'Lawful Processing', desc: 'All data processing activities are based on a valid legal basis (contract, consent, legitimate interest, or legal obligation)' },
          { title: 'Data Minimization', desc: 'We collect only the data strictly necessary to provide our service' },
          { title: 'Purpose Limitation', desc: 'Data is processed only for the specific purposes disclosed in our Privacy Policy' },
          { title: 'Storage Limitation', desc: 'Data is retained only for as long as necessary and is deleted upon request or expiry of retention periods' },
          { title: 'Accuracy', desc: 'Users can update and correct their personal data at any time through their account settings' },
          { title: 'Transparency', desc: 'Clear and accessible information about data processing through our Privacy Policy and this GDPR page' },
          { title: 'Data Protection by Design', desc: 'Privacy considerations are embedded into our development process from the outset' },
          { title: 'Accountability', desc: 'We maintain records of processing activities and can demonstrate compliance upon request' },
        ].map((item, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <h4 className="font-semibold text-gray-800 mb-1">{item.title}</h4>
            <p className="text-gray-600 text-sm">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>

    <SectionHeading number="2" title="Data Processing Activities Overview" icon={FileCheck} />
    <div id="en-g2">
      <p className="text-gray-600 leading-relaxed mb-4">
        The following table provides an overview of our main data processing activities:
      </p>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left font-semibold text-gray-900 border-b">Activity</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900 border-b">Data Categories</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900 border-b">Legal Basis</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900 border-b">Retention</th>
            </tr>
          </thead>
          <tbody className="text-gray-600">
            <tr className="border-b">
              <td className="px-4 py-3 font-medium">User Registration</td>
              <td className="px-4 py-3">Email, username, password (hashed), organization</td>
              <td className="px-4 py-3">Contract (Art. 6(1)(b))</td>
              <td className="px-4 py-3">Until account deletion + 30 days</td>
            </tr>
            <tr className="border-b bg-gray-50">
              <td className="px-4 py-3 font-medium">AI Proposal Generation</td>
              <td className="px-4 py-3">Project descriptions, partner info, generated text</td>
              <td className="px-4 py-3">Contract (Art. 6(1)(b))</td>
              <td className="px-4 py-3">Until deletion or 2 years inactive</td>
            </tr>
            <tr className="border-b">
              <td className="px-4 py-3 font-medium">Payment Processing</td>
              <td className="px-4 py-3">PayPal transaction IDs, plan type, amounts</td>
              <td className="px-4 py-3">Contract (Art. 6(1)(b)) / Legal (Art. 6(1)(c))</td>
              <td className="px-4 py-3">10 years (tax law)</td>
            </tr>
            <tr className="border-b bg-gray-50">
              <td className="px-4 py-3 font-medium">Partner Web Crawling</td>
              <td className="px-4 py-3">Publicly available website content</td>
              <td className="px-4 py-3">Legitimate interest (Art. 6(1)(f))</td>
              <td className="px-4 py-3">Until partner deleted</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium">Security Logging</td>
              <td className="px-4 py-3">IP addresses, access timestamps</td>
              <td className="px-4 py-3">Legitimate interest (Art. 6(1)(f))</td>
              <td className="px-4 py-3">90 days</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <SectionHeading number="3" title="Security Measures" icon={Lock} />
    <div id="en-g3">
      <p className="text-gray-600 leading-relaxed mb-4">
        We implement comprehensive technical and organizational security measures to protect personal data:
      </p>

      <h4 className="font-semibold text-gray-800 mt-4 mb-3">Technical Measures</h4>
      <div className="space-y-3">
        {[
          { title: 'Encryption in Transit', desc: 'All communications between users and our servers are encrypted using TLS 1.2+ (HTTPS)' },
          { title: 'Encryption at Rest', desc: 'Database storage is encrypted using AES-256 encryption on Render\'s managed PostgreSQL' },
          { title: 'Password Security', desc: 'User passwords are hashed using bcrypt with appropriate salt rounds; plaintext passwords are never stored' },
          { title: 'Authentication', desc: 'JWT-based token authentication with secure expiration policies' },
          { title: 'API Security', desc: 'Rate limiting, input validation, and CORS policies to prevent unauthorized access' },
          { title: 'Secure Communications', desc: 'All API calls to third-party services (OpenAI, PayPal) use encrypted HTTPS connections' },
        ].map((item, i) => (
          <div key={i} className="flex items-start space-x-3 bg-green-50 border border-green-100 rounded-lg p-4">
            <Lock className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-800">{item.title}</p>
              <p className="text-gray-600 text-sm">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <h4 className="font-semibold text-gray-800 mt-6 mb-3">Organizational Measures</h4>
      <ul className="list-disc list-inside text-gray-600 space-y-1">
        <li>Access to personal data is restricted to authorized personnel only</li>
        <li>Regular security reviews and code audits</li>
        <li>Data processing agreements with all third-party processors</li>
        <li>Incident response procedures for data breaches (72-hour notification)</li>
        <li>Privacy impact assessments for new features involving personal data</li>
      </ul>
    </div>

    <SectionHeading number="4" title="Sub-Processor List" icon={Server} />
    <div id="en-g4">
      <p className="text-gray-600 leading-relaxed mb-4">
        The following sub-processors are authorized to process personal data on our behalf:
      </p>
      <div className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-bold text-gray-900">OpenAI, Inc.</h4>
              <p className="text-sm text-gray-500">San Francisco, California, United States</p>
            </div>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">AI Processing</span>
          </div>
          <p className="text-gray-600 text-sm mt-2">
            Processes project descriptions and partner information to generate AI-powered proposal content.
            Data is processed via API and not used for model training (per OpenAI's business data policy).
          </p>
          <p className="text-xs text-gray-500 mt-2">Transfer mechanism: EU-U.S. Data Privacy Framework + SCCs</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-bold text-gray-900">PayPal (Europe) S.a r.l. et Cie, S.C.A.</h4>
              <p className="text-sm text-gray-500">Luxembourg, European Union</p>
            </div>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Payments</span>
          </div>
          <p className="text-gray-600 text-sm mt-2">
            Processes payment transactions for subscription purchases. Handles payment amount, payer email,
            and transaction identifiers. PayPal is the data controller for payment data processed within
            their platform.
          </p>
          <p className="text-xs text-gray-500 mt-2">Transfer mechanism: EU-based entity, no third-country transfer</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-bold text-gray-900">Render Services, Inc.</h4>
              <p className="text-sm text-gray-500">San Francisco, California, United States</p>
            </div>
            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">Hosting</span>
          </div>
          <p className="text-gray-600 text-sm mt-2">
            Provides cloud hosting for our backend application and managed PostgreSQL database. All service
            data is stored and processed on Render's infrastructure with encryption at rest and in transit.
          </p>
          <p className="text-xs text-gray-500 mt-2">Transfer mechanism: EU-U.S. Data Privacy Framework + SCCs</p>
        </div>
      </div>
    </div>

    <SectionHeading number="5" title="Data Transfer Safeguards" />
    <div id="en-g5">
      <p className="text-gray-600 leading-relaxed mb-4">
        When personal data is transferred outside the European Economic Area (EEA), we ensure adequate
        protection through:
      </p>
      <ul className="list-disc list-inside text-gray-600 space-y-2">
        <li>
          <strong>EU-U.S. Data Privacy Framework:</strong> Our U.S.-based processors (OpenAI, Render) participate
          in or are certified under the EU-U.S. Data Privacy Framework, providing an adequacy basis for transfers
        </li>
        <li>
          <strong>Standard Contractual Clauses (SCCs):</strong> We maintain data processing agreements incorporating
          the latest SCCs as adopted by the European Commission (Commission Implementing Decision (EU) 2021/914)
        </li>
        <li>
          <strong>Supplementary Measures:</strong> In addition to legal safeguards, we implement technical measures
          including encryption of data in transit and at rest, access controls, and data minimization practices
        </li>
        <li>
          <strong>Transfer Impact Assessments:</strong> We conduct transfer impact assessments to evaluate the
          level of data protection in the destination country
        </li>
      </ul>
    </div>

    <SectionHeading number="6" title="How to Exercise Your Rights" icon={FileCheck} />
    <div id="en-g6">
      <p className="text-gray-600 leading-relaxed mb-4">
        Under the GDPR, you have the right to access, rectify, erase, restrict, port, and object to the
        processing of your personal data. Here is how to exercise these rights:
      </p>

      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-5">
          <h4 className="font-semibold text-gray-900 mb-2">Step 1: Submit Your Request</h4>
          <p className="text-gray-600 text-sm">
            Send an email to <strong>privacy@getyourgrant.eu</strong> with the subject line "GDPR Rights Request".
            Please include your full name, the email address associated with your account, and a description of
            the right(s) you wish to exercise.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-5">
          <h4 className="font-semibold text-gray-900 mb-2">Step 2: Identity Verification</h4>
          <p className="text-gray-600 text-sm">
            For security purposes, we may ask you to verify your identity before processing your request. This
            is to ensure that personal data is not disclosed to unauthorized persons.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-5">
          <h4 className="font-semibold text-gray-900 mb-2">Step 3: Processing</h4>
          <p className="text-gray-600 text-sm">
            We will process your request within <strong>30 days</strong> of receipt. If the request is complex
            or if we receive many requests, we may extend this period by up to 60 additional days, and we will
            inform you of any such extension.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-5">
          <h4 className="font-semibold text-gray-900 mb-2">Step 4: Response</h4>
          <p className="text-gray-600 text-sm">
            You will receive a response confirming the actions taken. There is no fee for exercising your rights,
            unless requests are manifestly unfounded or excessive.
          </p>
        </div>
      </div>

      <div className="mt-6 bg-gray-50 rounded-lg p-5">
        <h4 className="font-semibold text-gray-800 mb-2">Self-Service Options</h4>
        <p className="text-gray-600 text-sm">
          For some rights, you can take action directly through your account:
        </p>
        <ul className="list-disc list-inside text-gray-600 text-sm mt-2 space-y-1">
          <li><strong>Access and Rectification:</strong> View and update your profile information in Settings</li>
          <li><strong>Data Export:</strong> Export your proposals as PDF from the Dashboard</li>
          <li><strong>Account Deletion:</strong> Contact support@getyourgrant.eu to request full account deletion</li>
        </ul>
      </div>
    </div>

    <SectionHeading number="7" title="Complaint Procedure" icon={AlertTriangle} />
    <div id="en-g7">
      <p className="text-gray-600 leading-relaxed mb-4">
        If you believe that your data protection rights have been violated, you have the right to lodge a
        complaint through the following channels:
      </p>

      <div className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h4 className="font-semibold text-gray-900 mb-2">1. Contact Us First</h4>
          <p className="text-gray-600 text-sm">
            We encourage you to contact us directly at <strong>privacy@getyourgrant.eu</strong> so we can
            address your concern. We aim to resolve all complaints within 30 days.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h4 className="font-semibold text-gray-900 mb-2">2. Italian Data Protection Authority (Garante)</h4>
          <p className="text-gray-600 text-sm mb-3">
            If you are not satisfied with our response, or if you wish to lodge a complaint directly, you
            can contact the Italian Data Protection Authority:
          </p>
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
            <p><strong>Garante per la Protezione dei Dati Personali</strong></p>
            <p>Piazza Venezia 11, 00187 Roma, Italy</p>
            <p>Phone: +39 06 696771</p>
            <p>Fax: +39 06 69677 3785</p>
            <p>Email: garante@gpdp.it</p>
            <p>PEC: protocollo@pec.gpdp.it</p>
            <p>
              Website:{' '}
              <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                www.garanteprivacy.it
              </a>
            </p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h4 className="font-semibold text-gray-900 mb-2">3. Your Local Supervisory Authority</h4>
          <p className="text-gray-600 text-sm">
            If you are located in another EU/EEA member state, you may also lodge a complaint with the
            supervisory authority in your country of residence.
          </p>
        </div>
      </div>
    </div>

    <SectionHeading number="8" title="Contact Us" icon={Mail} />
    <div id="en-g8" className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
      <p className="text-gray-700 mb-4">
        For any questions about our GDPR compliance or data protection practices:
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <p className="font-semibold text-gray-800">Data Protection Officer</p>
          <p className="text-gray-600 text-sm mt-1">privacy@getyourgrant.eu</p>
        </div>
        <div>
          <p className="font-semibold text-gray-800">General Support</p>
          <p className="text-gray-600 text-sm mt-1">support@getyourgrant.eu</p>
        </div>
        <div className="sm:col-span-2">
          <p className="font-semibold text-gray-800">Postal Address</p>
          <p className="text-gray-600 text-sm mt-1">
            GYG S.R.L., Via Maffei, n. 71, 38067 - Ledro (TN), Italy
          </p>
        </div>
      </div>
    </div>
  </div>
);

const ItalianContent = () => (
  <div className="prose prose-gray max-w-none">
    {/* Introduzione */}
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-10">
      <div className="flex items-start space-x-4">
        <Shield className="w-10 h-10 text-blue-600 flex-shrink-0 mt-1" />
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Il Nostro Impegno per la Protezione dei Dati</h3>
          <p className="text-gray-700 leading-relaxed">
            GYG S.R.L. si impegna a proteggere i dati personali di tutti gli utenti in piena conformita con
            il Regolamento Generale sulla Protezione dei Dati (UE) 2016/679 ("GDPR"). Questa pagina fornisce
            una panoramica di come implementiamo i requisiti del GDPR sulla nostra piattaforma e nelle nostre
            operazioni.
          </p>
        </div>
      </div>
    </div>

    {/* Indice */}
    <div className="bg-gray-50 rounded-xl p-6 mb-10">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Indice</h3>
      <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
        <li><a href="#it-g1" className="hover:underline">Come Rispettiamo il GDPR</a></li>
        <li><a href="#it-g2" className="hover:underline">Panoramica delle Attivita di Trattamento</a></li>
        <li><a href="#it-g3" className="hover:underline">Misure di Sicurezza</a></li>
        <li><a href="#it-g4" className="hover:underline">Elenco dei Sub-Responsabili</a></li>
        <li><a href="#it-g5" className="hover:underline">Garanzie per il Trasferimento dei Dati</a></li>
        <li><a href="#it-g6" className="hover:underline">Come Esercitare i Vostri Diritti</a></li>
        <li><a href="#it-g7" className="hover:underline">Procedura di Reclamo</a></li>
        <li><a href="#it-g8" className="hover:underline">Contattaci</a></li>
      </ol>
    </div>

    <SectionHeading number="1" title="Come Rispettiamo il GDPR" icon={Shield} />
    <div id="it-g1">
      <p className="text-gray-600 leading-relaxed mb-4">
        In qualita di societa registrata e operante in Italia nell'Unione Europea, GYG S.R.L. e pienamente
        soggetta al GDPR. Abbiamo implementato le seguenti misure per garantire la conformita:
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        {[
          { title: 'Trattamento Lecito', desc: 'Tutte le attivita di trattamento sono basate su una base giuridica valida (contratto, consenso, interesse legittimo o obbligo legale)' },
          { title: 'Minimizzazione dei Dati', desc: 'Raccogliamo solo i dati strettamente necessari per fornire il nostro servizio' },
          { title: 'Limitazione delle Finalita', desc: 'I dati vengono trattati solo per le finalita specifiche indicate nella nostra Informativa sulla Privacy' },
          { title: 'Limitazione della Conservazione', desc: 'I dati vengono conservati solo per il tempo necessario e cancellati su richiesta o alla scadenza dei periodi di conservazione' },
          { title: 'Esattezza', desc: 'Gli utenti possono aggiornare e correggere i propri dati personali in qualsiasi momento tramite le impostazioni dell\'account' },
          { title: 'Trasparenza', desc: 'Informazioni chiare e accessibili sul trattamento dei dati tramite la nostra Informativa sulla Privacy e questa pagina GDPR' },
          { title: 'Protezione dei Dati by Design', desc: 'Le considerazioni sulla privacy sono integrate nel nostro processo di sviluppo fin dall\'inizio' },
          { title: 'Responsabilizzazione', desc: 'Manteniamo registri delle attivita di trattamento e possiamo dimostrare la conformita su richiesta' },
        ].map((item, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <h4 className="font-semibold text-gray-800 mb-1">{item.title}</h4>
            <p className="text-gray-600 text-sm">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>

    <SectionHeading number="2" title="Panoramica delle Attivita di Trattamento" icon={FileCheck} />
    <div id="it-g2">
      <p className="text-gray-600 leading-relaxed mb-4">
        La seguente tabella fornisce una panoramica delle nostre principali attivita di trattamento dei dati:
      </p>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left font-semibold text-gray-900 border-b">Attivita</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900 border-b">Categorie di Dati</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900 border-b">Base Giuridica</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900 border-b">Conservazione</th>
            </tr>
          </thead>
          <tbody className="text-gray-600">
            <tr className="border-b">
              <td className="px-4 py-3 font-medium">Registrazione Utente</td>
              <td className="px-4 py-3">Email, username, password (hash), organizzazione</td>
              <td className="px-4 py-3">Contratto (Art. 6(1)(b))</td>
              <td className="px-4 py-3">Fino a cancellazione + 30 giorni</td>
            </tr>
            <tr className="border-b bg-gray-50">
              <td className="px-4 py-3 font-medium">Generazione Proposte IA</td>
              <td className="px-4 py-3">Descrizioni progetto, info partner, testo generato</td>
              <td className="px-4 py-3">Contratto (Art. 6(1)(b))</td>
              <td className="px-4 py-3">Fino a cancellazione o 2 anni inattivita</td>
            </tr>
            <tr className="border-b">
              <td className="px-4 py-3 font-medium">Elaborazione Pagamenti</td>
              <td className="px-4 py-3">ID transazione PayPal, tipo piano, importi</td>
              <td className="px-4 py-3">Contratto / Obbligo legale</td>
              <td className="px-4 py-3">10 anni (obbligo fiscale)</td>
            </tr>
            <tr className="border-b bg-gray-50">
              <td className="px-4 py-3 font-medium">Web Crawling Partner</td>
              <td className="px-4 py-3">Contenuti web pubblicamente disponibili</td>
              <td className="px-4 py-3">Interesse legittimo (Art. 6(1)(f))</td>
              <td className="px-4 py-3">Fino a cancellazione partner</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium">Logging di Sicurezza</td>
              <td className="px-4 py-3">Indirizzi IP, timestamp di accesso</td>
              <td className="px-4 py-3">Interesse legittimo (Art. 6(1)(f))</td>
              <td className="px-4 py-3">90 giorni</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <SectionHeading number="3" title="Misure di Sicurezza" icon={Lock} />
    <div id="it-g3">
      <p className="text-gray-600 leading-relaxed mb-4">
        Implementiamo misure di sicurezza tecniche e organizzative complete per proteggere i dati personali:
      </p>

      <h4 className="font-semibold text-gray-800 mt-4 mb-3">Misure Tecniche</h4>
      <div className="space-y-3">
        {[
          { title: 'Crittografia in Transito', desc: 'Tutte le comunicazioni tra gli utenti e i nostri server sono crittografate utilizzando TLS 1.2+ (HTTPS)' },
          { title: 'Crittografia a Riposo', desc: 'Lo storage del database e crittografato utilizzando la crittografia AES-256 sul PostgreSQL gestito da Render' },
          { title: 'Sicurezza delle Password', desc: 'Le password degli utenti sono sottoposte a hash utilizzando bcrypt con salt appropriati; le password in chiaro non vengono mai memorizzate' },
          { title: 'Autenticazione', desc: 'Autenticazione basata su token JWT con politiche di scadenza sicure' },
          { title: 'Sicurezza API', desc: 'Rate limiting, validazione degli input e politiche CORS per prevenire accessi non autorizzati' },
          { title: 'Comunicazioni Sicure', desc: 'Tutte le chiamate API ai servizi di terze parti (OpenAI, PayPal) utilizzano connessioni HTTPS crittografate' },
        ].map((item, i) => (
          <div key={i} className="flex items-start space-x-3 bg-green-50 border border-green-100 rounded-lg p-4">
            <Lock className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-800">{item.title}</p>
              <p className="text-gray-600 text-sm">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <h4 className="font-semibold text-gray-800 mt-6 mb-3">Misure Organizzative</h4>
      <ul className="list-disc list-inside text-gray-600 space-y-1">
        <li>L'accesso ai dati personali e limitato al solo personale autorizzato</li>
        <li>Revisioni regolari della sicurezza e audit del codice</li>
        <li>Accordi sul trattamento dei dati con tutti i responsabili terzi</li>
        <li>Procedure di risposta agli incidenti per violazioni dei dati (notifica entro 72 ore)</li>
        <li>Valutazioni d'impatto sulla privacy per nuove funzionalita che coinvolgono dati personali</li>
      </ul>
    </div>

    <SectionHeading number="4" title="Elenco dei Sub-Responsabili" icon={Server} />
    <div id="it-g4">
      <p className="text-gray-600 leading-relaxed mb-4">
        I seguenti sub-responsabili sono autorizzati a trattare dati personali per nostro conto:
      </p>
      <div className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-bold text-gray-900">OpenAI, Inc.</h4>
              <p className="text-sm text-gray-500">San Francisco, California, Stati Uniti</p>
            </div>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Elaborazione IA</span>
          </div>
          <p className="text-gray-600 text-sm mt-2">
            Elabora descrizioni del progetto e informazioni sui partner per generare contenuti di proposta
            basati sull'IA. I dati vengono elaborati tramite API e non utilizzati per l'addestramento del
            modello (secondo la politica sui dati aziendali di OpenAI).
          </p>
          <p className="text-xs text-gray-500 mt-2">Meccanismo di trasferimento: EU-U.S. Data Privacy Framework + SCC</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-bold text-gray-900">PayPal (Europe) S.a r.l. et Cie, S.C.A.</h4>
              <p className="text-sm text-gray-500">Lussemburgo, Unione Europea</p>
            </div>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Pagamenti</span>
          </div>
          <p className="text-gray-600 text-sm mt-2">
            Elabora le transazioni di pagamento per gli acquisti di abbonamenti. Gestisce importo del
            pagamento, email del pagante e identificativi della transazione.
          </p>
          <p className="text-xs text-gray-500 mt-2">Meccanismo di trasferimento: Entita con sede nell'UE, nessun trasferimento verso paesi terzi</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-bold text-gray-900">Render Services, Inc.</h4>
              <p className="text-sm text-gray-500">San Francisco, California, Stati Uniti</p>
            </div>
            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">Hosting</span>
          </div>
          <p className="text-gray-600 text-sm mt-2">
            Fornisce hosting cloud per la nostra applicazione backend e database PostgreSQL gestito.
            Tutti i dati del servizio sono memorizzati ed elaborati sull'infrastruttura di Render con
            crittografia a riposo e in transito.
          </p>
          <p className="text-xs text-gray-500 mt-2">Meccanismo di trasferimento: EU-U.S. Data Privacy Framework + SCC</p>
        </div>
      </div>
    </div>

    <SectionHeading number="5" title="Garanzie per il Trasferimento dei Dati" />
    <div id="it-g5">
      <p className="text-gray-600 leading-relaxed mb-4">
        Quando i dati personali vengono trasferiti al di fuori dello Spazio Economico Europeo (SEE),
        garantiamo una protezione adeguata attraverso:
      </p>
      <ul className="list-disc list-inside text-gray-600 space-y-2">
        <li>
          <strong>EU-U.S. Data Privacy Framework:</strong> I nostri responsabili con sede negli USA (OpenAI,
          Render) partecipano o sono certificati nell'ambito dell'EU-U.S. Data Privacy Framework
        </li>
        <li>
          <strong>Clausole Contrattuali Standard (SCC):</strong> Manteniamo accordi sul trattamento dei dati
          che incorporano le piu recenti SCC adottate dalla Commissione Europea
        </li>
        <li>
          <strong>Misure Supplementari:</strong> Oltre alle garanzie legali, implementiamo misure tecniche
          tra cui crittografia dei dati in transito e a riposo, controlli di accesso e pratiche di
          minimizzazione dei dati
        </li>
        <li>
          <strong>Valutazioni d'Impatto del Trasferimento:</strong> Conduciamo valutazioni d'impatto del
          trasferimento per valutare il livello di protezione dei dati nel paese di destinazione
        </li>
      </ul>
    </div>

    <SectionHeading number="6" title="Come Esercitare i Vostri Diritti" icon={FileCheck} />
    <div id="it-g6">
      <p className="text-gray-600 leading-relaxed mb-4">
        Ai sensi del GDPR, avete il diritto di accedere, rettificare, cancellare, limitare, portare e
        opporvi al trattamento dei vostri dati personali. Ecco come esercitare questi diritti:
      </p>

      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-5">
          <h4 className="font-semibold text-gray-900 mb-2">Passo 1: Invia la Tua Richiesta</h4>
          <p className="text-gray-600 text-sm">
            Invia un'email a <strong>privacy@getyourgrant.eu</strong> con oggetto "Richiesta Diritti GDPR".
            Includi il tuo nome completo, l'indirizzo email associato al tuo account e una descrizione del/dei
            diritto/i che desideri esercitare.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-5">
          <h4 className="font-semibold text-gray-900 mb-2">Passo 2: Verifica dell'Identita</h4>
          <p className="text-gray-600 text-sm">
            Per motivi di sicurezza, potremmo chiederti di verificare la tua identita prima di elaborare
            la richiesta. Questo per garantire che i dati personali non vengano divulgati a persone non
            autorizzate.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-5">
          <h4 className="font-semibold text-gray-900 mb-2">Passo 3: Elaborazione</h4>
          <p className="text-gray-600 text-sm">
            Elaboreremo la tua richiesta entro <strong>30 giorni</strong> dal ricevimento. Se la richiesta
            e complessa o se riceviamo molte richieste, potremmo estendere questo periodo di ulteriori 60
            giorni, e ti informeremo di tale estensione.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-5">
          <h4 className="font-semibold text-gray-900 mb-2">Passo 4: Risposta</h4>
          <p className="text-gray-600 text-sm">
            Riceverai una risposta che conferma le azioni intraprese. Non vi e alcun costo per l'esercizio
            dei tuoi diritti, salvo che le richieste siano manifestamente infondate o eccessive.
          </p>
        </div>
      </div>
    </div>

    <SectionHeading number="7" title="Procedura di Reclamo" icon={AlertTriangle} />
    <div id="it-g7">
      <p className="text-gray-600 leading-relaxed mb-4">
        Se ritieni che i tuoi diritti in materia di protezione dei dati siano stati violati, hai il
        diritto di presentare un reclamo attraverso i seguenti canali:
      </p>

      <div className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h4 className="font-semibold text-gray-900 mb-2">1. Contattaci Prima</h4>
          <p className="text-gray-600 text-sm">
            Ti incoraggiamo a contattarci direttamente a <strong>privacy@getyourgrant.eu</strong> affinche
            possiamo affrontare la tua preoccupazione. Miriamo a risolvere tutti i reclami entro 30 giorni.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h4 className="font-semibold text-gray-900 mb-2">2. Garante per la Protezione dei Dati Personali</h4>
          <p className="text-gray-600 text-sm mb-3">
            Se non sei soddisfatto della nostra risposta, o se desideri presentare un reclamo direttamente,
            puoi contattare il Garante per la Protezione dei Dati Personali:
          </p>
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
            <p><strong>Garante per la Protezione dei Dati Personali</strong></p>
            <p>Piazza Venezia 11, 00187 Roma, Italia</p>
            <p>Telefono: +39 06 696771</p>
            <p>Fax: +39 06 69677 3785</p>
            <p>Email: garante@gpdp.it</p>
            <p>PEC: protocollo@pec.gpdp.it</p>
            <p>
              Sito web:{' '}
              <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                www.garanteprivacy.it
              </a>
            </p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h4 className="font-semibold text-gray-900 mb-2">3. Autorita di Controllo Locale</h4>
          <p className="text-gray-600 text-sm">
            Se ti trovi in un altro Stato membro dell'UE/SEE, puoi anche presentare un reclamo all'autorita
            di controllo del tuo paese di residenza.
          </p>
        </div>
      </div>
    </div>

    <SectionHeading number="8" title="Contattaci" icon={Mail} />
    <div id="it-g8" className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
      <p className="text-gray-700 mb-4">
        Per qualsiasi domanda sulla nostra conformita al GDPR o sulle pratiche di protezione dei dati:
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <p className="font-semibold text-gray-800">Responsabile della Protezione dei Dati</p>
          <p className="text-gray-600 text-sm mt-1">privacy@getyourgrant.eu</p>
        </div>
        <div>
          <p className="font-semibold text-gray-800">Supporto Generale</p>
          <p className="text-gray-600 text-sm mt-1">support@getyourgrant.eu</p>
        </div>
        <div className="sm:col-span-2">
          <p className="font-semibold text-gray-800">Indirizzo Postale</p>
          <p className="text-gray-600 text-sm mt-1">
            GYG S.R.L., Via Maffei, n. 71, 38067 - Ledro (TN), Italia
          </p>
        </div>
      </div>
    </div>
  </div>
);

export default GDPRCompliance;
