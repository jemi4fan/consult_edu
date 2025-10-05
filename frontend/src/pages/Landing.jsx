import React, { useEffect, useRef, useState, useContext, createContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { adsAPI } from '../services/api';

const LangContext = createContext({ lang: 'en', setLang: () => {} });

const translations = {
  en: {
    home: 'Home', services: 'Services', about: 'About', success: 'Success Stories', partners: 'Partners', faq: 'FAQ',
    signin: 'Sign in', signup: 'Sign up', apply: 'Apply Now', learnMore: 'Learn More',
    heroTitle: 'Empowering Students and Professionals',
    heroSubtitle: 'Scholarships, jobs, and guidance tailored to your journey. Discover opportunities worldwide with expert support.',
    servicesTitle: 'Our Services',
    scholarshipsTitle: 'Scholarship Opportunities',
    scholarshipsDesc: 'Find and apply to scholarships that match your academic profile.',
    jobsTitle: 'Job Opportunities',
    jobsDesc: 'Discover global roles and get guidance to land the offer.',
    stepsTitle: 'How We Help',
    step1: 'Register', step1Desc: 'Create your free account.',
    step2: 'Upload Docs', step2Desc: 'Add transcripts, CV, and more.',
    step3: 'Get Matched', step3Desc: 'We recommend best-fit opportunities.',
    step4: 'Get Approved', step4Desc: 'Apply and track approvals.',
    aboutTitle: 'About Us',
    aboutText: 'We connect talent with life-changing opportunities through curated scholarships and jobs, guided by experienced counselors.',
    statApplicants: 'Applicants', statOffers: 'Offers', statPartners: 'Partners',
    successTitle: 'Success Stories',
    successQuote: 'Addis Consult guided me from application to visa. I am now pursuing my master’s in Europe with a full scholarship.',
    partnersTitle: 'Our Partners',
    advertsTitle: 'Tranding Offers',
    faqTitle: 'FAQ',
    faq1q: 'How do I apply?', faq1a: 'Create an account, complete your profile, and follow the wizard.',
    faq2q: 'Is there a service fee?', faq2a: 'Basic use is free. Counseling packages are optional.',
    faq3q: 'Do you support jobs abroad?', faq3a: 'Yes, we match candidates with global opportunities.',
    quickLinks: 'Quick Links', servicesLink: 'Services', aboutLink: 'About', faqLink: 'FAQ',
    servicesGroup: 'Services', contact: 'Contact', email: 'hello@addisconsult.com', phone: '+251 900 000 000', address: 'Addis Ababa, Ethiopia'
  },
  am: {
    home: 'መነሻ', services: 'አገልግሎቶች', about: 'ስለ እኛ', success: 'የተሳካ ታሪክ', partners: 'አጋሮች', faq: 'ጥያቄዎች',
    signin: 'መግባት', signup: 'መመዝገብ', apply: 'አሁን ይልኩ', learnMore: 'ተጨማሪ ይመልከቱ',
    heroTitle: 'ተማሪዎችን እና ሙያዊዎችን መቻል',
    heroSubtitle: 'ለጉዞዎ የተስተካከሉ ስኮላርሺፕ፣ ስራዎች እና መመሪያ. በባለሙያ ድጋፍ ዓለም አቀፍ እድሎችን ያግኙ.',
    servicesTitle: 'አገልግሎታችን',
    scholarshipsTitle: 'የስኮላርሺፕ እድሎች',
    scholarshipsDesc: 'ከትምህርታዊ መጠንዎ ጋር የሚስማሙ ስኮላርሺፕ ያግኙ እና ይመዝገቡ.',
    jobsTitle: 'የስራ እድሎች',
    jobsDesc: 'ዓለም አቀፍ ስራዎችን አግኝተው ለተቀጠሩ ድጋፍ ይደርሳችሁ.',
    stepsTitle: 'እንዴት እናገለግላለን',
    step1: 'ይመዝገቡ', step1Desc: 'ነጻ መለያዎን ይፍጠሩ.',
    step2: 'ሰነዶች ያስገቡ', step2Desc: 'ውጤቶች፣ CV እና ሌሎች ያክሉ.',
    step3: 'ማቀናበር', step3Desc: 'ምቹ እድሎችን እንመክራለን.',
    step4: 'እውቅና ያግኙ', step4Desc: 'ይመዝገቡ እና እውቅናን ይከታተሉ.',
    aboutTitle: 'ስለ እኛ',
    aboutText: 'በባለሙያ መካከለኛነት የተመረጡ ስኮላርሺፕ እና ስራዎችን እንገናኝላችሁ.',
    statApplicants: 'አመልካቾች', statOffers: 'ቅጥር', statPartners: 'አጋሮች',
    successTitle: 'የተሳካ ታሪኮች',
    successQuote: 'ከመመዝገብ እስከ ቪዛ ድረስ Addis Consult አግዟኝ. አሁን በአውሮፓ ሙሉ ስብስ እማራለሁ.',
    partnersTitle: 'አጋሮቻችን',
    advertsTitle: 'ታዋቂ እቃዎች',
    faqTitle: 'ጥያቄዎች',
    faq1q: 'እንዴት እልከዋለሁ?', faq1a: 'መለያ ፍጠሩ፣ ፕሮፋይሉን ያጠናቅቁ እና ዊዛርዱን ይከተሉ.',
    faq2q: 'ክፍያ አለ?', faq2a: 'መሰረታዊ አጠቃቀም ነጻ ነው። አማራጭ ምክር አገልግሎት አለ.',
    faq3q: 'ውጭ ስራዎችን ታግዛላችሁ?', faq3a: 'አዎን፣ ከአለም አቀፍ እድሎች ጋር እንዛመዳለን.',
    quickLinks: 'ፈጣን አገናኞች', servicesLink: 'አገልግሎቶች', aboutLink: 'ስለ እኛ', faqLink: 'ጥያቄዎች',
    servicesGroup: 'አገልግሎቶች', contact: 'እውቂያ', email: 'hello@addisconsult.com', phone: '+251 900 000 000', address: 'አዲስ አበባ፣ ኢትዮጵያ'
  },
  om: {
    home: 'Mana', services: 'Tajaajiloota', about: 'Waa’ee Keenya', success: 'Milkaa’ina', partners: 'Hojii Waliin', faq: 'Gaaffilee',
    signin: 'Seenu', signup: 'Galmaaʼu', apply: 'Amma Aplii godi', learnMore: 'Dabalataan Barbaadi',
    heroTitle: 'Barattoota fi Ogummaa Qabu Hojii Banuu',
    heroSubtitle: 'Scholarship, hojii, fi deeggarsa siif qophaaʼe. Carraa addunyaa balʼaa argadhu.',
    servicesTitle: 'Tajaajiloota Keenya',
    scholarshipsTitle: 'Carraa Scholarship',
    scholarshipsDesc: 'Scholarship sirriitti siif ta’an barbaadi fi galmaa’i.',
    jobsTitle: 'Carraa Hojii',
    jobsDesc: 'Hojii addunyaa balʼaa irratti siif mijatan argadhu.',
    stepsTitle: 'Akka Nu Gargaarru',
    step1: 'Galmaaʼi', step1Desc: 'Herrega bilisaa uumi.',
    step2: 'Sanadoota Galchi', step2Desc: 'Transcript, CV fi kkf.',
    step3: 'Tokkummaa', step3Desc: 'Carraa siif mijataa ni dhiyeessina.',
    step4: 'Mirmaa Argadhu', step4Desc: 'Aplikeeshinii fi hordoffii gochuu.',
    aboutTitle: 'Waa’ee Keenya',
    aboutText: 'Scholarship fi hojii filatamoo wal qunnamsiisna.',
    statApplicants: 'Aangawootaa', statOffers: 'Kenniinsa', statPartners: 'Hojii Waliin',
    successTitle: 'Milkaa’ina',
    successQuote: 'Addis Consult na gargaree visa naaf fide; scholarship guutuu argadhe.',
    partnersTitle: 'Hojii Waliin',
    advertsTitle: 'Carraa Ijaarsa',
    faqTitle: 'Gaaffilee',
    faq1q: 'Akka itti Aplikeessan?', faq1a: 'Herrega uumi, profile guuti, wizard hordofi.',
    faq2q: 'Kaffaltiin jiraa?', faq2a: 'Tajaajilli bu’uuraa bilisa; deeggarsi dabalataa filannoo.',
    faq3q: 'Hojii biyya alaatti jirtuu deeggartu?', faq3a: 'Eeyyee, carraa addunyaa waliin wal qunnamsiifna.',
    quickLinks: 'Hidhattoota Ariifataa', servicesLink: 'Tajaajiloota', aboutLink: 'Waa’ee Keenya', faqLink: 'Gaaffilee',
    servicesGroup: 'Tajaajiloota', contact: 'Quunnamtii', email: 'hello@addisconsult.com', phone: '+251 900 000 000', address: 'Finfinnee, Itoophiyaa'
  }
};

const useLang = () => useContext(LangContext);

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { lang, setLang } = useLang();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleApply = () => {
    const token = localStorage.getItem('token');
    if (token) navigate('/dashboard'); else navigate('/auth/register');
  };

  const handleLogin = () => navigate('/auth/login');
  const handleSignup = () => {
    const token = localStorage.getItem('token');
    navigate(token ? '/dashboard' : '/auth/register');
  };

  const setLanguage = (code) => {
    setLang(code);
    document.documentElement.setAttribute('lang', code);
    try { localStorage.setItem('lang', code); } catch {}
  };

  const scrollToId = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 72;
    window.scrollTo({ top: y, behavior: 'smooth' });
    setMobileOpen(false);
  };

  const navLink = (id, label) => (
    <button onClick={() => scrollToId(id)} className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900">
      {label}
    </button>
  );

  return (
    <header className={`fixed top-0 inset-x-0 z-50 ${scrolled ? 'bg-white/80 backdrop-blur-md shadow-sm' : 'bg-white/60 backdrop-blur-md border-b'} transition`}> 
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full" style={{ background: 'var(--gradient-primary)' }} />
          <span className="font-semibold">Addis Consult Solutions</span>
        </div>
        <nav className="hidden md:flex items-center gap-1">
          {navLink('home', translations[lang].home)}
          {navLink('services', translations[lang].services)}
          {navLink('about', translations[lang].about)}
          {navLink('success', translations[lang].success)}
          {navLink('partners', translations[lang].partners)}
          {navLink('faq', translations[lang].faq)}
        </nav>
        <div className="hidden md:flex items-center gap-3">
          <div className="rounded-full border px-1 py-1 text-xs bg-white/70">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              aria-pressed={lang==='en'}
              className={`px-2 py-1 rounded-full ${lang==='en' ? 'text-white' : 'text-gray-700'}`}
              style={lang==='en' ? { background: 'var(--gradient-primary)' } : {}}
            >EN</button>
            <button
              type="button"
              onClick={() => setLanguage('am')}
              aria-pressed={lang==='am'}
              className={`px-2 py-1 rounded-full ${lang==='am' ? 'text-white' : 'text-gray-700'}`}
              style={lang==='am' ? { background: 'var(--gradient-primary)' } : {}}
            >አማ</button>
            <button
              type="button"
              onClick={() => setLanguage('om')}
              aria-pressed={lang==='om'}
              className={`px-2 py-1 rounded-full ${lang==='om' ? 'text-white' : 'text-gray-700'}`}
              style={lang==='om' ? { background: 'var(--gradient-primary)' } : {}}
            >OM</button>
          </div>
          <button onClick={handleLogin} className="btn h-10 px-4 bg-white text-gray-900 border border-gray-200 hover:bg-gray-100">
            <i className="fas fa-right-to-bracket mr-2"></i>
            {translations[lang].signin}
          </button>
          <button onClick={handleSignup} className="btn btn-primary-gradient h-10 px-5">
            <i className="fas fa-user-plus mr-2"></i>
            {translations[lang].signup}
          </button>
        </div>
        <button aria-label="Menu" className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
          <i className="fas fa-bars text-xl"></i>
        </button>
      </div>
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 bg-white z-40 pt-16">
          <div className="p-6 space-y-4">
            <div className="rounded-full border px-1 py-1 text-xs inline-flex bg-white/70">
              {['en','am','om'].map(code => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLanguage(code)}
                  aria-pressed={lang===code}
                  className={`px-3 py-1 rounded-full ${lang===code ? 'text-white' : 'text-gray-700'}`}
                  style={lang===code ? { background: 'var(--gradient-primary)' } : {}}
                >{code==='en'?'EN':code==='am'?'አማ':'OM'}</button>
              ))}
            </div>
            {['home','services','about','success','partners','faq'].map(id => (
              <button key={id} onClick={() => scrollToId(id)} className="block w-full text-left text-lg py-3 border-b">
                {translations[lang][id] || id}
              </button>
            ))}
            <div className="pt-4 flex gap-3">
              <button onClick={handleLogin} className="btn bg-gray-100 hover:bg-gray-200 text-gray-900 flex-1">
                <i className="fas fa-right-to-bracket mr-2"></i> {translations[lang].signin}
              </button>
              <button onClick={handleSignup} className="btn btn-primary-gradient flex-1">
                <i className="fas fa-user-plus mr-2"></i> {translations[lang].signup}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

const Hero = () => {
  const { lang } = useLang();
  const heroRef = useRef(null);
  const globeRef = useRef(null);
  const orbitRefs = useRef([]);
  orbitRefs.current = [];
  const floatRefs = useRef([]);
  floatRefs.current = [];

  const addFloatRef = (el) => {
    if (el && !floatRefs.current.includes(el)) floatRefs.current.push(el);
  };
  const addOrbitRef = (el) => {
    if (el && !orbitRefs.current.includes(el)) orbitRefs.current.push(el);
  };

  // Remove entrance animations on load; only continuous motions
  useEffect(() => {
    if (globeRef.current) {
      gsap.to(globeRef.current, { rotate: 360, duration: 60, ease: 'none', repeat: -1 });
    }
    orbitRefs.current.forEach((el, idx) => {
      gsap.to(el, { rotate: 360, transformOrigin: '50% 50%', duration: 20 + idx * 8, ease: 'none', repeat: -1 });
    });
    floatRefs.current.forEach((el, idx) => {
      gsap.to(el, { y: 12, rotation: idx % 2 ? 6 : -6, duration: 3 + (idx % 3), yoyo: true, repeat: -1, ease: 'sine.inOut' });
    });

    const onScroll = () => {
      const y = window.scrollY || 0;
      if (heroRef.current) {
        const parallax = Math.min(y * 0.1, 40);
        heroRef.current.style.setProperty('--hero-parallax', `${parallax}px`);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navigate = useNavigate();
  const apply = () => {
    const token = localStorage.getItem('token');
    navigate(token ? '/dashboard' : '/auth/register');
  };

  return (
    <section id="home" ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden" style={{ background: 'var(--gradient-hero)' }}>
      <div className="absolute inset-0 opacity-20 translate-y-[var(--hero-parallax,0px)] pointer-events-none" aria-hidden="true"></div>

      {/* Floating icons */}
      <div ref={addFloatRef} className="absolute top-24 left-10 w-12 h-12 rounded-full bg-white/30 text-white z-10 flex items-center justify-center">
        <i className="fas fa-passport"></i>
      </div>
      <div ref={addFloatRef} className="absolute top-40 right-16 w-12 h-12 rounded-full bg-white/30 text-white z-10 flex items-center justify-center">
        <i className="fas fa-graduation-cap"></i>
      </div>
      <div ref={addFloatRef} className="absolute bottom-24 left-24 w-12 h-12 rounded-full bg-white/30 text-white z-10 flex items-center justify-center">
        <i className="fas fa-briefcase"></i>
      </div>
      <div ref={addFloatRef} className="absolute bottom-16 right-24 w-12 h-12 rounded-full bg-white/30 text-white z-10 flex items-center justify-center">
        <i className="fas fa-plane"></i>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full pt-20">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white">
              {translations[lang].heroTitle}
            </h1>
            <p className="mt-4 text-white/90 text-lg md:text-xl max-w-prose">
              {translations[lang].heroSubtitle}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button type="button" onClick={apply} className="btn btn-primary-gradient btn-lg w-full sm:w-auto">{translations[lang].apply}</button>
              <button type="button" onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })} className="btn btn-lg w-full sm:w-auto bg-white text-gray-900 hover:bg-gray-100">
                {translations[lang].learnMore}
              </button>
            </div>
          </div>
          <div className="relative h-[360px] md:h-[480px]">
            <div className="absolute inset-0 rounded-full" style={{ background: 'var(--gradient-primary)', filter: 'blur(60px)', opacity: 0.6 }} />
            <div
              ref={globeRef}
              className="relative w-72 h-72 md:w-96 md:h-96 rounded-full mx-auto border-4 border-white/20 shadow-2xl overflow-hidden"
              style={{
                backgroundImage: "radial-gradient(circle at 30% 30%, #4A90E2, #003366), url('https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/World_map_-_low_resolution.svg/1024px-World_map_-_low_resolution.svg.png')",
                backgroundSize: 'cover, 140%',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                backgroundBlendMode: 'overlay',
              }}
            >
              {/* Ethiopia marker */}
              <div className="absolute w-2.5 h-2.5 rounded-full" style={{ background: 'var(--ethiopian-yellow)', top: '38%', left: '58%' }} title="Ethiopia" />
              {/* Orbits */}
              <div ref={addOrbitRef} className="absolute inset-0">
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ transform: 'translate(-50%, -50%) translateX(44%)' }}>
                  <i className="fas fa-plane text-white/80"></i>
                </div>
              </div>
              <div ref={addOrbitRef} className="absolute inset-0">
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ transform: 'translate(-50%, -50%) translateX(-44%)' }}>
                  <i className="fas fa-circle text-[6px] text-white/70"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Section = ({ id, title, children, variant = 'light' }) => (
  <section id={id} className={`py-20 ${variant==='dark' ? '' : ''}`} style={variant==='dark' ? { background: 'var(--gradient-primary)', color: '#fff' } : {}}>
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <h2 className={`text-3xl md:text-4xl font-bold mb-8 ${variant==='dark' ? '' : 'gradient-text'}`}>{title}</h2>
      {children}
    </div>
  </section>
);

const Services = () => {
  const { lang } = useLang();
  return (
  <Section id="services" title={translations[lang].servicesTitle}>
    <div className="grid md:grid-cols-2 gap-6">
      {[{
        icon: 'fa-graduation-cap',
        title: translations[lang].scholarshipsTitle,
        desc: translations[lang].scholarshipsDesc
      }, {
        icon: 'fa-briefcase',
        title: translations[lang].jobsTitle,
        desc: translations[lang].jobsDesc
      }].map((s) => (
        <div key={s.title} className="card p-6 hover:shadow-md transition-transform" style={{ transformStyle: 'preserve-3d' }}>
          <div className="w-12 h-12 rounded-lg text-white flex items-center justify-center" style={{ background: 'var(--gradient-primary)' }}>
            <i className={`fas ${s.icon}`}></i>
          </div>
          <h3 className="mt-4 text-xl font-semibold text-primary-700">{s.title}</h3>
          <p className="mt-2 text-gray-600">{s.desc}</p>
          <button onClick={() => {
            const token = localStorage.getItem('token');
            window.location.href = token ? '/dashboard#services' : '/auth/register';
          }} className="mt-4 btn btn-outline">Learn More</button>
        </div>
      ))}
    </div>
  </Section>
)};

const Adverts = () => {
  const { lang } = useLang();
  const [ads, setAds] = useState([]);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await adsAPI.getPinnedAds(3);
        if (mounted) setAds(data?.data || []);
      } catch (e) {
        if (mounted) setAds([
          { id: 'ad1', title: 'Ad 1', image_url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200' },
          { id: 'ad2', title: 'Ad 2', image_url: 'https://images.unsplash.com/photo-1529336953121-adb2f2a02c3a?w=1200' },
          { id: 'ad3', title: 'Ad 3', image_url: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=1200' },
        ]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const Card = ({ title, image }) => (
    <div className="card overflow-hidden">
      <div className="p-5">
        <h3 className="text-xl font-semibold text-primary-700 truncate">{title}</h3>
      </div>
      <div className="h-80 md:h-96 w-full bg-gray-100">
        <img src={image} alt={title} className="w-full h-full object-cover" loading="lazy" />
      </div>
    </div>
  );

  return (
    <Section id="adverts" title={translations[lang].advertsTitle} variant="dark">
      <div className="grid md:grid-cols-3 gap-6">
        {['ad1','ad2','ad3'].map((key, idx) => {
          const a = ads[idx];
          return <Card key={key} title={a?.title || `Ad ${idx+1}`} image={a?.image_url || ''} />
        })}
      </div>
    </Section>
  );
};

const Steps = () => {
  const { lang } = useLang();
  return (
  <Section id="how-we-help" title={translations[lang].stepsTitle}>
    <div className="grid md:grid-cols-4 gap-4">
      {[
        { n: '01', icon: 'fa-user-plus', title: translations[lang].step1, desc: translations[lang].step1Desc },
        { n: '02', icon: 'fa-file-upload', title: translations[lang].step2, desc: translations[lang].step2Desc },
        { n: '03', icon: 'fa-magnifying-glass', title: translations[lang].step3, desc: translations[lang].step3Desc },
        { n: '04', icon: 'fa-circle-check', title: translations[lang].step4, desc: translations[lang].step4Desc },
      ].map(step => (
        <div key={step.n} className="relative card p-6 hover:shadow-md transition">
          <div className="absolute -top-3 -left-3 text-6xl font-extrabold text-gray-100 select-none">{step.n}</div>
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white" style={{ background: 'var(--gradient-primary)' }}>
            <i className={`fas ${step.icon}`}></i>
          </div>
          <h3 className="mt-4 font-semibold">{step.title}</h3>
          <p className="text-gray-600">{step.desc}</p>
        </div>
      ))}
    </div>
  </Section>
)};

const About = () => {
  const { lang } = useLang();
  return (
  <section id="about" className="py-20 text-white" style={{ background: 'var(--gradient-primary)' }}>
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-8 items-center">
      <div>
        <h2 className="text-3xl md:text-4xl font-bold">{translations[lang].aboutTitle}</h2>
        <p className="mt-3 text-white/90">{translations[lang].aboutText}</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[{ n: '5K+', label: translations[lang].statApplicants }, { n: '800+', label: translations[lang].statOffers }, { n: '120+', label: translations[lang].statPartners }].map((s) => (
          <div key={s.label} className="rounded-lg bg-white/15 p-4 text-center">
            <div className="text-3xl font-extrabold" style={{ color: 'var(--ethiopian-yellow)' }}>{s.n}</div>
            <div className="text-sm opacity-90">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
)};

const Success = () => {
  const { lang } = useLang();
  return (
  <Section id="success" title={translations[lang].successTitle}>
    <div className="max-w-3xl mx-auto">
      <div className="card p-6">
        <div className="text-emerald-600">
          <i className="fas fa-quote-left"></i>
        </div>
        <p className="italic text-gray-700 mt-2">{translations[lang].successQuote}</p>
        <div className="mt-4 flex items-center gap-3">
          <img src="https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=80&h=80&fit=crop&crop=faces" alt="Student" className="w-12 h-12 rounded-full object-cover" loading="lazy" />
          <div>
            <div className="font-semibold">Hanna T.</div>
            <div className="text-sm text-gray-500">Master’s Student</div>
          </div>
        </div>
      </div>
    </div>
  </Section>
)};

const Partners = () => {
  const { lang } = useLang();
  const marqueeRef = useRef(null);
  const trackRef = useRef(null);
  const universities = [
    { name: 'University of Oxford', logo: 'https://logo.clearbit.com/ox.ac.uk' },
    { name: 'Harvard University', logo: 'https://logo.clearbit.com/harvard.edu' },
    { name: 'MIT', logo: 'https://logo.clearbit.com/mit.edu' },
    { name: 'Stanford University', logo: 'https://logo.clearbit.com/stanford.edu' },
    { name: 'University of Cambridge', logo: 'https://logo.clearbit.com/cam.ac.uk' },
    { name: 'ETH Zürich', logo: 'https://logo.clearbit.com/ethz.ch' },
    { name: 'University of Toronto', logo: 'https://logo.clearbit.com/utoronto.ca' },
    { name: 'University of Melbourne', logo: 'https://logo.clearbit.com/unimelb.edu.au' },
    { name: 'KAIST', logo: 'https://logo.clearbit.com/kaist.ac.kr' },
    { name: 'University of Tokyo', logo: 'https://logo.clearbit.com/u-tokyo.ac.jp' },
  ];

  useEffect(() => {
    if (!trackRef.current) return;
    const track = trackRef.current;
    const left = track.children[0];
    let tween;

    const setup = () => {
      if (!left) return;
      const halfWidth = left.scrollWidth;
      // Set explicit width so halves sit side-by-side without overlap
      track.style.width = `${halfWidth * 2}px`;
      gsap.set(track, { x: 0 });
      if (tween) tween.kill();
      const duration = Math.max(20, Math.round(halfWidth / 40)); // speed ~40px/s
      tween = gsap.to(track, { x: -halfWidth, duration, ease: 'none', repeat: -1 });
    };

    setup();
    const onResize = () => setup();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (tween) tween.kill();
    };
  }, []);

  const Card = ({ name, logo }) => (
    <div className="relative shrink-0 w-64 mr-6 last:mr-6 rounded-lg bg-gray-100 p-4 text-center hover:bg-white hover:shadow transition overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none"
           style={{ backgroundImage: `url(${logo})`, backgroundSize: '70%', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }} />
      <div className="relative font-semibold text-primary-700 truncate">{name}</div>
      <div className="relative mt-2 text-xs text-gray-600">Scholarship partner</div>
    </div>
  );

  return (
  <Section id="partners" title={translations[lang].partnersTitle} variant="dark">
    <div ref={marqueeRef} className="relative overflow-hidden">
      <div ref={trackRef} className="flex items-center will-change-transform pl-6">
        <div className="flex items-center py-2">
          {universities.map(u => <Card key={`a-${u.name}`} name={u.name} logo={u.logo} />)}
        </div>
        <div className="flex items-center py-2" aria-hidden="true">
          {universities.map(u => <Card key={`b-${u.name}`} name={u.name} logo={u.logo} />)}
        </div>
      </div>
    </div>
  </Section>
)};

const FAQ = () => {
  const [open, setOpen] = useState(0);
  const { lang } = useLang();
  const items = [
    { q: translations[lang].faq1q, a: translations[lang].faq1a },
    { q: translations[lang].faq2q, a: translations[lang].faq2a },
    { q: translations[lang].faq3q, a: translations[lang].faq3a },
  ];
  return (
    <Section id="faq" title={translations[lang].faqTitle}>
      <div className="space-y-3">
        {items.map((it, i) => (
          <div key={it.q} className="card">
            <button aria-expanded={open===i} onClick={() => setOpen(open===i?-1:i)} className="w-full flex items-center justify-between p-4 text-left">
              <span className="font-medium text-primary-700">{it.q}</span>
              <i className={`fas fa-chevron-down transition ${open===i ? 'rotate-180' : ''}`}></i>
            </button>
            <div className="px-4 pb-4 text-gray-600" style={{ display: open===i ? 'block' : 'none' }}>{it.a}</div>
          </div>
        ))}
      </div>
    </Section>
  );
};

const Footer = () => {
  const { lang } = useLang();
  return (
  <footer className="pt-16 pb-8 text-white" style={{ background: 'var(--primary-blue-deep)' }}>
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid md:grid-cols-4 gap-8">
      <div>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full" style={{ background: 'var(--gradient-primary)' }} />
          <span className="font-semibold">Addis Consult Solutions</span>
        </div>
        <div className="mt-4 flex gap-3">
          {['facebook','twitter','linkedin','instagram'].map(n => (
            <a key={n} href="#" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">
              <i className={`fab fa-${n}`}></i>
            </a>
          ))}
        </div>
      </div>
      <div>
        <div className="font-semibold mb-2" style={{ color: 'var(--ethiopian-yellow)' }}>{translations[lang].servicesGroup}</div>
        <ul className="space-y-2 text-white/80">
          <li>{translations[lang].scholarshipsTitle}</li>
          <li>{translations[lang].jobsTitle}</li>
          <li>Counseling</li>
        </ul>
      </div>
      <div>
        <div className="font-semibold mb-2" style={{ color: 'var(--ethiopian-yellow)' }}>{translations[lang].contact}</div>
        <ul className="space-y-2 text-white/80">
          <li><i className="fas fa-envelope mr-2"></i> {translations[lang].email}</li>
          <li><i className="fas fa-phone mr-2"></i> {translations[lang].phone}</li>
          <li><i className="fas fa-location-dot mr-2"></i> {translations[lang].address}</li>
        </ul>
      </div>
      <div>
        <div className="font-semibold mb-2" style={{ color: 'var(--ethiopian-yellow)' }}>Map</div>
        <div className="rounded-lg overflow-hidden border border-white/10">
          <iframe
            title="Map - Addis Ababa, Ethiopia"
            src="https://www.google.com/maps?q=Addis%20Ababa%2C%20Ethiopia&output=embed"
            className="w-full h-48"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </div>
    </div>
    <div className="mt-8 border-t border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 text-sm text-white/70">
        © {new Date().getFullYear()} Addis Consult Solutions. All rights reserved.
      </div>
    </div>
  </footer>
)};

const Landing = () => {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem('lang') || 'en'; } catch { return 'en'; }
  });
  useEffect(() => {
    document.documentElement.setAttribute('lang', lang);
  }, [lang]);
  return (
    <LangContext.Provider value={{ lang, setLang }}>
      <main className="min-h-screen">
        <Header />
        <Hero />
        <Services />
        <Adverts />
        <Steps />
        <About />
        <Success />
        <Partners />
        <FAQ />
        <Footer />
      </main>
    </LangContext.Provider>
  );
};

export default Landing;


