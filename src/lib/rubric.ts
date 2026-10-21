// The grading rubric, transcribed from the Accelerate People "Grading Report"
// for the Level 4 Software Developer EPA (ST0116/AP06, QAN 610/2027/8).
//
// Each assessment method lists the Pass criteria and the Distinction criteria
// an examiner ticks off ("Criteria Not Met" in the report). The wording below
// is the report's own, so practice scoring is judged against the same
// sentences the examiner reads.
//
// Grade rules, as they play out in the report:
//  - A method is a Fail if any Pass criterion is not met.
//  - It is a Distinction only if every Pass AND every Distinction criterion is
//    met; otherwise it is a Pass.
//  - Overall: any Fail = Fail; both Distinction = Distinction; exactly one
//    Distinction = Merit; otherwise Pass.

import type { Phase } from "./ksbs";

export type CriterionLevel = "pass" | "distinction";

export interface Criterion {
  id: string; // e.g. "AM1-P-S4", "AM2-D-B7+K4+S15"
  method: Phase;
  level: CriterionLevel;
  ksbs: string[];
  text: string;
}

export const METHOD_CODE: Record<Phase, "AM1" | "AM2"> = {
  project: "AM1",
  discussion: "AM2",
};

function crit(
  method: Phase,
  level: CriterionLevel,
  ksbs: string[],
  text: string,
): Criterion {
  return {
    id: `${METHOD_CODE[method]}-${level === "pass" ? "P" : "D"}-${ksbs.join("+")}`,
    method,
    level,
    ksbs,
    text,
  };
}

const P = "project" as const;
const D = "discussion" as const;

export const CRITERIA: Criterion[] = [
  // ---- AM1: Work-based project with questioning - Pass ----
  crit(P, "pass", ["S4"], "Analyses unit testing results and reviews the outcomes correcting errors."),
  crit(P, "pass", ["S7"], "Applies structured techniques to problem solving to identify and resolve issues and debug basic flaws in code."),
  crit(P, "pass", ["S1"], "Creates logical and maintainable code to deliver project outcomes, explaining their choice of approach."),
  crit(P, "pass", ["B3"], "Describes how they have maintained a productive, professional and secure working environment throughout the project activity."),
  crit(P, "pass", ["B2"], "Establishes a logical thinking approach to areas of work which require valid reasoning and/or justified decision making."),
  crit(P, "pass", ["K2"], "Explains the roles and responsibilities of all people working within the software development lifecycle, and how they relate to the project."),
  crit(P, "pass", ["S6"], "Identifies and creates test scenarios which satisfy the project specification."),
  crit(P, "pass", ["S16", "K9"], "Outlines and applies the rationale and use of algorithms, logic and data structures."),
  crit(P, "pass", ["K6"], "Outlines how teams work effectively to produce software and how to contribute appropriately."),
  crit(P, "pass", ["S10"], "Reviews and justifies their contribution to building, managing and deploying code into the relevant environment in accordance with the project specification."),
  crit(P, "pass", ["S12", "S11", "K11"], "Reviews methods of software design with reference to functional/technical specifications and applies a justified approach to software development."),

  // ---- AM1 - Distinction ----
  crit(P, "distinction", ["S7"], "Analyses the software to identify and debug complex issues using a fix that provides a permanent solution."),
  crit(P, "distinction", ["K6"], "Compare and contrast the requirements of a software development team, and how they would ensure that each member (including themselves) were able to make a contribution."),
  crit(P, "distinction", ["S11"], "Evaluates different software development approaches in order justifying the best alignment with a given paradigm (for example, object oriented, event driven or procedural)."),
  crit(P, "distinction", ["S1"], "Evaluates the advantages and disadvantages of different coding and programming techniques to create logical and maintainable code."),

  // ---- AM2: Professional discussion underpinned by portfolio - Pass ----
  crit(D, "pass", ["K10"], "Applies the principles and uses of relational and non-relational databases to software development tasks."),
  crit(D, "pass", ["S9"], "Creates analysis artefacts, such as use cases and/or user stories to enable effective delivery of software activities."),
  crit(D, "pass", ["S8"], "Creates simple software designs to communicate understanding of the programme to stakeholders and users of the programme."),
  crit(D, "pass", ["K1"], "Describes all stages of the software development lifecycle."),
  crit(D, "pass", ["K12"], "Describes basic software testing frameworks and methodologies."),
  crit(D, "pass", ["K4", "S15"], "Describes methods of communicating with all stakeholders that is determined by the audience and/or their level of technical knowledge."),
  crit(D, "pass", ["K3"], "Describes the roles and responsibilities of the project lifecycle within their organisation, and their role."),
  crit(D, "pass", ["K5"], "Describes the similarities and differences between different software development methodologies, such as agile and waterfall."),
  crit(D, "pass", ["B1"], "Describes how they have operated independently to complete tasks to given deadlines which reflect the level of responsibility assigned to them by the organisation."),
  crit(D, "pass", ["B7"], "Explains how they have communicated effectively in a variety of situations to both a technical and non-technical audience."),
  crit(D, "pass", ["B5"], "Explains how they have established an approach in the workplace which reflects integrity with respect to ethical, legal, and regulatory matters and ensures the protection of personal data, safety and security."),
  crit(D, "pass", ["B9"], "Explains how they reflect on their continued professional development and act independently to seek out new opportunities."),
  crit(D, "pass", ["K8", "S14"], "Explains the relevance of organisational policies and procedures relating to the tasks being undertaken, and when to follow them including how they have followed company, team or client approaches to continuous integration, version, and source control."),
  crit(D, "pass", ["S17"], "Explains how they have interpreted and implemented a given design whilst remaining compliant with security and maintainability requirements."),
  crit(D, "pass", ["S3"], "Explains how they have linked code to data sets."),
  crit(D, "pass", ["S2"], "Explains their own approach to development of user interfaces."),
  crit(D, "pass", ["B8"], "Illustrates how they have responded to the business context with curiosity to explore new opportunities and techniques with tenacity to improve solution performance, establishing an approach to methods and solutions which reflects a determination to succeed."),
  crit(D, "pass", ["B4"], "Illustrates how they have worked collaboratively with people in different roles, internally and externally, which show a positive attitude to inclusion & diversity."),
  crit(D, "pass", ["S5", "S13"], "Illustrates how to conduct test types, including Integration, System, User Acceptance, Non-Functional, Performance and Security testing including how they have followed testing frameworks and methodologies."),
  crit(D, "pass", ["B6"], "Illustrates their approach to meeting unexpected minor changes at work and outlines their approach to delivering within their remit using their initiative."),
  crit(D, "pass", ["K7"], "Suggests and applies different software design approaches and patterns, to identify reusable solutions to commonly occurring problems (include bespoke or off-the-shelf)."),

  // ---- AM2 - Distinction ----
  crit(D, "distinction", ["B7", "K4", "S15"], "Compares and contrasts the different types of communication used for technical and non-technical audiences and the benefits of these types of communication methods."),
  crit(D, "distinction", ["K7"], "Evaluates and recommends approaches to using reusable solutions to common problems."),
  crit(D, "distinction", ["K12"], "Evaluates the use of various software testing frameworks and methodologies and justifies their choice."),
];

export const criterionById = new Map(CRITERIA.map((c) => [c.id, c]));

export function criteriaFor(method: Phase, level?: CriterionLevel): Criterion[] {
  return CRITERIA.filter(
    (c) => c.method === method && (level === undefined || c.level === level),
  );
}

// Every criterion a question can produce evidence for: those in the same
// assessment method that share at least one of its KSB tags. Context
// questions (no tags) evidence nothing.
export function criteriaForQuestion(q: { phase: Phase; tags: string[] }): Criterion[] {
  if (q.tags.length === 0) return [];
  return CRITERIA.filter(
    (c) => c.method === q.phase && c.ksbs.some((k) => q.tags.includes(k)),
  );
}

export type Grade = "fail" | "pass" | "distinction";
export type OverallGrade = "fail" | "pass" | "merit" | "distinction";

export function methodGrade(passAllMet: boolean, distinctionAllMet: boolean): Grade {
  if (!passAllMet) return "fail";
  return distinctionAllMet ? "distinction" : "pass";
}

export function overallGrade(am1: Grade, am2: Grade): OverallGrade {
  if (am1 === "fail" || am2 === "fail") return "fail";
  const distinctions = [am1, am2].filter((g) => g === "distinction").length;
  if (distinctions === 2) return "distinction";
  if (distinctions === 1) return "merit";
  return "pass";
}

// Link target that opens Practice Mode filtered to the questions that can
// evidence a criterion.
export function practiceHref(c: Criterion): string {
  const params = new URLSearchParams({
    mode: "prep",
    phase: c.method,
    ksb: c.ksbs.join(","),
  });
  return `/session?${params.toString()}`;
}
