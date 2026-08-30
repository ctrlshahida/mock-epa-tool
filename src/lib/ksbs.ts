// KSB reference data for Software Developer Level 4 (ST0116).
//
// Two assessment methods, correctly separated:
//  - Professional discussion (AM2), based on the portfolio
//  - Project questioning (AM1), based on the work-based project report
//
// Distinction tags verified against Accelerate People's assessment criteria
// doc (Aug 2026) - including K6, which the government PDF's column
// formatting had obscured.

export type Phase = "discussion" | "project";

export interface Ksb {
  code: string;
  title: string;
  phase: Phase;
  distinction: boolean;
}

export const KSBS: Ksb[] = [
  // ---- Professional discussion (AM2) ----
  { code: "K1", title: "All stages of the software development lifecycle", phase: "discussion", distinction: false },
  { code: "K3", title: "Roles and responsibilities of the project lifecycle in the organisation, and own role", phase: "discussion", distinction: false },
  { code: "K4", title: "Communicating with stakeholders based on audience and technical knowledge", phase: "discussion", distinction: true },
  { code: "K5", title: "Similarities and differences between agile and waterfall", phase: "discussion", distinction: false },
  { code: "K7", title: "Software design approaches and patterns; reusable solutions", phase: "discussion", distinction: true },
  { code: "K8", title: "Organisational policies incl. version/source control and CI", phase: "discussion", distinction: false },
  { code: "K10", title: "Principles and uses of relational and non-relational databases", phase: "discussion", distinction: false },
  { code: "K12", title: "Software testing frameworks and methodologies", phase: "discussion", distinction: true },
  { code: "S2", title: "Develop effective user interfaces", phase: "discussion", distinction: false },
  { code: "S3", title: "Link code to data sets", phase: "discussion", distinction: false },
  { code: "S5", title: "Conduct a range of test types", phase: "discussion", distinction: false },
  { code: "S8", title: "Create simple software designs to communicate understanding", phase: "discussion", distinction: false },
  { code: "S9", title: "Create analysis artefacts such as use cases and user stories", phase: "discussion", distinction: false },
  { code: "S13", title: "Follow testing frameworks and methodologies", phase: "discussion", distinction: false },
  { code: "S14", title: "Follow organisational policies (version control, CI)", phase: "discussion", distinction: false },
  { code: "S15", title: "Communicate to technical and non-technical stakeholders", phase: "discussion", distinction: true },
  { code: "S17", title: "Implement a design compliant with functional, non-functional and security requirements", phase: "discussion", distinction: false },
  { code: "B1", title: "Works independently and takes responsibility to meet deadlines", phase: "discussion", distinction: false },
  { code: "B4", title: "Collaborative working across roles with a positive attitude to inclusion", phase: "discussion", distinction: false },
  { code: "B5", title: "Integrity in legal, ethical and data protection matters", phase: "discussion", distinction: false },
  { code: "B6", title: "Initiative and responsibility responding to minor work changes", phase: "discussion", distinction: false },
  { code: "B7", title: "Effective communication with technical and non-technical audiences", phase: "discussion", distinction: true },
  { code: "B8", title: "Curiosity and drive to explore new techniques and opportunities", phase: "discussion", distinction: false },
  { code: "B9", title: "Commitment to continuous professional development", phase: "discussion", distinction: false },

  // ---- Project questioning (AM1) ----
  { code: "K2", title: "Roles and responsibilities across the development lifecycle", phase: "project", distinction: false },
  { code: "K6", title: "How teams work effectively to produce software; own contribution", phase: "project", distinction: true },
  { code: "K9", title: "Algorithms, logic and data structures", phase: "project", distinction: false },
  { code: "K11", title: "Software designs and functional/technical specifications", phase: "project", distinction: false },
  { code: "S1", title: "Create logical and maintainable code", phase: "project", distinction: true },
  { code: "S4", title: "Test code and analyse results to correct errors (unit testing)", phase: "project", distinction: false },
  { code: "S6", title: "Identify and create test scenarios", phase: "project", distinction: false },
  { code: "S7", title: "Structured problem solving, debugging to root cause", phase: "project", distinction: true },
  { code: "S10", title: "Build, manage and deploy code into the relevant environment", phase: "project", distinction: false },
  { code: "S11", title: "Apply an appropriate development approach for the paradigm (OO, event-driven, procedural)", phase: "project", distinction: true },
  { code: "S12", title: "Follow software designs and functional/technical specifications", phase: "project", distinction: false },
  { code: "S16", title: "Apply algorithms, logic and data structures", phase: "project", distinction: false },
  { code: "B2", title: "Applies logical thinking - clear and valid reasoning in decisions", phase: "project", distinction: false },
  { code: "B3", title: "Maintains a productive, professional and secure working environment", phase: "project", distinction: false },
];

export const ksbByCode = new Map(KSBS.map((k) => [k.code, k]));

// Distinction lens copy per KSB. K4 / S15 / B7 are one combined cluster and
// deliberately share the same copy.
const COMMS_CLUSTER_COPY =
  "Compare at least two communication approaches and explain which served this audience better, and why.";

export const DISTINCTION_LENS: Record<string, string> = {
  K6: "Compare and contrast what a software development team actually needs, and how you'd ensure every member - including yourself - could make a contribution.",
  S1: "Weigh up a coding technique you could have used instead - what made yours more maintainable, not just that it worked.",
  S7: "Establish that this was a genuinely complex issue, and that your fix was permanent - not a patch that happened to hold.",
  S11: "Justify your chosen paradigm against a real alternative - why it was the best alignment, not just that it worked.",
  K4: COMMS_CLUSTER_COPY,
  S15: COMMS_CLUSTER_COPY,
  B7: COMMS_CLUSTER_COPY,
  K7: 'Go beyond "I used X" - evaluate the reusable solutions you considered and recommend why X beat the alternatives.',
  K12: "Evaluate the testing frameworks or methodologies you compared, and justify the one you picked.",
};

export function distinctionLensFor(tags: string[]): string | null {
  for (const tag of tags) {
    if (DISTINCTION_LENS[tag]) return DISTINCTION_LENS[tag];
  }
  return null;
}

export function isDistinctionTagged(tags: string[]): boolean {
  return tags.some((t) => ksbByCode.get(t)?.distinction);
}

export const PHASE_LABEL: Record<Phase, string> = {
  discussion: "Professional Discussion (AM2)",
  project: "Project Questioning (AM1)",
};
