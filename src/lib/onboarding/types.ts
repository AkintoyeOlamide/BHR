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
  slides: OnboardingSlide[];
};

export type OnboardingDepartment = {
  id: string;
  name: string;
  /** Short label for sidebar / mobile nav */
  navLabel: string;
  tagline: string;
  description: string;
  accent: "indigo" | "cyan" | "orange" | "emerald" | "sky" | "amber";
  lessons: OnboardingLesson[];
};
