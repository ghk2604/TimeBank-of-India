export type Language = 'en' | 'hi' | 'te';

export interface TranslationStrings {
  appName: string;
  tagline: string;
  subTagline: string;
  nav: {
    home: string;
    dashboard: string;
    marketplace: string;
    passport: string;
    wallet: string;
    impact: string;
    gapDetector: string;
    learningPaths: string;
    admin: string;
  };
  cycle: {
    learn: string;
    learnDesc: string;
    prove: string;
    proveDesc: string;
    teach: string;
    teachDesc: string;
    earn: string;
    earnDesc: string;
    grow: string;
    growDesc: string;
  };
  hero: {
    badge: string;
    ctaExplore: string;
    ctaStart: string;
    creditsExplainer: string;
  };
  wallet: {
    title: string;
    currentBalance: string;
    availableCredits: string;
    borrowedCredits: string;
    borrowingLimit: string;
    neverExpire: string;
    transactionHistory: string;
    creditRecovery: string;
  };
  session: {
    duration: string;
    goalContract: string;
    countdown: string;
    confirmSession: string;
    dispute: string;
  };
}

export const translations: Record<Language, TranslationStrings> = {
  en: {
    appName: 'TimeBank of India',
    tagline: 'Your Time. Your Knowledge. Your Growth.',
    subTagline: "India's Peer-to-Peer Skill Learning and Knowledge Exchange Network. Exchange skills with Time Credits instead of direct monetary payments.",
    nav: {
      home: 'Home',
      dashboard: 'Dashboard',
      marketplace: 'Explore Skills',
      passport: 'Skill Passport',
      wallet: 'Time Wallet',
      impact: 'Knowledge Impact',
      gapDetector: 'Gap Detector',
      learningPaths: 'Learning Paths',
      admin: 'Admin Portal',
    },
    cycle: {
      learn: '1. Learn',
      learnDesc: 'Acquire new skills 1-on-1 from experienced Indian peers.',
      prove: '2. Prove',
      proveDesc: 'Demonstrate competency via interactive assessments & tasks.',
      teach: '3. Teach',
      teachDesc: 'Share your verified skills with eager learners across the nation.',
      earn: '4. Earn',
      earnDesc: 'Receive guaranteed Time Credits automatically (1 Hr = 1 Credit).',
      grow: '5. Grow',
      growDesc: 'Use earned credits to learn advanced topics & elevate your career.',
    },
    hero: {
      badge: '🇮🇳 India’s Knowledge & Skill Credit Revolution',
      ctaExplore: 'Explore Skills & Mentors',
      ctaStart: 'Start Learning (Borrow 1 Credit)',
      creditsExplainer: 'Strict Rule: 1 Hour of Teaching = 1 Time Credit. No money involved.',
    },
    wallet: {
      title: 'Time Credit Wallet',
      currentBalance: 'Current Balance',
      availableCredits: 'Available Credits',
      borrowedCredits: 'Borrowed Credits',
      borrowingLimit: 'Borrowing Limit',
      neverExpire: '🛡️ Time Credits Never Expire',
      transactionHistory: 'Transaction Audit Ledger',
      creditRecovery: 'Credit Recovery Opportunities',
    },
    session: {
      duration: 'Session Duration',
      goalContract: 'Learning Goal Contract',
      countdown: 'Waiting for Teacher Response (24h Window)',
      confirmSession: 'Confirm & Transfer Credits',
      dispute: 'Raise Dispute',
    },
  },
  hi: {
    appName: 'टाइमबैंक ऑफ़ इंडिया',
    tagline: 'आपका समय। आपका ज्ञान। आपका विकास।',
    subTagline: 'भारत का पीयर-टू-पीयर कौशल शिक्षण एवं ज्ञान आदान-प्रदान नेटवर्क। सीधे पैसों के बिना टाइम क्रेडिट्स के साथ कौशल सीखें।',
    nav: {
      home: 'होम',
      dashboard: 'डैशबोर्ड',
      marketplace: 'कौशल खोजें',
      passport: 'स्किल पासपोर्ट',
      wallet: 'टाइम वॉलेट',
      impact: 'ज्ञान प्रभाव',
      gapDetector: 'ज्ञान गैप डिटेक्टर',
      learningPaths: 'लर्निंग पाथ',
      admin: 'एडमिन पोर्टल',
    },
    cycle: {
      learn: '१. सीखें (Learn)',
      learnDesc: 'अनुभवी साथियों से आमने-सामने नए कौशल सीखें।',
      prove: '२. प्रमाणित करें (Prove)',
      proveDesc: 'मूल्यांकन और व्यावहारिक कार्यों द्वारा योग्यता सिद्ध करें।',
      teach: '३. सिखाएं (Teach)',
      teachDesc: 'अपने प्रमाणित कौशल से देश भर के शिक्षार्थियों को सिखाएं।',
      earn: '४. अर्जित करें (Earn)',
      earnDesc: 'स्वतः टाइम क्रेडिट्स प्राप्त करें (१ घंटा शिक्षण = १ क्रेडिट)।',
      grow: '५. विकास करें (Grow)',
      growDesc: 'अर्जित क्रेडिट्स से नए कौशल सीखें और आगे बढ़ें।',
    },
    hero: {
      badge: '🇮🇳 भारत का ज्ञान और कौशल क्रेडिट आंदोलन',
      ctaExplore: 'कौशल और गुरु खोजें',
      ctaStart: 'सीखना शुरू करें (१ क्रेडिट उधार लें)',
      creditsExplainer: 'नियम: १ घंटा सिखाना = १ टाइम क्रेडिट। कोई नकद लेन-देन नहीं।',
    },
    wallet: {
      title: 'टाइम क्रेडिट वॉलेट',
      currentBalance: 'वर्तमान बैलेंस',
      availableCredits: 'उपलब्ध क्रेडिट्स',
      borrowedCredits: 'उधार लिए गए क्रेडिट्स',
      borrowingLimit: 'उधार सीमा (Borrowing Limit)',
      neverExpire: '🛡️ टाइम क्रेडिट्स कभी समाप्त नहीं होते',
      transactionHistory: 'लेन-देन ऑडिट लेजर',
      creditRecovery: 'क्रेडिट रिकवरी के अवसर',
    },
    session: {
      duration: 'सत्र की अवधि',
      goalContract: 'लर्निंग गोल अनुबंध',
      countdown: 'शिक्षक की प्रतिक्रिया की प्रतीक्षा (२४ घंटे की सीमा)',
      confirmSession: 'सत्र पुष्टि एवं क्रेडिट ट्रांसफर',
      dispute: 'विवाद दर्ज करें',
    },
  },
  te: {
    appName: 'టైంబ్యాంక్ ఆఫ్ ఇండియా',
    tagline: 'మీ సమయం. మీ జ్ఞానం. మీ పురోగతి.',
    subTagline: 'భారతదేశ పీర్-టు-పీర్ నైపుణ్య అభ్యాస మరియు జ్ఞాన మార్పిడి వేదిక. ధనంతో పనిలేకుండా టైమ్ క్రెడిట్లతో నైపుణ్యాలను పంచుకోండి.',
    nav: {
      home: 'హోమ్',
      dashboard: 'డ్యాష్‌బోర్డ్',
      marketplace: 'నైపుణ్యాలు శోధించండి',
      passport: 'స్కిల్ పాస్‌పోర్ట్',
      wallet: 'టైమ్ వాలెట్',
      impact: 'జ్ఞాన ప్రభావం',
      gapDetector: 'గ్యాప్ డిటెక్టర్',
      learningPaths: 'లెర్నింగ్ పాత్స్',
      admin: 'అడ్మిన్ పోర్టల్',
    },
    cycle: {
      learn: '1. నేర్చుకోండి (Learn)',
      learnDesc: 'తోటి నిపుణుల నుండి ఆచరణాత్మకంగా కొత్త నైపుణ్యాలు నేర్చుకోండి.',
      prove: '2. నిరూపించండి (Prove)',
      proveDesc: 'క్విజ్ మరియు ప్రాక్టికల్ టాస్క్‌ల ద్వారా మీ ప్రతిభను నిరూపించండి.',
      teach: '3. బోధించండి (Teach)',
      teachDesc: 'మీ నైపుణ్యాన్ని ఆసక్తిగల విద్యార్థులకు సులభంగా బోధించండి.',
      earn: '4. సంపాదించండి (Earn)',
      earnDesc: 'టైమ్ క్రెడిట్లను ఆటోమేటిక్‌గా పొందండి (1 గంట బోధన = 1 క్రెడిట్).',
      grow: '5. ఎదగండి (Grow)',
      growDesc: 'సంపాదించిన క్రెడిట్లతో మరిన్ని ఉన్నత నైపుణ్యాలను నేర్చుకోండి.',
    },
    hero: {
      badge: '🇮🇳 భారత విజ్ఞాన & నైపుణ్య క్రెడిట్ విప్లవం',
      ctaExplore: 'నైపుణ్యాలు & గురువులను అన్వేషించండి',
      ctaStart: 'నేర్చుకోవడం ప్రారంభించండి (1 క్రెడిట్ రుణం)',
      creditsExplainer: 'ముఖ్య నియమం: 1 గంట బోధన = 1 టైమ్ క్రెడిట్. డబ్బులతో సంబంధం లేదు.',
    },
    wallet: {
      title: 'టైమ్ క్రెడిట్ వాలెట్',
      currentBalance: 'ప్రస్తుత బ్యాలెన్స్',
      availableCredits: 'అందుబాటులో ఉన్న క్రెడిట్లు',
      borrowedCredits: 'రుణం తీసుకున్న క్రెడిట్లు',
      borrowingLimit: 'గరిష్ట రుణ పరిమితి',
      neverExpire: '🛡️ టైమ్ క్రెడిట్లు ఎప్పటికీ గడువు ముగియవు',
      transactionHistory: 'లావాదేవీల రికార్డు',
      creditRecovery: 'క్రెడిట్ రికవరీ అవకాశాలు',
    },
    session: {
      duration: 'సెషన్ వ్యవధి',
      goalContract: 'లెర్నింగ్ గోల్ ఒప్పందం',
      countdown: 'గురువు స్పందన కోసం నిరీక్షణ (24 గంటల గడువు)',
      confirmSession: 'పూర్తి చేసి క్రెడిట్ బదిలీ చేయండి',
      dispute: 'ఫిర్యాదు దాఖలు చేయండి',
    },
  },
};
