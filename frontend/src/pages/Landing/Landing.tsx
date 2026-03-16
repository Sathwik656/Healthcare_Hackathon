import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, Calendar, Shield, Clock, ArrowRight, Heart, Users,
  MapPin, Mail, Phone, Star, ChevronRight, CheckCircle, Stethoscope,
  Brain, Eye, Bone, Baby, HeartPulse, Microscope, Quote, Play,
  Building2, Award, Zap, Globe, ChevronLeft
} from 'lucide-react';

/* ─── Utility: count-up hook ─── */
function useCountUp(target, duration = 1800, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return count;
}

/* ─── Stat item ─── */
function StatItem({ value, suffix, label, started }) {
  const num = useCountUp(value, 1800, started);
  return (
    <div className="stat-item">
      <div className="stat-number">{num}{suffix}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

/* ─── Data ─── */
const SPECIALTIES = [
  { icon: HeartPulse, label: 'Cardiology',    color: '#ef4444', bg: '#fef2f2' },
  { icon: Brain,      label: 'Neurology',     color: '#8b5cf6', bg: '#f5f3ff' },
  { icon: Eye,        label: 'Ophthalmology', color: '#06b6d4', bg: '#ecfeff' },
  { icon: Bone,       label: 'Orthopedics',   color: '#f59e0b', bg: '#fffbeb' },
  { icon: Baby,       label: 'Pediatrics',    color: '#ec4899', bg: '#fdf2f8' },
  { icon: Microscope, label: 'Pathology',     color: '#10b981', bg: '#f0fdf4' },
];

const DOCTORS = [
  {
    name: 'Dr. Ananya Krishnan',
    specialty: 'Cardiologist',
    exp: '14 yrs',
    rating: 4.9,
    reviews: 312,
    img: 'AK',
    color: '#10b981',
    bg: '#d1fae5',
    tag: 'Top Rated',
    hospital: 'Apollo Hospitals',
    available: 'Today',
  },
  {
    name: 'Dr. Rajiv Mehta',
    specialty: 'Neurologist',
    exp: '18 yrs',
    rating: 4.8,
    reviews: 289,
    img: 'RM',
    color: '#8b5cf6',
    bg: '#ede9fe',
    tag: 'Senior Specialist',
    hospital: 'Fortis Healthcare',
    available: 'Tomorrow',
  },
  {
    name: 'Dr. Priya Nair',
    specialty: 'Pediatrician',
    exp: '10 yrs',
    rating: 4.9,
    reviews: 401,
    img: 'PN',
    color: '#ec4899',
    bg: '#fce7f3',
    tag: 'Most Booked',
    hospital: 'Manipal Hospitals',
    available: 'Today',
  },
  {
    name: 'Dr. Suresh Babu',
    specialty: 'Orthopedic Surgeon',
    exp: '21 yrs',
    rating: 4.7,
    reviews: 198,
    img: 'SB',
    color: '#f59e0b',
    bg: '#fef3c7',
    tag: 'Expert',
    hospital: 'Narayana Health',
    available: 'Wed',
  },
];

const HOSPITALS = [
  { name: 'Apollo Hospitals',  city: 'Pan India', beds: '10,000+', since: '1983', color: '#1d4ed8', abbr: 'AH' },
  { name: 'Fortis Healthcare', city: 'Pan India', beds: '4,000+',  since: '2001', color: '#7c3aed', abbr: 'FH' },
  { name: 'Manipal Hospitals', city: 'South India', beds: '5,000+', since: '1953', color: '#0891b2', abbr: 'MH' },
  { name: 'Narayana Health',   city: 'Pan India', beds: '6,500+',  since: '2000', color: '#059669', abbr: 'NH' },
  { name: 'AIIMS Delhi',       city: 'New Delhi', beds: '2,500+',  since: '1956', color: '#dc2626', abbr: 'AI' },
  { name: 'Kokilaben Hospital',city: 'Mumbai',    beds: '750+',    since: '2009', color: '#d97706', abbr: 'KH' },
];

const TESTIMONIALS = [
  {
    text: "Booking was effortless. I got an appointment with a top cardiologist within hours. The whole experience felt premium and stress-free.",
    author: 'Meera Iyer',
    role: 'Patient, Bengaluru',
    initials: 'MI',
    color: '#10b981',
  },
  {
    text: "As a doctor, the platform helped me manage my schedule, reduce no-shows, and reach patients who genuinely need my help.",
    author: 'Dr. Arun Pillai',
    role: 'Physician, Kochi',
    initials: 'AP',
    color: '#6366f1',
  },
  {
    text: "My elderly mother's prescriptions and reports are now organised in one place. I can monitor her health remotely with total peace of mind.",
    author: 'Vikram Nanda',
    role: 'Caregiver, Hyderabad',
    initials: 'VN',
    color: '#f59e0b',
  },
];

const FEATURES = [
  {
    icon: Calendar,
    title: 'Instant Booking',
    desc: 'Real-time slot availability. Book, reschedule, or cancel in under 30 seconds.',
    color: '#10b981',
  },
  {
    icon: Shield,
    title: 'Encrypted Records',
    desc: 'End-to-end encrypted health records accessible only by you and your care team.',
    color: '#6366f1',
  },
  {
    icon: Zap,
    title: 'AI Health Insights',
    desc: 'Personalised health nudges and early-warning alerts powered by clinical AI.',
    color: '#f59e0b',
  },
  {
    icon: Globe,
    title: 'Video Consultations',
    desc: 'HD video calls with specialists anywhere in India. No travel, no waiting rooms.',
    color: '#06b6d4',
  },
  {
    icon: HeartPulse,
    title: 'Vitals Monitoring',
    desc: 'Connect wearables to track heart rate, SpO₂, sleep, and more in one dashboard.',
    color: '#ef4444',
  },
  {
    icon: Award,
    title: 'Verified Doctors',
    desc: 'Every doctor is credential-checked and peer-reviewed before joining the platform.',
    color: '#8b5cf6',
  },
];

/* ─── Stars ─── */
const Stars = ({ rating }) => (
  <div style={{ display: 'flex', gap: 2 }}>
    {[1,2,3,4,5].map(i => (
      <Star key={i} size={12}
        fill={i <= Math.round(rating) ? '#f59e0b' : 'none'}
        color={i <= Math.round(rating) ? '#f59e0b' : '#d1d5db'}
      />
    ))}
  </div>
);

/* ═══════════════════════════════════════════ MAIN ═══════════════════════════════ */
export default function Landing() {
  const [statsVisible, setStatsVisible] = useState(false);
  const [activeTesti, setActiveTesti] = useState(0);
  const statsRef = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const id = setInterval(() => setActiveTesti(t => (t + 1) % TESTIMONIALS.length), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,600;0,9..144,700;0,9..144,800;1,9..144,300;1,9..144,600&family=DM+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --green: #16a34a;
          --green-light: #22c55e;
          --green-pale: #f0fdf4;
          --slate-900: #0f172a;
          --slate-700: #334155;
          --slate-500: #64748b;
          --slate-200: #e2e8f0;
          --slate-100: #f1f5f9;
          --white: #ffffff;
          --radius: 20px;
          --shadow-card: 0 4px 32px rgba(0,0,0,0.07);
          --shadow-hover: 0 16px 48px rgba(0,0,0,0.12);
        }

        body { font-family: 'DM Sans', sans-serif; background: #fafaf9; color: var(--slate-900); }

        /* ── NAV ── */
        .nav {
          position: sticky; top: 0; z-index: 100;
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--slate-200);
        }
        .nav-inner {
          max-width: 1200px; margin: 0 auto;
          padding: 0 24px;
          height: 72px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .nav-logo { display: flex; align-items: center; gap: 8px; text-decoration: none; }
        .nav-logo-text { font-family: 'Fraunces', serif; font-size: 24px; font-weight: 700; color: var(--slate-900); }
        .nav-links { display: flex; gap: 32px; }
        .nav-links a { font-size: 15px; color: var(--slate-700); text-decoration: none; font-weight: 500; transition: color .2s; }
        .nav-links a:hover { color: var(--green); }
        .nav-actions { display: flex; gap: 12px; align-items: center; }
        .btn-ghost { font-size: 15px; font-weight: 500; color: var(--slate-700); text-decoration: none; padding: 8px 16px; border-radius: 10px; transition: background .2s; }
        .btn-ghost:hover { background: var(--slate-100); }
        .btn-primary {
          display: inline-flex; align-items: center; gap: 6px;
          background: var(--green); color: white;
          font-size: 15px; font-weight: 600;
          padding: 10px 22px; border-radius: 12px;
          text-decoration: none;
          transition: background .2s, transform .15s, box-shadow .2s;
          box-shadow: 0 2px 12px rgba(22,163,74,0.25);
        }
        .btn-primary:hover { background: #15803d; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(22,163,74,0.3); }
        .btn-primary-lg {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--green); color: white;
          font-size: 17px; font-weight: 600;
          padding: 15px 32px; border-radius: 14px;
          text-decoration: none;
          box-shadow: 0 4px 20px rgba(22,163,74,0.3);
          transition: background .2s, transform .15s, box-shadow .2s;
        }
        .btn-primary-lg:hover { background: #15803d; transform: translateY(-2px); box-shadow: 0 10px 28px rgba(22,163,74,0.35); }
        .btn-outline-lg {
          display: inline-flex; align-items: center; gap: 8px;
          background: white; color: var(--slate-700);
          font-size: 17px; font-weight: 600;
          padding: 15px 32px; border-radius: 14px;
          text-decoration: none;
          border: 1.5px solid var(--slate-200);
          transition: border-color .2s, transform .15s;
        }
        .btn-outline-lg:hover { border-color: var(--green); color: var(--green); transform: translateY(-1px); }

        /* ── HERO ── */
        .hero { padding: 80px 24px 100px; max-width: 1200px; margin: 0 auto; }
        .hero-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center; }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--green-pale); border: 1px solid #bbf7d0;
          color: var(--green); border-radius: 50px;
          padding: 6px 16px; font-size: 13px; font-weight: 600;
          margin-bottom: 24px;
        }
        .hero-badge-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--green-light); animation: pulse-dot 2s infinite; }
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.3)} }
        .hero-h1 {
          font-family: 'Fraunces', serif; font-size: 62px; font-weight: 800;
          line-height: 1.08; letter-spacing: -1.5px;
          color: var(--slate-900); margin-bottom: 24px;
        }
        .hero-h1 em { font-style: italic; color: var(--green); }
        .hero-sub { font-size: 18px; color: var(--slate-500); line-height: 1.7; margin-bottom: 36px; max-width: 480px; }
        .hero-ctas { display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 56px; }
        .hero-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 0; border-top: 1px solid var(--slate-200); padding-top: 32px; }
        .stat-item { padding-right: 24px; }
        .stat-item + .stat-item { padding-left: 24px; border-left: 1px solid var(--slate-200); }
        .stat-number { font-family: 'Fraunces', serif; font-size: 36px; font-weight: 700; color: var(--slate-900); }
        .stat-label { font-size: 13px; color: var(--slate-500); margin-top: 4px; font-weight: 500; }

        /* Hero card */
        .hero-visual { position: relative; }
        .hero-card {
          background: white; border-radius: 28px;
          border: 1px solid var(--slate-200);
          box-shadow: 0 24px 64px rgba(0,0,0,0.08);
          padding: 28px; overflow: hidden;
          position: relative;
        }
        .hero-card::before {
          content: ''; position: absolute; top: -60px; right: -60px;
          width: 180px; height: 180px;
          background: radial-gradient(circle, #dcfce7, transparent 70%);
          border-radius: 50%;
        }
        .hero-card-header {
          display: flex; align-items: center; gap: 14px;
          padding-bottom: 20px; margin-bottom: 20px;
          border-bottom: 1px solid var(--slate-100);
        }
        .hero-card-icon {
          width: 48px; height: 48px; border-radius: 14px;
          background: var(--green-pale); display: flex; align-items: center; justify-content: center;
        }
        .hero-card-title { font-weight: 700; font-size: 16px; color: var(--slate-900); }
        .hero-card-sub { font-size: 13px; color: var(--slate-500); margin-top: 2px; }
        .feature-row {
          display: flex; align-items: flex-start; gap: 14px;
          padding: 14px; border-radius: 14px; background: var(--slate-100);
          border: 1px solid var(--slate-200); margin-bottom: 10px;
          transition: transform .2s, box-shadow .2s;
        }
        .feature-row:hover { transform: translateX(4px); box-shadow: var(--shadow-card); }
        .feature-row:last-child { margin-bottom: 0; }
        .feature-icon {
          width: 40px; height: 40px; border-radius: 10px;
          background: white; display: flex; align-items: center; justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06); flex-shrink: 0;
        }
        .feature-row-title { font-weight: 600; font-size: 14px; color: var(--slate-900); }
        .feature-row-desc { font-size: 12px; color: var(--slate-500); margin-top: 2px; }

        /* Floating card */
        .floating-chip {
          position: absolute; left: -28px; bottom: 64px;
          background: white; border-radius: 16px;
          padding: 12px 16px; display: flex; align-items: center; gap: 10px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.12);
          border: 1px solid var(--slate-100);
          animation: float 4s ease-in-out infinite;
        }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .chip-avatar {
          width: 36px; height: 36px; border-radius: 50%;
          background: var(--green-pale); display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 13px; color: var(--green);
        }
        .chip-name { font-weight: 600; font-size: 13px; color: var(--slate-900); }
        .chip-sub { font-size: 11px; color: var(--slate-500); }
        .floating-chip2 {
          position: absolute; right: -20px; top: 60px;
          background: white; border-radius: 14px;
          padding: 10px 14px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          border: 1px solid var(--slate-100);
          animation: float 5s ease-in-out infinite;
          animation-delay: 1s;
        }
        .chip2-inner { display: flex; align-items: center; gap: 8px; }
        .chip2-dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; animation: pulse-dot 1.5s infinite; }

        /* ── SECTION COMMONS ── */
        .section { padding: 100px 24px; }
        .section-inner { max-width: 1200px; margin: 0 auto; }
        .section-tag {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;
          color: var(--green); margin-bottom: 16px;
        }
        .section-tag::before { content:''; display:block; width:24px; height:2px; background:var(--green); border-radius:2px; }
        .section-h2 {
          font-family: 'Fraunces', serif; font-size: 44px; font-weight: 700;
          line-height: 1.15; letter-spacing: -1px; color: var(--slate-900);
          margin-bottom: 16px;
        }
        .section-h2 em { font-style: italic; color: var(--green); }
        .section-sub { font-size: 17px; color: var(--slate-500); line-height: 1.65; max-width: 540px; }

        /* ── SPECIALTIES ── */
        .specialties-bg { background: white; border-top: 1px solid var(--slate-200); border-bottom: 1px solid var(--slate-200); }
        .specialties-grid { display: grid; grid-template-columns: repeat(6,1fr); gap: 16px; margin-top: 56px; }
        .spec-card {
          text-align: center; padding: 24px 12px; border-radius: 18px;
          border: 1.5px solid transparent; cursor: pointer;
          transition: border-color .2s, transform .2s, box-shadow .2s;
          background: white;
        }
        .spec-card:hover { transform: translateY(-6px); box-shadow: var(--shadow-hover); }
        .spec-icon {
          width: 56px; height: 56px; border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 12px;
        }
        .spec-label { font-size: 13px; font-weight: 600; color: var(--slate-700); }

        /* ── FEATURES ── */
        .features-bg { background: #fafaf9; }
        .features-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 24px; margin-top: 56px; }
        .feat-card {
          background: white; border-radius: 22px;
          border: 1px solid var(--slate-200);
          padding: 28px; position: relative; overflow: hidden;
          transition: transform .25s, box-shadow .25s;
        }
        .feat-card:hover { transform: translateY(-6px); box-shadow: var(--shadow-hover); }
        .feat-card::after {
          content: ''; position: absolute; bottom: 0; left: 0; right: 0;
          height: 3px; background: var(--accent-color, #10b981);
          transform: scaleX(0); transition: transform .25s;
          transform-origin: left;
        }
        .feat-card:hover::after { transform: scaleX(1); }
        .feat-icon-wrap {
          width: 52px; height: 52px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 20px;
        }
        .feat-title { font-weight: 700; font-size: 17px; color: var(--slate-900); margin-bottom: 8px; }
        .feat-desc { font-size: 14px; color: var(--slate-500); line-height: 1.65; }

        /* ── DOCTORS ── */
        .doctors-bg { background: white; border-top: 1px solid var(--slate-200); }
        .doctors-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 48px; }
        .doctors-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 20px; }
        .doctor-card {
          background: white; border-radius: 22px;
          border: 1px solid var(--slate-200);
          padding: 24px; position: relative;
          transition: transform .25s, box-shadow .25s;
          cursor: pointer;
        }
        .doctor-card:hover { transform: translateY(-6px); box-shadow: var(--shadow-hover); }
        .doctor-tag {
          position: absolute; top: 16px; right: 16px;
          font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
          background: var(--green-pale); color: var(--green);
          border: 1px solid #bbf7d0; border-radius: 50px; padding: 3px 10px;
        }
        .doctor-avatar {
          width: 64px; height: 64px; border-radius: 18px;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Fraunces', serif; font-size: 22px; font-weight: 700;
          margin-bottom: 16px;
        }
        .doctor-name { font-weight: 700; font-size: 15px; color: var(--slate-900); margin-bottom: 4px; }
        .doctor-spec { font-size: 13px; color: var(--slate-500); margin-bottom: 12px; }
        .doctor-meta { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--slate-500); margin-bottom: 4px; }
        .doctor-hosp { font-size: 12px; color: var(--slate-500); display: flex; align-items: center; gap: 6px; margin-bottom: 16px; }
        .doctor-footer { display: flex; align-items: center; justify-content: space-between; }
        .avail-badge {
          font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 50px;
          background: #dcfce7; color: #15803d;
        }
        .book-btn {
          font-size: 13px; font-weight: 600; color: var(--green);
          display: flex; align-items: center; gap: 4px;
          background: none; border: none; cursor: pointer;
          padding: 0; transition: gap .2s;
        }
        .book-btn:hover { gap: 8px; }

        /* ── HOSPITALS ── */
        .hospitals-bg { background: #f8fafc; border-top: 1px solid var(--slate-200); }
        .hospitals-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; margin-top: 48px; }
        .hosp-card {
          background: white; border-radius: 20px;
          border: 1px solid var(--slate-200); padding: 24px;
          display: flex; align-items: flex-start; gap: 18px;
          transition: transform .2s, box-shadow .2s;
        }
        .hosp-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-hover); }
        .hosp-logo {
          width: 52px; height: 52px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 14px; color: white;
          flex-shrink: 0; letter-spacing: 0.5px;
        }
        .hosp-name { font-weight: 700; font-size: 15px; color: var(--slate-900); margin-bottom: 4px; }
        .hosp-city { font-size: 12px; color: var(--slate-500); display: flex; align-items: center; gap: 4px; margin-bottom: 12px; }
        .hosp-stats { display: flex; gap: 16px; }
        .hosp-stat-item { font-size: 12px; }
        .hosp-stat-val { font-weight: 700; color: var(--slate-900); }
        .hosp-stat-lbl { color: var(--slate-500); }
        .verified-badge { display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; color: var(--green); margin-top: 10px; }

        /* ── TESTIMONIALS ── */
        .testi-bg { background: var(--slate-900); }
        .testi-inner { max-width: 800px; margin: 0 auto; text-align: center; }
        .testi-h { font-family: 'Fraunces', serif; font-size: 40px; font-weight: 700; color: white; margin-bottom: 56px; }
        .testi-h em { font-style: italic; color: #4ade80; }
        .testi-card { position: relative; min-height: 220px; }
        .testi-slide {
          position: absolute; inset: 0;
          opacity: 0; transform: translateY(16px);
          transition: opacity .5s, transform .5s;
          pointer-events: none;
        }
        .testi-slide.active { opacity: 1; transform: translateY(0); pointer-events: auto; }
        .testi-quote { font-size: 20px; color: #e2e8f0; line-height: 1.65; margin-bottom: 32px; font-style: italic; }
        .testi-author { display: flex; align-items: center; justify-content: center; gap: 14px; }
        .testi-avatar {
          width: 48px; height: 48px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 15px; color: white;
        }
        .testi-name { font-weight: 700; color: white; font-size: 15px; }
        .testi-role { font-size: 13px; color: #94a3b8; margin-top: 2px; }
        .testi-dots { display: flex; justify-content: center; gap: 8px; margin-top: 40px; }
        .testi-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #334155; cursor: pointer;
          transition: background .3s, transform .3s;
        }
        .testi-dot.active { background: #4ade80; transform: scale(1.3); }

        /* ── HOW IT WORKS ── */
        .hiw-bg { background: white; border-top: 1px solid var(--slate-200); }
        .hiw-steps { display: grid; grid-template-columns: repeat(4,1fr); gap: 0; margin-top: 64px; position: relative; }
        .hiw-steps::before {
          content: ''; position: absolute; top: 30px; left: 10%; right: 10%;
          height: 1px; background: linear-gradient(to right, transparent, var(--slate-200) 20%, var(--slate-200) 80%, transparent);
          z-index: 0;
        }
        .hiw-step { text-align: center; padding: 0 20px; position: relative; z-index: 1; }
        .hiw-num {
          width: 60px; height: 60px; border-radius: 50%;
          background: var(--green-pale); border: 2px solid #bbf7d0;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 20px;
          font-family: 'Fraunces', serif; font-size: 22px; font-weight: 700; color: var(--green);
        }
        .hiw-title { font-weight: 700; font-size: 16px; color: var(--slate-900); margin-bottom: 8px; }
        .hiw-desc { font-size: 13px; color: var(--slate-500); line-height: 1.65; }

        /* ── CTA BANNER ── */
        .cta-bg {
          background: linear-gradient(135deg, #064e3b 0%, #15803d 50%, #166534 100%);
          padding: 80px 24px;
        }
        .cta-inner { max-width: 700px; margin: 0 auto; text-align: center; }
        .cta-h { font-family: 'Fraunces', serif; font-size: 48px; font-weight: 800; color: white; line-height: 1.1; margin-bottom: 16px; letter-spacing: -1px; }
        .cta-h em { font-style: italic; color: #86efac; }
        .cta-sub { font-size: 17px; color: #d1fae5; margin-bottom: 40px; line-height: 1.65; }
        .cta-actions { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
        .cta-btn-white {
          display: inline-flex; align-items: center; gap: 8px;
          background: white; color: #16a34a;
          font-size: 16px; font-weight: 700;
          padding: 14px 32px; border-radius: 14px;
          text-decoration: none;
          box-shadow: 0 4px 16px rgba(0,0,0,0.15);
          transition: transform .2s, box-shadow .2s;
        }
        .cta-btn-white:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.2); }
        .cta-btn-outline {
          display: inline-flex; align-items: center; gap: 8px;
          background: transparent; color: white;
          font-size: 16px; font-weight: 600;
          padding: 14px 32px; border-radius: 14px;
          border: 1.5px solid rgba(255,255,255,0.4);
          text-decoration: none;
          transition: background .2s, border-color .2s;
        }
        .cta-btn-outline:hover { background: rgba(255,255,255,0.1); border-color: white; }

        /* ── FOOTER ── */
        .footer { background: #0f172a; padding: 72px 24px 32px; }
        .footer-inner { max-width: 1200px; margin: 0 auto; }
        .footer-grid { display: grid; grid-template-columns: 1.6fr 1fr 1fr 1.2fr; gap: 48px; margin-bottom: 56px; }
        .footer-brand-text { font-size: 14px; color: #94a3b8; line-height: 1.7; margin-top: 12px; max-width: 260px; }
        .footer-h { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #e2e8f0; margin-bottom: 20px; }
        .footer-links { list-style: none; }
        .footer-links li { margin-bottom: 12px; }
        .footer-links a { font-size: 14px; color: #94a3b8; text-decoration: none; transition: color .2s; }
        .footer-links a:hover { color: #4ade80; }
        .footer-contact-item { display: flex; align-items: flex-start; gap: 10px; font-size: 14px; color: #94a3b8; margin-bottom: 12px; }
        .footer-divider { border: none; border-top: 1px solid #1e293b; margin-bottom: 28px; }
        .footer-bottom { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
        .footer-copy { font-size: 13px; color: #475569; }
        .footer-legal { display: flex; gap: 24px; }
        .footer-legal a { font-size: 13px; color: #475569; text-decoration: none; transition: color .2s; }
        .footer-legal a:hover { color: #e2e8f0; }

        /* ── RESPONSIVE ── */
        @media (max-width: 1024px) {
          .hero-grid { grid-template-columns: 1fr; }
          .hero-visual { display: none; }
          .features-grid { grid-template-columns: repeat(2,1fr); }
          .doctors-grid { grid-template-columns: repeat(2,1fr); }
          .hospitals-grid { grid-template-columns: repeat(2,1fr); }
          .footer-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 640px) {
          .hero-h1 { font-size: 40px; }
          .section-h2 { font-size: 32px; }
          .specialties-grid { grid-template-columns: repeat(3,1fr); }
          .features-grid { grid-template-columns: 1fr; }
          .doctors-grid { grid-template-columns: 1fr; }
          .hospitals-grid { grid-template-columns: 1fr; }
          .hiw-steps { grid-template-columns: repeat(2,1fr); }
          .hiw-steps::before { display: none; }
          .footer-grid { grid-template-columns: 1fr; }
          .nav-links { display: none; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

        {/* ── NAV ── */}
        <nav className="nav">
          <div className="nav-inner">
            <Link to="/" className="nav-logo">
              <Activity size={28} color="#16a34a" />
              <span className="nav-logo-text">HealthCare</span>
            </Link>
            <div className="nav-links">
              <a href="#features">Features</a>
              <a href="#doctors">Doctors</a>
              <a href="#hospitals">Hospitals</a>
              <a href="#about">About</a>
              <a href="#contact">Contact</a>
            </div>
            <div className="nav-actions">
              <Link to="/login" className="btn-ghost">Log In</Link>
              <Link to="/register" className="btn-primary">
                Sign Up <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section style={{ background: 'white' }}>
          <div className="hero">
            <div className="hero-grid">
              <div>
                <div className="hero-badge">
                  <span className="hero-badge-dot" />
                  Modern Healthcare Platform
                </div>
                <h1 className="hero-h1">Your Health,<br /><em>Simplified.</em></h1>
                <p className="hero-sub">
                  Book appointments with top doctors, manage your medical history, and get AI-powered health recommendations — all in one secure platform.
                </p>
                <div className="hero-ctas">
                  <Link to="/register" className="btn-primary-lg">
                    Get Started <ArrowRight size={18} />
                  </Link>
                  <a href="#doctors" className="btn-outline-lg">
                    <Play size={16} /> Browse Doctors
                  </a>
                </div>
                <div className="hero-stats" ref={statsRef}>
                  <StatItem value={500}  suffix="+"  label="Verified Doctors"  started={statsVisible} />
                  <StatItem value={10}   suffix="k+" label="Happy Patients"    started={statsVisible} />
                  <StatItem value={4.9}  suffix="/5" label="Average Rating"    started={false} />
                </div>
              </div>

              <div className="hero-visual">
                {/* Floating Chip 1 */}
                <div className="floating-chip">
                  <div className="chip-avatar">AK</div>
                  <div>
                    <div className="chip-name">Dr. Ananya Krishnan</div>
                    <div className="chip-sub">Available · Today 3:00 PM</div>
                  </div>
                </div>

                {/* Floating Chip 2 */}
                <div className="floating-chip2">
                  <div className="chip2-inner">
                    <div className="chip2-dot" />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#15803d' }}>
                      142 patients seen today
                    </span>
                  </div>
                </div>

                <div className="hero-card">
                  <div className="hero-card-header">
                    <div className="hero-card-icon">
                      <Activity size={22} color="#16a34a" />
                    </div>
                    <div>
                      <div className="hero-card-title">Quick Booking</div>
                      <div className="hero-card-sub">Find the right doctor in seconds</div>
                    </div>
                  </div>
                  {[
                    { Icon: Calendar, t: 'Easy Scheduling',    d: 'Book slots instantly' },
                    { Icon: Shield,   t: 'Secure Records',     d: 'Your data is protected' },
                    { Icon: Clock,    t: '24/7 Support',       d: 'Always here to help' },
                    { Icon: Zap,      t: 'AI Recommendations', d: 'Personalised health tips' },
                  ].map(({ Icon, t, d }) => (
                    <div className="feature-row" key={t}>
                      <div className="feature-icon"><Icon size={18} color="#16a34a" /></div>
                      <div>
                        <div className="feature-row-title">{t}</div>
                        <div className="feature-row-desc">{d}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SPECIALTIES ── */}
        <section className="section specialties-bg" id="specialties">
          <div className="section-inner">
            <div className="section-tag">Browse by Specialty</div>
            <h2 className="section-h2">Find <em>care</em> in every field</h2>
            <div className="specialties-grid">
              {SPECIALTIES.map(({ icon: Icon, label, color, bg }) => (
                <div className="spec-card" key={label}
                  style={{ background: bg, borderColor: bg }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = color}
                  onMouseLeave={e => e.currentTarget.style.borderColor = bg}
                >
                  <div className="spec-icon" style={{ background: 'white' }}>
                    <Icon size={24} color={color} />
                  </div>
                  <div className="spec-label" style={{ color }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section className="section features-bg" id="features">
          <div className="section-inner">
            <div className="section-tag">Why HealthCare</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 24 }}>
              <div>
                <h2 className="section-h2">Everything you need,<br /><em>nothing you don't</em></h2>
              </div>
              <p className="section-sub">
                A platform built for patients who want clarity, security, and speed — and doctors who want to focus on care, not paperwork.
              </p>
            </div>
            <div className="features-grid">
              {FEATURES.map(({ icon: Icon, title, desc, color }) => (
                <div className="feat-card" key={title} style={{ '--accent-color': color }}>
                  <div className="feat-icon-wrap" style={{ background: color + '18' }}>
                    <Icon size={22} color={color} />
                  </div>
                  <div className="feat-title">{title}</div>
                  <div className="feat-desc">{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="section hiw-bg">
          <div className="section-inner">
            <div style={{ textAlign: 'center', marginBottom: 0 }}>
              <div className="section-tag" style={{ justifyContent: 'center' }}>Simple Process</div>
              <h2 className="section-h2" style={{ textAlign: 'center' }}>Up and running in <em>4 steps</em></h2>
            </div>
            <div className="hiw-steps">
              {[
                { n: '1', t: 'Create Account',   d: 'Sign up in under a minute with your email or phone number.' },
                { n: '2', t: 'Find a Doctor',    d: 'Search by specialty, location, rating, or availability.' },
                { n: '3', t: 'Book a Slot',      d: 'Pick a time that suits you — in-clinic or video call.' },
                { n: '4', t: 'Get Care',         d: 'Attend your appointment and access records instantly after.' },
              ].map(({ n, t, d }) => (
                <div className="hiw-step" key={n}>
                  <div className="hiw-num">{n}</div>
                  <div className="hiw-title">{t}</div>
                  <div className="hiw-desc">{d}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── DOCTORS ── */}
        <section className="section doctors-bg" id="doctors">
          <div className="section-inner">
            <div className="doctors-header">
              <div>
                <div className="section-tag">Our Doctors</div>
                <h2 className="section-h2">Meet our <em>top specialists</em></h2>
              </div>
              <a href="#" style={{ display:'flex', alignItems:'center', gap:6, color:'var(--green)', fontWeight:600, fontSize:15, textDecoration:'none' }}>
                View all doctors <ChevronRight size={16} />
              </a>
            </div>
            <div className="doctors-grid">
              {DOCTORS.map(d => (
                <div className="doctor-card" key={d.name}>
                  <div className="doctor-tag">{d.tag}</div>
                  <div className="doctor-avatar" style={{ background: d.bg, color: d.color }}>{d.img}</div>
                  <div className="doctor-name">{d.name}</div>
                  <div className="doctor-spec">{d.specialty}</div>
                  <div className="doctor-meta">
                    <Stars rating={d.rating} />
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>{d.rating}</span>
                    <span>({d.reviews} reviews)</span>
                  </div>
                  <div className="doctor-hosp">
                    <Building2 size={12} />
                    {d.hospital} · {d.exp} exp
                  </div>
                  <div className="doctor-footer">
                    <span className="avail-badge">Available {d.available}</span>
                    <button className="book-btn">
                      Book <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOSPITALS ── */}
        <section className="section hospitals-bg" id="hospitals">
          <div className="section-inner">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 24, marginBottom: 0 }}>
              <div>
                <div className="section-tag">Partner Hospitals</div>
                <h2 className="section-h2">Trusted by India's <em>finest</em> institutions</h2>
              </div>
              <p className="section-sub" style={{ marginBottom: 0 }}>
                We partner exclusively with accredited hospitals and clinics committed to the highest standards of care.
              </p>
            </div>
            <div className="hospitals-grid">
              {HOSPITALS.map(h => (
                <div className="hosp-card" key={h.name}>
                  <div className="hosp-logo" style={{ background: h.color }}>{h.abbr}</div>
                  <div style={{ flex: 1 }}>
                    <div className="hosp-name">{h.name}</div>
                    <div className="hosp-city">
                      <MapPin size={12} color="#94a3b8" /> {h.city}
                    </div>
                    <div className="hosp-stats">
                      <div className="hosp-stat-item">
                        <span className="hosp-stat-val">{h.beds}</span>
                        <span className="hosp-stat-lbl"> beds</span>
                      </div>
                      <div className="hosp-stat-item">
                        <span className="hosp-stat-lbl">Est. </span>
                        <span className="hosp-stat-val">{h.since}</span>
                      </div>
                    </div>
                    <div className="verified-badge">
                      <CheckCircle size={12} /> Verified Partner
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section className="section testi-bg" id="about">
          <div className="section-inner">
            <div className="testi-inner">
              <h2 className="testi-h">Real stories from <em>real patients</em></h2>
              <div className="testi-card" style={{ minHeight: 220 }}>
                {TESTIMONIALS.map((t, i) => (
                  <div className={`testi-slide${i === activeTesti ? ' active' : ''}`} key={i}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                      <Quote size={28} color="#4ade80" />
                    </div>
                    <p className="testi-quote">"{t.text}"</p>
                    <div className="testi-author">
                      <div className="testi-avatar" style={{ background: t.color }}>{t.initials}</div>
                      <div style={{ textAlign: 'left' }}>
                        <div className="testi-name">{t.author}</div>
                        <div className="testi-role">{t.role}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="testi-dots">
                {TESTIMONIALS.map((_, i) => (
                  <div
                    key={i}
                    className={`testi-dot${i === activeTesti ? ' active' : ''}`}
                    onClick={() => setActiveTesti(i)}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="cta-bg">
          <div className="cta-inner">
            <h2 className="cta-h">Start your <em>health journey</em> today</h2>
            <p className="cta-sub">
              Join over 10,000 patients who have already taken control of their health. Sign up free — it takes less than 60 seconds.
            </p>
            <div className="cta-actions">
              <Link to="/register" className="cta-btn-white">
                Create Free Account <ArrowRight size={16} />
              </Link>
              <a href="#doctors" className="cta-btn-outline">
                <Stethoscope size={16} /> Find a Doctor
              </a>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="footer" id="contact">
          <div className="footer-inner">
            <div className="footer-grid">
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <Activity size={24} color="#4ade80" />
                  <span style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:700, color:'white' }}>HealthCare</span>
                </div>
                <p className="footer-brand-text">
                  Making quality healthcare accessible, simple, and secure for everyone across India.
                </p>
              </div>

              <div>
                <div className="footer-h">Quick Links</div>
                <ul className="footer-links">
                  {['Home','Features','About Us','Contact'].map(l => (
                    <li key={l}><a href="#">{l}</a></li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="footer-h">Services</div>
                <ul className="footer-links">
                  {['Find a Doctor','Book Appointment','Video Consultation','Health Records','AI Health Tips'].map(l => (
                    <li key={l}><a href="#">{l}</a></li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="footer-h">Contact Us</div>
                <div className="footer-contact-item"><MapPin size={14} color="#4ade80" style={{flexShrink:0,marginTop:2}} />123 Health Avenue, Medical City, Bengaluru 560001</div>
                <div className="footer-contact-item"><Phone size={14} color="#4ade80" style={{flexShrink:0}} />+91 80 1234 5678</div>
                <div className="footer-contact-item"><Mail size={14} color="#4ade80" style={{flexShrink:0}} />support@healthcare.com</div>
              </div>
            </div>

            <hr className="footer-divider" />
            <div className="footer-bottom">
              <p className="footer-copy">© {new Date().getFullYear()} HealthCare Platform. All rights reserved.</p>
              <div className="footer-legal">
                <a href="#">Privacy Policy</a>
                <a href="#">Terms of Service</a>
              </div>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}