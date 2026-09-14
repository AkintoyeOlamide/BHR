export type OnboardingSlide = {
  id: string;
  title: string;
  body: string;
  /** Optional accent label shown on the slide */
  eyebrow?: string;
};

export type OnboardingLesson = {
  id: string;
  title: string;
  summary: string;
  durationLabel: string;
  /** HTML5 or hosted video URL — replace with real Bitachon assets later */
  videoUrl: string;
  videoPoster?: string;
  /** Optional PDF deck shown in Slides mode */
  slidesPdfUrl?: string;
  /** Optional PowerPoint deck (download / open) when PDF is unavailable */
  slidesPptxUrl?: string;
  slides: OnboardingSlide[];
};

export type OnboardingModuleId =
  | "bitachon"
  | "vmo-aero"
  | "group-units"
  | "ceo-speech";

export type OnboardingModule = {
  id: OnboardingModuleId;
  name: string;
  shortName: string;
  description: string;
  /** Parent company vs subsidiary brand */
  kind: "company" | "subsidiary";
  /** Optional brand mark under /public */
  logoUrl?: string;
  departmentIds: string[];
};

export type OnboardingDepartment = {
  id: string;
  name: string;
  /** Short label for sidebar / mobile nav */
  navLabel: string;
  tagline: string;
  description: string;
  accent: "indigo" | "cyan" | "orange" | "emerald" | "sky" | "amber";
  moduleId: OnboardingModuleId;
  lessons: OnboardingLesson[];
};
