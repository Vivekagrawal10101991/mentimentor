/** Category / subcategory options for mentee onboarding (aligned with marketplace topics). */
export interface SubcategoryOption {
  id: string;
  label: string;
}

export interface CategoryOption {
  id: string;
  label: string;
  subcategories: SubcategoryOption[];
}

export const ONBOARDING_CATEGORIES: CategoryOption[] = [
  {
    id: "technology",
    label: "Technology",
    subcategories: [
      { id: "web-development", label: "Web development" },
      { id: "mobile-development", label: "Mobile development" },
      { id: "data-science", label: "Data science" },
      { id: "devops", label: "DevOps & cloud" },
      { id: "security", label: "Security" },
    ],
  },
  {
    id: "career",
    label: "Career & growth",
    subcategories: [
      { id: "interview-prep", label: "Interview preparation" },
      { id: "resume", label: "Resume & portfolio" },
      { id: "leadership", label: "Leadership" },
      { id: "productivity", label: "Productivity" },
    ],
  },
  {
    id: "design",
    label: "Design & creative",
    subcategories: [
      { id: "ui-ux", label: "UI/UX design" },
      { id: "graphic-design", label: "Graphic design" },
      { id: "content-writing", label: "Content & writing" },
    ],
  },
  {
    id: "business",
    label: "Business & finance",
    subcategories: [
      { id: "startup", label: "Startups" },
      { id: "marketing", label: "Marketing" },
      { id: "finance", label: "Personal finance" },
    ],
  },
];

export const LANGUAGE_OPTIONS: { value: string; label: string }[] = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
];
