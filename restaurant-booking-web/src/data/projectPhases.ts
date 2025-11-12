import { ProjectPhase } from '../types';

export const projectPhases: ProjectPhase[] = [
  {
    id: 0,
    title: 'Phase 0 · Project Setup',
    status: 'complete',
    description:
      'Backend and frontend scaffolding, linting, testing harnesses, and shared tooling are in place to support further work.',
    highlights: [
      'Node.js + Express API with TypeScript configured',
      'React + Vite frontend with Tailwind and i18next ready',
      'Testing, linting, and CI utilities available',
    ],
  },
  {
    id: 1,
    title: 'Phase 1 · Database & Models',
    status: 'complete',
    description:
      'Database schema, Prisma models, and validation scripts cover branches, tables, bookings, and core relational data.',
    highlights: [
      'PostgreSQL schema and migrations defined',
      'Prisma client generated with repository layer',
      'Validation suite exercised through automated tests',
    ],
  },
  {
    id: 2,
    title: 'Phase 2 · Authentication',
    status: 'complete',
    description:
      'Authentication services support account management, JWT issuance, refresh tokens, and guarded application routes.',
    highlights: [
      'JWT utilities with access and refresh token handling',
      'Role-based middleware on protected endpoints',
      'Frontend auth context, login flows, and protected routes',
    ],
  },
  {
    id: 3,
    title: 'Phase 3 · Core APIs',
    status: 'complete',
    description:
      'Core REST endpoints for branches, tables, customers, and reservations expose the system for the booking experience.',
    highlights: [
      'CRUD APIs for core resources implemented',
      'Validation and error handling layers enforced',
      'API client utilities connected to the frontend',
    ],
  },
  {
    id: 4,
    title: 'Phase 4 · Booking Workflows',
    status: 'in_progress',
    description:
      'Scheduling logic, waitlists, and availability calculations exist but require UI polish and additional automation.',
    highlights: [
      'Booking services and analytics endpoints wired',
      'Admin dashboard surfaces upcoming reservations',
      'Remaining tasks focus on automation and UX refinements',
    ],
  },
  {
    id: 5,
    title: 'Phase 5 · Customer Management',
    status: 'pending',
    description:
      'CRM tooling, loyalty tracking, and customer timelines still need to be completed before launch.',
    highlights: [
      'Requirements captured in planning documents',
      'Backend scaffolding ready for CRM modules',
      'Frontend has placeholders awaiting implementation',
    ],
  },
  {
    id: 6,
    title: 'Phase 6 · Admin Dashboard',
    status: 'pending',
    description:
      'Advanced admin tooling and branch operations dashboards are scheduled once core CRM capabilities are in place.',
    highlights: [
      'Current dashboard shows summaries and trends',
      'Needs granular controls for staff workflows',
      'Design updates planned to match product spec',
    ],
  },
  {
    id: 7,
    title: 'Phase 7 · Analytics & Reporting',
    status: 'pending',
    description:
      'Deeper analytics, forecasting, and exports will be introduced after admin tooling and CRM endpoints land.',
    highlights: [
      'Basic booking trends available in admin overview',
      'Comprehensive KPI dashboards not yet delivered',
      'Reporting exports and scheduling outstanding',
    ],
  },
  {
    id: 8,
    title: 'Phase 8 · Notifications',
    status: 'pending',
    description:
      'Multi-channel notifications, waitlist pings, and scheduled reminders remain to be wired end-to-end.',
    highlights: [
      'Notification templates outlined in documentation',
      'Service connectors for email/SMS configured',
      'Queue workers pending integration tests',
    ],
  },
  {
    id: 9,
    title: 'Phase 9 · UI Polish',
    status: 'pending',
    description:
      'Responsive polish, accessibility reviews, and final theming are targeted once core flows stabilize.',
    highlights: [
      'Base responsive layout in production',
      'Needs accessibility audit and final design sweep',
      'Localization coverage to be expanded',
    ],
  },
  {
    id: 10,
    title: 'Phase 10 · Launch & QA',
    status: 'pending',
    description:
      'Deployment hardening, monitoring, and go-live runbooks will close out the project after feature completion.',
    highlights: [
      'CI workflows validate builds and tests',
      'Production observability stack not yet configured',
      'Launch readiness checklist tracked in project docs',
    ],
  },
];

export const completedPhases = projectPhases.filter((phase) => phase.status === 'complete').length;
export const totalPhases = projectPhases.length;
