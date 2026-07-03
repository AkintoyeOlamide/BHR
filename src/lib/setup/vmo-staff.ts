import { ROLES } from "@/lib/auth/roles";

/** Shared password for all VMO staff accounts below */
export const VMO_STAFF_PASSWORD = "vmostaff2026";

/** Emails eligible to be assigned as appraisers / line managers */
export const VMO_APPRAISER_EMAILS = [
  "seun@vmoaeros.com",
  "emmanuel@vmoaeros.com",
  "adesoji@vmoaeros.com",
  "oyindamola@vmoaeros.com",
  "cynthia@vmoaeros.com",
  "olugbenga@citygateshl.com",
  "vmogeneralmanager@gmail.com",
  "adejoke@vmoaeros.com",
  "damilolaajina@vmoaeros.com",
  "commercial@vmoaeros.com",
  "edeheudim@vmoaeros.com",
  "ironbar@vmoaeros.com",
] as const;

export type StaffAccountSeed = {
  email: string;
  full_name: string;
  department: string;
  job_title: string;
  role: string;
};

/**
 * VMO line managers — can log in and complete appraisals assigned to them by HR.
 */
export const VMO_STAFF_ACCOUNTS: StaffAccountSeed[] = [
  {
    email: "seun@vmoaeros.com",
    full_name: "Oluwaseun Ayodeji-cole",
    department: "Executive Leadership",
    job_title: "Chief Operating Officer",
    role: ROLES.HR_MANAGER,
  },
  {
    email: "emmanuel@vmoaeros.com",
    full_name: "Emmanuel Awe",
    department: "Maintainace",
    job_title: "Aircraft Maintenance Planner and Technical Records Associate",
    role: ROLES.HR_MANAGER,
  },
  {
    email: "adesoji@vmoaeros.com",
    full_name: "Adesoji Adedara",
    department: "Finance",
    job_title: "Account and Finance Manager",
    role: ROLES.HR_MANAGER,
  },
  {
    email: "oyindamola@vmoaeros.com",
    full_name: "Oyindamola Benthomas",
    department: "Admin",
    job_title: "Admin and Facility Manager",
    role: ROLES.HR_MANAGER,
  },
  {
    email: "cynthia@vmoaeros.com",
    full_name: "Cynthia Ngwodo",
    department: "Comms & IT",
    job_title: "Corporate Communications and Tech Supervisor",
    role: ROLES.HR_MANAGER,
  },
  {
    email: "olugbenga@citygateshl.com",
    full_name: "Olugbenga Emoruwa",
    department: "Executive Leadership",
    job_title: "General Manager",
    role: ROLES.HR_MANAGER,
  },
  {
    email: "vmogeneralmanager@gmail.com",
    full_name: "Olugbenga Emoruwa",
    department: "Executive Leadership",
    job_title: "General Manager",
    role: ROLES.HR_MANAGER,
  },
  {
    email: "adejoke@vmoaeros.com",
    full_name: "Adejoke Okeowo-Adediran",
    department: "Quality & Safety",
    job_title: "Quality & Safety Manager",
    role: ROLES.HR_MANAGER,
  },
  {
    email: "damilolaajina@vmoaeros.com",
    full_name: "Damilola Ajina",
    department: "Operations",
    job_title: "Chief Pilot - Fixed Wing",
    role: ROLES.HR_MANAGER,
  },
  {
    email: "commercial@vmoaeros.com",
    full_name: "Rabi Iboyi",
    department: "Commercial",
    job_title: "Commercial Supervisor",
    role: ROLES.HR_MANAGER,
  },
  {
    email: "edeheudim@vmoaeros.com",
    full_name: "Edeheudim Udofia",
    department: "Maintainace",
    job_title: "DCA - Rotary Wing Engineer",
    role: ROLES.HR_MANAGER,
  },
  {
    email: "ironbar@vmoaeros.com",
    full_name: "Michael Ironbar",
    department: "Maintainace",
    job_title: "Chief Engineer - Fixed Wing",
    role: ROLES.HR_MANAGER,
  },
];
