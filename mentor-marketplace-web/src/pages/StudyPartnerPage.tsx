import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Clock,
  MessageCircle,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { MobileHeader } from "@/components/ui/mobile-header";
import { TrustBadge } from "@/components/ui/trust-badge";

const studyPartners = [
  {
    id: 1,
    name: "Amit Kumar",
    goal: "JEE 2026 Preparation",
    subjects: ["Physics", "Chemistry", "Mathematics"],
    studyTime: "Evening (6-9 PM)",
    compatibility: 92,
    verified: true,
  },
  {
    id: 2,
    name: "Sneha Reddy",
    goal: "Class 12 Board Exams",
    subjects: ["Biology", "Chemistry", "English"],
    studyTime: "Morning (7-10 AM)",
    compatibility: 88,
    verified: true,
  },
  {
    id: 3,
    name: "Rohan Patel",
    goal: "NEET Preparation",
    subjects: ["Biology", "Chemistry", "Physics"],
    studyTime: "Afternoon (2-5 PM)",
    compatibility: 85,
    verified: true,
  },
] as const;

const subjects = [
  "Physics",
  "Chemistry",
  "Mathematics",
  "Biology",
  "English",
] as const;

export function StudyPartnerPage() {
  const navigate = useNavigate();
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  function toggleSubject(subject: string) {
    setSelectedSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
    );
  }

  const visiblePartners = useMemo(() => {
    if (selectedSubjects.length === 0) {
      return [...studyPartners];
    }
    return studyPartners.filter((partner) =>
      partner.subjects.some((s) => selectedSubjects.includes(s))
    );
  }, [selectedSubjects]);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-emerald-50 to-white pb-6">
      <MobileHeader title="Find Study Partner" showBack />

      <div className="space-y-6 px-4 py-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-500">
            <Users className="h-8 w-8 text-white" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            Learn Together, Grow Together
          </h1>
          <p className="text-gray-600">
            Find students with similar goals and study schedules
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <h3 className="mb-3 font-semibold text-gray-900">
            What are you studying?
          </h3>
          <div className="flex flex-wrap gap-2">
            {subjects.map((subject) => (
              <Chip
                key={subject}
                label={subject}
                selected={selectedSubjects.includes(subject)}
                onClick={() => toggleSubject(subject)}
                accent="emerald"
              />
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-green-50 p-4">
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
            <Sparkles className="h-5 w-5 text-emerald-600" />
            Why study with a partner?
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-emerald-600">✓</span>
              <span>Stay motivated and accountable</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-emerald-600">✓</span>
              <span>Share study resources and tips</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-emerald-600">✓</span>
              <span>Practice together and clarify doubts</span>
            </li>
          </ul>
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Best Matches for You
            </h2>
            <span className="text-sm font-medium text-emerald-600">
              {visiblePartners.length} matches
            </span>
          </div>

          <div className="space-y-3">
            {visiblePartners.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-600">
                No partners match these subjects yet. Try another combination or
                clear filters.
              </div>
            ) : null}
            {visiblePartners.map((partner) => (
              <div
                key={partner.id}
                className="rounded-2xl border border-gray-200 bg-white p-4 transition-all hover:shadow-md"
              >
                <div className="mb-4 flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-500">
                    <span className="text-xl font-bold text-white">
                      {partner.name[0]}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{partner.name}</h3>
                      {partner.verified ? (
                        <TrustBadge type="verified" size="sm" />
                      ) : null}
                    </div>
                    <div className="mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4 shrink-0 text-emerald-600" />
                      <p className="text-sm text-gray-600">{partner.goal}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 shrink-0 text-gray-400" />
                      <p className="text-sm text-gray-500">{partner.studyTime}</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="rounded-full bg-emerald-100 px-3 py-1">
                      <p className="text-sm font-bold text-emerald-700">
                        {partner.compatibility}%
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Match</p>
                  </div>
                </div>

                <div className="mb-3 flex flex-wrap items-center gap-2">
                  {partner.subjects.map((subject) => (
                    <span
                      key={subject}
                      className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
                    >
                      {subject}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                    onClick={() => navigate("/profiles")}
                  >
                    View Profile
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                    onClick={() => navigate("/profiles")}
                  >
                    <MessageCircle className="mr-1 h-4 w-4" />
                    Connect
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 p-6 text-center text-white">
          <BookOpen className="mx-auto mb-3 h-12 w-12 opacity-90" />
          <h3 className="mb-2 text-lg font-bold">Can&apos;t find a match?</h3>
          <p className="mb-4 text-sm opacity-90">
            Create a study group and invite others to join
          </p>
          <Button
            type="button"
            className="bg-white text-emerald-600 hover:bg-gray-100"
            onClick={() => navigate("/dashboard")}
          >
            Create Study Group
          </Button>
        </div>
      </div>
    </div>
  );
}
