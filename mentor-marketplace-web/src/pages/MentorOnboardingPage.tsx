import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";
import { normalizeApiError } from "@/lib/apiError";
import { getStoredAccessToken } from "@/lib/sessionUser";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { endpoints, httpClient } from "@/services/api";
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  CheckCircle2,
  Star,
  Shield,
  FileText,
  Camera,
  MapPin,
  Phone,
  Mail,
  Calendar,
  BookOpen,
  Music,
  Dumbbell,
  Code2,
  Palette,
  Languages,
  Trophy,
  Brain,
  CheckCheck,
  Clock,
  AlertCircle,
  TrendingUp,
  BadgeCheck,
} from "lucide-react";

type FlowStep =
  | "basic"
  | "expertise"
  | "education"
  | "profile-preview"
  | "knowledge-intro"
  | "knowledge-quiz"
  | "knowledge-result"
  | "rating-evolution"
  | "pedagogy-intro"
  | "pedagogy-quiz"
  | "pedagogy-result"
  | "ai-interview-intro"
  | "ai-interview"
  | "ai-interview-result"
  | "verification"
  | "final-evaluation"
  | "recommended-rate";

const FLOW_STEPS: { id: FlowStep; label: string; stepNum: number }[] = [
  { id: "basic", label: "Basic Info", stepNum: 1 },
  { id: "expertise", label: "Expertise", stepNum: 2 },
  { id: "education", label: "Education", stepNum: 3 },
  { id: "knowledge-quiz", label: "Assessment", stepNum: 4 },
  { id: "pedagogy-quiz", label: "Pedagogy", stepNum: 5 },
  { id: "ai-interview", label: "Interview", stepNum: 6 },
  { id: "verification", label: "Verify", stepNum: 7 },
  { id: "final-evaluation", label: "Complete", stepNum: 8 },
];

const subjectCategories = [
  {
    id: "mathematics",
    label: "Mathematics",
    icon: "➗",
    subs: ["School Mathematics", "JEE Mathematics", "Competitive Exams", "Foundation", "Vedic Maths"],
  },
  {
    id: "physics",
    label: "Physics",
    icon: "⚛️",
    subs: ["School Physics", "JEE Physics", "Olympiad", "Foundation"],
  },
  {
    id: "chemistry",
    label: "Chemistry",
    icon: "🧪",
    subs: ["School Chemistry", "JEE Chemistry", "Organic", "Inorganic", "Physical"],
  },
  {
    id: "biology",
    label: "Biology",
    icon: "🧬",
    subs: ["School Biology", "NEET Biology", "Botany", "Zoology"],
  },
  {
    id: "english",
    label: "English",
    icon: "📝",
    subs: ["Grammar", "Writing", "Literature", "IELTS/TOEFL", "Communication"],
  },
];

const skillCategories = [
  { id: "music", label: "Music", icon: Music, subs: ["Vocal", "Guitar", "Piano", "Western Music", "Indian Classical", "Tabla"] },
  { id: "fitness", label: "Fitness", icon: Dumbbell, subs: ["General Fitness", "Strength Training", "Yoga", "Sports Conditioning", "Zumba"] },
  { id: "coding", label: "Coding", icon: Code2, subs: ["Python", "JavaScript", "Web Dev", "Data Science", "App Dev", "AI/ML"] },
  { id: "art", label: "Art & Design", icon: Palette, subs: ["Drawing", "Painting", "Sketching", "Digital Art", "UI Design"] },
  { id: "languages", label: "Languages", icon: Languages, subs: ["Hindi", "French", "Spanish", "German", "Japanese", "Mandarin"] },
  { id: "sports", label: "Sports", icon: Trophy, subs: ["Cricket", "Football", "Badminton", "Tennis", "Swimming", "Chess"] },
];

const knowledgeQuestions = [
  {
    id: 1,
    question: "If a quadratic equation ax² + bx + c = 0 has roots α and β, what is the value of α² + β²?",
    options: [
      "(b² - 2ac) / a²",
      "(b² + 2ac) / a²",
      "(b² - 4ac) / a²",
      "b² / a² - 2c/a",
    ],
    correct: 0,
  },
  {
    id: 2,
    question: "The sum of the first n terms of an arithmetic progression is given by Sₙ = n/2 × (2a + (n-1)d). What is the 15th term if a = 3 and d = 4?",
    options: ["55", "59", "63", "67"],
    correct: 1,
  },
  {
    id: 3,
    question: "In a right-angled triangle, if one angle is 30°, what is the ratio of the side opposite to 30° to the hypotenuse?",
    options: ["1/2", "√3/2", "1/√3", "√3"],
    correct: 0,
  },
  {
    id: 4,
    question: "Which of the following is equivalent to log₂(8) + log₂(4)?",
    options: ["7", "5", "6", "32"],
    correct: 1,
  },
  {
    id: 5,
    question: "If f(x) = 3x² - 2x + 1, what is f'(x)?",
    options: ["6x - 2", "3x - 2", "6x + 2", "6x² - 2"],
    correct: 0,
  },
];

const pedagogyQuestions = [
  {
    id: 1,
    scenario: "A student refuses to participate in class and sits with arms crossed, refusing to answer questions.",
    question: "What is your first response?",
    options: [
      "Insist they answer and give them extra homework if they don't",
      "Gently check if they're okay privately, and give them a smaller, easier task to rebuild confidence",
      "Ignore them and focus on other students",
      "Report them immediately to parents",
    ],
    correct: 1,
  },
  {
    id: 2,
    scenario: "A child becomes frustrated and says 'I'm too stupid for this' after getting an answer wrong three times.",
    question: "How do you respond?",
    options: [
      "Tell them to try harder and focus",
      "Validate their feeling, show them how you also make mistakes, and break the problem into smaller steps",
      "Give them the answer directly to reduce frustration",
      "Change the topic immediately",
    ],
    correct: 1,
  },
  {
    id: 3,
    scenario: "During a session, a student becomes distracted, keeps checking their phone, and seems disengaged.",
    question: "What do you do?",
    options: [
      "Confiscate the phone and continue the lesson",
      "Ask them directly what's distracting them, and take a short 2-minute break before resuming",
      "End the session and inform parents",
      "Lecture them about the importance of focus",
    ],
    correct: 1,
  },
  {
    id: 4,
    scenario: "A student who usually performs well suddenly scores very poorly and becomes withdrawn.",
    question: "What is your approach?",
    options: [
      "Give extra assignments to help them catch up",
      "Have a private, empathetic conversation to understand if something is wrong at home or school",
      "Tell them their performance is disappointing",
      "Continue as normal, assuming it is a one-off",
    ],
    correct: 1,
  },
  {
    id: 5,
    scenario: "A parent contacts you saying their child says the sessions are 'boring' and they don't want to continue.",
    question: "How do you handle this?",
    options: [
      "Explain that learning requires discipline even if it's not always fun",
      "Listen carefully, ask the child what they would enjoy, and redesign sessions to include more interactive elements",
      "Ask the parent to motivate the child more",
      "Offer a discount to keep them enrolled",
    ],
    correct: 1,
  },
];

const aiInterviewQuestions = [
  {
    id: 1,
    question: "Walk us through how you would introduce a completely new concept — one the student has never encountered before. What's your process?",
  },
  {
    id: 2,
    question: "Describe a situation where a student struggled with a concept despite repeated explanations. How did you adapt your approach?",
  },
  {
    id: 3,
    question: "How do you structure your sessions differently for a student who is ahead of the curriculum versus one who needs foundational support?",
  },
  {
    id: 4,
    question: "What does a strong mentor-student relationship look like to you, and how do you intentionally build it?",
  },
  {
    id: 5,
    question: "A student performs well in practice but poorly in exams. What is your diagnosis and how would you address it?",
  },
];

function StepHeader({
  currentStep,
  onBack,
}: {
  currentStep: FlowStep;
  onBack?: () => void;
}) {
  const stepNum = FLOW_STEPS.find((s) => s.id === currentStep)?.stepNum ?? 1;
  const progressPct = Math.min(((stepNum - 1) / 7) * 100, 100);

  return (
    <div className="sticky top-0 z-30 bg-background border-b border-border">
      <div className="max-w-2xl mx-auto px-4 py-3">
        <div className="flex items-center gap-3 mb-3">
          {onBack ? (
            <button
              onClick={onBack}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-foreground" />
            </button>
          ) : (
            <Link to="/">
              <div className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors">
                <ArrowLeft className="w-4 h-4 text-foreground" />
              </div>
            </Link>
          )}
          <div className="flex items-center gap-2 flex-1">
            <Logo className="h-6 w-auto" />
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            Step {stepNum} of 8
          </span>
        </div>

        {/* Step pills */}
        <div className="flex gap-1.5 mb-2">
          {FLOW_STEPS.map((s) => (
            <div
              key={s.id}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                s.stepNum <= stepNum ? "bg-accent" : "bg-muted"
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{progressPct.toFixed(0)}% complete</p>
      </div>
    </div>
  );
}

export function MentorOnboardingPage() {
  const allowed = useRequireAuth({
    authPath: "/signup",
    fallbackReturn: "/profiles/mentor",
  });
  const navigate = useNavigate();
  const [flow, setFlow] = useState<FlowStep>("basic");

  // Basic info
  const [basic, setBasic] = useState({
    name: "",
    mobile: "",
    email: "",
    dob: "",
    gender: "",
    city: "",
    mode: "",
  });

  // Expertise
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedSubs, setSelectedSubs] = useState<string[]>([]);

  // Education
  const [eduMode, setEduMode] = useState<"manual" | "upload" | "parsed">("manual");
  const [edu, setEdu] = useState({
    qualification: "",
    college: "",
    degree: "",
    year: "",
    cgpa: "",
    teachingExp: "",
    totalExp: "",
  });

  // Knowledge quiz
  const [kqIdx, setKqIdx] = useState(0);
  const [kAnswers, setKAnswers] = useState<(number | null)[]>(Array(knowledgeQuestions.length).fill(null));
  const [kMarked, setKMarked] = useState<boolean[]>(Array(knowledgeQuestions.length).fill(false));

  // Pedagogy quiz
  const [pqIdx, setPqIdx] = useState(0);
  const [pAnswers, setPAnswers] = useState<(number | null)[]>(Array(pedagogyQuestions.length).fill(null));

  // AI Interview
  const [aiStep, setAiStep] = useState(0);
  const [aiAnswers, setAiAnswers] = useState<string[]>(Array(aiInterviewQuestions.length).fill(""));
  const [aiCurrentAnswer, setAiCurrentAnswer] = useState("");
  // Verification
  const [verif, setVerif] = useState({ pan: "", aadhaar: "" });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [recommendedRate, setRecommendedRate] = useState<number | null>(null);
  const [platformRating, setPlatformRating] = useState<number | null>(null);

  const kScore = kAnswers.filter((a, i) => a === knowledgeQuestions[i].correct).length;
  const kScorePercent = Math.round((kScore / knowledgeQuestions.length) * 100);
  const kRating = (kScorePercent / 100) * 5;

  const pScore = pAnswers.filter((a, i) => a === pedagogyQuestions[i].correct).length;
  const pScorePercent = Math.round((pScore / pedagogyQuestions.length) * 100);
  const pRating = (pScorePercent / 100) * 5;

  const go = (next: FlowStep) => {
    setFlow(next);
    window.scrollTo(0, 0);
  };

  const toggleSubject = (id: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };
  const toggleSkill = (id: string) => {
    setSelectedSkills((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };
  const toggleSub = (sub: string) => {
    setSelectedSubs((prev) =>
      prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]
    );
  };

  const selectedSubjectLabel =
    selectedSubjects.length > 0
      ? subjectCategories.find((c) => c.id === selectedSubjects[0])?.label ?? "Mathematics"
      : "Mathematics";

  const teachingModeApi = useMemo(() => {
    if (basic.mode === "online") return "ONLINE";
    if (basic.mode === "offline") return "OFFLINE";
    return "BOTH";
  }, [basic.mode]);

  async function persistOnboarding(partial: Record<string, unknown>, next?: FlowStep) {
    if (!getStoredAccessToken()) {
      setSaveError("Sign in to save your mentor onboarding progress.");
      return false;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const { data } = await httpClient.post(endpoints.mentorsMeOnboarding, partial);
      if (data?.recommendedHourlyRate != null) {
        setRecommendedRate(Number(data.recommendedHourlyRate));
      }
      if (data?.mentimentorRating != null) {
        setPlatformRating(Number(data.mentimentorRating));
      }
      if (next) go(next);
      return true;
    } catch (err) {
      setSaveError(normalizeApiError(err));
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function finalizeAndShowRate() {
    const cats: string[] = [];
    const subs: string[] = [];
    for (const id of selectedSubjects) {
      const cat = subjectCategories.find((c) => c.id === id);
      if (!cat) continue;
      const chosen = selectedSubs.filter((s) => cat.subs.includes(s));
      if (chosen.length === 0) {
        cats.push(cat.id);
        subs.push(cat.subs[0] ?? "General");
      } else {
        for (const s of chosen) {
          cats.push(cat.id);
          subs.push(s);
        }
      }
    }
    for (const id of selectedSkills) {
      const cat = skillCategories.find((c) => c.id === id);
      if (!cat) continue;
      const chosen = selectedSubs.filter((s) => cat.subs.includes(s));
      if (chosen.length === 0) {
        cats.push(cat.id);
        subs.push(cat.subs[0] ?? "General");
      } else {
        for (const s of chosen) {
          cats.push(cat.id);
          subs.push(s);
        }
      }
    }

    const teachYears = Number.parseInt(edu.teachingExp || "0", 10);
    const totalYears = Number.parseInt(edu.totalExp || "0", 10);
    const year = Number.parseInt(edu.year || "0", 10);

    await persistOnboarding(
      {
        step: 7,
        completeOnboarding: true,
        firstName: basic.name.split(" ")[0] || basic.name,
        lastName: basic.name.split(" ").slice(1).join(" ") || undefined,
        gender: basic.gender || undefined,
        city: basic.city || undefined,
        teachingMode: teachingModeApi,
        expertiseCategories: cats.length ? cats : ["mathematics"],
        expertiseSubcategories: subs.length ? subs : ["School Mathematics"],
        languages: ["en"],
        highestQualification: edu.qualification || undefined,
        college: edu.college || undefined,
        degree: edu.degree || undefined,
        yearOfCompletion: Number.isFinite(year) && year > 0 ? year : undefined,
        marksOrCgpa: edu.cgpa || undefined,
        professionalExperienceYears: Number.isFinite(totalYears) ? totalYears : undefined,
        teachingExperienceYears: Number.isFinite(teachYears) ? teachYears : undefined,
        experienceDetails: [
          edu.qualification && `Qualification: ${edu.qualification}`,
          edu.college && `College: ${edu.college}`,
          edu.degree && `Degree: ${edu.degree}`,
        ]
          .filter(Boolean)
          .join(". "),
        knowledgeScore: kScorePercent,
        knowledgeRating: Number(kRating.toFixed(2)),
        pedagogyScore: pScorePercent,
        pedagogyRating: Number(pRating.toFixed(2)),
        panNumber: verif.pan || undefined,
        aadhaarNumber: verif.aadhaar || undefined,
      },
      "recommended-rate"
    );
  }

  if (!allowed) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <StepHeader
        currentStep={flow}
        onBack={
          flow === "basic"
            ? undefined
            : () => {
                const backs: Partial<Record<FlowStep, FlowStep>> = {
                  expertise: "basic",
                  education: "expertise",
                  "profile-preview": "education",
                  "knowledge-intro": "profile-preview",
                  "knowledge-quiz": "knowledge-intro",
                  "knowledge-result": "knowledge-quiz",
                  "rating-evolution": "knowledge-result",
                  "pedagogy-intro": "rating-evolution",
                  "pedagogy-quiz": "pedagogy-intro",
                  "pedagogy-result": "pedagogy-quiz",
                  verification: "pedagogy-result",
                  "final-evaluation": "verification",
                  "recommended-rate": "final-evaluation",
                };
                const prev = backs[flow];
                if (prev) go(prev);
              }
        }
      />

      <div className="max-w-2xl mx-auto px-4 pb-24">
        {saveError ? (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {saveError}
          </div>
        ) : null}
        {/* ──────── STEP 1: BASIC INFO ──────── */}
        {flow === "basic" && (
          <motion.div
            key="basic"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="py-8 space-y-6"
          >
            <div>
              <p className="text-sm text-accent font-semibold mb-1">Step 1 of 8 · Basic Information</p>
              <h1 className="text-3xl font-bold text-foreground mb-2" style={{ fontFamily: "var(--font-display)" }}>
                Let's start with the basics
              </h1>
              <p className="text-muted-foreground">This takes about 2 minutes to complete.</p>
            </div>

            {/* Photo */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-24 h-24 rounded-2xl bg-muted border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:bg-secondary transition-colors">
                <Camera className="w-8 h-8 text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground">Add photo</span>
              </div>
              <p className="text-xs text-muted-foreground">Profile photo helps build trust with students</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Full Name *</label>
                <Input
                  placeholder="e.g., Arjun Ramesh"
                  value={basic.name}
                  onChange={(e) => setBasic({ ...basic, name: e.target.value })}
                  className="bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Mobile Number *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="+91 98765 43210"
                    className="pl-10 bg-white"
                    value={basic.mobile}
                    onChange={(e) => setBasic({ ...basic, mobile: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="arjun@example.com"
                    className="pl-10 bg-white"
                    value={basic.email}
                    onChange={(e) => setBasic({ ...basic, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Date of Birth *</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="date"
                      className="pl-10 bg-white"
                      value={basic.dob}
                      onChange={(e) => setBasic({ ...basic, dob: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Gender *</label>
                  <div className="grid grid-cols-3 gap-1.5 mt-1">
                    {["Male", "Female", "Other"].map((g) => (
                      <button
                        key={g}
                        onClick={() => setBasic({ ...basic, gender: g })}
                        className={`text-xs py-2.5 rounded-lg border font-medium transition-all ${
                          basic.gender === g
                            ? "border-accent bg-accent/10 text-accent-foreground"
                            : "border-border bg-white text-muted-foreground hover:border-primary/30"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">City *</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Mumbai, Delhi, Bangalore..."
                    className="pl-10 bg-white"
                    value={basic.city}
                    onChange={(e) => setBasic({ ...basic, city: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Preferred Teaching Mode *</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "online", label: "Online", emoji: "💻" },
                    { id: "offline", label: "At Home", emoji: "🏠" },
                    { id: "both", label: "Both", emoji: "✨" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setBasic({ ...basic, mode: m.id })}
                      className={`py-4 rounded-xl border-2 text-sm font-medium flex flex-col items-center gap-1.5 transition-all ${
                        basic.mode === m.id
                          ? "border-accent bg-accent/10 text-foreground"
                          : "border-border bg-white hover:border-primary/30 text-muted-foreground"
                      }`}
                    >
                      <span className="text-xl">{m.emoji}</span>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Button
              onClick={() => go("expertise")}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold"
              disabled={!basic.name || !basic.mobile || !basic.email || !basic.mode}
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            <button className="w-full text-sm text-muted-foreground hover:text-foreground text-center">
              Save & continue later
            </button>
          </motion.div>
        )}

        {/* ──────── STEP 2: EXPERTISE ──────── */}
        {flow === "expertise" && (
          <motion.div
            key="expertise"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="py-8 space-y-6"
          >
            <div>
              <p className="text-sm text-accent font-semibold mb-1">Step 2 of 8 · Your Expertise</p>
              <h1 className="text-3xl font-bold text-foreground mb-2" style={{ fontFamily: "var(--font-display)" }}>
                What can you mentor?
              </h1>
              <p className="text-muted-foreground">Select all that apply. You can add more later.</p>
            </div>

            <div>
              <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Academic Subjects
              </p>
              <div className="grid grid-cols-3 gap-3">
                {subjectCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => toggleSubject(cat.id)}
                    className={`py-4 rounded-xl border-2 text-sm font-medium flex flex-col items-center gap-2 transition-all ${
                      selectedSubjects.includes(cat.id)
                        ? "border-primary bg-primary/8 text-primary"
                        : "border-border bg-white hover:border-primary/30 text-foreground"
                    }`}
                  >
                    <span className="text-2xl">{cat.icon}</span>
                    <span className="text-xs text-center leading-tight">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Subcategories for selected subjects */}
            {selectedSubjects.map((sid) => {
              const cat = subjectCategories.find((c) => c.id === sid);
              if (!cat) return null;
              return (
                <div key={sid} className="bg-secondary/50 rounded-xl p-4 border border-border">
                  <p className="text-sm font-semibold text-foreground mb-3">{cat.icon} {cat.label} — Specialization</p>
                  <div className="flex flex-wrap gap-2">
                    {cat.subs.map((sub) => (
                      <button
                        key={sub}
                        onClick={() => toggleSub(sub)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          selectedSubs.includes(sub)
                            ? "border-primary bg-primary text-white"
                            : "border-border bg-white text-foreground hover:border-primary/30"
                        }`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}

            <div>
              <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Trophy className="w-4 h-4" /> Skills & Other
              </p>
              <div className="grid grid-cols-3 gap-3">
                {skillCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => toggleSkill(cat.id)}
                    className={`py-4 rounded-xl border-2 text-sm font-medium flex flex-col items-center gap-2 transition-all ${
                      selectedSkills.includes(cat.id)
                        ? "border-accent bg-accent/10 text-accent-foreground"
                        : "border-border bg-white hover:border-accent/30 text-foreground"
                    }`}
                  >
                    <cat.icon className="w-6 h-6" />
                    <span className="text-xs text-center leading-tight">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Subcategories for selected skills */}
            {selectedSkills.map((sid) => {
              const cat = skillCategories.find((c) => c.id === sid);
              if (!cat) return null;
              return (
                <div key={sid} className="bg-secondary/50 rounded-xl p-4 border border-border">
                  <p className="text-sm font-semibold text-foreground mb-3">
                    <cat.icon className="w-4 h-4 inline mr-1" /> {cat.label} — Specialization
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {cat.subs.map((sub) => (
                      <button
                        key={sub}
                        onClick={() => toggleSub(sub)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          selectedSubs.includes(sub)
                            ? "border-accent bg-accent text-accent-foreground"
                            : "border-border bg-white text-foreground hover:border-accent/30"
                        }`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}

            <Button
              onClick={() => go("education")}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold"
              disabled={selectedSubjects.length + selectedSkills.length === 0}
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        )}

        {/* ──────── STEP 3: EDUCATION ──────── */}
        {flow === "education" && (
          <motion.div
            key="education"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="py-8 space-y-6"
          >
            <div>
              <p className="text-sm text-accent font-semibold mb-1">Step 3 of 8 · Education & Experience</p>
              <h1 className="text-3xl font-bold text-foreground mb-2" style={{ fontFamily: "var(--font-display)" }}>
                Tell us your background
              </h1>
              <p className="text-muted-foreground">Your qualifications help us determine your recommended rate.</p>
            </div>

            {/* Mode switch */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setEduMode("manual")}
                className={`py-4 rounded-xl border-2 text-sm font-medium flex flex-col items-center gap-2 transition-all ${
                  eduMode === "manual"
                    ? "border-primary bg-primary/8 text-primary"
                    : "border-border bg-white text-muted-foreground hover:border-primary/30"
                }`}
              >
                <FileText className="w-5 h-5" />
                Enter manually
              </button>
              <button
                onClick={() => setEduMode("upload")}
                className={`py-4 rounded-xl border-2 text-sm font-medium flex flex-col items-center gap-2 transition-all ${
                  eduMode === "upload" || eduMode === "parsed"
                    ? "border-accent bg-accent/10 text-accent-foreground"
                    : "border-border bg-white text-muted-foreground hover:border-accent/30"
                }`}
              >
                <Upload className="w-5 h-5" />
                Upload Resume
              </button>
            </div>

            {/* Resume upload flow */}
            {(eduMode === "upload" || eduMode === "parsed") && (
              <div>
                {eduMode === "upload" && (
                  <div
                    onClick={() => {
                      setEduMode("parsed");
                      setEdu({
                        qualification: "B.Tech",
                        college: "IIT Bombay",
                        degree: "Computer Science",
                        year: "2018",
                        cgpa: "8.7",
                        teachingExp: "4 years",
                        totalExp: "6 years",
                      });
                    }}
                    className="border-2 border-dashed border-accent/40 rounded-2xl p-10 text-center cursor-pointer hover:border-accent hover:bg-accent/5 transition-all"
                  >
                    <Upload className="w-10 h-10 text-accent mx-auto mb-3" />
                    <p className="font-semibold text-foreground mb-1">Let mentimentor fill this for you.</p>
                    <p className="text-sm text-muted-foreground mb-3">Upload your resume and we'll extract your details automatically.</p>
                    <p className="text-xs text-muted-foreground">PDF, DOC up to 5MB</p>
                  </div>
                )}

                {eduMode === "parsed" && (
                  <div className="space-y-4">
                    <div className="bg-[#27AE60]/10 border border-[#27AE60]/20 rounded-xl p-4 flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#27AE60] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">Resume parsed successfully</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Your information has been extracted. Please review it before continuing.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Manual or parsed form */}
            {(eduMode === "manual" || eduMode === "parsed") && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-foreground uppercase tracking-wide text-xs">Education</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">Highest Qualification</label>
                    <Input value={edu.qualification} onChange={(e) => setEdu({ ...edu, qualification: e.target.value })} placeholder="B.Tech, M.Sc..." className="bg-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">College / University</label>
                    <Input value={edu.college} onChange={(e) => setEdu({ ...edu, college: e.target.value })} placeholder="IIT Bombay, DU..." className="bg-white" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">Degree / Specialization</label>
                    <Input value={edu.degree} onChange={(e) => setEdu({ ...edu, degree: e.target.value })} placeholder="Computer Science" className="bg-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">Year of Completion</label>
                    <Input value={edu.year} onChange={(e) => setEdu({ ...edu, year: e.target.value })} placeholder="2020" className="bg-white" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Marks / CGPA</label>
                  <Input value={edu.cgpa} onChange={(e) => setEdu({ ...edu, cgpa: e.target.value })} placeholder="8.5 CGPA or 85%" className="bg-white" />
                </div>

                <div className="pt-2 space-y-1">
                  <p className="text-xs font-bold text-foreground uppercase tracking-wide">Experience</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">Teaching Experience</label>
                    <Input value={edu.teachingExp} onChange={(e) => setEdu({ ...edu, teachingExp: e.target.value })} placeholder="3 years" className="bg-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">Total Professional Exp.</label>
                    <Input value={edu.totalExp} onChange={(e) => setEdu({ ...edu, totalExp: e.target.value })} placeholder="5 years" className="bg-white" />
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={() => go("profile-preview")}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold"
              disabled={!edu.qualification || !edu.college}
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        )}

        {/* ──────── PROFILE PREVIEW ──────── */}
        {flow === "profile-preview" && (
          <motion.div
            key="profile-preview"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="py-8 space-y-6"
          >
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/15 text-sm font-medium text-foreground mb-4">
                <TrendingUp className="w-3.5 h-3.5 text-accent" />
                Your mentimentor profile is being built
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2" style={{ fontFamily: "var(--font-display)" }}>
                Looking great so far!
              </h1>
              <p className="text-muted-foreground">Here's a preview of your mentor profile. Complete the assessments to unlock your rating.</p>
            </div>

            {/* Profile card */}
            <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                  {basic.name ? basic.name[0].toUpperCase() : "M"}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h2 className="font-bold text-foreground text-lg">{basic.name || "Your Name"}</h2>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">Pending Verification</span>
                  </div>
                  <p className="text-muted-foreground text-sm mb-2">
                    {[...selectedSubjects, ...selectedSkills]
                      .map((id) => {
                        const s = subjectCategories.find((c) => c.id === id);
                        const sk = skillCategories.find((c) => c.id === id);
                        return s?.label ?? sk?.label;
                      })
                      .filter(Boolean)
                      .join(", ") || "Mathematics, Physics"}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{basic.city || "Mumbai"}</span>
                    <span>💻 {basic.mode === "online" ? "Online" : basic.mode === "offline" ? "At Home" : "Online & At Home"}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Education</p>
                  <p className="text-sm font-medium text-foreground">{edu.qualification || "B.Tech"}</p>
                  <p className="text-xs text-muted-foreground">{edu.college || "IIT Bombay"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Experience</p>
                  <p className="text-sm font-medium text-foreground">{edu.teachingExp || "—"} teaching</p>
                  <p className="text-xs text-muted-foreground">{edu.totalExp || "—"} professional</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border bg-muted/30 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">mentimentor Rating</p>
                    <p className="text-sm font-medium text-muted-foreground italic">Pending assessment completion</p>
                  </div>
                  <div className="w-12 h-12 rounded-full border-2 border-dashed border-border flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">?</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-secondary rounded-xl p-4 border border-border">
              <p className="text-sm font-semibold text-foreground mb-1">Next: Knowledge Assessment</p>
              <p className="text-sm text-muted-foreground">Complete the domain assessment to unlock your preliminary mentimentor rating.</p>
            </div>

            <Button
              onClick={() => go("knowledge-intro")}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold"
            >
              Start Knowledge Assessment
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        )}

        {/* ──────── KNOWLEDGE INTRO ──────── */}
        {flow === "knowledge-intro" && (
          <motion.div
            key="knowledge-intro"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="py-8 space-y-6"
          >
            <div>
              <p className="text-sm text-accent font-semibold mb-1">Step 4 of 8 · Knowledge Assessment</p>
              <h1 className="text-3xl font-bold text-foreground mb-3" style={{ fontFamily: "var(--font-display)" }}>
                Show us what you know.
              </h1>
              <p className="text-muted-foreground leading-relaxed">
                To ensure every learner receives a capable mentor, we assess your knowledge in the area you want to teach.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
              <p className="font-semibold text-foreground">{selectedSubjectLabel} Assessment</p>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>{knowledgeQuestions.length}</p>
                  <p className="text-xs text-muted-foreground">Questions</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>15</p>
                  <p className="text-xs text-muted-foreground">Minutes</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>Medium</p>
                  <p className="text-xs text-muted-foreground">Difficulty</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {[
                "Read each question carefully before answering.",
                "You can mark questions for review and return later.",
                "Do not use external resources during the assessment.",
                "Your score contributes to your preliminary mentimentor rating.",
              ].map((instruction, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs text-primary font-bold">{i + 1}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{instruction}</p>
                </div>
              ))}
            </div>

            <Button
              onClick={() => { setKqIdx(0); setKAnswers(Array(knowledgeQuestions.length).fill(null)); go("knowledge-quiz"); }}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold"
            >
              Start Assessment
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        )}

        {/* ──────── KNOWLEDGE QUIZ ──────── */}
        {flow === "knowledge-quiz" && (
          <motion.div
            key={`kq-${kqIdx}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
            className="py-8 space-y-6"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Question {kqIdx + 1} of {knowledgeQuestions.length}
                </span>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">~3 min remaining</span>
                </div>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-500"
                  style={{ width: `${((kqIdx + 1) / knowledgeQuestions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Question navigation dots */}
            <div className="flex gap-1.5 flex-wrap">
              {knowledgeQuestions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setKqIdx(i)}
                  className={`w-7 h-7 rounded-full text-xs font-medium border transition-all ${
                    i === kqIdx
                      ? "border-primary bg-primary text-white"
                      : kAnswers[i] !== null
                      ? kMarked[i]
                        ? "border-amber-400 bg-amber-50 text-amber-700"
                        : "border-[#27AE60] bg-[#27AE60]/10 text-[#27AE60]"
                      : "border-border bg-white text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-border p-6">
              <p className="font-semibold text-foreground text-base leading-relaxed">
                {knowledgeQuestions[kqIdx].question}
              </p>
            </div>

            <div className="space-y-3">
              {knowledgeQuestions[kqIdx].options.map((opt, oi) => (
                <button
                  key={oi}
                  onClick={() => {
                    const next = [...kAnswers];
                    next[kqIdx] = oi;
                    setKAnswers(next);
                  }}
                  className={`w-full text-left px-5 py-4 rounded-xl border-2 text-sm transition-all ${
                    kAnswers[kqIdx] === oi
                      ? "border-primary bg-primary/8 text-foreground font-medium"
                      : "border-border bg-white text-foreground hover:border-primary/30"
                  }`}
                >
                  <span className="font-semibold text-muted-foreground mr-3">{String.fromCharCode(65 + oi)}.</span>
                  {opt}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  const next = [...kMarked];
                  next[kqIdx] = !next[kqIdx];
                  setKMarked(next);
                }}
                className={`flex-1 border-border ${kMarked[kqIdx] ? "border-amber-400 text-amber-700 bg-amber-50" : ""}`}
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                {kMarked[kqIdx] ? "Marked" : "Mark for Review"}
              </Button>

              {kqIdx < knowledgeQuestions.length - 1 ? (
                <Button
                  onClick={() => setKqIdx(kqIdx + 1)}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={() => go("knowledge-result")}
                  className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
                >
                  Submit Test
                  <CheckCheck className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>

            {kqIdx > 0 && (
              <button
                onClick={() => setKqIdx(kqIdx - 1)}
                className="w-full text-sm text-muted-foreground hover:text-foreground text-center"
              >
                ← Previous question
              </button>
            )}
          </motion.div>
        )}

        {/* ──────── KNOWLEDGE RESULT ──────── */}
        {flow === "knowledge-result" && (
          <motion.div
            key="knowledge-result"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="py-8 space-y-6"
          >
            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl bg-[#27AE60]/10 flex items-center justify-center mx-auto mb-4">
                <CheckCheck className="w-10 h-10 text-[#27AE60]" />
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2" style={{ fontFamily: "var(--font-display)" }}>
                Knowledge Assessment Completed
              </h1>
            </div>

            <div className="bg-white rounded-2xl border border-border p-8 text-center space-y-4">
              <div>
                <p className="text-5xl font-bold text-foreground mb-1" style={{ fontFamily: "var(--font-display)" }}>
                  {kScorePercent}<span className="text-2xl text-muted-foreground">/100</span>
                </p>
                <p className="text-muted-foreground text-sm">Score</p>
              </div>
              <div className="w-px h-8 bg-border mx-auto" />
              <div>
                <p className="text-xs text-muted-foreground mb-2">Knowledge Rating</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-3xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
                    {kRating.toFixed(1)}
                  </span>
                  <span className="text-muted-foreground">/ 5</span>
                  <div className="flex ml-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        className={`w-5 h-5 ${n <= Math.round(kRating) ? "fill-amber-400 text-amber-400" : "text-muted"}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                <strong>Preliminary rating only.</strong> This is your initial knowledge rating. It is not your final mentimentor rating.
              </p>
            </div>

            <Button
              onClick={() => go("rating-evolution")}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold"
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        )}

        {/* ──────── RATING EVOLUTION ──────── */}
        {flow === "rating-evolution" && (
          <motion.div
            key="rating-evolution"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="py-8 space-y-6"
          >
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-3" style={{ fontFamily: "var(--font-display)" }}>
                Your rating evolves with your mentoring journey.
              </h1>
              <p className="text-muted-foreground leading-relaxed">
                Your initial rating is based on your knowledge assessment, qualifications and profile information. As you mentor students, their verified feedback and performance-based evaluation will contribute to your overall mentimentor rating.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-border p-6">
              <div className="flex flex-col items-center gap-0">
                {[
                  { label: "Initial Assessment", desc: "Knowledge + Pedagogy + Profile", color: "bg-muted text-muted-foreground", active: false },
                  { label: "Preliminary Rating", desc: `${kRating.toFixed(1)} / 5 (current)`, color: "bg-primary text-white", active: true },
                  { label: "Student Feedback", desc: "Real-time feedback from learners", color: "bg-muted text-muted-foreground", active: false },
                  { label: "Experience", desc: "Sessions completed + reliability", color: "bg-muted text-muted-foreground", active: false },
                  { label: "Final / Evolving Rating", desc: "Your true mentimentor rating", color: "bg-accent text-accent-foreground", active: false },
                ].map((item, i, arr) => (
                  <div key={item.label} className="flex flex-col items-center w-full">
                    <div className={`w-full rounded-xl px-5 py-3.5 ${item.color} ${item.active ? "shadow-sm" : ""}`}>
                      <p className={`font-semibold text-sm ${item.active ? "text-white" : "text-foreground"}`}>{item.label}</p>
                      <p className={`text-xs mt-0.5 ${item.active ? "text-white/70" : "text-muted-foreground"}`}>{item.desc}</p>
                    </div>
                    {i < arr.length - 1 && (
                      <div className="w-px h-6 bg-border my-1" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={() => go("pedagogy-intro")}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold"
            >
              Continue to Pedagogy Assessment
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        )}

        {/* ──────── PEDAGOGY INTRO ──────── */}
        {flow === "pedagogy-intro" && (
          <motion.div
            key="pedagogy-intro"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="py-8 space-y-6"
          >
            <div>
              <p className="text-sm text-accent font-semibold mb-1">Step 5 of 8 · Pedagogy Assessment</p>
              <h1 className="text-3xl font-bold text-foreground mb-3" style={{ fontFamily: "var(--font-display)" }}>
                Knowing the subject is only half the journey.
              </h1>
              <p className="text-muted-foreground leading-relaxed">
                A great mentor knows how to understand, communicate with and guide a learner. This assessment evaluates how you respond to real-life student situations.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>{pedagogyQuestions.length}</p>
                  <p className="text-xs text-muted-foreground">Scenarios</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>20</p>
                  <p className="text-xs text-muted-foreground">Minutes</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>Scenario</p>
                  <p className="text-xs text-muted-foreground">Format</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {[
                "Each question presents a real student scenario.",
                "Choose the response that best reflects your teaching approach.",
                "There are no trick questions — we want to understand how you think.",
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-3 bg-secondary/50 rounded-xl px-4 py-3">
                  <Brain className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground">{tip}</p>
                </div>
              ))}
            </div>

            <Button
              onClick={() => { setPqIdx(0); setPAnswers(Array(pedagogyQuestions.length).fill(null)); go("pedagogy-quiz"); }}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold"
            >
              Start Pedagogy Assessment
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        )}

        {/* ──────── PEDAGOGY QUIZ ──────── */}
        {flow === "pedagogy-quiz" && (
          <motion.div
            key={`pq-${pqIdx}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
            className="py-8 space-y-6"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Scenario {pqIdx + 1} of {pedagogyQuestions.length}</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-500"
                  style={{ width: `${((pqIdx + 1) / pedagogyQuestions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Scenario card */}
            <div className="bg-[#243B8F] rounded-2xl p-6">
              <p className="text-xs text-white/50 font-semibold uppercase tracking-wide mb-2">Scenario</p>
              <p className="text-white leading-relaxed">{pedagogyQuestions[pqIdx].scenario}</p>
            </div>

            <div>
              <p className="text-sm font-semibold text-foreground mb-3">{pedagogyQuestions[pqIdx].question}</p>
              <div className="space-y-3">
                {pedagogyQuestions[pqIdx].options.map((opt, oi) => (
                  <button
                    key={oi}
                    onClick={() => {
                      const next = [...pAnswers];
                      next[pqIdx] = oi;
                      setPAnswers(next);
                    }}
                    className={`w-full text-left px-5 py-4 rounded-xl border-2 text-sm transition-all leading-relaxed ${
                      pAnswers[pqIdx] === oi
                        ? "border-primary bg-primary/8 text-foreground font-medium"
                        : "border-border bg-white text-foreground hover:border-primary/30"
                    }`}
                  >
                    <span className="font-semibold text-muted-foreground mr-3">{String.fromCharCode(65 + oi)}.</span>
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              {pqIdx > 0 && (
                <Button variant="outline" onClick={() => setPqIdx(pqIdx - 1)} className="flex-1 border-border">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
              )}

              {pqIdx < pedagogyQuestions.length - 1 ? (
                <Button
                  onClick={() => setPqIdx(pqIdx + 1)}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={() => go("pedagogy-result")}
                  className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
                >
                  Submit Assessment
                  <CheckCheck className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {/* ──────── PEDAGOGY RESULT ──────── */}
        {flow === "pedagogy-result" && (
          <motion.div
            key="pedagogy-result"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="py-8 space-y-6"
          >
            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl bg-[#7C3AED]/10 flex items-center justify-center mx-auto mb-4">
                <Brain className="w-10 h-10 text-[#7C3AED]" />
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2" style={{ fontFamily: "var(--font-display)" }}>
                Pedagogy Assessment Completed
              </h1>
            </div>

            <div className="bg-white rounded-2xl border border-border p-8 text-center space-y-4">
              <div>
                <p className="text-5xl font-bold text-foreground mb-1" style={{ fontFamily: "var(--font-display)" }}>
                  {pScorePercent}<span className="text-2xl text-muted-foreground">/100</span>
                </p>
                <p className="text-muted-foreground text-sm">Pedagogy Score</p>
              </div>
              <div className="w-px h-8 bg-border mx-auto" />
              <div>
                <p className="text-xs text-muted-foreground mb-2">Pedagogy Rating</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-3xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
                    {pRating.toFixed(1)}
                  </span>
                  <span className="text-muted-foreground">/ 5</span>
                  <div className="flex ml-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        className={`w-5 h-5 ${n <= Math.round(pRating) ? "fill-[#7C3AED] text-[#7C3AED]" : "text-muted"}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-secondary/50 rounded-xl p-4 border border-border">
              <p className="text-sm text-foreground leading-relaxed">
                This score reflects your ability to respond to student behaviour and learning situations. A higher pedagogy rating signals to students and parents that you're a thoughtful, empathetic mentor.
              </p>
            </div>

            <Button
              onClick={() => go("ai-interview-intro")}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold"
            >
              Continue to AI Interview
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        )}

        {/* ──────── STEP 6: AI INTERVIEW INTRO ──────── */}
        {flow === "ai-interview-intro" && (
          <motion.div
            key="ai-interview-intro"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="py-8 space-y-6"
          >
            <div>
              <p className="text-sm text-accent font-semibold mb-1">Step 6 of 8 · AI Interview</p>
              <h1 className="text-3xl font-bold text-foreground mb-3" style={{ fontFamily: "var(--font-display)" }}>
                One final step — a short AI interview.
              </h1>
              <p className="text-muted-foreground leading-relaxed">
                Our AI will ask you 5 open-ended questions about your mentoring philosophy and teaching approach. Your responses help us match you with students who are the right fit.
              </p>
            </div>

            <div className="bg-[#243B8F] rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">mentimentor AI Interviewer</p>
                  <p className="text-white/50 text-xs">Powered by adaptive evaluation</p>
                </div>
              </div>
              {[
                "5 questions · 3 minutes each",
                "Text responses — write naturally",
                "No right or wrong answers — we assess depth and clarity",
                "Your answers are kept private and used only for matching",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-white/75 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="bg-secondary/50 rounded-xl p-4 border border-border">
              <p className="text-sm text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Why do we do this?</strong> Our goal is to match students with mentors who are not just knowledgeable, but reflective and growth-oriented. This interview surfaces the qualities that assessments alone cannot measure.
              </p>
            </div>

            <Button
              onClick={() => { setAiStep(0); setAiCurrentAnswer(""); go("ai-interview"); }}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold"
            >
              Start Interview
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        )}

        {/* ──────── AI INTERVIEW ──────── */}
        {flow === "ai-interview" && (
          <motion.div
            key="ai-interview"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="py-8 space-y-6"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-accent font-semibold">Step 6 of 8 · AI Interview</p>
              <span className="text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
                Question {aiStep + 1} of {aiInterviewQuestions.length}
              </span>
            </div>

            {/* Progress dots */}
            <div className="flex gap-2">
              {aiInterviewQuestions.map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${
                    i < aiStep ? "bg-accent" : i === aiStep ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>

            {/* AI avatar + question */}
            <div className="bg-[#243B8F] rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <Brain className="w-4.5 h-4.5 text-accent" />
                </div>
                <div>
                  <p className="text-white/50 text-xs">mentimentor AI</p>
                  <p className="text-white text-xs font-medium">is asking…</p>
                </div>
              </div>
              <p className="text-white text-base leading-relaxed font-medium">
                {aiInterviewQuestions[aiStep].question}
              </p>
            </div>

            {/* Response area */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Your answer</label>
              <textarea
                value={aiCurrentAnswer}
                onChange={(e) => setAiCurrentAnswer(e.target.value)}
                placeholder="Take your time and respond thoughtfully. Write at least 2–3 sentences…"
                rows={6}
                className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none leading-relaxed"
              />
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-xs text-muted-foreground">{aiCurrentAnswer.length} characters</p>
                <p className="text-xs text-muted-foreground">Min. 80 characters recommended</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 px-3 py-2 rounded-lg">
              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Take your time — there's no hard time limit. Write what you genuinely think.</span>
            </div>

            <Button
              onClick={() => {
                const updated = [...aiAnswers];
                updated[aiStep] = aiCurrentAnswer;
                setAiAnswers(updated);
                if (aiStep < aiInterviewQuestions.length - 1) {
                  setAiStep(aiStep + 1);
                  setAiCurrentAnswer("");
                } else {
                  go("ai-interview-result");
                }
              }}
              disabled={aiCurrentAnswer.trim().length < 20}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold disabled:opacity-40"
            >
              {aiStep < aiInterviewQuestions.length - 1 ? "Next Question" : "Submit Interview"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        )}

        {/* ──────── AI INTERVIEW RESULT ──────── */}
        {flow === "ai-interview-result" && (
          <motion.div
            key="ai-interview-result"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="py-8 space-y-6"
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
                className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <CheckCheck className="w-10 h-10 text-accent" />
              </motion.div>
              <p className="text-sm text-accent font-semibold mb-2">Step 6 of 8 · AI Interview</p>
              <h1 className="text-3xl font-bold text-foreground mb-3" style={{ fontFamily: "var(--font-display)" }}>
                Interview complete.
              </h1>
              <p className="text-muted-foreground leading-relaxed">
                Your {aiInterviewQuestions.length} responses have been submitted. Our AI is analyzing your teaching philosophy and approach.
              </p>
            </div>

            <div className="bg-secondary/50 rounded-2xl p-5 border border-border space-y-3">
              {aiInterviewQuestions.map((q, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{q.question}</p>
                </div>
              ))}
            </div>

            <div className="bg-[#243B8F] rounded-xl p-4 flex items-start gap-3">
              <Brain className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <p className="text-white/75 text-sm leading-relaxed">
                Results from your AI interview are confidential and used solely to improve mentor-student matching. They feed into your overall mentimentor profile.
              </p>
            </div>

            <Button
              onClick={() => go("verification")}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold"
            >
              Continue to Identity Verification
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        )}

        {/* ──────── STEP 7: VERIFICATION ──────── */}
        {flow === "verification" && (
          <motion.div
            key="verification"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="py-8 space-y-6"
          >
            <div>
              <p className="text-sm text-accent font-semibold mb-1">Step 7 of 8 · Identity Verification</p>
              <h1 className="text-3xl font-bold text-foreground mb-3" style={{ fontFamily: "var(--font-display)" }}>
                Help us keep every learner safe.
              </h1>
              <p className="text-muted-foreground leading-relaxed">
                Every mentor on mentimentor is verified before being made available to students.
              </p>
            </div>

            <div className="bg-[#243B8F] rounded-2xl p-5 flex items-start gap-3">
              <Shield className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-semibold text-sm mb-1">Child Safety Commitment</p>
                <p className="text-white/65 text-sm leading-relaxed">
                  Your identity information is collected as part of our mentor verification and child-safety process. Your documents are handled securely and used only for verification purposes.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">PAN Card Number *</label>
                <Input
                  placeholder="ABCDE1234F"
                  value={verif.pan}
                  onChange={(e) => setVerif({ ...verif, pan: e.target.value.toUpperCase() })}
                  className="bg-white font-mono tracking-widest"
                  maxLength={10}
                />
                <p className="text-xs text-muted-foreground mt-1">Format: AAAAA0000A</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Aadhaar Number *</label>
                <Input
                  placeholder="XXXX XXXX XXXX"
                  value={verif.aadhaar}
                  onChange={(e) => setVerif({ ...verif, aadhaar: e.target.value })}
                  className="bg-white font-mono tracking-widest"
                  maxLength={14}
                />
                <p className="text-xs text-muted-foreground mt-1">12-digit Aadhaar number</p>
              </div>
            </div>

            {/* Upload area */}
            <div className="grid grid-cols-2 gap-3">
              <div className="border-2 border-dashed border-border rounded-xl p-4 text-center cursor-pointer hover:border-primary/40 hover:bg-secondary/30 transition-all">
                <Upload className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                <p className="text-xs font-medium text-foreground">Upload PAN</p>
                <p className="text-xs text-muted-foreground">JPG, PDF</p>
              </div>
              <div className="border-2 border-dashed border-border rounded-xl p-4 text-center cursor-pointer hover:border-primary/40 hover:bg-secondary/30 transition-all">
                <Upload className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                <p className="text-xs font-medium text-foreground">Upload Aadhaar</p>
                <p className="text-xs text-muted-foreground">JPG, PDF</p>
              </div>
            </div>

            <div className="bg-secondary/50 rounded-xl p-4 border border-border">
              <p className="text-xs text-muted-foreground leading-relaxed">
                🔒 Your PAN and Aadhaar details will never be publicly displayed on your mentor profile. This information is used solely for identity verification.
              </p>
            </div>

            <Button
              onClick={() => go("final-evaluation")}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold"
              disabled={!verif.pan || !verif.aadhaar}
            >
              Submit for Verification
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        )}

        {/* ──────── FINAL EVALUATION ──────── */}
        {flow === "final-evaluation" && (
          <motion.div
            key="final-evaluation"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="py-8 space-y-6"
          >
            <div>
              <p className="text-sm text-accent font-semibold mb-1">Step 8 of 8 · Final Evaluation</p>
              <h1 className="text-3xl font-bold text-foreground mb-2" style={{ fontFamily: "var(--font-display)" }}>
                You have been evaluated.
              </h1>
              <p className="text-muted-foreground leading-relaxed">
                mentimentor has reviewed your profile, assessments, interview and documents. Here is your result.
              </p>
            </div>

            {/* Overall rating — clean, no internal breakdown */}
            <div className="bg-primary rounded-2xl p-10 text-center">
              <p className="text-white/60 text-sm mb-2">Your mentimentor Rating</p>
              <div className="flex items-baseline justify-center gap-2 mb-3">
                <span className="text-7xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>4.2</span>
                <span className="text-2xl text-white/50">/ 5</span>
              </div>
              <div className="flex justify-center gap-1 mb-5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className={`w-7 h-7 ${n <= 4 ? "fill-accent text-accent" : "text-white/20"}`} />
                ))}
              </div>
              <div className="inline-flex items-center gap-1.5 bg-white/10 text-white/80 text-xs px-3 py-1.5 rounded-full">
                <BadgeCheck className="w-3.5 h-3.5 text-accent" />
                Pending identity verification · subject to revision
              </div>
            </div>

            <div className="bg-secondary/60 rounded-xl p-4 border border-border space-y-3">
              <div className="flex items-start gap-2.5">
                <TrendingUp className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                <p className="text-sm text-foreground leading-relaxed">
                  <strong>Your rating will grow.</strong> As you complete sessions and receive verified student feedback, mentimentor updates your rating to reflect real-world teaching performance.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The evaluation process is proprietary to mentimentor. Detailed component scores are not disclosed to protect the integrity of the rating system.
                </p>
              </div>
            </div>

            <Button
              onClick={() => void finalizeAndShowRate()}
              disabled={saving}
              className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
            >
              {saving ? "Calculating your rate..." : "See Your Approved Rate"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        )}

        {/* ──────── RECOMMENDED RATE ──────── */}
        {flow === "recommended-rate" && (
          <motion.div
            key="recommended-rate"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="py-8 space-y-6"
          >
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#27AE60]/10 text-[#27AE60] text-sm font-medium mb-4">
                <BadgeCheck className="w-4 h-4" />
                Profile Complete
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2" style={{ fontFamily: "var(--font-display)" }}>
                Your expected mentimentor rate
              </h1>
            </div>

            {/* Rate card */}
            <div className="bg-white rounded-2xl border-2 border-accent p-8 text-center shadow-lg shadow-accent/10">
              <p className="text-7xl font-bold text-primary mb-2" style={{ fontFamily: "var(--font-display)" }}>
                ₹{recommendedRate != null ? Math.round(recommendedRate) : 850}
              </p>
              <p className="text-xl text-muted-foreground">per hour</p>
              <p className="text-xs text-muted-foreground mt-2">mentimentor Recommended Rate</p>
            </div>

            <div className="bg-secondary/60 rounded-xl p-5 border border-border space-y-3">
              <p className="text-sm text-foreground leading-relaxed">
                Your rate is determined by mentimentor based on a holistic evaluation of your qualifications, assessments, experience and interview. <strong>Mentors do not independently set their own rate.</strong>
              </p>
              <div className="border-t border-border pt-3 space-y-2">
                {[
                  { label: "mentimentor Rating", value: platformRating != null ? `${platformRating.toFixed(1)} / 5` : `${((kRating + pRating) / 2).toFixed(1)} / 5` },
                  { label: "Verification Status", value: "Under Review" },
                  { label: "Subject Area", value: selectedSubjectLabel },
                  { label: "Session Modes", value: basic.mode === "both" ? "Online & Home Visit" : basic.mode === "offline" ? "At Home / In Person" : "Online" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-medium text-foreground">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={() => navigate("/dashboard")}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold"
            >
              Go to My Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Your rate may be revised after your verification is complete and as you receive student feedback.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
