import type { ReactNode } from "react";

export type ServiceSlug =
  | "newborn-care"
  | "immunizations"
  | "sick-visits"
  | "chronic-care"
  | "developmental-screening"
  | "well-child";

export type Service = {
  slug: ServiceSlug;
  title: string;
  tagline: string;
  description: string;
  image: string;
  icon: ReactNode;
  color: string; // e.g. "text-sky-500"
  bg: string; // e.g. "bg-sky-500/90"
  accent: string; // e.g. "bg-sky-500"
  accentSoft: string; // e.g. "bg-sky-500/10"
  highlights: { title: string; description: string; icon: ReactNode }[];
  faqs: { q: string; a: string }[];
  stats: { label: string; value: string }[];
};

// Reusable SVG icons
const HeartIcon = (
  <svg
    aria-hidden="true"
    className="h-6 w-6"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    viewBox="0 0 24 24"
  >
    <path
      d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ShieldIcon = (
  <svg
    aria-hidden="true"
    className="h-6 w-6"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    viewBox="0 0 24 24"
  >
    <path
      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SparkleIcon = (
  <svg
    aria-hidden="true"
    className="h-6 w-6"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    viewBox="0 0 24 24"
  >
    <path
      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CalendarIcon = (
  <svg
    aria-hidden="true"
    className="h-6 w-6"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    viewBox="0 0 24 24"
  >
    <path
      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ChatIcon = (
  <svg
    aria-hidden="true"
    className="h-6 w-6"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    viewBox="0 0 24 24"
  >
    <path
      d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const StarIcon = (
  <svg
    aria-hidden="true"
    className="h-6 w-6"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    viewBox="0 0 24 24"
  >
    <path
      d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ClockIcon = (
  <svg
    aria-hidden="true"
    className="h-6 w-6"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    viewBox="0 0 24 24"
  >
    <path
      d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const UsersIcon = (
  <svg
    aria-hidden="true"
    className="h-6 w-6"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    viewBox="0 0 24 24"
  >
    <path
      d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CheckIcon = (
  <svg
    aria-hidden="true"
    className="h-6 w-6"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    viewBox="0 0 24 24"
  >
    <path d="M4.5 12.75l6 6 9-13.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const SERVICES: Service[] = [
  {
    slug: "newborn-care",
    title: "Newborn Care",
    tagline: "Expert guidance for the most tender weeks of life.",
    description:
      "The transition from hospital to home can feel overwhelming. We provide a gentle, expert hand through your baby's first months—focusing on feeding success, healthy weight gain, and giving you the confidence to navigate those first precious weeks. Whether you are breastfeeding, bottle-feeding, or both, our team meets you exactly where you are.",
    image: "/images/lactation-counseling.webp",
    icon: HeartIcon,
    color: "text-sky-500",
    bg: "bg-sky-500/90",
    accent: "bg-sky-500",
    accentSoft: "bg-sky-500/10",
    highlights: [
      {
        title: "Lactation & Feeding Support",
        description:
          "One-on-one guidance from certified lactation counselors for breast, bottle, and combination feeding.",
        icon: HeartIcon,
      },
      {
        title: "Early Weight Checks",
        description:
          "Crucial weigh-ins to ensure your baby is gaining weight and feeding effectively.",
        icon: StarIcon,
      },
      {
        title: "Safe Sleep Coaching",
        description:
          "Evidence-based strategies to help your baby—and you—sleep safely and soundly.",
        icon: ClockIcon,
      },
      {
        title: "Newborn Screening",
        description: "Prompt, non-invasive checks for common newborn concerns like jaundice.",
        icon: ShieldIcon,
      },
    ],
    faqs: [
      {
        q: "When should my newborn have their first checkup?",
        a: "We typically schedule the first visit within 48 to 72 hours of hospital discharge to check weight and feeding.",
      },
      {
        q: "I'm struggling with breastfeeding. Can you help?",
        a: "Absolutely. Our certified lactation consultants are experts at troubleshooting latch, supply, and feeding pain.",
      },
      {
        q: "How often will we see the doctor in the first month?",
        a: "Usually at 3–5 days old, 2 weeks, and 1 month. We tailor the schedule based on your baby's individual needs.",
      },
    ],
    stats: [
      { label: "First visit", value: "48–72 hrs" },
      { label: "Newborns supported", value: "5,000+" },
      { label: "Lactation specialists", value: "8" },
    ],
  },
  {
    slug: "immunizations",
    title: "Immunizations",
    tagline: "Safe, proven protection for a healthy future.",
    description:
      "We believe vaccines are one of the most powerful tools we have to protect your child. We strictly follow the CDC and AAP recommended schedules, but we never rush. We take the time to answer your questions, explain the science, and ensure your child is as comfortable as possible during their visit.",
    image: "/images/vaccination.webp",
    icon: ShieldIcon,
    color: "text-teal-500",
    bg: "bg-teal-500/90",
    accent: "bg-teal-500",
    accentSoft: "bg-teal-500/10",
    highlights: [
      {
        title: "Unhurried Consultations",
        description:
          "We dedicate time to address your vaccine questions without judgment or pressure.",
        icon: ShieldIcon,
      },
      {
        title: "Pain-Free Techniques",
        description:
          "We use topical numbing, distraction, and gentle positioning to minimize discomfort.",
        icon: HeartIcon,
      },
      {
        title: "Accessible Digital Records",
        description:
          "View, download, and share your child's complete immunization history via your portal.",
        icon: CalendarIcon,
      },
      {
        title: "Custom Catch-Up Plans",
        description:
          "If your child is behind schedule, we'll design a safe, step-by-step plan to catch up.",
        icon: CheckIcon,
      },
    ],
    faqs: [
      {
        q: "What if I have concerns about a specific vaccine?",
        a: "Please bring them up. We will review the current medical research together so you can make an informed decision.",
      },
      {
        q: "Can multiple vaccines be given at the same visit?",
        a: "Yes. Combination visits are safe, effective, and reduce the number of office trips for your family.",
      },
      {
        q: "Do you offer an alternative vaccine schedule?",
        a: "We are happy to discuss a customized schedule that remains within safe and medically sound guidelines.",
      },
    ],
    stats: [
      { label: "Vaccines administered", value: "20,000+" },
      { label: "Schedule adherence", value: "98%" },
      { label: "On-site vaccines", value: "14" },
    ],
  },
  {
    slug: "sick-visits",
    title: "Sick Visits",
    tagline: "Rapid, reassuring care when illness strikes.",
    description:
      "When your child is sick, you need answers fast. From sudden fevers and ear infections to rashes and respiratory bugs, we offer same-day appointments and on-site rapid testing. Our goal is to get your child diagnosed, treated, and feeling better without the anxiety of an emergency room wait.",
    image: "/images/sick-child.webp",
    icon: HeartIcon,
    color: "text-rose-400",
    bg: "bg-rose-400/90",
    accent: "bg-rose-400",
    accentSoft: "bg-rose-400/10",
    highlights: [
      {
        title: "Same-Day Sick Appointments",
        description:
          "Reserve a morning or afternoon slot online—often seen within hours of calling.",
        icon: CalendarIcon,
      },
      {
        title: "On-Site Rapid Testing",
        description: "Fast, accurate in-house results for Strep, Flu, RSV, and COVID in minutes.",
        icon: SparkleIcon,
      },
      {
        title: "Telehealth Triage",
        description:
          "Quick virtual assessments to help you decide if an in-person visit is necessary.",
        icon: ChatIcon,
      },
      {
        title: "After-Hours Nurse Line",
        description: "Direct access to medical advice during evenings and weekends.",
        icon: ClockIcon,
      },
    ],
    faqs: [
      {
        q: "How do I know if my child needs to be seen?",
        a: "Call our nurse triage line. We will assess the symptoms and book a same-day appointment if necessary.",
      },
      {
        q: "Can you prescribe antibiotics or antivirals?",
        a: "Yes. Our providers prescribe appropriate medications immediately following a diagnosis.",
      },
      {
        q: "Do we need a follow-up visit?",
        a: "For serious infections, we schedule a complimentary follow-up to ensure your child is fully recovering.",
      },
    ],
    stats: [
      { label: "Avg. wait time", value: "< 24 hrs" },
      { label: "Same-day slots", value: "20/day" },
      { label: "Nurse line hours", value: "7a–10p" },
    ],
  },
  {
    slug: "chronic-care",
    title: "Chronic Care",
    tagline: "A proactive partnership for long-term health.",
    description:
      "Managing conditions like asthma, allergies, diabetes, or eczema requires more than just prescriptions. It requires a coordinated strategy. We build personalized, written care plans that empower your family, integrate seamlessly with schools and specialists, and keep your child thriving despite their condition.",
    image: "/images/consultation.webp",
    icon: UsersIcon,
    color: "text-indigo-400",
    bg: "bg-indigo-400/90",
    accent: "bg-indigo-400",
    accentSoft: "bg-indigo-400/10",
    highlights: [
      {
        title: "Written Action Plans",
        description: "Clear, step-by-step protocols for daily management and acute flare-ups.",
        icon: CalendarIcon,
      },
      {
        title: "Multi-Specialist Coordination",
        description:
          "We act as your medical home, communicating with pulmonologists, endocrinologists, and others.",
        icon: UsersIcon,
      },
      {
        title: "School & Sport Integration",
        description:
          "We provide necessary documentation and medication authorizations for school staff.",
        icon: ShieldIcon,
      },
      {
        title: "Device & Medication Training",
        description:
          "Hands-on education for inhalers, EpiPens, and glucose monitors for both parents and kids.",
        icon: HeartIcon,
      },
    ],
    faqs: [
      {
        q: "My child was just diagnosed. Where do we start?",
        a: "Book a dedicated 45-minute intake visit. We will map out an achievable, personalized management plan together.",
      },
      {
        q: "Can you communicate with my child's school nurse?",
        a: "Yes. With your permission, we will share the necessary care plans and medication authorizations.",
      },
      {
        q: "How often are chronic care check-ins?",
        a: "Usually every 3 to 6 months, depending on how well-controlled the condition is.",
      },
    ],
    stats: [
      { label: "Conditions managed", value: "12+" },
      { label: "Coordinated specialists", value: "40+" },
      { label: "Patient satisfaction", value: "4.9/5" },
    ],
  },
  {
    slug: "developmental-screening",
    title: "Developmental Screening",
    tagline: "Identifying strengths and supporting milestones early.",
    description:
      "Every child grows and learns at their own pace. Our play-based developmental screenings are designed to identify potential delays in speech, motor skills, and social interaction as early as possible. Early intervention is key, and we are here to guide your family through every step with warmth and expertise.",
    image: "/images/development.webp",
    icon: StarIcon,
    color: "text-amber-500",
    bg: "bg-amber-500/90",
    accent: "bg-amber-500",
    accentSoft: "bg-amber-500/10",
    highlights: [
      {
        title: "Play-Based Evaluations",
        description: "Gentle, interactive assessments that feel like playtime, not a test.",
        icon: SparkleIcon,
      },
      {
        title: "Speech & Language Checks",
        description: "Tracking both receptive and expressive communication milestones.",
        icon: ChatIcon,
      },
      {
        title: "Fine & Gross Motor Skills",
        description: "Monitoring physical coordination and movement at every well visit.",
        icon: CheckIcon,
      },
      {
        title: "Warm Early Intervention Referrals",
        description:
          "Direct connections to speech, occupational, and physical therapists if needed.",
        icon: UsersIcon,
      },
    ],
    faqs: [
      {
        q: "At what age should we start screening?",
        a: "We perform routine screenings from 2 months to 5 years, and anytime a parent or caregiver has a concern.",
      },
      {
        q: "What happens if a delay is identified?",
        a: "We will walk you through local early intervention programs and coordinate referrals seamlessly.",
      },
      {
        q: "Is a screening the same as a medical diagnosis?",
        a: "No. A screening flags areas to monitor. If necessary, we will guide you through a formal, comprehensive evaluation.",
      },
    ],
    stats: [
      { label: "Screenings / year", value: "3,200+" },
      { label: "Early referrals", value: "40%" },
      { label: "Partner programs", value: "12" },
    ],
  },
  {
    slug: "well-child",
    title: "Well-Child Visits",
    tagline: "Preventative care to keep your child thriving.",
    description:
      "Well-child visits are the cornerstone of pediatric care. These visits aren't just about height and weight—they are dedicated time to discuss nutrition, sleep, behavior, and school readiness. We build a long-term, trusting relationship with your child, celebrating their milestones and addressing concerns before they become problems.",
    image: "/images/growth-development.webp",
    icon: UsersIcon,
    color: "text-blue-500",
    bg: "bg-blue-500/90",
    accent: "bg-blue-500",
    accentSoft: "bg-blue-500/10",
    highlights: [
      {
        title: "Comprehensive Growth Tracking",
        description: "Detailed reviews of height, weight, BMI, and developmental percentiles.",
        icon: StarIcon,
      },
      {
        title: "Nutrition & Sleep Guidance",
        description:
          "Age-appropriate, practical advice for everything from picky eating to bedtime routines.",
        icon: HeartIcon,
      },
      {
        title: "Behavioral & Mood Check-ins",
        description:
          "Dedicated time to discuss emotional regulation, learning, and social development.",
        icon: ChatIcon,
      },
      {
        title: "School & Sports Forms",
        description: "Physicals and clearance paperwork completed efficiently during your visit.",
        icon: CalendarIcon,
      },
    ],
    faqs: [
      {
        q: "What is the recommended well-child visit schedule?",
        a: "Visits occur at 3–5 days, 2 weeks, and at 1, 2, 4, 6, 9, 12, 15, 18, 24 months, and then annually.",
      },
      {
        q: "Can I combine a well visit with a sick concern?",
        a: "We will always try to address both. Please note the acute concern when booking the appointment.",
      },
      {
        q: "Do you provide sports physicals?",
        a: "Yes, we offer same-day sports and school physicals. Call ahead and we'll prepare the forms.",
      },
    ],
    stats: [
      { label: "Well visits / year", value: "9,500+" },
      { label: "Sports physicals", value: "2,000+" },
      { label: "On-time visit rate", value: "94%" },
    ],
  },
];

export function getService(slug: ServiceSlug): Service {
  const service = SERVICES.find((s) => s.slug === slug);
  if (!service) throw new Error(`Unknown service: ${slug}`);
  return service;
}
