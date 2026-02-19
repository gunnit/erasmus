import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicy = () => {
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
          <h1 className="text-3xl sm:text-4xl font-bold">Privacy Policy</h1>
          <p className="mt-2 text-blue-100">Informativa sulla Privacy</p>
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
        <li><a href="#en-p1" className="hover:underline">Data Controller</a></li>
        <li><a href="#en-p2" className="hover:underline">Data We Collect</a></li>
        <li><a href="#en-p3" className="hover:underline">Legal Basis for Processing</a></li>
        <li><a href="#en-p4" className="hover:underline">How We Use Your Data</a></li>
        <li><a href="#en-p5" className="hover:underline">Third-Party Data Processors</a></li>
        <li><a href="#en-p6" className="hover:underline">Data Retention</a></li>
        <li><a href="#en-p7" className="hover:underline">International Data Transfers</a></li>
        <li><a href="#en-p8" className="hover:underline">Your Rights Under GDPR</a></li>
        <li><a href="#en-p9" className="hover:underline">Cookie Policy</a></li>
        <li><a href="#en-p10" className="hover:underline">Data Security</a></li>
        <li><a href="#en-p11" className="hover:underline">Children's Privacy</a></li>
        <li><a href="#en-p12" className="hover:underline">Changes to This Policy</a></li>
        <li><a href="#en-p13" className="hover:underline">Data Protection Officer</a></li>
        <li><a href="#en-p14" className="hover:underline">Contact Information</a></li>
      </ol>
    </div>

    <p className="text-gray-600 leading-relaxed">
      This Privacy Policy explains how GYG S.R.L. ("we", "us", or "our") collects, uses, stores,
      and protects your personal data when you use the Get Your Grant platform ("the Service"). We are
      committed to protecting your privacy in compliance with the General Data Protection Regulation
      (EU) 2016/679 ("GDPR") and Italian data protection law (D.Lgs. 196/2003 as amended by D.Lgs.
      101/2018).
    </p>

    <SectionHeading number="1" title="Data Controller" />
    <div id="en-p1" className="bg-gray-50 rounded-lg p-5">
      <p className="text-gray-700"><strong>Data Controller:</strong> GYG S.R.L.</p>
      <p className="text-gray-700"><strong>Registered Address:</strong> Via Maffei, n. 71, 38067 - Ledro (TN), Italy</p>
      <p className="text-gray-700"><strong>VAT Number (P.IVA):</strong> 02767760222</p>
      <p className="text-gray-700"><strong>Privacy Contact:</strong> privacy@getyourgrant.eu</p>
      <p className="text-gray-700"><strong>General Support:</strong> support@getyourgrant.eu</p>
    </div>

    <SectionHeading number="2" title="Data We Collect" />
    <div id="en-p2">
      <p className="text-gray-600 leading-relaxed mb-4">
        We collect the following categories of personal data:
      </p>

      <h4 className="font-semibold text-gray-800 mt-4 mb-2">2.1 Account Data</h4>
      <ul className="list-disc list-inside text-gray-600 space-y-1">
        <li>Email address</li>
        <li>Username</li>
        <li>Full name (optional)</li>
        <li>Organization name (optional)</li>
        <li>Hashed password (we never store plaintext passwords)</li>
      </ul>

      <h4 className="font-semibold text-gray-800 mt-4 mb-2">2.2 Project and Proposal Data</h4>
      <ul className="list-disc list-inside text-gray-600 space-y-1">
        <li>Project descriptions and ideas</li>
        <li>Partner organization information (names, countries, websites, descriptions)</li>
        <li>Selected EU priorities and target groups</li>
        <li>AI-generated proposal answers</li>
        <li>Draft and submitted proposal content</li>
      </ul>

      <h4 className="font-semibold text-gray-800 mt-4 mb-2">2.3 Payment Data</h4>
      <ul className="list-disc list-inside text-gray-600 space-y-1">
        <li>PayPal transaction identifiers (order ID, payer ID)</li>
        <li>Subscription plan type and status</li>
        <li>Payment dates and amounts</li>
        <li>We do NOT store credit card numbers, PayPal passwords, or full financial account details</li>
      </ul>

      <h4 className="font-semibold text-gray-800 mt-4 mb-2">2.4 Technical Data</h4>
      <ul className="list-disc list-inside text-gray-600 space-y-1">
        <li>IP address (for security and abuse prevention)</li>
        <li>Browser type and version</li>
        <li>Access timestamps</li>
        <li>Authentication tokens (JWT)</li>
      </ul>
    </div>

    <SectionHeading number="3" title="Legal Basis for Processing" />
    <div id="en-p3">
      <p className="text-gray-600 leading-relaxed mb-3">
        We process your personal data on the following legal bases under Article 6 of the GDPR:
      </p>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left font-semibold text-gray-900 border-b">Processing Activity</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900 border-b">Legal Basis</th>
            </tr>
          </thead>
          <tbody className="text-gray-600">
            <tr className="border-b"><td className="px-4 py-3">Account creation and management</td><td className="px-4 py-3">Contract performance (Art. 6(1)(b))</td></tr>
            <tr className="border-b bg-gray-50"><td className="px-4 py-3">AI-generated proposal content</td><td className="px-4 py-3">Contract performance (Art. 6(1)(b))</td></tr>
            <tr className="border-b"><td className="px-4 py-3">Payment processing</td><td className="px-4 py-3">Contract performance (Art. 6(1)(b))</td></tr>
            <tr className="border-b bg-gray-50"><td className="px-4 py-3">Marketing communications</td><td className="px-4 py-3">Consent (Art. 6(1)(a))</td></tr>
            <tr className="border-b"><td className="px-4 py-3">Security and abuse prevention</td><td className="px-4 py-3">Legitimate interest (Art. 6(1)(f))</td></tr>
            <tr className="bg-gray-50"><td className="px-4 py-3">Legal compliance and tax records</td><td className="px-4 py-3">Legal obligation (Art. 6(1)(c))</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <SectionHeading number="4" title="How We Use Your Data" />
    <div id="en-p4">
      <p className="text-gray-600 leading-relaxed">We use your personal data to:</p>
      <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
        <li>Provide and maintain the Service, including AI-powered proposal generation</li>
        <li>Process your subscription payments via PayPal</li>
        <li>Manage your account and provide customer support</li>
        <li>Send service-related communications (e.g., subscription confirmations, expiry reminders)</li>
        <li>Improve the Service and develop new features</li>
        <li>Ensure the security and integrity of the platform</li>
        <li>Comply with legal obligations</li>
      </ul>
    </div>

    <SectionHeading number="5" title="Third-Party Data Processors" />
    <div id="en-p5">
      <p className="text-gray-600 leading-relaxed mb-4">
        We share your data with the following third-party processors, each bound by data processing
        agreements:
      </p>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left font-semibold text-gray-900 border-b">Processor</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900 border-b">Purpose</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900 border-b">Data Shared</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900 border-b">Location</th>
            </tr>
          </thead>
          <tbody className="text-gray-600">
            <tr className="border-b">
              <td className="px-4 py-3 font-medium">OpenAI, Inc.</td>
              <td className="px-4 py-3">AI content generation</td>
              <td className="px-4 py-3">Project descriptions, partner info (anonymized where possible)</td>
              <td className="px-4 py-3">United States</td>
            </tr>
            <tr className="border-b bg-gray-50">
              <td className="px-4 py-3 font-medium">PayPal (Europe) S.a r.l.</td>
              <td className="px-4 py-3">Payment processing</td>
              <td className="px-4 py-3">Payment amount, transaction ID, payer email</td>
              <td className="px-4 py-3">Luxembourg / EU</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium">Render Services, Inc.</td>
              <td className="px-4 py-3">Cloud hosting and database</td>
              <td className="px-4 py-3">All service data (encrypted at rest and in transit)</td>
              <td className="px-4 py-3">United States</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-gray-600 leading-relaxed mt-4">
        For transfers to the United States (OpenAI, Render), we rely on the EU-U.S. Data Privacy
        Framework and/or Standard Contractual Clauses (SCCs) as approved by the European Commission
        to ensure adequate data protection.
      </p>
    </div>

    <SectionHeading number="6" title="Data Retention" />
    <div id="en-p6">
      <p className="text-gray-600 leading-relaxed mb-3">
        We retain your data for the following periods:
      </p>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left font-semibold text-gray-900 border-b">Data Type</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900 border-b">Retention Period</th>
            </tr>
          </thead>
          <tbody className="text-gray-600">
            <tr className="border-b"><td className="px-4 py-3">Account data</td><td className="px-4 py-3">Until account deletion request, then 30 days</td></tr>
            <tr className="border-b bg-gray-50"><td className="px-4 py-3">Proposal and project data</td><td className="px-4 py-3">Until account deletion or 2 years after last activity</td></tr>
            <tr className="border-b"><td className="px-4 py-3">Payment records</td><td className="px-4 py-3">10 years (Italian tax law requirement)</td></tr>
            <tr className="border-b bg-gray-50"><td className="px-4 py-3">Technical logs</td><td className="px-4 py-3">90 days</td></tr>
            <tr><td className="px-4 py-3">Authentication tokens</td><td className="px-4 py-3">Session duration (expires on logout)</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <SectionHeading number="7" title="International Data Transfers" />
    <div id="en-p7">
      <p className="text-gray-600 leading-relaxed">
        Your data may be transferred to and processed in countries outside the European Economic Area (EEA),
        specifically the United States (for OpenAI AI processing and Render hosting). Such transfers are
        protected by:
      </p>
      <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
        <li>EU-U.S. Data Privacy Framework (where applicable)</li>
        <li>Standard Contractual Clauses (SCCs) approved by the European Commission</li>
        <li>Additional technical and organizational measures (encryption, access controls)</li>
      </ul>
    </div>

    <SectionHeading number="8" title="Your Rights Under GDPR" />
    <div id="en-p8">
      <p className="text-gray-600 leading-relaxed mb-3">
        Under the GDPR, you have the following rights regarding your personal data:
      </p>
      <div className="space-y-3">
        {[
          { right: 'Right of Access (Art. 15)', desc: 'Request a copy of all personal data we hold about you' },
          { right: 'Right to Rectification (Art. 16)', desc: 'Request correction of inaccurate or incomplete data' },
          { right: 'Right to Erasure (Art. 17)', desc: 'Request deletion of your personal data ("right to be forgotten")' },
          { right: 'Right to Restriction (Art. 18)', desc: 'Request restriction of processing in certain circumstances' },
          { right: 'Right to Data Portability (Art. 20)', desc: 'Receive your data in a structured, machine-readable format' },
          { right: 'Right to Object (Art. 21)', desc: 'Object to processing based on legitimate interests' },
          { right: 'Right to Withdraw Consent (Art. 7(3))', desc: 'Withdraw consent at any time without affecting prior processing' },
        ].map((item, i) => (
          <div key={i} className="bg-gray-50 rounded-lg p-4">
            <p className="font-semibold text-gray-800">{item.right}</p>
            <p className="text-gray-600 text-sm mt-1">{item.desc}</p>
          </div>
        ))}
      </div>
      <p className="text-gray-600 leading-relaxed mt-4">
        To exercise any of these rights, contact us at <strong>privacy@getyourgrant.eu</strong>. We will
        respond within 30 days as required by the GDPR. If you are unsatisfied with our response, you have
        the right to lodge a complaint with the Italian Data Protection Authority (Garante per la Protezione
        dei Dati Personali).
      </p>
    </div>

    <SectionHeading number="9" title="Cookie Policy" />
    <div id="en-p9">
      <p className="text-gray-600 leading-relaxed">
        Our use of cookies is minimal and limited to essential functionality:
      </p>
      <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
        <li><strong>Authentication tokens:</strong> Stored in local storage to maintain your logged-in session (essential for service functionality)</li>
        <li><strong>Dark mode preference:</strong> Stored in local storage to remember your display preference</li>
      </ul>
      <p className="text-gray-600 leading-relaxed mt-3">
        We do <strong>not</strong> use tracking cookies, analytics cookies, or third-party advertising cookies.
        No cookie consent banner is required as we only use strictly necessary storage.
      </p>
    </div>

    <SectionHeading number="10" title="Data Security" />
    <div id="en-p10">
      <p className="text-gray-600 leading-relaxed">
        We implement appropriate technical and organizational measures to protect your data, including:
      </p>
      <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
        <li>SSL/TLS encryption for all data in transit</li>
        <li>Database encryption at rest</li>
        <li>Password hashing using industry-standard algorithms (bcrypt)</li>
        <li>JWT-based authentication with secure token management</li>
        <li>Role-based access controls</li>
        <li>Regular security reviews and updates</li>
      </ul>
    </div>

    <SectionHeading number="11" title="Children's Privacy" />
    <div id="en-p11">
      <p className="text-gray-600 leading-relaxed">
        The Service is not intended for use by individuals under 18 years of age. We do not knowingly
        collect personal data from minors. If we become aware that we have collected data from a minor,
        we will take steps to delete it promptly.
      </p>
    </div>

    <SectionHeading number="12" title="Changes to This Policy" />
    <div id="en-p12">
      <p className="text-gray-600 leading-relaxed">
        We may update this Privacy Policy from time to time. Material changes will be communicated via
        email or through a prominent notice on the Service. The "Last updated" date at the top of this
        policy indicates when it was last revised.
      </p>
    </div>

    <SectionHeading number="13" title="Data Protection Officer" />
    <div id="en-p13" className="bg-gray-50 rounded-lg p-5">
      <p className="text-gray-700">
        For any data protection inquiries, you may contact our Data Protection Officer (DPO):
      </p>
      <p className="text-gray-700 mt-2"><strong>Email:</strong> privacy@getyourgrant.eu</p>
      <p className="text-gray-700"><strong>Address:</strong> Data Protection Officer, GYG S.R.L., Via Maffei, n. 71, 38067 - Ledro (TN), Italy</p>
    </div>

    <SectionHeading number="14" title="Contact Information" />
    <div id="en-p14" className="bg-gray-50 rounded-lg p-5">
      <p className="text-gray-700">For privacy-related inquiries:</p>
      <p className="text-gray-700 mt-2"><strong>Privacy:</strong> privacy@getyourgrant.eu</p>
      <p className="text-gray-700"><strong>General Support:</strong> support@getyourgrant.eu</p>
      <p className="text-gray-700"><strong>Address:</strong> GYG S.R.L., Via Maffei, n. 71, 38067 - Ledro (TN), Italy</p>
      <p className="text-gray-700 mt-3">
        <strong>Supervisory Authority:</strong> Garante per la Protezione dei Dati Personali,
        Piazza Venezia 11, 00187 Roma, Italy -
        <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
          www.garanteprivacy.it
        </a>
      </p>
    </div>
  </div>
);

const ItalianContent = () => (
  <div className="prose prose-gray max-w-none">
    {/* Indice */}
    <div className="bg-blue-50 rounded-xl p-6 mb-10">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Indice</h3>
      <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
        <li><a href="#it-p1" className="hover:underline">Titolare del Trattamento</a></li>
        <li><a href="#it-p2" className="hover:underline">Dati Raccolti</a></li>
        <li><a href="#it-p3" className="hover:underline">Base Giuridica del Trattamento</a></li>
        <li><a href="#it-p4" className="hover:underline">Finalita del Trattamento</a></li>
        <li><a href="#it-p5" className="hover:underline">Responsabili Esterni del Trattamento</a></li>
        <li><a href="#it-p6" className="hover:underline">Conservazione dei Dati</a></li>
        <li><a href="#it-p7" className="hover:underline">Trasferimento Internazionale dei Dati</a></li>
        <li><a href="#it-p8" className="hover:underline">I Vostri Diritti ai sensi del GDPR</a></li>
        <li><a href="#it-p9" className="hover:underline">Cookie Policy</a></li>
        <li><a href="#it-p10" className="hover:underline">Sicurezza dei Dati</a></li>
        <li><a href="#it-p11" className="hover:underline">Privacy dei Minori</a></li>
        <li><a href="#it-p12" className="hover:underline">Modifiche alla presente Informativa</a></li>
        <li><a href="#it-p13" className="hover:underline">Responsabile della Protezione dei Dati</a></li>
        <li><a href="#it-p14" className="hover:underline">Informazioni di Contatto</a></li>
      </ol>
    </div>

    <p className="text-gray-600 leading-relaxed">
      La presente Informativa sulla Privacy spiega come GYG S.R.L. ("noi" o "nostro") raccoglie, utilizza,
      conserva e protegge i vostri dati personali quando utilizzate la piattaforma Get Your Grant ("il
      Servizio"). Ci impegniamo a proteggere la vostra privacy in conformita con il Regolamento Generale
      sulla Protezione dei Dati (UE) 2016/679 ("GDPR") e la normativa italiana sulla protezione dei dati
      (D.Lgs. 196/2003 come modificato dal D.Lgs. 101/2018).
    </p>

    <SectionHeading number="1" title="Titolare del Trattamento" />
    <div id="it-p1" className="bg-gray-50 rounded-lg p-5">
      <p className="text-gray-700"><strong>Titolare del Trattamento:</strong> GYG S.R.L.</p>
      <p className="text-gray-700"><strong>Sede Legale:</strong> Via Maffei, n. 71, 38067 - Ledro (TN), Italia</p>
      <p className="text-gray-700"><strong>Partita IVA:</strong> 02767760222</p>
      <p className="text-gray-700"><strong>Contatto Privacy:</strong> privacy@getyourgrant.eu</p>
      <p className="text-gray-700"><strong>Supporto Generale:</strong> support@getyourgrant.eu</p>
    </div>

    <SectionHeading number="2" title="Dati Raccolti" />
    <div id="it-p2">
      <p className="text-gray-600 leading-relaxed mb-4">
        Raccogliamo le seguenti categorie di dati personali:
      </p>

      <h4 className="font-semibold text-gray-800 mt-4 mb-2">2.1 Dati dell'Account</h4>
      <ul className="list-disc list-inside text-gray-600 space-y-1">
        <li>Indirizzo email</li>
        <li>Nome utente</li>
        <li>Nome completo (facoltativo)</li>
        <li>Nome dell'organizzazione (facoltativo)</li>
        <li>Password con hash (non conserviamo mai password in chiaro)</li>
      </ul>

      <h4 className="font-semibold text-gray-800 mt-4 mb-2">2.2 Dati del Progetto e delle Proposte</h4>
      <ul className="list-disc list-inside text-gray-600 space-y-1">
        <li>Descrizioni e idee del progetto</li>
        <li>Informazioni sulle organizzazioni partner (nomi, paesi, siti web, descrizioni)</li>
        <li>Priorita UE e gruppi target selezionati</li>
        <li>Risposte alle proposte generate dall'IA</li>
        <li>Contenuto delle proposte in bozza e inviate</li>
      </ul>

      <h4 className="font-semibold text-gray-800 mt-4 mb-2">2.3 Dati di Pagamento</h4>
      <ul className="list-disc list-inside text-gray-600 space-y-1">
        <li>Identificativi delle transazioni PayPal (ID ordine, ID pagante)</li>
        <li>Tipo e stato del piano di abbonamento</li>
        <li>Date e importi dei pagamenti</li>
        <li>NON conserviamo numeri di carta di credito, password PayPal o dettagli completi dei conti finanziari</li>
      </ul>

      <h4 className="font-semibold text-gray-800 mt-4 mb-2">2.4 Dati Tecnici</h4>
      <ul className="list-disc list-inside text-gray-600 space-y-1">
        <li>Indirizzo IP (per sicurezza e prevenzione abusi)</li>
        <li>Tipo e versione del browser</li>
        <li>Timestamp di accesso</li>
        <li>Token di autenticazione (JWT)</li>
      </ul>
    </div>

    <SectionHeading number="3" title="Base Giuridica del Trattamento" />
    <div id="it-p3">
      <p className="text-gray-600 leading-relaxed mb-3">
        Trattiamo i vostri dati personali sulle seguenti basi giuridiche ai sensi dell'Articolo 6 del GDPR:
      </p>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left font-semibold text-gray-900 border-b">Attivita di Trattamento</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900 border-b">Base Giuridica</th>
            </tr>
          </thead>
          <tbody className="text-gray-600">
            <tr className="border-b"><td className="px-4 py-3">Creazione e gestione dell'account</td><td className="px-4 py-3">Esecuzione del contratto (Art. 6(1)(b))</td></tr>
            <tr className="border-b bg-gray-50"><td className="px-4 py-3">Contenuti generati dall'IA</td><td className="px-4 py-3">Esecuzione del contratto (Art. 6(1)(b))</td></tr>
            <tr className="border-b"><td className="px-4 py-3">Elaborazione dei pagamenti</td><td className="px-4 py-3">Esecuzione del contratto (Art. 6(1)(b))</td></tr>
            <tr className="border-b bg-gray-50"><td className="px-4 py-3">Comunicazioni di marketing</td><td className="px-4 py-3">Consenso (Art. 6(1)(a))</td></tr>
            <tr className="border-b"><td className="px-4 py-3">Sicurezza e prevenzione abusi</td><td className="px-4 py-3">Interesse legittimo (Art. 6(1)(f))</td></tr>
            <tr className="bg-gray-50"><td className="px-4 py-3">Adempimenti fiscali e legali</td><td className="px-4 py-3">Obbligo legale (Art. 6(1)(c))</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <SectionHeading number="4" title="Finalita del Trattamento" />
    <div id="it-p4">
      <p className="text-gray-600 leading-relaxed">Utilizziamo i vostri dati personali per:</p>
      <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
        <li>Fornire e mantenere il Servizio, inclusa la generazione di proposte basata sull'IA</li>
        <li>Elaborare i pagamenti dell'abbonamento tramite PayPal</li>
        <li>Gestire il vostro account e fornire assistenza clienti</li>
        <li>Inviare comunicazioni relative al servizio (es. conferme di abbonamento, promemoria di scadenza)</li>
        <li>Migliorare il Servizio e sviluppare nuove funzionalita</li>
        <li>Garantire la sicurezza e l'integrita della piattaforma</li>
        <li>Adempiere agli obblighi di legge</li>
      </ul>
    </div>

    <SectionHeading number="5" title="Responsabili Esterni del Trattamento" />
    <div id="it-p5">
      <p className="text-gray-600 leading-relaxed mb-4">
        Condividiamo i vostri dati con i seguenti responsabili esterni del trattamento, ciascuno vincolato
        da accordi sul trattamento dei dati:
      </p>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left font-semibold text-gray-900 border-b">Responsabile</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900 border-b">Finalita</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900 border-b">Dati Condivisi</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900 border-b">Sede</th>
            </tr>
          </thead>
          <tbody className="text-gray-600">
            <tr className="border-b">
              <td className="px-4 py-3 font-medium">OpenAI, Inc.</td>
              <td className="px-4 py-3">Generazione contenuti IA</td>
              <td className="px-4 py-3">Descrizioni progetto, info partner (anonimizzate ove possibile)</td>
              <td className="px-4 py-3">Stati Uniti</td>
            </tr>
            <tr className="border-b bg-gray-50">
              <td className="px-4 py-3 font-medium">PayPal (Europe) S.a r.l.</td>
              <td className="px-4 py-3">Elaborazione pagamenti</td>
              <td className="px-4 py-3">Importo pagamento, ID transazione, email pagante</td>
              <td className="px-4 py-3">Lussemburgo / UE</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium">Render Services, Inc.</td>
              <td className="px-4 py-3">Hosting cloud e database</td>
              <td className="px-4 py-3">Tutti i dati del servizio (crittografati)</td>
              <td className="px-4 py-3">Stati Uniti</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <SectionHeading number="6" title="Conservazione dei Dati" />
    <div id="it-p6">
      <p className="text-gray-600 leading-relaxed mb-3">
        Conserviamo i vostri dati per i seguenti periodi:
      </p>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left font-semibold text-gray-900 border-b">Tipo di Dati</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900 border-b">Periodo di Conservazione</th>
            </tr>
          </thead>
          <tbody className="text-gray-600">
            <tr className="border-b"><td className="px-4 py-3">Dati dell'account</td><td className="px-4 py-3">Fino alla richiesta di cancellazione, poi 30 giorni</td></tr>
            <tr className="border-b bg-gray-50"><td className="px-4 py-3">Dati di progetto e proposte</td><td className="px-4 py-3">Fino alla cancellazione dell'account o 2 anni dall'ultima attivita</td></tr>
            <tr className="border-b"><td className="px-4 py-3">Registri di pagamento</td><td className="px-4 py-3">10 anni (obbligo fiscale italiano)</td></tr>
            <tr className="border-b bg-gray-50"><td className="px-4 py-3">Log tecnici</td><td className="px-4 py-3">90 giorni</td></tr>
            <tr><td className="px-4 py-3">Token di autenticazione</td><td className="px-4 py-3">Durata della sessione (scadono al logout)</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <SectionHeading number="7" title="Trasferimento Internazionale dei Dati" />
    <div id="it-p7">
      <p className="text-gray-600 leading-relaxed">
        I vostri dati possono essere trasferiti e trattati in paesi al di fuori dello Spazio Economico
        Europeo (SEE), in particolare gli Stati Uniti (per l'elaborazione IA di OpenAI e l'hosting Render).
        Tali trasferimenti sono protetti da:
      </p>
      <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
        <li>EU-U.S. Data Privacy Framework (ove applicabile)</li>
        <li>Clausole Contrattuali Standard (SCC) approvate dalla Commissione Europea</li>
        <li>Misure tecniche e organizzative aggiuntive (crittografia, controlli di accesso)</li>
      </ul>
    </div>

    <SectionHeading number="8" title="I Vostri Diritti ai sensi del GDPR" />
    <div id="it-p8">
      <p className="text-gray-600 leading-relaxed mb-3">
        Ai sensi del GDPR, avete i seguenti diritti riguardo ai vostri dati personali:
      </p>
      <div className="space-y-3">
        {[
          { right: 'Diritto di Accesso (Art. 15)', desc: 'Richiedere una copia di tutti i dati personali in nostro possesso' },
          { right: 'Diritto di Rettifica (Art. 16)', desc: 'Richiedere la correzione di dati inesatti o incompleti' },
          { right: 'Diritto alla Cancellazione (Art. 17)', desc: 'Richiedere la cancellazione dei vostri dati personali ("diritto all\'oblio")' },
          { right: 'Diritto alla Limitazione (Art. 18)', desc: 'Richiedere la limitazione del trattamento in determinate circostanze' },
          { right: 'Diritto alla Portabilita (Art. 20)', desc: 'Ricevere i vostri dati in un formato strutturato e leggibile da dispositivo automatico' },
          { right: 'Diritto di Opposizione (Art. 21)', desc: 'Opporsi al trattamento basato su interessi legittimi' },
          { right: 'Diritto di Revoca del Consenso (Art. 7(3))', desc: 'Revocare il consenso in qualsiasi momento senza pregiudicare il trattamento precedente' },
        ].map((item, i) => (
          <div key={i} className="bg-gray-50 rounded-lg p-4">
            <p className="font-semibold text-gray-800">{item.right}</p>
            <p className="text-gray-600 text-sm mt-1">{item.desc}</p>
          </div>
        ))}
      </div>
      <p className="text-gray-600 leading-relaxed mt-4">
        Per esercitare uno qualsiasi di questi diritti, contattateci a <strong>privacy@getyourgrant.eu</strong>.
        Risponderemo entro 30 giorni come richiesto dal GDPR. Se non siete soddisfatti della nostra risposta,
        avete il diritto di presentare un reclamo al Garante per la Protezione dei Dati Personali.
      </p>
    </div>

    <SectionHeading number="9" title="Cookie Policy" />
    <div id="it-p9">
      <p className="text-gray-600 leading-relaxed">
        Il nostro utilizzo dei cookie e minimo e limitato alle funzionalita essenziali:
      </p>
      <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
        <li><strong>Token di autenticazione:</strong> Memorizzati nel local storage per mantenere la sessione di accesso (essenziali per il funzionamento del servizio)</li>
        <li><strong>Preferenza modalita scura:</strong> Memorizzata nel local storage per ricordare la preferenza di visualizzazione</li>
      </ul>
      <p className="text-gray-600 leading-relaxed mt-3">
        <strong>Non</strong> utilizziamo cookie di tracciamento, cookie analitici o cookie pubblicitari di
        terze parti. Non e richiesto alcun banner di consenso ai cookie poiche utilizziamo solo
        memorizzazione strettamente necessaria.
      </p>
    </div>

    <SectionHeading number="10" title="Sicurezza dei Dati" />
    <div id="it-p10">
      <p className="text-gray-600 leading-relaxed">
        Implementiamo misure tecniche e organizzative appropriate per proteggere i vostri dati, tra cui:
      </p>
      <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
        <li>Crittografia SSL/TLS per tutti i dati in transito</li>
        <li>Crittografia del database a riposo</li>
        <li>Hashing delle password con algoritmi standard del settore (bcrypt)</li>
        <li>Autenticazione basata su JWT con gestione sicura dei token</li>
        <li>Controlli di accesso basati sui ruoli</li>
        <li>Revisioni e aggiornamenti di sicurezza regolari</li>
      </ul>
    </div>

    <SectionHeading number="11" title="Privacy dei Minori" />
    <div id="it-p11">
      <p className="text-gray-600 leading-relaxed">
        Il Servizio non e destinato all'uso da parte di persone di eta inferiore ai 18 anni. Non raccogliamo
        consapevolmente dati personali di minori. Se veniamo a conoscenza di aver raccolto dati di un minore,
        adotteremo misure per cancellarli tempestivamente.
      </p>
    </div>

    <SectionHeading number="12" title="Modifiche alla presente Informativa" />
    <div id="it-p12">
      <p className="text-gray-600 leading-relaxed">
        Potremmo aggiornare la presente Informativa sulla Privacy di tanto in tanto. Le modifiche sostanziali
        saranno comunicate via email o tramite un avviso ben visibile sul Servizio. La data "Ultimo
        aggiornamento" in cima a questa informativa indica quando e stata rivista l'ultima volta.
      </p>
    </div>

    <SectionHeading number="13" title="Responsabile della Protezione dei Dati" />
    <div id="it-p13" className="bg-gray-50 rounded-lg p-5">
      <p className="text-gray-700">
        Per qualsiasi richiesta relativa alla protezione dei dati, potete contattare il nostro Responsabile
        della Protezione dei Dati (DPO):
      </p>
      <p className="text-gray-700 mt-2"><strong>Email:</strong> privacy@getyourgrant.eu</p>
      <p className="text-gray-700"><strong>Indirizzo:</strong> Responsabile della Protezione dei Dati, GYG S.R.L., Via Maffei, n. 71, 38067 - Ledro (TN), Italia</p>
    </div>

    <SectionHeading number="14" title="Informazioni di Contatto" />
    <div id="it-p14" className="bg-gray-50 rounded-lg p-5">
      <p className="text-gray-700">Per richieste relative alla privacy:</p>
      <p className="text-gray-700 mt-2"><strong>Privacy:</strong> privacy@getyourgrant.eu</p>
      <p className="text-gray-700"><strong>Supporto Generale:</strong> support@getyourgrant.eu</p>
      <p className="text-gray-700"><strong>Indirizzo:</strong> GYG S.R.L., Via Maffei, n. 71, 38067 - Ledro (TN), Italia</p>
      <p className="text-gray-700 mt-3">
        <strong>Autorita di Controllo:</strong> Garante per la Protezione dei Dati Personali,
        Piazza Venezia 11, 00187 Roma, Italia -
        <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
          www.garanteprivacy.it
        </a>
      </p>
    </div>
  </div>
);

export default PrivacyPolicy;
