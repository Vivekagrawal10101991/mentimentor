import { useState } from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Star,
  ShieldCheck,
  Brain,
  BookOpen,
  BadgeCheck,
  Zap,
  Users,
  IndianRupee,
  ChevronRight,
  Menu,
  X,
  Quote,
} from "lucide-react";
import { AuthNavLink } from "@/components/AuthNavLink";
import { Logo } from "@/components/Logo";
import { getStoredAccessToken } from "@/lib/sessionUser";

const BLUE = "#243B8F";
const DARK = "#101A5C";

// ── Curated Unsplash photo URLs ──────────────────────────────────────────────
const PHOTOS = {
  heroMain:      "https://images.unsplash.com/photo-1583468991267-3f068b607ae1?w=900&h=1000&fit=crop&auto=format&q=85",
  heroOnline:    "https://images.unsplash.com/photo-1616587226960-4a03badbe8bf?w=340&h=220&fit=crop&auto=format&q=80",
  howBanner:     "https://images.unsplash.com/photo-1589206946274-929e4da3996b?w=1400&h=500&fit=crop&auto=format&q=85",
  whySplit:      "https://images.unsplash.com/photo-1561346745-5db62ae43861?w=800&h=900&fit=crop&auto=format&q=85",
  trustBg:       "https://images.unsplash.com/photo-1580894732930-0babd100d356?w=1400&h=600&fit=crop&auto=format&q=75",
  statsBg:       "https://images.unsplash.com/photo-1529390079861-591de354faf5?w=1400&h=500&fit=crop&auto=format&q=75",
  t1Avatar:      "https://images.unsplash.com/photo-1573496800808-56566a492b63?w=80&h=80&fit=crop&auto=format&q=80",
  t2Avatar:      "https://images.unsplash.com/photo-1638030195605-e38e33f3a083?w=80&h=80&fit=crop&auto=format&q=80",
  t3Avatar:      "https://images.unsplash.com/photo-1586985564150-11ee04838034?w=80&h=80&fit=crop&auto=format&q=80",
};

const navLinks: { label: string; to: string; requireAuth?: boolean }[] = [
  { label: "Find a Mentor", to: "/search", requireAuth: true },
  { label: "How It Works", to: "#how-it-works" },
  { label: "Become a Mentor", to: "/profiles/mentor", requireAuth: true },
  { label: "Resources", to: "#resources" },
  { label: "About Us", to: "#about" },
];

const howSteps = [
  { num: "01", title: "Tell us what you need", desc: "Subject, level, goals, preferred timing and learning style. Takes less than 2 minutes." },
  { num: "02", title: "Choose your mentors", desc: "Compare verified mentors by rating, qualification, price and experience. Prioritize up to 5." },
  { num: "03", title: "We find the right match", desc: "Requests go to your selected mentors. The first suitable mentor who accepts gets assigned." },
  { num: "04", title: "Learn 1:1", desc: "Start sessions, track progress and continue growing with your mentor over time." },
];

const trustIndicators = [
  { icon: BadgeCheck, label: "Qualification Verified" },
  { icon: Brain, label: "Knowledge Assessed" },
  { icon: BookOpen, label: "Teaching & Pedagogy Assessed" },
  { icon: ShieldCheck, label: "Identity Verified" },
];

const subjects = [
  "Mathematics", "Physics", "Chemistry", "Biology", "Coding",
  "English", "Music", "Art", "Languages", "Fitness", "History", "Geography",
];

const testimonials = [
  {
    quote: "My daughter's JEE rank improved by 8,000 positions in 4 months. The mentor mentimentor matched was exactly what she needed.",
    name: "Priya Sharma",
    role: "Parent, JEE Aspirant",
    subject: "Chemistry",
    avatar: PHOTOS.t1Avatar,
  },
  {
    quote: "I was learning guitar from random YouTube videos. Having a real mentor who adjusts to my pace made all the difference.",
    name: "Arjun Mehta",
    role: "Student, Age 16",
    subject: "Music",
    avatar: PHOTOS.t2Avatar,
  },
  {
    quote: "As a parent, the verification process gave me the confidence I needed before letting someone teach my child at home.",
    name: "Sunita Reddy",
    role: "Parent",
    subject: "Mathematics",
    avatar: PHOTOS.t3Avatar,
  },
];

const mentors = [
  { name: "Dr. Anita Verma", qual: "Ph.D. Organic Chemistry", college: "IIT Delhi", exp: "8 years", rating: 4.9, reviews: 127, subjects: ["Chemistry", "JEE Prep"], rate: 600, available: "Today" },
  { name: "Vikram Singh", qual: "M.Sc. Mathematics", college: "IIT Bombay", exp: "5 years", rating: 4.8, reviews: 89, subjects: ["Mathematics", "Statistics"], rate: 500, available: "Tomorrow" },
  { name: "Priya Nair", qual: "B.Tech Computer Science", college: "NIT Trichy", exp: "4 years", rating: 4.7, reviews: 63, subjects: ["Coding", "Python", "DSA"], rate: 450, available: "Today" },
];

const stats = [
  { value: "500+", label: "Verified Mentors", accent: true },
  { value: "20+", label: "Learning Categories", accent: false },
  { value: "1:1", label: "Personalised Sessions", accent: false },
  { value: "4.8+", label: "Average Mentor Rating", accent: true },
];

const features = [
  { num: "01", title: "Personalised Matching", desc: "We don't give you a random list. We understand your goal and match you to the right person." },
  { num: "02", title: "Verified Mentors", desc: "Every mentor passes our multi-layer verification — knowledge, pedagogy, and identity." },
  { num: "03", title: "Flexible Learning", desc: "Online, at the mentor's place, or at your home. Learn when and where suits you." },
  { num: "04", title: "Continuous Support", desc: "Track progress, get session notes and continue with the same mentor as long as it works." },
];

export function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<number | null>(null);
  const signedIn = !!getStoredAccessToken();

  return (
    <div className="min-h-screen bg-white font-[Manrope,sans-serif] overflow-x-hidden">

      {/* ───── NAVBAR ───── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-black/8">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="shrink-0"><Logo className="h-8 w-auto" /></Link>
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) =>
              link.requireAuth ? (
                <AuthNavLink
                  key={link.label}
                  to={link.to}
                  className="text-sm font-medium text-gray-600 hover:text-[#243B8F] transition-colors"
                >
                  {link.label}
                </AuthNavLink>
              ) : (
                <a
                  key={link.label}
                  href={link.to}
                  className="text-sm font-medium text-gray-600 hover:text-[#243B8F] transition-colors"
                >
                  {link.label}
                </a>
              )
            )}
          </div>
          <div className="hidden lg:flex items-center gap-3">
            {signedIn ? (
              <Link to="/profiles" className="text-sm font-semibold text-[#243B8F] hover:text-[#101A5C] flex items-center gap-1 transition-colors">
                My account <ArrowUpRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link to="/login" className="text-sm font-semibold text-[#243B8F] hover:text-[#101A5C] flex items-center gap-1 transition-colors">
                Login <ArrowUpRight className="w-4 h-4" />
              </Link>
            )}
            <AuthNavLink to="/search" className="px-5 py-2.5 bg-[#DFFF2F] text-[#101A5C] text-sm font-bold rounded-full hover:bg-[#d4f520] transition-colors">
              Find My Mentor
            </AuthNavLink>
          </div>
          <button className="lg:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            className="lg:hidden bg-white border-t border-black/8 px-6 py-4 space-y-4">
            {navLinks.map((link) =>
              link.requireAuth ? (
                <AuthNavLink
                  key={link.label}
                  to={link.to}
                  className="block text-sm font-medium text-gray-700 py-1"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </AuthNavLink>
              ) : (
                <a
                  key={link.label}
                  href={link.to}
                  className="block text-sm font-medium text-gray-700 py-1"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              )
            )}
            <div className="flex flex-col gap-3 pt-2">
              <AuthNavLink to="/search" className="w-full text-center px-5 py-3 bg-[#DFFF2F] text-[#101A5C] font-bold rounded-full text-sm" onClick={() => setMobileMenuOpen(false)}>
                Find My Mentor
              </AuthNavLink>
              <AuthNavLink to="/profiles/mentor" authPath="/signup" className="w-full text-center px-5 py-3 bg-[#101A5C] text-white font-bold rounded-full text-sm" onClick={() => setMobileMenuOpen(false)}>
                Become a Mentor
              </AuthNavLink>
            </div>
          </motion.div>
        )}
      </nav>

      {/* ───── HERO ───── */}
      <section className="relative min-h-screen pt-16 flex items-center overflow-hidden" style={{ backgroundColor: BLUE }}>
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }} />

        <div className="relative max-w-7xl mx-auto px-6 py-20 lg:py-24 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left: copy */}
            <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full text-white/80 text-xs font-semibold uppercase tracking-wider mb-8">
                <span className="w-1.5 h-1.5 bg-[#DFFF2F] rounded-full" />
                India's Capability-Verified Mentor Platform
              </div>
              <h1 className="text-4xl lg:text-6xl font-extrabold text-white leading-[1.1] mb-6">
                Not every student learns the{" "}
                <span className="text-[#DFFF2F]">same way.</span>{" "}
                So why should every student get the{" "}
                <span className="text-[#DFFF2F]">same tutor?</span>
              </h1>
              <p className="text-white/70 text-lg leading-relaxed mb-10 max-w-xl">
                mentimentor connects every learner with a verified mentor matched to their learning needs, goals, preferences and location.
              </p>
              <div className="flex flex-wrap gap-4">
                <AuthNavLink to="/search"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-[#DFFF2F] text-[#101A5C] font-bold text-base rounded-full hover:bg-[#d4f520] transition-all hover:gap-3 shadow-lg shadow-black/20">
                  Find Your Mentor <ArrowRight className="w-5 h-5" />
                </AuthNavLink>
                <AuthNavLink to="/profiles/mentor" authPath="/signup"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-[#101A5C] text-white font-bold text-base rounded-full hover:bg-black transition-all">
                  Become a Mentor <ArrowUpRight className="w-5 h-5" />
                </AuthNavLink>
              </div>
              <div className="flex flex-wrap gap-3 mt-10">
                {[
                  { icon: CheckCircle2, text: "Verified Mentor" },
                  { icon: Star, text: "4.9 Rating" },
                  { icon: Users, text: "1:1 Guidance" },
                  { icon: Zap, text: "Available Now" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="inline-flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full text-white text-xs font-semibold">
                    <Icon className="w-3.5 h-3.5 text-[#DFFF2F]" />
                    {text}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right: HD tutoring photo */}
            <motion.div initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="hidden lg:block relative">

              {/* Main photo */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-black/40" style={{ height: 520 }}>
                <img
                  src={PHOTOS.heroMain}
                  alt="One-to-one tutoring session"
                  className="w-full h-full object-cover"
                />
                {/* Subtle blue tint overlay */}
                <div className="absolute inset-0 bg-[#243B8F]/15" />

                {/* Floating badge — top right */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 }}
                  className="absolute top-5 right-5 flex items-center gap-2 px-4 py-2.5 bg-[#DFFF2F] rounded-full shadow-lg">
                  <CheckCircle2 className="w-4 h-4 text-[#101A5C]" />
                  <span className="text-[#101A5C] font-bold text-sm">Verified Mentor</span>
                </motion.div>

                {/* Floating rating badge — bottom left */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.85 }}
                  className="absolute bottom-5 left-5 bg-white rounded-2xl p-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#243B8F] rounded-xl flex items-center justify-center shrink-0">
                      <span className="text-white font-bold">A</span>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">Dr. Anita Verma</p>
                      <p className="text-xs text-gray-500">IIT Delhi · Chemistry</p>
                    </div>
                    <div className="ml-4 text-right">
                      <p className="text-sm font-extrabold text-[#243B8F]">★ 4.9</p>
                      <p className="text-xs text-gray-400">127 reviews</p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Small online session card */}
              <motion.div
                initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.0 }}
                className="absolute -right-6 top-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl overflow-hidden w-44">
                <img src={PHOTOS.heroOnline} alt="Online tutoring" className="w-full h-28 object-cover" />
                <div className="p-3">
                  <p className="text-xs font-bold text-[#101A5C]">Online Session</p>
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-[#27AE60] rounded-full inline-block" />
                    Live now
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ───── HOW IT WORKS ───── */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16">
            <p className="text-[#101A5C] bg-[#DFFF2F] inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">How It Works</p>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-[#101A5C] leading-tight max-w-2xl">
              The right mentor changes everything.
            </h2>
          </motion.div>

          <div className="grid lg:grid-cols-4 gap-6 mb-16">
            {howSteps.map((step, i) => (
              <motion.div key={step.num}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="bg-[#F6F7F2] rounded-2xl p-6 border border-transparent hover:border-[#243B8F]/20 hover:shadow-md transition-all group">
                <div className="text-5xl font-extrabold text-[#243B8F]/15 mb-4 group-hover:text-[#DFFF2F] transition-colors leading-none"
                  style={{ WebkitTextStroke: "2px #243B8F" }}>
                  {step.num}
                </div>
                <h3 className="font-bold text-[#101A5C] text-lg mb-3">{step.title}</h3>
                <p className="text-[#626262] text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* ── Full-width photo banner ── */}
          <motion.div
            initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden" style={{ height: 380 }}>
            <img src={PHOTOS.howBanner} alt="Mentor guiding student through a lesson" className="w-full h-full object-cover" />
            {/* Gradient overlay with text */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#101A5C]/85 via-[#101A5C]/50 to-transparent" />
            <div className="absolute inset-0 flex items-center px-12">
              <div className="max-w-lg">
                <p className="text-[#DFFF2F] text-xs font-bold uppercase tracking-wider mb-3">Real 1:1 sessions</p>
                <h3 className="text-3xl font-extrabold text-white mb-4 leading-tight">
                  Every session is personal.<br />Every lesson is yours.
                </h3>
                <p className="text-white/70 text-base leading-relaxed">
                  No recorded videos. No group classes. Just you, your mentor, and a focused hour of learning designed exactly around your needs.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ───── MENTOR DISCOVERY ───── */}
      <section className="py-24 bg-[#F6F7F2]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-4">
            <h2 className="text-4xl lg:text-5xl font-extrabold text-[#101A5C] leading-tight">Don't settle for a random tutor.</h2>
            <p className="text-xl text-[#626262] mt-3 font-medium">Compare. Choose. Prioritize. Learn.</p>
          </motion.div>

          <div className="mt-12 space-y-4">
            {mentors.map((mentor, i) => (
              <motion.div key={mentor.name}
                initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                onClick={() => setSelectedMentor(selectedMentor === i ? null : i)}
                className={`bg-white rounded-2xl p-5 border-2 transition-all cursor-pointer ${selectedMentor === i ? "border-[#DFFF2F] shadow-lg" : "border-transparent hover:border-[#243B8F]/15 hover:shadow-md"}`}>
                <div className="flex items-center gap-5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0 ${selectedMentor === i ? "bg-[#DFFF2F] text-[#101A5C]" : "bg-[#F6F7F2] text-[#243B8F]"}`}>
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="w-14 h-14 bg-[#243B8F] rounded-xl flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-xl">{mentor.name[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-gray-900">{mentor.name}</p>
                      <BadgeCheck className="w-4 h-4 text-[#243B8F]" />
                    </div>
                    <p className="text-sm text-[#626262]">{mentor.qual} · {mentor.college} · {mentor.exp} experience</p>
                  </div>
                  <div className="hidden md:flex gap-2 shrink-0">
                    {mentor.subjects.map((s) => (
                      <span key={s} className="px-2.5 py-1 bg-[#243B8F]/8 text-[#243B8F] rounded-full text-xs font-semibold">{s}</span>
                    ))}
                  </div>
                  <div className="text-center shrink-0 hidden lg:block">
                    <p className="text-lg font-extrabold text-[#101A5C]">★ {mentor.rating}</p>
                    <p className="text-xs text-[#626262]">{mentor.reviews} reviews</p>
                  </div>
                  <div className="text-center shrink-0">
                    <p className="text-lg font-extrabold text-[#101A5C] flex items-center gap-0.5">
                      <IndianRupee className="w-4 h-4" />{mentor.rate}
                    </p>
                    <p className="text-xs text-[#626262]">per hour</p>
                  </div>
                  <AuthNavLink to="/search" onClick={(e) => e.stopPropagation()}
                    className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all shrink-0 ${selectedMentor === i ? "bg-[#DFFF2F] text-[#101A5C] hover:bg-[#d4f520]" : "bg-[#101A5C] text-white hover:bg-[#243B8F]"}`}>
                    {selectedMentor === i ? "Selected ✓" : "Select →"}
                  </AuthNavLink>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <AuthNavLink to="/search" className="inline-flex items-center gap-2 px-8 py-4 bg-[#243B8F] text-white font-bold rounded-full hover:bg-[#101A5C] transition-colors">
              Browse All Mentors <ArrowRight className="w-5 h-5" />
            </AuthNavLink>
          </div>
        </div>
      </section>

      {/* ───── TRUST ───── */}
      <section className="relative py-24 overflow-hidden">
        {/* HD photo with heavy dark overlay */}
        <img src={PHOTOS.trustBg} alt="" className="absolute inset-0 w-full h-full object-cover" aria-hidden />
        <div className="absolute inset-0 bg-[#101A5C]/92" />

        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-white mb-4">Every mentor earns their place.</h2>
            <p className="text-white/65 text-lg max-w-2xl mx-auto mb-16">
              Verified for capability. Screened for responsibility. Accountable to every learner.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trustIndicators.map(({ icon: Icon, label }, i) => (
              <motion.div key={label}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/8 backdrop-blur-sm border border-white/12 rounded-2xl p-8 text-center">
                <div className="w-14 h-14 bg-[#DFFF2F] rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <Icon className="w-7 h-7 text-[#101A5C]" />
                </div>
                <p className="text-white font-bold text-base">{label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── WHY MENTIMENTOR — true photo split ───── */}
      <section className="py-0 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 min-h-[640px]">

            {/* Left: HD photo */}
            <motion.div
              initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="relative">
              <img src={PHOTOS.whySplit} alt="Mentor coaching student at computer" className="w-full h-full object-cover min-h-[400px]" />
              {/* Lime accent badge */}
              <div className="absolute bottom-8 left-8 bg-[#DFFF2F] rounded-2xl px-5 py-3 shadow-xl">
                <p className="text-[#101A5C] font-extrabold text-lg">4.8★</p>
                <p className="text-[#101A5C] text-xs font-semibold">Average mentor rating</p>
              </div>
            </motion.div>

            {/* Right: copy + features */}
            <motion.div
              initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="bg-white px-10 lg:px-16 py-20 flex flex-col justify-center">
              <p className="text-[#101A5C] bg-[#DFFF2F] inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-6 self-start">
                Why mentimentor
              </p>
              <h2 className="text-4xl font-extrabold text-[#101A5C] leading-tight mb-4">
                One student.{" "}
                <span className="text-[#243B8F]">One need.</span>{" "}
                One right mentor.
              </h2>
              <p className="text-[#626262] text-base leading-relaxed mb-10">
                Our platform is built around the belief that learning is deeply personal. We don't just find you a tutor — we find you the right person.
              </p>

              <div className="space-y-5">
                {features.map((f, i) => (
                  <motion.div key={f.num}
                    initial={{ opacity: 0, x: 16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="flex gap-4 p-5 bg-[#F6F7F2] rounded-xl hover:bg-[#243B8F]/5 transition-colors">
                    <div className="text-2xl font-extrabold text-[#243B8F]/20 shrink-0 leading-none mt-0.5">{f.num}</div>
                    <div>
                      <h3 className="font-bold text-[#101A5C] mb-1">{f.title}</h3>
                      <p className="text-[#626262] text-sm leading-relaxed">{f.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <AuthNavLink to="/search" authPath="/signup"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#DFFF2F] text-[#101A5C] font-bold rounded-full hover:bg-[#d4f520] transition-colors mt-10 self-start">
                Get Started <ArrowRight className="w-5 h-5" />
              </AuthNavLink>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ───── SUBJECTS ───── */}
      <section className="py-24 bg-[#F6F7F2]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-extrabold text-[#101A5C] mb-4">Learn what matters to you.</h2>
            <p className="text-[#626262] text-lg max-w-2xl mx-auto">
              From JEE preparation to guitar, coding to communication — find the right person to learn from.
            </p>
          </motion.div>
          <div className="flex flex-wrap justify-center gap-3">
            {subjects.map((subject) => (
              <AuthNavLink
                key={subject}
                to="/search"
                className="px-6 py-3 bg-white text-[#101A5C] font-semibold rounded-full border-2 border-transparent hover:border-[#243B8F] hover:bg-[#243B8F] hover:text-white transition-all shadow-sm"
              >
                {subject}
              </AuthNavLink>
            ))}
            <AuthNavLink to="/search" className="px-6 py-3 bg-[#DFFF2F] text-[#101A5C] font-bold rounded-full flex items-center gap-1 hover:bg-[#d4f520] transition-colors shadow-sm">
              More <ChevronRight className="w-4 h-4" />
            </AuthNavLink>
          </div>
        </div>
      </section>

      {/* ───── TESTIMONIALS ───── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-extrabold text-[#101A5C] max-w-3xl mx-auto">
              Learning feels different when someone learns{" "}
              <span className="text-[#243B8F]">with you.</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div key={t.name}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-8 border-2 border-[#101A5C]/10 hover:border-[#243B8F]/30 hover:shadow-xl transition-all flex flex-col">
                <Quote className="w-8 h-8 text-[#DFFF2F] mb-5 shrink-0" style={{ filter: "drop-shadow(0 0 0 #243B8F)" }} />
                <p className="text-[#111111] font-medium leading-relaxed mb-8 text-sm flex-1">
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-4 pt-6 border-t border-[#101A5C]/8">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-[#DFFF2F] ring-offset-2"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#101A5C] text-sm">{t.name}</p>
                    <p className="text-xs text-[#626262]">{t.role}</p>
                  </div>
                  <div>
                    <div className="flex gap-0.5 mb-1">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <span key={j} className="text-[#DFFF2F]" style={{ WebkitTextStroke: "0.5px #B8A000" }}>★</span>
                      ))}
                    </div>
                    <span className="px-2 py-0.5 bg-[#243B8F]/8 text-[#243B8F] rounded-full text-xs font-semibold">{t.subject}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── STATS — photo background ───── */}
      <section className="relative py-24 overflow-hidden">
        <img src={PHOTOS.statsBg} alt="" className="absolute inset-0 w-full h-full object-cover" aria-hidden />
        <div className="absolute inset-0" style={{ backgroundColor: DARK, opacity: 0.93 }} />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`, backgroundSize: "40px 40px" }}
        />
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <motion.div key={s.label}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center">
                <p className={`text-6xl font-extrabold mb-3 ${s.accent ? "text-[#DFFF2F]" : "text-white"}`}>{s.value}</p>
                <p className="text-white/60 font-medium">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── TRUST DIFFERENTIATORS (brief) ───── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-14 text-center">
            <h2 className="text-4xl lg:text-5xl font-extrabold text-[#101A5C] leading-tight">
              Not just a tutor. A mentor chosen for you.
            </h2>
            <p className="text-[#626262] text-lg mt-4 max-w-2xl mx-auto">
              Every mentor is assessed, verified and accountable — so every learner gets someone matched to their needs.
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {[
              { title: "Verified Mentors", desc: "Every mentor goes through our verification process." },
              { title: "Knowledge Tested", desc: "Mentors clear a domain-specific knowledge assessment before joining." },
              { title: "Child-Safe & Pedagogy Tested", desc: "Mentors are evaluated on how they handle real-life student situations." },
              { title: "Capability-Based Pricing", desc: "Mentors do not decide their own hourly rates. MentiMentor determines the recommended rate." },
              { title: "Continuous Rating", desc: "Initial ratings combine with real student feedback as mentors gain experience." },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="rounded-2xl bg-[#F6F7F2] p-6 border border-transparent hover:border-[#243B8F]/20"
              >
                <h3 className="font-bold text-[#101A5C] mb-2">{card.title}</h3>
                <p className="text-sm text-[#626262] leading-relaxed">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── WHY MENTORS DON'T SET PRICE ───── */}
      <section className="py-24 bg-[#F6F7F2]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-extrabold text-[#101A5C] mb-4">
            Why don’t mentors decide their own price?
          </h2>
          <p className="text-[#626262] text-lg mb-10">
            Your mentor’s rate is not based on what they choose to charge.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {["Qualification", "Experience", "Institution", "Knowledge", "Pedagogy", "Verification", "Student Feedback"].map((item) => (
              <span key={item} className="px-4 py-2 rounded-full bg-white text-[#243B8F] text-sm font-semibold border border-[#243B8F]/15">
                {item}
              </span>
            ))}
          </div>
          <div className="inline-flex flex-col items-center rounded-3xl bg-[#101A5C] px-10 py-8 text-white shadow-xl">
            <p className="text-[#DFFF2F] text-xs font-bold uppercase tracking-wider mb-2">MentiMentor Recommended Rate</p>
            <p className="text-2xl font-extrabold">Fair pricing. Verified capability. No random rates.</p>
          </div>
        </div>
      </section>

      {/* ───── COMPARISON ───── */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-4xl font-extrabold text-[#101A5C] text-center mb-12">
            Your child deserves more than a random tutor.
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-200 p-8">
              <h3 className="font-bold text-slate-500 mb-4">Traditional Tutor Marketplace</h3>
              <ul className="space-y-3 text-sm text-[#626262]">
                {["Tutor chooses price", "Limited verification", "Variable quality", "No standardized assessment", "Unknown teaching approach"].map((t) => (
                  <li key={t} className="flex gap-2"><span className="text-rose-400">×</span>{t}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border-2 border-[#DFFF2F] bg-[#101A5C] p-8 text-white">
              <h3 className="font-bold text-[#DFFF2F] mb-4">MentiMentor</h3>
              <ul className="space-y-3 text-sm text-white/80">
                {["Capability assessed", "Identity verified", "Pedagogy assessed", "Transparent recommended pricing", "Continuous student feedback", "Verified mentor matching"].map((t) => (
                  <li key={t} className="flex gap-2"><span className="text-[#DFFF2F]">✓</span>{t}</li>
                ))}
              </ul>
              <p className="mt-8 font-extrabold text-white">Every mentor earns their place.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ───── FINAL CTA ───── */}
      <section className="py-28 relative overflow-hidden" style={{ backgroundColor: BLUE }}>
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }} />
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight">
              Your learning is personal.{" "}
              <span className="text-[#DFFF2F]">Your mentor should be too.</span>
            </h2>
            <p className="text-white/65 text-lg mb-12 leading-relaxed">
              Tell us what you want to learn. We'll help you find someone who can walk the journey with you.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <AuthNavLink to="/search"
                className="inline-flex items-center gap-2 px-10 py-4 bg-[#DFFF2F] text-[#101A5C] font-extrabold text-base rounded-full hover:bg-[#d4f520] transition-all shadow-xl shadow-black/30">
                Find Your Mentor <ArrowRight className="w-5 h-5" />
              </AuthNavLink>
              <AuthNavLink to="/profiles/mentor" authPath="/signup"
                className="inline-flex items-center gap-2 px-10 py-4 bg-[#101A5C] text-white font-bold text-base rounded-full hover:bg-black transition-all">
                Become a Mentor <ArrowUpRight className="w-5 h-5" />
              </AuthNavLink>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ───── FOOTER ───── */}
      <footer className="bg-[#101A5C] py-12 border-t border-white/8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Logo className="h-7 w-auto" variant="white" />
            <div className="flex flex-wrap justify-center gap-6 text-sm text-white/50">
              <span className="hover:text-white transition-colors">Privacy Policy</span>
              <span className="hover:text-white transition-colors">Terms of Service</span>
              <span className="hover:text-white transition-colors">Safety Policy</span>
              <Link to="/admin/login" className="hover:text-white transition-colors">Admin</Link>
            </div>
            <p className="text-white/40 text-xs">© 2026 mentimentor · Made in India</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
