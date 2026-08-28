// Single source of truth for every certification the simulator supports.
// Plain ESM, no browser- or Node-only APIs, so both the Vite frontend
// (src/*) and the Node backend (lib/, scripts/, api/) can import it directly.
//
// Add a new certification by adding an entry here - nothing else in the
// codebase should hardcode exam names, domains, or blueprint numbers.

export const EXAMS = {
  pspo1: {
    id: 'pspo1',
    label: 'PSPO I',
    fullName: 'Professional Scrum Product Owner I',
    org: 'Scrum.org',
    domains: ['Scrum Framework', 'Developing People and Teams', 'Managing Products with Agility'],
    domainGuide: `
- "Scrum Framework": Scrum theory & empiricism, Scrum values, roles/accountabilities (Product Owner, Scrum Master, Developers), events (Sprint, Sprint Planning, Daily Scrum, Sprint Review, Sprint Retrospective), artifacts (Product Backlog, Sprint Backlog, Increment), Definition of Done, commitments.
- "Developing People and Teams": self-management, cross-functionality, servant leadership, coaching/facilitation, team dynamics, conflict, stakeholder collaboration skills, organizational culture around agility.
- "Managing Products with Agility": product vision & strategy, value & value-driven development, Product Backlog management/ordering/refinement, forecasting & release planning, stakeholder & customer collaboration on product direction, evidence-based management / metrics, market and business context.
`.trim(),
    itemWriterRole: 'PSPO I (Professional Scrum Product Owner I)',
    kbDirs: ['knowledge-base/notebooklm-exports/pspo', 'knowledge-base/raw-sources/pspo'],
    simulation: { questionCount: 80, minutes: 60, passThreshold: 0.85, thresholdIsOfficial: true },
    domainWeights: null, // even split across domains
    practiceCountOptions: [5, 10, 20],
  },
  pmp: {
    id: 'pmp',
    label: 'PMP',
    fullName: 'Project Management Professional',
    org: 'PMI',
    domains: ['People', 'Process', 'Business Environment'],
    domainGuide: `
- "People" (soft skills, leading the team): managing conflict, leading a team, supporting team performance, empowering team members and stakeholders, ensuring adequate training, building a team, removing impediments/obstacles/blockers, negotiating project agreements, collaborating with stakeholders, building shared understanding, engaging virtual/remote teams, defining team ground rules, mentoring stakeholders, applying emotional intelligence to boost team performance.
- "Process" (the technical/delivery side): executing the project to deliver business value, managing communications, assessing and managing risk, engaging stakeholders, planning/managing budget and resources, planning/managing schedule, planning/managing quality, planning/managing scope, integrating project planning activities, managing project changes, planning/managing procurement, managing project artifacts, determining the appropriate project methodology/methods/practices (predictive, agile, hybrid), establishing project governance, managing issues, ensuring knowledge transfer, planning/managing project or phase closure.
- "Business Environment" (the project's connection to organizational strategy): planning and managing project compliance, evaluating and delivering project benefits and value, evaluating and addressing external business environment changes, supporting organizational change.
`.trim(),
    itemWriterRole: 'PMP (Project Management Professional, per PMBOK 7 and the PMI Examination Content Outline)',
    kbDirs: ['knowledge-base/notebooklm-exports/pmp', 'knowledge-base/raw-sources/pmp'],
    simulation: { questionCount: 180, minutes: 230, passThreshold: 0.61, thresholdIsOfficial: false },
    // Official PMI Examination Content Outline domain weighting.
    domainWeights: { People: 0.42, Process: 0.5, 'Business Environment': 0.08 },
    practiceCountOptions: [5, 10, 20],
  },
}

export const DEFAULT_EXAM_ID = 'pspo1'

export function getExam(examId) {
  return EXAMS[examId] ?? EXAMS[DEFAULT_EXAM_ID]
}
