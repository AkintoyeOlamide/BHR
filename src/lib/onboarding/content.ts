import type { OnboardingDepartment, OnboardingLesson } from "./types";

/** Sample open video until Bitachon uploads department assets */
const DEMO_VIDEO =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
const DEMO_POSTER =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg";

function lesson(
  partial: Omit<OnboardingLesson, "videoUrl" | "videoPoster"> & {
    videoUrl?: string;
    videoPoster?: string;
  }
): OnboardingLesson {
  const videoUrl = partial.videoUrl ?? DEMO_VIDEO;
  return {
    ...partial,
    videoUrl,
    videoPoster:
      partial.videoPoster ??
      (videoUrl === DEMO_VIDEO ? DEMO_POSTER : undefined),
  };
}

/**
 * Seed curriculum for Bitachon staff onboarding.
 * Replace video URLs and copy with real department assets when ready.
 */
export const ONBOARDING_DEPARTMENTS: OnboardingDepartment[] = [
  {
    id: "welcome",
    name: "Welcome to Bitachon",
    navLabel: "Welcome to Bitachon",
    tagline: "Who we are",
    description:
      "Start here. Learn our story, values, and how every team contributes to safe, reliable operations.",
    accent: "indigo",
    lessons: [
      lesson({
        id: "our-story",
        title: "Our story & purpose",
        summary:
          "How Bitachon came to be, what we stand for, and the people behind the work.",
        durationLabel: "8 min",
        videoUrl: "/onboarding/welcome.mp4",
        slidesPdfUrl: "/onboarding/welcome-slides.pdf",
        slides: [
          {
            id: "s1",
            eyebrow: "Bitachon",
            title: "Welcome aboard",
            body: "You are joining a team that values precision, care, and continuous improvement. This short path introduces the company and how we work together.",
          },
          {
            id: "s2",
            eyebrow: "Purpose",
            title: "What we exist to do",
            body: "Bitachon supports excellence across aviation and related operations — keeping people safe, processes clear, and service consistent.",
          },
          {
            id: "s3",
            eyebrow: "Culture",
            title: "How we show up",
            body: "Respect, accountability, and clear communication. Ask questions early. Document decisions. Lift colleagues as you learn.",
          },
        ],
      }),
      lesson({
        id: "ways-of-working",
        title: "Ways of working",
        summary:
          "Tools, communication norms, and what “good” looks like in your first weeks.",
        durationLabel: "10 min",
        slides: [
          {
            id: "s1",
            eyebrow: "Week one",
            title: "Your first priorities",
            body: "Complete this onboarding path, meet your line manager, and confirm access to the systems your role needs.",
          },
          {
            id: "s2",
            eyebrow: "Communication",
            title: "Stay aligned",
            body: "Use official channels for work decisions. Confirm verbal agreements in writing when they affect safety, money, or schedules.",
          },
          {
            id: "s3",
            eyebrow: "Support",
            title: "Who to ask",
            body: "Your manager is the first stop. HR supports people topics. Facilities issues go through the facility report flow.",
          },
        ],
      }),
    ],
  },
  {
    id: "hr",
    name: "Human Resource",
    navLabel: "Human Resource",
    tagline: "",
    description:
      "Policies, leave, appraisals, and how Human Resource supports every staff member.",
    accent: "cyan",
    lessons: [
      lesson({
        id: "people-essentials",
        title: "People essentials",
        summary: "Contracts, conduct, and the HR services available to you.",
        durationLabel: "12 min",
        videoUrl: "/onboarding/hr.mp4",
        slidesPdfUrl: "/onboarding/hr-slides.pdf",
        slides: [
          {
            id: "s1",
            eyebrow: "Policies",
            title: "Know the framework",
            body: "HR policies cover conduct, leave, and workplace expectations. Read them carefully — they protect you and the organisation.",
          },
          {
            id: "s2",
            eyebrow: "Appraisals",
            title: "Performance reviews",
            body: "Bitachon HR hosts your appraisal cycle. You will self-assess, then work with your manager toward a shared rating.",
          },
          {
            id: "s3",
            eyebrow: "Help",
            title: "Reach HR",
            body: "For payroll questions, leave, or people issues, contact HR through the channels shared during induction.",
          },
        ],
      }),
    ],
  },
  {
    id: "operations",
    name: "Operations",
    navLabel: "Operations",
    tagline: "Flight readiness",
    description:
      "How operations keep schedules, crews, and aircraft aligned for every mission.",
    accent: "sky",
    lessons: [
      lesson({
        id: "ops-overview",
        title: "Operations overview",
        summary: "Roles, handoffs, and the rhythm of a typical operational day.",
        durationLabel: "14 min",
        slides: [
          {
            id: "s1",
            eyebrow: "Mission",
            title: "Safe, on-time delivery",
            body: "Operations coordinates people, aircraft, and timelines so every departure and arrival meets safety and service standards.",
          },
          {
            id: "s2",
            eyebrow: "Handoffs",
            title: "Work with Maintenance & CSE",
            body: "Clear status updates between Operations, Maintenance, and Cabin Service keep passengers and crews confident.",
          },
          {
            id: "s3",
            eyebrow: "Discipline",
            title: "Follow the checklist",
            body: "If a step is unclear, pause and escalate. Improvising around safety or compliance is never acceptable.",
          },
        ],
      }),
    ],
  },
  {
    id: "maintenance",
    name: "Maintenance",
    navLabel: "Maintenance",
    tagline: "Airworthiness",
    description:
      "Engineering standards, records, and how maintenance keeps aircraft ready.",
    accent: "orange",
    lessons: [
      lesson({
        id: "mx-fundamentals",
        title: "Maintenance fundamentals",
        summary: "Documentation, tooling discipline, and quality expectations.",
        durationLabel: "15 min",
        slides: [
          {
            id: "s1",
            eyebrow: "Airworthiness",
            title: "Records matter",
            body: "Every task must be logged correctly. Incomplete paperwork can ground an aircraft as surely as a mechanical defect.",
          },
          {
            id: "s2",
            eyebrow: "Safety",
            title: "Stop when unsure",
            body: "If a procedure or part does not match the documentation, stop work and escalate to your supervisor immediately.",
          },
          {
            id: "s3",
            eyebrow: "Teamwork",
            title: "Shift continuity",
            body: "Hand over open work clearly. The next engineer should never guess what was done or what remains.",
          },
        ],
      }),
    ],
  },
  {
    id: "quality-safety",
    name: "Quality & Safety",
    navLabel: "Quality & Safety",
    tagline: "Zero compromise",
    description:
      "Reporting culture, audits, and how everyone owns safety outcomes.",
    accent: "emerald",
    lessons: [
      lesson({
        id: "safety-culture",
        title: "Safety culture",
        summary: "How to report, what happens next, and why silence is risky.",
        durationLabel: "11 min",
        slides: [
          {
            id: "s1",
            eyebrow: "Speak up",
            title: "Report without fear",
            body: "Near misses and hazards must be raised early. A strong safety culture rewards honesty, not perfection theatre.",
          },
          {
            id: "s2",
            eyebrow: "Audits",
            title: "Continuous improvement",
            body: "Audits find gaps so we can close them. Treat findings as shared learning, not personal blame.",
          },
          {
            id: "s3",
            eyebrow: "You",
            title: "Everyone is accountable",
            body: "Safety is not only the Q&S team’s job. Your daily choices either strengthen or weaken the system.",
          },
        ],
      }),
    ],
  },
  {
    id: "finance",
    name: "Finance",
    navLabel: "Finance",
    tagline: "Stewardship",
    description:
      "Approvals, expense discipline, and how Finance supports every department.",
    accent: "amber",
    lessons: [
      lesson({
        id: "finance-basics",
        title: "Finance basics for staff",
        summary: "What you need to know about claims, vendors, and approvals.",
        durationLabel: "9 min",
        slides: [
          {
            id: "s1",
            eyebrow: "Approvals",
            title: "Follow the path",
            body: "Spend only within approved authority. If you are unsure who signs off, ask before you commit the company.",
          },
          {
            id: "s2",
            eyebrow: "Evidence",
            title: "Keep receipts",
            body: "Accurate documentation speeds reimbursement and protects both you and Bitachon during reviews.",
          },
          {
            id: "s3",
            eyebrow: "Partners",
            title: "Work with Finance early",
            body: "Bring budget questions to Finance before a project starts — not after costs are locked in.",
          },
        ],
      }),
    ],
  },
  {
    id: "comms-it",
    name: "Comms & IT",
    navLabel: "Comms & IT",
    tagline: "Systems & voice",
    description:
      "Devices, access, brand voice, and how we stay secure online.",
    accent: "indigo",
    lessons: [
      lesson({
        id: "digital-hygiene",
        title: "Digital hygiene",
        summary: "Passwords, phishing, and protecting company information.",
        durationLabel: "10 min",
        videoUrl: "/onboarding/comms-it.mp4",
        slides: [
          {
            id: "s1",
            eyebrow: "Access",
            title: "Protect your login",
            body: "Never share OTP codes or passwords. Use work accounts only for work. Report suspicious emails immediately.",
          },
          {
            id: "s2",
            eyebrow: "Devices",
            title: "Company equipment",
            body: "Keep software updated. Do not install unapproved tools. Lock your screen when you step away.",
          },
          {
            id: "s3",
            eyebrow: "Brand",
            title: "External voice",
            body: "Public posts and client materials should follow Comms guidance. When in doubt, ask before you publish.",
          },
        ],
      }),
    ],
  },
  {
    id: "agro",
    name: "Agro",
    navLabel: "Agro",
    tagline: "",
    description:
      "Farm operations, food production, and how Agro delivers quality from field to finish.",
    accent: "emerald",
    lessons: [
      lesson({
        id: "agro-overview",
        title: "Agro overview",
        summary:
          "How the Agro team works across production, processing, and day-to-day farm discipline.",
        durationLabel: "11 min",
        videoUrl: "/onboarding/agro.mp4",
        slides: [
          {
            id: "s1",
            eyebrow: "Purpose",
            title: "From farm to product",
            body: "Agro covers crop and food production work. Quality, timing, and clean records keep every batch trustworthy.",
          },
          {
            id: "s2",
            eyebrow: "Standards",
            title: "Follow the process",
            body: "Use approved procedures for handling, storage, and safety. If a step is unclear, stop and ask before you continue.",
          },
          {
            id: "s3",
            eyebrow: "Teamwork",
            title: "Handoffs matter",
            body: "Clear shift notes and status updates protect the next person on duty and keep production moving smoothly.",
          },
        ],
      }),
    ],
  },
  {
    id: "chl",
    name: "CHL",
    navLabel: "CHL",
    tagline: "",
    description:
      "How CHL operates day to day — coordination, administration, and reliable delivery.",
    accent: "sky",
    lessons: [
      lesson({
        id: "chl-overview",
        title: "CHL overview",
        summary:
          "Roles, routines, and what good support looks like across CHL operations.",
        durationLabel: "10 min",
        videoUrl: "/onboarding/chl.mp4",
        slides: [
          {
            id: "s1",
            eyebrow: "Role",
            title: "Keep operations moving",
            body: "CHL supports coordinated work across the unit. Accuracy and timely updates help every partner team succeed.",
          },
          {
            id: "s2",
            eyebrow: "Admin",
            title: "Document clearly",
            body: "Keep schedules, requests, and records complete. Incomplete information creates delays for everyone downstream.",
          },
          {
            id: "s3",
            eyebrow: "Service",
            title: "Respond with care",
            body: "Treat internal and external requests with the same professionalism. Escalate early when you cannot resolve something alone.",
          },
        ],
      }),
    ],
  },
  {
    id: "internal-control",
    name: "Internal Control",
    navLabel: "Internal Control",
    tagline: "",
    description:
      "Controls, compliance, and how Internal Control protects the organisation.",
    accent: "orange",
    lessons: [
      lesson({
        id: "controls-overview",
        title: "Internal Control overview",
        summary:
          "Why controls exist, how reviews work, and how every staff member supports compliance.",
        durationLabel: "12 min",
        videoUrl: "/onboarding/internal-control.mp4",
        slides: [
          {
            id: "s1",
            eyebrow: "Purpose",
            title: "Protect the system",
            body: "Internal Control checks that processes are followed and risks are managed. Strong controls build trust with leadership and partners.",
          },
          {
            id: "s2",
            eyebrow: "Reviews",
            title: "Be ready and open",
            body: "When records or processes are reviewed, share complete information. Hiding issues only increases risk.",
          },
          {
            id: "s3",
            eyebrow: "You",
            title: "Controls are everyone’s job",
            body: "Follow approval paths, keep evidence, and raise concerns early. Good control starts with daily discipline.",
          },
        ],
      }),
    ],
  },
  {
    id: "admin-facility",
    name: "Admin & Facility",
    navLabel: "Admin & Facility",
    tagline: "",
    description:
      "Workplace support, facilities care, and how Admin keeps the environment ready for every team.",
    accent: "cyan",
    lessons: [
      lesson({
        id: "admin-facility-overview",
        title: "Admin & Facility overview",
        summary:
          "How Admin & Facility supports the workplace, reports issues, and keeps shared spaces working well.",
        durationLabel: "10 min",
        videoUrl: "/onboarding/admin-facility.mp4",
        slidesPdfUrl: "/onboarding/admin-facility-slides.pdf",
        slides: [
          {
            id: "s1",
            eyebrow: "Role",
            title: "Keep the workplace ready",
            body: "Admin & Facility looks after the spaces, services, and day-to-day support that help every department do their work.",
          },
          {
            id: "s2",
            eyebrow: "Reporting",
            title: "Raise issues early",
            body: "Report facility problems through the proper channels as soon as you notice them. Clear details help the team fix issues faster.",
          },
          {
            id: "s3",
            eyebrow: "Care",
            title: "Shared responsibility",
            body: "Leave shared areas better than you found them. Good facility culture protects safety, comfort, and professionalism for everyone.",
          },
        ],
      }),
    ],
  },
];

export function getDepartment(departmentId: string) {
  return (
    ONBOARDING_DEPARTMENTS.find((d) => d.id === departmentId) ?? null
  );
}

export function getLesson(departmentId: string, lessonId: string) {
  const department = getDepartment(departmentId);
  if (!department) return null;
  const lessonItem =
    department.lessons.find((l) => l.id === lessonId) ?? null;
  if (!lessonItem) return null;
  return { department, lesson: lessonItem };
}

export function getNextLesson(departmentId: string, lessonId: string) {
  const department = getDepartment(departmentId);
  if (!department) return null;
  const index = department.lessons.findIndex((l) => l.id === lessonId);
  if (index < 0 || index >= department.lessons.length - 1) return null;
  return department.lessons[index + 1];
}

export function getFirstLessonPath(departmentId: string) {
  const department = getDepartment(departmentId);
  const first = department?.lessons[0];
  if (!department || !first) return "/onboarding";
  return `/onboarding/${department.id}/${first.id}`;
}

export const ACCENT_CLASSES = {
  indigo: {
    soft: "bg-indigo-50 text-indigo-700",
    bar: "bg-indigo-500",
    ring: "ring-indigo-500/30",
    text: "text-indigo-600",
  },
  cyan: {
    soft: "bg-cyan-50 text-cyan-800",
    bar: "bg-cyan-500",
    ring: "ring-cyan-500/30",
    text: "text-cyan-700",
  },
  orange: {
    soft: "bg-orange-50 text-orange-800",
    bar: "bg-orange-500",
    ring: "ring-orange-500/30",
    text: "text-orange-700",
  },
  emerald: {
    soft: "bg-emerald-50 text-emerald-800",
    bar: "bg-emerald-500",
    ring: "ring-emerald-500/30",
    text: "text-emerald-700",
  },
  sky: {
    soft: "bg-sky-50 text-sky-800",
    bar: "bg-sky-500",
    ring: "ring-sky-500/30",
    text: "text-sky-700",
  },
  amber: {
    soft: "bg-amber-50 text-amber-900",
    bar: "bg-amber-500",
    ring: "ring-amber-500/30",
    text: "text-amber-700",
  },
} as const;
