// Local, offline scoring of a practice answer against the grading-report
// criteria (see rubric.ts). No network, no API cost.
//
// This is a keyword-and-structure check, not a marker. For each criterion the
// question can evidence it asks: did the answer touch the points an examiner
// listens for (the "concepts" below), is it developed enough, does it show
// ownership ("I did", not just "we did")? For Distinction criteria it looks
// for the evaluative moves the criterion is worded around - comparing against
// an alternative, weighing advantages/disadvantages, justifying the choice.
//
// It can be fooled both ways (a keyword-stuffed answer scores well, an
// excellent answer in unusual vocabulary scores low), so the UI labels it an
// estimate. Its value is making gaps visible and repeatable.

import { distinctionLensFor } from "./ksbs";
import { countFillers, countWords, roughWpm } from "./analysis";
import {
  criteriaForQuestion,
  type Criterion,
} from "./rubric";
import type {
  AttemptFeedback,
  CriterionVerdict,
  Delivery,
  Rating,
} from "./practice-types";

interface Concept {
  label: string;
  re: RegExp;
}

interface PassSpec {
  concepts: Concept[];
  // How many concepts must come through for full marks.
  need: number;
  // Indices of concepts that must all be present for "met" (cap at partial).
  must?: number[];
}

interface DistSpec {
  // Criterion-specific signals on top of the generic evaluative language.
  signals: Concept[];
  need: number;
}

const c = (label: string, re: RegExp): Concept => ({ label, re });

// Shared across the two communication criteria and the distinction cluster.
const COMMS_CONCEPTS: Concept[] = [
  c("who the audience was (technical / non-technical, stakeholder, client)", /\b(audience\w*|stakeholder\w*|client\w*|customer\w*|users?|non-?technical|technical|business|colleague\w*|developer\w*|manager\w*)\b/i),
  c("the method used (email, stand-up, demo, diagram, docs, meeting…)", /\b(e-?mail\w*|slack|teams|meeting\w*|stand-?up\w*|demo\w*|present\w*|documentation|docs|diagram\w*|call\w*|show and tell|ticket\w*|jira|confluence|wiki|message\w*|workshop\w*|write-?up)\b/i),
  c("how you tailored it to the audience (jargon, level of detail, plain language)", /\b(tailor\w*|adapt\w*|adjust\w*|jargon|plain (english|language)|simpl\w+|level of detail|high[- ]level|analog\w+|explain\w*|context)\b/i),
];

const PASS_SPECS: Record<string, PassSpec> = {
  // ---------------- AM1 ----------------
  S4: {
    need: 2,
    must: [0],
    concepts: [
      c("the unit tests you wrote / ran", /\b(unit tests?|test suite|jest|pytest|rspec|junit|mocha|vitest|nunit|xunit|assert\w*|tdd|test[- ]driven)\b/i),
      c("what the results showed (failures, errors, red/green)", /\b(fail\w*|errors?|red|green|broke\w*|exception\w*|stack ?trace|output|results?|passing|pass(ed)?)\b/i),
      c("how you analysed them and corrected the errors", /\b(fix\w*|correct\w*|resolv\w*|re-?ran|re-?run|refactor\w*|review\w*|analys\w+|investigat\w+|debug\w*|traced)\b/i),
    ],
  },
  S7: {
    need: 3,
    concepts: [
      c("the bug / issue itself", /\b(debug\w*|bugs?|issues?|errors?|problem|defect|fault|broke\w*)\b/i),
      c("a structured technique (reproduce, isolate, logs, breakpoints, hypothesis)", /\b(reproduc\w+|isolat\w+|logg?(ing|ed|s)?|breakpoint\w*|console|stack ?trace|hypothes\w+|step(ped)? through|bisect\w*|narrow\w*|trac(e|ed|ing)\b|inspect\w*|dev ?tools|debugger|rubber duck|one (thing|change) at a time)\b/i),
      c("how you fixed it and checked the fix", /\b(fix\w*|resolv\w*|solution|patch\w*|verif\w+|confirm\w*|regression|re-?tested|test\w*)\b/i),
    ],
  },
  S1: {
    need: 2,
    concepts: [
      c("how you kept the code logical / maintainable (naming, structure, conventions)", /\b(readab\w+|maintainab\w+|clean|refactor\w*|nam(e|ed|ing)|convention\w*|comment\w*|structur\w+|modular\w*|dry\b|solid\b|single responsibility|separation of concerns|reusab\w+|lint\w*|style guide)\b/i),
      c("the building blocks you used (functions, classes, modules, components)", /\b(functions?|class(es)?|modules?|components?|methods?|files?|layers?|folders?|services?|hooks?)\b/i),
      c("who it had to make sense to (teammates, future developers, reviewers)", /\b(others|colleagues?|team\w*|future|someone else|new (developer|joiner)\w*|understand\w*|make sense|code review\w*|pull request\w*|handover)\b/i),
    ],
  },
  B3: {
    need: 2,
    concepts: [
      c("how you stayed productive (planning, prioritising, routine)", /\b(productiv\w+|organi[sz]\w*|prioriti[sz]\w*|plan\w*|time ?box\w*|stand-?up\w*|kanban|board|focus\w*|routine|schedule\w*|task list)\b/i),
      c("professional conduct (communication, updates, expectations)", /\b(professional\w*|communicat\w*|stakeholder\w*|respect\w*|update\w*|expectation\w*|keep(ing)? (them|everyone) informed)\b/i),
      c("keeping the environment secure (passwords, access, data)", /\b(secur\w+|passwords?|vpn|2fa|mfa|secrets?|encrypt\w*|access control|lock\w*|confidential\w*|gdpr|backups?|polic(y|ies)|env(ironment)? var\w*)\b/i),
    ],
  },
  B2: {
    need: 2,
    concepts: [
      c("the decision / options you weighed", /\b(decid\w*|decisions?|chose|choose|options?|approach\w*|considered|evaluat\w*|weigh\w*|alternatives?)\b/i),
      c("the reasoning behind it", /\b(because|reasons?|rationale|justif\w*|so that|trade-?offs?|evidence|data|requirements?|constraints?)\b/i),
      c("a logical chain to the outcome (first… then… therefore)", /\b(logic\w*|step by step|first(ly)?|then|therefore|as a result|which meant|outcome|consequently)\b/i),
    ],
  },
  K2: {
    need: 3,
    concepts: [
      c("the roles and responsibilities involved", /\b(roles?|responsib\w+)\b/i),
      c("named roles (designer, tester, product owner, BA, scrum master…)", /\b(designers?|testers?|qa|product owners?|scrum master|business analysts?|devops|stakeholders?|client|project manager|architect|ux|delivery manager)\b/i),
      c("where they sit in the lifecycle (requirements, design, build, test, deploy)", /\b(requirements?|design|build|test\w*|deploy\w*|lifecycle|sdlc|stages?|phases?|hand ?off|handover)\b/i),
    ],
  },
  S6: {
    need: 2,
    concepts: [
      c("test scenarios / cases / acceptance criteria", /\b(test (scenarios?|cases?|plans?|scripts?)|scenarios?|acceptance criteria|user (journey|flow)s?|happy path|edge cases?|negative tests?|manual test\w*|e2e|end[- ]to[- ]end|uat)\b/i),
      c("tying them to the specification / requirements", /\b(spec\w*|requirements?|brief|user stor(y|ies)|criteria|tickets?|expected)\b/i),
      c("how you verified the software met them", /\b(verif\w+|validat\w+|check\w*|confirm\w*|prove\w*|ensur\w+)\b/i),
    ],
  },
  "S16+K9": {
    need: 2,
    concepts: [
      c("algorithms / logic (searching, sorting, loops, conditions, complexity)", /\b(algorithms?|sort\w*|search\w*|binary search|big ?o|complexity|o\(|recursi\w+|loops?|iterat\w*|logic|conditions?)\b/i),
      c("data structures (array, hash, list, tree, queue, graph…)", /\b(data structures?|arrays?|lists?|hash\w*|dictionar\w+|maps?|sets?|stacks?|queues?|trees?|graphs?|linked list|objects?)\b/i),
      c("why it was the right choice (performance, trade-offs)", /\b(because|so that|trade-?offs?|performance|fast\w*|efficien\w*|look-?ups?|constant|linear|time|scal\w+|memory)\b/i),
    ],
  },
  K6: {
    need: 2,
    concepts: [
      c("how the team works together (stand-ups, sprints, reviews, pairing)", /\b(teams?|colleagues?|pair\w*|stand-?ups?|sprints?|retro\w*|reviews?|pull requests?|communicat\w*|collaborat\w*)\b/i),
      c("your own contribution", /\b(my (role|contribution|part)|i (was responsible|contributed|took|led|owned|handled|picked up)|contribut\w+)\b/i),
      c("what makes it effective (sharing work, supporting each other)", /\b(effective\w*|work\w* well|shar\w+|support\w*|help\w*|everyone|each (member|person)|split|divid\w*|allocat\w*|delegat\w*)\b/i),
    ],
  },
  S10: {
    need: 2,
    concepts: [
      c("building / deploying (pipeline, server, cloud, containers)", /\b(deploy\w*|releas\w+|ship\w*|host\w*|servers?|cloud|aws|azure|vercel|heroku|docker\w*|containers?|kubernetes|ci ?\/? ?cd|pipelines?|github actions|environments?|staging|production|builds?)\b/i),
      c("your own part in it", /\b(my (part|role|contribution)|i (set up|configured|wrote|managed|deployed|built|automated|ran)|responsible for)\b/i),
      c("alignment with the spec / managing it (config, secrets, rollback, monitoring)", /\b(spec\w*|requirements?|config\w*|secrets?|rollbacks?|monitor\w*|manag\w+|version\w*|env(ironment)? var\w*)\b/i),
    ],
  },
  "S12+S11+K11": {
    need: 2,
    concepts: [
      c("the design / specification you worked from", /\b(design\w*|specifications?|spec\b|technical spec|functional|diagrams?|tickets?|requirements?|acceptance criteria|wireframes?|architecture|brief)\b/i),
      c("the approach / paradigm (OO, functional, procedural, event-driven, patterns)", /\b(paradigm\w*|object[- ]oriented|oop|functional|procedural|event[- ]driven|declarative|class(es)?|patterns?|approach)\b/i),
      c("why that approach was justified", /\b(follow\w*|conform\w*|standards?|justif\w*|because|chose|decid\w*|reasons?|why)\b/i),
    ],
  },

  // ---------------- AM2 ----------------
  K10: {
    need: 3,
    must: [0, 1],
    concepts: [
      c("relational databases (tables, SQL, keys, joins)", /\b(relational|sql|postgres(ql)?|mysql|sqlite|tables?|foreign keys?|primary keys?|joins?|schemas?|normali[sz]\w+)\b/i),
      c("non-relational databases (document / key-value / graph, e.g. MongoDB)", /\b(non-?relational|no-?sql|mongo\w*|document (database|store|db)s?|key[- ]value|redis|dynamo\w*|graph (database|db)|cassandra|firestore|couch\w*)\b/i),
      c("when to use which (structure, scale, consistency, flexibility)", /\b(when|use case|suit\w*|scal\w+|flexib\w+|consisten\w+|acid|structured|unstructured|relationships?|trade-?off\w*|depends)\b/i),
    ],
  },
  S9: {
    need: 2,
    concepts: [
      c("analysis artefacts (user stories, use cases, acceptance criteria)", /\b(user stor(y|ies)|use cases?|acceptance criteria|requirements?|epics?|personas?|as an? .{1,40} i want|given .{1,60} when|tickets?|backlog|artefacts?|artifacts?)\b/i),
      c("who you gathered them from (stakeholders, users, product owner)", /\b(stakeholders?|clients?|users?|business|product owner|refine\w*|workshops?|elicit\w*|interview\w*|discuss\w*)\b/i),
      c("how they enabled delivery (estimating, prioritising, definition of done)", /\b(deliver\w*|build|develop\w*|estimat\w*|prioriti[sz]\w*|definition of done|plan\w*|sprint)\b/i),
    ],
  },
  S8: {
    need: 2,
    concepts: [
      c("the design artefact (diagram, wireframe, flowchart, ERD, UML)", /\b(diagrams?|wireframes?|flow ?charts?|erd|entity|uml|sequence|architecture|mock-?ups?|sketch\w*|figma|draw\.?io|lucid\w*|miro)\b/i),
      c("who it was for / how it communicated understanding", /\b(communicat\w+|explain\w*|show\w*|shar\w+|understand\w*|stakeholders?|colleagues?|team|clients?|users?)\b/i),
      c("what it described (structure, flow, relationships)", /\b(design|plan|structure|flows?|relationships?|components?|system|screens?)\b/i),
    ],
  },
  K1: {
    need: 4,
    concepts: [
      c("requirements / analysis", /\b(requirements?|analysis|discovery|elicit\w*)\b/i),
      c("design", /\b(design\w*|architecture|wireframe\w*)\b/i),
      c("build / development", /\b(build|develop(ment|ing)?|implement\w*|coding)\b/i),
      c("testing", /\b(test(ing)?|qa)\b/i),
      c("deployment / release", /\b(deploy(ment|ed|ing)?|releas\w+|go[- ]live)\b/i),
      c("maintenance / support", /\b(maintenance|maintain\w*|support|operations|monitor\w*)\b/i),
    ],
  },
  K12: {
    need: 2,
    concepts: [
      c("named testing frameworks (Jest, pytest, Cypress, RSpec…)", /\b(jest|mocha|jasmine|pytest|unittest|junit|nunit|xunit|rspec|cypress|playwright|selenium|vitest|testing library|cucumber|test(ing)? frameworks?)\b/i),
      c("test types (unit, integration, end-to-end, acceptance…)", /\b(unit|integration|end[- ]to[- ]end|e2e|acceptance|regression|system|performance|security)[- ]tests?\w*|\b(unit|integration|e2e|acceptance|regression) testing\b/i),
      c("methodology (TDD, BDD, coverage, mocking)", /\b(tdd|bdd|test[- ]driven|behaviou?r[- ]driven|red[- ]green|methodolog\w+|coverage|mock\w*|stub\w*)\b/i),
    ],
  },
  "K4+S15": {
    need: 2,
    concepts: COMMS_CONCEPTS,
  },
  K3: {
    need: 3,
    concepts: [
      c("roles and responsibilities", /\b(roles?|responsib\w+)\b/i),
      c("named roles in your team (product owner, scrum master, tester, designer…)", /\b(product owners?|scrum master|developers?|testers?|qa|designers?|business analysts?|tech lead|stakeholders?|project manager|delivery manager)\b/i),
      c("your own role and where you sit", /\b(my role|i am an?|i work as|i'?m an?|my part|i'?m responsible|i am responsible|i'?m the)\b/i),
      c("how stages hand over / work together", /\b(hand ?off|hand ?over|work\w* with|collaborat\w+|pair\w*|stage\w*|lifecycle)\b/i),
    ],
  },
  K5: {
    need: 3,
    must: [0, 1],
    concepts: [
      c("agile", /\bagile\b/i),
      c("waterfall", /\bwaterfall\b/i),
      c("how each runs (sprints, standups, phases, sign-off)", /\b(sprints?|scrum|kanban|iterat\w+|stand-?ups?|retro\w*|backlog|phases?|sequential|up-?front|fixed scope|gates?|linear|documentation)\b/i),
      c("similarities and differences explicitly", /\b(differ\w*|similar\w*|in common|whereas|compared?|contrast|both)\b/i),
    ],
  },
  B1: {
    need: 2,
    concepts: [
      c("working independently / taking ownership", /\b(independent\w*|on my own|own initiative|self[- ]?manag\w*|took ownership|ownership|responsib\w+|autonom\w*)\b/i),
      c("deadlines and prioritising", /\b(deadlines?|deliver\w*|sprints?|timelines?|prioriti[sz]\w*|estimat\w*|on time|planned|schedul\w+)\b/i),
      c("a task from start to finish incl. difficulty", /\b(started|from start|end to end|complet\w+|finished|shipped|released|overcame|difficult|challeng\w+|stuck)\b/i),
    ],
  },
  B7: {
    need: 2,
    concepts: COMMS_CONCEPTS,
  },
  B5: {
    need: 2,
    concepts: [
      c("the legal / ethical frameworks (GDPR, data protection, confidentiality)", /\b(gdpr|data protection|personal data|privacy|confidential\w*|ethic\w*|legal\w*|regulat\w*|compliance|dpa|iso ?27001|security polic\w+)\b/i),
      c("how data / systems are protected (access control, encryption, breach process)", /\b(protect\w*|encrypt\w*|access control|permissions?|anonymi[sz]\w*|redact\w*|mask\w*|consent|retention|breach\w*|report\w*|dpo|data officer|secure|safety)\b/i),
      c("what you personally do to uphold it", /\b(i|we)\b.{0,60}\b(ensure\w*|make sure|check\w*|follow\w*|comply\w*|never|always)\b/i),
    ],
  },
  B9: {
    need: 2,
    concepts: [
      c("specific CPD (courses, certifications, books, mentoring)", /\b(cpd|courses?|training|certif\w+|workshops?|conferences?|meet-?ups?|books?|tutorials?|up-?skill\w*|mentor\w*|pluralsight|udemy|coursera)\b/i),
      c("reflecting on gaps / goals / progress", /\b(reflect\w*|feedback|gaps?|goals?|plan|review\w*|progress\w*|development)\b/i),
      c("acting independently and applying it", /\b(appl(y|ied|ying)|put (it )?into practice|used it|value|benefit\w*|impact\w*|own initiative|in my own time|independent\w*|myself)\b/i),
    ],
  },
  "K8+S14": {
    need: 2,
    concepts: [
      c("version / source control (git, branches, pull requests)", /\b(git|github|gitlab|version control|source control|branch\w*|pull requests?|\bprs?\b|merge\w*|commit\w*)\b/i),
      c("continuous integration (pipelines, automated builds/tests)", /\b(ci|cd|ci ?\/ ?cd|pipelines?|continuous integration|github actions|jenkins|azure devops|automated (build|test)s?)\b/i),
      c("the policy / procedure and why you follow it", /\b(polic(y|ies)|procedures?|standards?|guidelines?|process|code reviews?|approv\w+|gdpr|compliance)\b/i),
    ],
  },
  S17: {
    need: 2,
    concepts: [
      c("security considerations (validation, auth, secrets, injection)", /\b(secur\w+|sanitis\w+|sanitiz\w+|auth\w*|encrypt\w*|owasp|injection|xss|csrf|secrets?|hash\w*|permissions?|validat\w+)\b/i),
      c("maintainability (readability, refactoring, tests, conventions)", /\b(maintainab\w+|readab\w+|refactor\w*|clean|documentation|conventions?|modular|tests?)\b/i),
      c("working from the design / ticket as intended", /\b(designs?|spec\w*|tickets?|requirements?|implement\w*|as intended|follow\w*)\b/i),
    ],
  },
  S3: {
    need: 2,
    concepts: [
      c("the data source (database, API, dataset)", /\b(databases?|data ?sets?|apis?|queries|query|orm|sql|schemas?|endpoints?|json|csv|records?|tables?)\b/i),
      c("how code connects to it (queries, models, fetching, CRUD)", /\b(connect\w*|link\w*|map\w*|bind\w*|fetch\w*|crud|insert\w*|select\w*|update\w*|migrat\w+|models?|seed\w*)\b/i),
      c("a concrete example from your code", /\b(for example|for instance|in (my|the|our) (code|project|app)|e\.g\.)\b/i),
    ],
  },
  S2: {
    need: 2,
    concepts: [
      c("the interface you built (components, layout, front end)", /\b(ui|user interface|front-?end|interface|layouts?|components?|css|html|react|figma|wireframes?|responsive)\b/i),
      c("users / accessibility / usability", /\b(users?|accessib\w+|a11y|wcag|usab\w+|ux|screen readers?|contrast|keyboard|feedback)\b/i),
      c("your design process (prototype, iterate, test with users)", /\b(design\w*|prototype\w*|mock-?ups?|iterat\w*|test\w* with|user research)\b/i),
    ],
  },
  B8: {
    need: 3,
    concepts: [
      c("curiosity - exploring something new", /\b(curios\w*|explor\w*|experiment\w*|research\w*|new (tool|technique|technology|approach|library)|spike|proof of concept|poc|trial\w*)\b/i),
      c("improving solution performance", /\b(perform\w*|optimi[sz]\w*|improv\w*|faster|speed|latency|efficien\w*|scal\w+|reduc\w+)\b/i),
      c("the business context / who benefits", /\b(business|clients?|customers?|users?|stakeholders?|value|context|cost|revenue)\b/i),
      c("tenacity / determination to succeed", /\b(determin\w*|tenac\w*|persever\w*|kept (going|trying)|didn'?t give up|stuck with|iterat\w+)\b/i),
    ],
  },
  B4: {
    need: 2,
    must: [1],
    concepts: [
      c("working with people in different roles (internal / external)", /\b(collaborat\w+|work\w* with|pair\w*|cross[- ]functional|designers?|testers?|product|clients?|external\w*|internal\w*|stakeholders?|suppliers?|vendors?)\b/i),
      c("a positive attitude to inclusion & diversity", /\b(inclusi\w+|divers\w*|different (background|perspective|view)\w*|respect\w*|listen\w*|everyone|accessib\w+|neurodiv\w*|welcom\w*|voice)\b/i),
      c("different roles / across teams", /\b(different roles?|across|outside|other teams?)\b/i),
    ],
  },
  "S5+S13": {
    need: 2,
    concepts: [
      c("test types (integration, system, UAT, non-functional, performance, security)", /\b(integration|system|user acceptance|uat|acceptance|non-?functional|performance|security|load|penetration|regression|end[- ]to[- ]end|e2e)\b/i),
      c("frameworks / methodologies / test plans followed", /\b(framework\w*|methodolog\w+|tdd|bdd|test plans?|test cases?|test scripts?|checklists?|criteria|given when then|gherkin)\b/i),
      c("how you carried the testing out", /\b(tested|testing|ran|executed|automated|manual\w*)\b/i),
    ],
  },
  B6: {
    need: 2,
    concepts: [
      c("the unexpected change / problem", /\b(unexpected|urgent|last[- ]minute|changes?|bugs?|incidents?|issues?|problems?|blockers?|hot-?fix|ad[- ]hoc|came up|pivot\w*)\b/i),
      c("using initiative within your remit", /\b(initiative|decided|took the lead|raised|proposed|picked up|sorted|resolved|handled|within my remit|escalat\w*|asked)\b/i),
      c("the outcome", /\b(solution|fix\w*|outcome|result\w*|resolved|workaround|delivered)\b/i),
    ],
  },
  K7: {
    need: 2,
    concepts: [
      c("a named pattern / reusable solution (MVC, library, framework, off-the-shelf)", /\b(patterns?|mvc|model[- ]view[- ]controller|singleton|factory|observer|repository|dependency injection|microservices?|monolith|reusab\w+|librar(y|ies)|frameworks?|off[- ]the[- ]shelf|bespoke|third[- ]party|packages?|npm)\b/i),
      c("how you structured the system", /\b(structur\w+|architecture|design|components?|layers?)\b/i),
      c("why reuse helps (separation of concerns, maintainability)", /\b(separat\w+|decoupl\w*|concerns?|maintain\w*|reus\w+|modular\w*)\b/i),
    ],
  },
};

const DIST_SPECS: Record<string, DistSpec> = {
  // ---------------- AM1 ----------------
  S7: {
    need: 2,
    signals: [
      c("showing the issue was genuinely complex (intermittent, concurrency, deep cause)", /\b(complex\w*|intermittent\w*|race condition\w*|concurren\w+|memory leak\w*|non-?deterministic|multiple (causes|systems|layers)|hard to (reproduce|find|track))\b/i),
      c("naming the root cause", /\b(root cause|underlying (cause|issue|problem)|the real (cause|problem|issue)|systemic)\b/i),
      c("explaining why the fix is permanent, not a patch", /\b(permanent\w*|prevent\w*|never (happen|come back|recur)|won'?t (happen|recur)|regression tests?|rather than (a )?(patch|workaround|quick fix)|not (just )?a (patch|workaround|quick fix)|recurr\w+)\b/i),
    ],
  },
  K6: {
    need: 1,
    signals: [
      c("what a team actually needs (roles, skills, communication)", /\b(team needs?|requirements? of (a|the) team|needs? (of|from) (a|the) team|roles?|skills?|communicat\w+|trust|ownership)\b/i),
      c("ensuring every member - including you - can contribute", /\b(everyone|each (member|person)|every (member|person)|all members|include\w*|inclusive|opportunit\w+ to (contribute|speak)|make sure (everyone|each))\b/i),
    ],
  },
  S11: {
    need: 1,
    signals: [
      c("naming a paradigm (OO, functional, procedural, event-driven)", /\b(paradigm\w*|object[- ]oriented|oop|functional|procedural|event[- ]driven|declarative|imperative)\b/i),
      c("why it was the best fit for this project", /\b(best (fit|alignment|suited)|suited|fits?|aligned?|alignment|natural fit|map\w* (well|naturally))\b/i),
    ],
  },
  S1: {
    need: 1,
    signals: [
      c("naming a coding technique you did / did not use", /\b(technique\w*|pattern\w*|approach\w*|refactor\w*|inheritance|composition|recursion|iteration|abstraction|dependency injection|monolith\w*|modular\w*|tdd|pair programming|functional|object[- ]oriented)\b/i),
      c("the maintainability payoff / cost", /\b(maintainab\w+|readab\w+|easier to (read|change|extend|test)|harder to (read|change|extend|test)|future|extensib\w+|technical debt|complexity)\b/i),
    ],
  },

  // ---------------- AM2 ----------------
  "B7+K4+S15": {
    need: 1,
    signals: [
      c("contrasting technical vs non-technical communication", /\b(non-?technical|technical (vs|versus|and non)|jargon|plain (english|language)|level of detail|different (audiences?|levels?))\b/i),
      c("the benefit of each method", /\b(benefit\w*|advantage\w*|works? (better|best|well)|more effective|quicker|clearer|disadvantage\w*|downside\w*|drawback\w*)\b/i),
    ],
  },
  K7: {
    need: 1,
    signals: [
      c("alternative patterns / solutions you considered", /\b(alternative\w*|other (patterns?|options?|solutions?|approaches)|considered|bespoke|off[- ]the[- ]shelf|build (vs|versus) buy)\b/i),
      c("a clear recommendation of the best one", /\b(recommend\w*|best (fit|option|choice)|better (than|suited)|settled on|went with|chose)\b/i),
    ],
  },
  K12: {
    need: 1,
    signals: [
      c("comparing testing frameworks / methodologies", /\b(jest|mocha|jasmine|pytest|cypress|playwright|selenium|vitest|rspec|junit|tdd|bdd|framework\w*|methodolog\w+)\b/i),
      c("justifying your choice (speed, ecosystem, team skills)", /\b(because|justif\w*|speed|ecosystem|community|team (skills|knowledge)|fit\w*|chose|picked|decided)\b/i),
    ],
  },
};

// Generic evaluative moves - what every Distinction criterion is worded around.
const EVAL_CATEGORIES: { key: string; label: string; re: RegExp }[] = [
  {
    key: "compare",
    label: "compare against an alternative",
    re: /\b(compar\w*|contrast\w*|alternatives?|whereas|versus|vs\.?|instead of|rather than|other options?|another (way|approach|option)|different (way|approach|option|technique)s?|on the other hand|could have (used|done|gone))\b/i,
  },
  {
    key: "tradeoff",
    label: "weigh advantages and disadvantages",
    re: /\b(advantages?|disadvantages?|drawbacks?|downsides?|trade-?offs?|pros\b|cons\b|benefits?|limitations?|weakness\w*|strengths?)\b/i,
  },
  {
    key: "reason",
    label: "give the reason (“because…”)",
    re: /\b(because|so that|which is why|that'?s why|that is why|the reason|justif\w*|since (it|we|the))\b/i,
  },
  {
    key: "decision",
    label: "land a clear decision / recommendation",
    re: /\b(chose|choose|picked|decided|recommend\w*|best (fit|option|choice|alignment)|better (than|suited)|most suitable|settled on|went with|opted)\b/i,
  },
];

function countMatches(re: RegExp, text: string): number {
  const g = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
  return (text.match(g) ?? []).length;
}

const SITUATION_RE =
  /\b(when|at the time|the (project|task|ticket|context|situation|problem|brief)|we were|i was (working|asked|given|tasked)|background|the (aim|goal) was)\b/i;
const ACTION_RE =
  /\bI (built|wrote|created|implemented|decided|chose|used|added|designed|raised|fixed|ran|set up|configured|refactored|introduced|proposed|led|owned|tested|deployed|reviewed|paired|investigated|researched|developed|worked|spoke|presented|updated|checked|made|took)\b/i;
const RESULT_RE =
  /\b(as a result|the result|outcome|which meant|this (led|meant|resulted)|resulting|reduced|improved|increased|saved|faster|delivered|shipped|feedback (was|from)|in the end|ultimately|\d+ ?%)\b/i;
const FIRST_PERSON_RE = /\b(i|i'm|i've|i'd|i'll|my|me)\b/gi;
const WE_RE = /\b(we|we're|we've|our|us)\b/gi;
const TOOLS_RE =
  /\b(react|next\.?js|node|typescript|javascript|python|ruby|rails|java|c#|\.net|sql|postgres\w*|mongo\w*|aws|azure|docker|git\w*|jest|jira|figma|api|rest|graphql|tailwind|css|html|django|flask|spring|redis|kubernetes|terraform|angular|vue)\b/i;

function deliveryFor(text: string, durationSec: number | null): Delivery {
  const words = countWords(text);
  const fillers = countFillers(text);
  return {
    words,
    wpm: durationSec ? roughWpm(text, durationSec * 1000) : null,
    fillers,
    fillersPer100: words > 0 ? Math.round((fillers / words) * 1000) / 10 : 0,
    star: {
      situation: SITUATION_RE.test(text),
      action: ACTION_RE.test(text),
      result: RESULT_RE.test(text),
    },
    firstPerson: countMatches(FIRST_PERSON_RE, text),
    we: countMatches(WE_RE, text),
    specifics: /\d/.test(text) || TOOLS_RE.test(text),
  };
}

const RATING_VALUE: Record<Rating, number> = { met: 1, partial: 0.5, not_met: 0 };

function labels(cs: Concept[]): string {
  return cs.map((x) => x.label).join("; ");
}

function scorePass(criterion: Criterion, text: string, d: Delivery): CriterionVerdict {
  const key = criterion.ksbs.join("+");
  const spec = PASS_SPECS[key];
  if (!spec) {
    return { criterionId: criterion.id, rating: "not_met", reason: "No scoring rules for this criterion.", improve: null };
  }
  const hit = spec.concepts.filter((x) => x.re.test(text));
  const miss = spec.concepts.filter((x) => !x.re.test(text));
  const concept = Math.min(1, hit.length / spec.need);
  const depth = d.words >= 90 ? 1 : d.words >= 45 ? 0.5 : 0;
  const knowledgeOnly = criterion.ksbs.every((k) => k.startsWith("K"));

  let s: number;
  if (knowledgeOnly) {
    s = 0.7 * concept + 0.3 * depth;
  } else {
    const ownership = d.firstPerson >= 3 ? 1 : d.firstPerson >= 1 ? 0.5 : 0;
    const structure =
      ([d.star.situation, d.star.action, d.star.result].filter(Boolean).length) / 3;
    s = 0.5 * concept + 0.2 * depth + 0.15 * ownership + 0.15 * structure;
  }

  let rating: Rating = s >= 0.7 ? "met" : s >= 0.35 ? "partial" : "not_met";
  if (hit.length === 0) rating = "not_met";
  // Genuinely touching the criterion in a real answer is "partly", not nothing.
  else if (rating === "not_met" && d.words >= 15) rating = "partial";
  const mustMissed = (spec.must ?? []).filter((i) => !spec.concepts[i].re.test(text));
  if (mustMissed.length > 0 && rating === "met") rating = "partial";

  const reason =
    hit.length === 0
      ? "None of the points an examiner listens for for this criterion came through."
      : `Covered ${hit.length} of ${spec.concepts.length} expected points: ${labels(hit)}.`;

  const improveParts: string[] = [];
  const mustMissing = mustMissed.map((i) => spec.concepts[i]);
  if (mustMissing.length > 0) improveParts.push(`Essential and missing: ${labels(mustMissing)}.`);
  const otherMiss = miss.filter((x) => !mustMissing.includes(x));
  if (rating !== "met" && otherMiss.length > 0) improveParts.push(`Also bring in: ${labels(otherMiss)}.`);
  if (rating !== "met" && d.words < 45) improveParts.push("Develop the answer - under 45 words reads as thin.");
  if (rating !== "met" && !knowledgeOnly && d.firstPerson === 0) {
    improveParts.push("Say what *you* did, in the first person.");
  }

  return {
    criterionId: criterion.id,
    rating,
    reason,
    improve: rating === "met" ? null : improveParts.join(" ") || "Add more specific evidence.",
  };
}

function scoreDistinction(criterion: Criterion, text: string, d: Delivery): CriterionVerdict {
  const key = criterion.ksbs.join("+");
  const spec = DIST_SPECS[key];
  if (!spec) {
    return { criterionId: criterion.id, rating: "not_met", reason: "No scoring rules for this criterion.", improve: null };
  }
  const cats = EVAL_CATEGORIES.filter((x) => x.re.test(text));
  const hasCompare = cats.some((x) => x.key === "compare");
  const sigHit = spec.signals.filter((x) => x.re.test(text));
  const sigMiss = spec.signals.filter((x) => !x.re.test(text));

  let rating: Rating = "not_met";
  if (cats.length >= 3 && hasCompare && sigHit.length >= spec.need && d.words >= 80) {
    rating = "met";
  } else if (cats.length >= 2 || (cats.length >= 1 && sigHit.length >= 1)) {
    rating = "partial";
  }

  const reason =
    cats.length === 0 && sigHit.length === 0
      ? "Described what you did but no evaluation - nothing compared, weighed or justified."
      : `Evaluative moves present: ${cats.length ? cats.map((x) => x.label).join("; ") : "none"}.` +
        (sigHit.length ? ` Criterion-specific: ${labels(sigHit)}.` : "");

  let improve: string | null = null;
  if (rating !== "met") {
    const parts: string[] = [];
    const missingCats = EVAL_CATEGORIES.filter((x) => !cats.includes(x));
    if (missingCats.length > 0) parts.push(`Add: ${missingCats.map((x) => x.label).join("; ")}.`);
    if (sigHit.length < spec.need && sigMiss.length > 0) parts.push(`Cover: ${labels(sigMiss)}.`);
    if (d.words < 80) parts.push("Distinction answers need room - aim for 80+ words.");
    const lens = distinctionLensFor(criterion.ksbs);
    if (lens) parts.push(`Lens: ${lens}`);
    improve = parts.join(" ");
  }

  return { criterionId: criterion.id, rating, reason, improve };
}

function deliveryNotes(d: Delivery, hasCriteria: boolean): { good: string[]; fix: string[] } {
  const good: string[] = [];
  const fix: string[] = [];

  if (d.words >= 90) good.push(`Well-developed answer (${d.words} words).`);
  else if (d.words < 45) fix.push(`Too short (${d.words} words) - aim for roughly 90-200, about a minute or two, with one concrete example.`);
  else fix.push(`Fairly brief (${d.words} words) - add detail or an example.`);

  if (hasCriteria) {
    const star = d.star;
    if (star.situation && star.action && star.result) good.push("Clear shape: situation → what you did → result.");
    else {
      const missing = [
        !star.situation && "the situation",
        !star.action && "what you personally did",
        !star.result && "the result",
      ].filter(Boolean);
      fix.push(`Structure: no clear signal of ${missing.join(", ")}.`);
    }
    if (d.firstPerson >= 3 && d.we <= d.firstPerson * 2) good.push("Good ownership - you said what you did.");
    else if (d.we > Math.max(2, d.firstPerson * 2)) fix.push("Lots of “we” - the examiner is assessing you, so say what *you* did.");
  }

  if (d.specifics) good.push("Concrete detail (tools / numbers) included.");
  else fix.push("No concrete detail - name the tool, ticket, metric or decision.");

  if (d.fillersPer100 > 4) fix.push(`Filler words are frequent (~${d.fillersPer100} per 100 words).`);
  if (d.wpm !== null) {
    if (d.wpm < 110) fix.push(`Pace is slow (~${d.wpm} wpm) - aim for 120-160.`);
    else if (d.wpm > 180) fix.push(`Pace is fast (~${d.wpm} wpm) - aim for 120-160.`);
    else good.push(`Comfortable pace (~${d.wpm} wpm).`);
  }
  return { good, fix };
}

export interface ScoredAnswer {
  overallScore: number | null;
  verdicts: CriterionVerdict[];
  delivery: Delivery;
  feedback: AttemptFeedback;
}

export function scoreAnswer(
  question: { phase: "discussion" | "project"; tags: string[] },
  text: string,
  durationSec: number | null,
): ScoredAnswer {
  const clean = text.trim();
  const delivery = deliveryFor(clean, durationSec);
  const criteria = criteriaForQuestion(question);

  const verdicts = criteria.map((cr) =>
    cr.level === "pass" ? scorePass(cr, clean, delivery) : scoreDistinction(cr, clean, delivery),
  );

  const overallScore =
    verdicts.length === 0
      ? null
      : Math.round(
          (verdicts.reduce((sum, v) => sum + RATING_VALUE[v.rating], 0) / verdicts.length) * 100,
        );

  const notes = deliveryNotes(delivery, criteria.length > 0);
  const strengths: string[] = [];
  const improvements: string[] = [];

  const metCodes = (lvl: "pass" | "distinction") =>
    verdicts
      .filter((v) => v.rating === "met" && criteria.find((x) => x.id === v.criterionId)?.level === lvl)
      .map((v) => criteria.find((x) => x.id === v.criterionId)!.ksbs.join("/"));
  const metPass = metCodes("pass");
  const metDist = metCodes("distinction");
  if (metPass.length > 0) strengths.push(`Pass criteria evidenced: ${metPass.join(", ")}.`);
  if (metDist.length > 0) strengths.push(`Distinction criteria evidenced: ${metDist.join(", ")}.`);
  strengths.push(...notes.good);

  for (const v of verdicts) {
    const cr = criteria.find((x) => x.id === v.criterionId)!;
    if (v.rating === "met" || !v.improve) continue;
    if (cr.level === "pass") improvements.push(`${cr.ksbs.join("/")} (pass): ${v.improve}`);
  }
  for (const v of verdicts) {
    const cr = criteria.find((x) => x.id === v.criterionId)!;
    if (v.rating !== "met" && v.improve && cr.level === "distinction") {
      improvements.push(`${cr.ksbs.join("/")} (distinction): ${v.improve}`);
    }
  }
  improvements.push(...notes.fix);

  if (criteria.length === 0) {
    strengths.unshift("Context question - it doesn't count toward any grading criterion, so this is scored on delivery only.");
  }

  return { overallScore, verdicts, delivery, feedback: { strengths, improvements } };
}
