import { Phase } from "./ksbs";

export interface Question {
  id: string;
  phase: Phase;
  tags: string[];
  text: string;
  // Portfolio page reference - discussion questions only. Not used by the
  // generic EPA question bank below; left in the type for anyone wiring up
  // a portfolio-linked bank later.
  ref?: string;
}

// ---------------------------------------------------------------------------
// Project questioning (AM1) - SDv1.1 Interview questions, generic EPA bank.
// Context questions carry no KSB tags; criteria questions are tagged per the
// assessment criteria doc, including the DISTINCTION-only criteria (K6, S1,
// S7, S11) which the tool already flags via ksbs.ts. Where the source bank
// listed a bullet as a follow-up to the one before it (referring back with
// "this", "that", "these" etc.), the two are folded into one question so
// they're asked together rather than being drawn independently at random.
// ---------------------------------------------------------------------------
export const PROJECT_QUESTIONS: Question[] = [
  // ---- Project / context questions ----
  { id: "p01", phase: "project", tags: [], text: "Can you give me an overview of your project, and what you completed?" },
  { id: "p02", phase: "project", tags: [], text: "What was the outcome of the project?" },
  { id: "p03", phase: "project", tags: [], text: "What is the business value of this project?" },
  { id: "p04", phase: "project", tags: [], text: "How do you feel the project went?" },
  { id: "p05", phase: "project", tags: [], text: "What went well, is there anything you would improve?" },
  { id: "p06", phase: "project", tags: [], text: "Is the project completed? If not, what are the next steps?" },
  { id: "p07", phase: "project", tags: [], text: "Did you encounter any unexpected blockers during the project, if so, how did you deal with these?" },
  { id: "p08", phase: "project", tags: [], text: "Do you feel the project meets the client/stakeholder brief?" },

  // ---- K2: roles/responsibilities across the lifecycle, and the project ----
  { id: "p09", phase: "project", tags: ["K2"], text: "You worked with a designer on this project. What were their roles in terms of the software development lifecycle, compared to your own?" },

  // ---- K6: how teams work effectively, and own contribution (distinction) ----
  { id: "p10", phase: "project", tags: ["K6"], text: "How does a software team work?" },
  { id: "p11", phase: "project", tags: ["K6"], text: "How do you contribute to the team?" },
  { id: "p12", phase: "project", tags: ["K6"], text: "Who worked on this project with you? What did they do? What was your important role?" },
  { id: "p13", phase: "project", tags: ["K6"], text: "How did you ensure you worked effectively with others to make this project happen?" },
  { id: "p13d", phase: "project", tags: ["K6"], text: "If someone else on the team had taken a different approach to dividing up the work, what would you have lost or gained? How did you make sure everyone - including you - had a genuine contribution to make?" },

  // ---- K9, S16: algorithms, logic and data structures ----
  { id: "p14", phase: "project", tags: ["K9", "S16"], text: "What is an algorithm?" },
  { id: "p15", phase: "project", tags: ["K9", "S16"], text: "Tell me about some data structures you use." },
  { id: "p16", phase: "project", tags: ["K9", "S16"], text: "Let's say you're out for dinner and your wine waiter brings you a list of a million different wines. You usually like to order the second cheapest, but they're all randomly ordered so you can't tell which one that is. What algorithm would be most appropriate?" },
  { id: "p17", phase: "project", tags: ["K9", "S16"], text: "Let's say I wanted you to build a system to keep track of all of someone's children and grand-children. What would you use?" },
  { id: "p18", phase: "project", tags: ["K9", "S16"], text: "What data structures have you used in this project? If you used a hash for a particular task, why was that the right choice?" },
  { id: "p19", phase: "project", tags: ["K9", "S16"], text: "Let's say that you had ten million users, and you only wanted to find the users with the favourite colour orange, and you only ever wanted to do it once — what approach would you use, and what's the performance tradeoff of using a hash there?" },

  // ---- K11, S11, S12: software design vs functional/technical specs ----
  { id: "p20", phase: "project", tags: ["K11", "S11", "S12"], text: "What role have you played in designing the solutions to the tasks you are given?" },
  { id: "p21", phase: "project", tags: ["K11", "S11", "S12"], text: "When you're given a ticket to do, what is in it? Are you given software designs as well?" },
  { id: "p22", phase: "project", tags: ["K11", "S11", "S12"], text: "I see you decided to use a functional paradigm for this project. Why - and could you point to some examples of the functional techniques you used?" },
  { id: "p23", phase: "project", tags: ["K11", "S11", "S12"], text: "Does your project have a system diagram [technical spec]? How do you use it?" },
  { id: "p24", phase: "project", tags: ["K11", "S11", "S12"], text: "Are there technical standards you have to conform to in your job? For example, automated checks or a quality checklist?" },

  // ---- S1: logical and maintainable code (distinction) ----
  { id: "p25", phase: "project", tags: ["S1"], text: "Talk me through how you wrote the code in this project. What about how you structured it, and how did you ensure it would make sense to others?" },
  { id: "p25d", phase: "project", tags: ["S1"], text: "Was there a different way you could have structured this code? What made your approach more maintainable than that alternative, rather than just functional?" },

  // ---- S4: unit testing results and correcting errors ----
  { id: "p26", phase: "project", tags: ["S4"], text: "What testing methodology did you apply for this project - and if you wrote your tests after the code, why?" },

  // ---- S6: test scenarios against the project specification ----
  { id: "p27", phase: "project", tags: ["S6"], text: "How did you verify that the software met the specification from a user perspective?" },

  // ---- S7: structured problem solving and debugging (distinction) ----
  { id: "p28", phase: "project", tags: ["S7"], text: "Tell me about a specific bug you found and logged. What's your general approach to debugging?" },
  { id: "p28d", phase: "project", tags: ["S7"], text: "Convince me this was a genuinely complex issue, not a simple one. What made your fix a permanent solution, rather than a workaround that happened to hold?" },

  // ---- S10: building, managing and deploying code ----
  { id: "p29", phase: "project", tags: ["S10"], text: "How did you deploy this project - for example, how did you move it (or its container) onto the server?" },

  // ---- B2: logical thinking and justified decision making ----
  { id: "p30", phase: "project", tags: ["B2"], text: "Tell me about why you made the decision XYZ." },

  // ---- B3: productive, professional and secure working environment ----
  { id: "p31", phase: "project", tags: ["B3"], text: "How did you maintain productivity - for yourself and other stakeholders - throughout this project?" },

  // ---- S11 (distinction): justify the paradigm against a real alternative ----
  { id: "p32", phase: "project", tags: ["S11"], text: "On the ticket you're working on at the moment, what programming paradigm are you using, and why do you think the team decided to use it?" },
];

// ---------------------------------------------------------------------------
// Professional discussion (AM2) - SDv1.1 Interview questions, generic EPA
// bank. Context questions carry no KSB tags; criteria questions are tagged
// per the assessment criteria doc, including the DISTINCTION-only criteria
// (K4, S15, B7 comms cluster; K7; K12) which ksbs.ts already flags. Where
// the source bank listed a bullet as a follow-up to the one before it
// (referring back with "this", "that", "these" etc.), the two are folded
// into one question so they're asked together rather than being drawn
// independently at random.
// ---------------------------------------------------------------------------
export const DISCUSSION_QUESTIONS: Question[] = [
  // ---- Get to know you / context questions ----
  { id: "d01", phase: "discussion", tags: [], text: "Tell me about you, why did you apply for this Apprenticeship?" },
  { id: "d02", phase: "discussion", tags: [], text: "What is your job and job role?" },
  { id: "d03", phase: "discussion", tags: [], text: "Tell me about the company. What do they do?" },
  { id: "d04", phase: "discussion", tags: [], text: "What are the current major projects?" },
  { id: "d05", phase: "discussion", tags: [], text: "How many people are on your team (or who do you work with?)" },
  { id: "d06", phase: "discussion", tags: [], text: "How do you work with the other members of the team?" },
  { id: "d07", phase: "discussion", tags: [], text: "How do you manage your workload?" },
  { id: "d08", phase: "discussion", tags: [], text: "How are you allocated work?" },
  { id: "d09", phase: "discussion", tags: [], text: "Do you have an incident management system where you review tickets?" },
  { id: "d10", phase: "discussion", tags: [], text: "How do you know you are having an impact on your team?" },
  { id: "d11", phase: "discussion", tags: [], text: "How do you know you are progressing?" },

  // ---- K1: all stages of the software development lifecycle ----
  { id: "d12", phase: "discussion", tags: ["K1"], text: "What's the software development life-cycle, and what are its stages?" },
  { id: "d13", phase: "discussion", tags: ["K1"], text: "In your team, what is the deployment phase of the software development life-cycle?" },

  // ---- K3: roles/responsibilities of the project lifecycle, and own role ----
  { id: "d14", phase: "discussion", tags: ["K3"], text: "What tasks do you perform in the SD lifecycle?" },
  { id: "d15", phase: "discussion", tags: ["K3"], text: "Talk me through your team and their roles?" },
  { id: "d16", phase: "discussion", tags: ["K3"], text: "What's your stage in the software development lifecycle. How does your stage work with others?" },
  { id: "d17", phase: "discussion", tags: ["K3"], text: "Tell me about your role, where does your role fit in the team." },

  // ---- K4, S15: communicating with stakeholders by audience/technical level ----
  { id: "d18", phase: "discussion", tags: ["K4", "S15"], text: "How did you work with others to achieve what you needed - what was the outcome?" },
  { id: "d19", phase: "discussion", tags: ["K4", "S15"], text: "Give me an example of team working? How do you share information? Is it documented?" },

  // ---- K5: agile vs waterfall ----
  { id: "d20", phase: "discussion", tags: ["K5"], text: "What is Agile and/or Waterfall? What does your team/company use, and how does that work in practice?" },
  { id: "d21", phase: "discussion", tags: ["K5"], text: "How do you contribute to your team's software development methodologies, and how does following that methodology impact your work?" },
  { id: "d22", phase: "discussion", tags: ["K5"], text: "What do agile and waterfall have in common - and what makes agile specifically agile?" },
  { id: "d23", phase: "discussion", tags: ["K5"], text: "What are the advantages and disadvantages of using these methodologies?" },

  // ---- K7: design approaches and patterns; reusable solutions (distinction) ----
  { id: "d24", phase: "discussion", tags: ["K7"], text: "What is model-view-controller architecture and why is it useful?" },
  { id: "d25", phase: "discussion", tags: ["K7"], text: "Did you use any design patterns in this work? Why did you use MVC, if so?" },
  { id: "d26", phase: "discussion", tags: ["K7"], text: "How did you structure this system?" },
  { id: "d27", phase: "discussion", tags: ["K7"], text: "What is object oriented programming?" },
  { id: "d27d", phase: "discussion", tags: ["K7"], text: "Beyond MVC, what other patterns or off-the-shelf solutions did you consider for this? Why did the one you picked beat the alternatives?" },

  // ---- K8, S14: organisational policies, CI, version/source control ----
  { id: "d28", phase: "discussion", tags: ["K8", "S14"], text: "What is GDPR? What does it apply to - could you give an example?" },
  { id: "d29", phase: "discussion", tags: ["K8", "S14"], text: "What regulations apply to the work you do?" },
  { id: "d30", phase: "discussion", tags: ["K8", "S14"], text: "What's a pull request?" },
  { id: "d31", phase: "discussion", tags: ["K8", "S14"], text: "Talk me through your team's approach to source control and continuous integration." },

  // ---- K10: relational and non-relational databases ----
  { id: "d32", phase: "discussion", tags: ["K10"], text: "What's a relational database? How do those relationships work, and what other kinds of relationships are there?" },
  { id: "d33", phase: "discussion", tags: ["K10"], text: "What is the difference between a relational and non-relational database, and when should you use one over the other?" },
  { id: "d34", phase: "discussion", tags: ["K10"], text: "What's a non-relational database? Give an example." },
  { id: "d35", phase: "discussion", tags: ["K10"], text: "What database does your project use? Could you tell me a bit about what kind of database that is, and how you'd implement the same thing in a non-relational database - for example a document database?" },
  { id: "d36", phase: "discussion", tags: ["K10"], text: "Could you walk me through a table in your database that implements a many-to-many relationship? How does it work?" },
  { id: "d37", phase: "discussion", tags: ["K10"], text: "Could you give an example of a 'relationship' in project X?" },

  // ---- K12: software testing frameworks and methodologies ----
  { id: "d38", phase: "discussion", tags: ["K12"], text: "Why did you decide to choose that particular testing framework for this project? How did you use it, and what are some of the positives and negatives of using it?" },
  { id: "d39", phase: "discussion", tags: ["K12"], text: "What testing framework do you use?" },
  { id: "d40", phase: "discussion", tags: ["K12"], text: "How do you do testing in your team?" },

  // ---- S2: approach to development of user interfaces ----
  { id: "d41", phase: "discussion", tags: ["S2"], text: "Who are the users of your system, and what work have you done on the parts of the system they use?" },
  { id: "d42", phase: "discussion", tags: ["S2"], text: "How did you ensure users had a good experience interacting with those fields, including support for users with impairments - for example, those who can't see them?" },

  // ---- S3: linking code to data sets ----
  { id: "d43", phase: "discussion", tags: ["S3"], text: "Does your system use a database, and what code do you write that interacts with it? What about search infrastructure like ElasticSearch?" },

  // ---- S5, S13: test types (integration, system, UAT, non-functional, etc.) ----
  { id: "d44", phase: "discussion", tags: ["S5", "S13"], text: "How did you test the reliability of this system?" },
  { id: "d45", phase: "discussion", tags: ["S5", "S13"], text: "I see acceptance criteria in your tickets — how did you test these?" },

  // ---- S8: simple software designs to communicate understanding ----
  { id: "d46", phase: "discussion", tags: ["S8"], text: "Talk me through a diagram you've created - what does it describe, and how did you use it to communicate your ideas to your colleagues?" },

  // ---- S9: analysis artefacts (use cases, user stories) ----
  { id: "d47", phase: "discussion", tags: ["S9"], text: "What is your/your team's approach to creating analysis artefacts, and how have you been involved in that process?" },
  { id: "d48", phase: "discussion", tags: ["S9"], text: "Why did you write your ticket in this format starting with 'As a user'?" },

  // ---- S17: implementing a design compliant with security/maintainability ----
  { id: "d49", phase: "discussion", tags: ["S17"], text: "In ticket Y you were given a design to implement. What consideration did you give to security here?" },
  { id: "d50", phase: "discussion", tags: ["S17"], text: "In ticket Y you were given a design to implement which required some changes to existing code. How did you balance the importance of implementing the design as intended, with assuring the maintainability of the system?" },

  // ---- B1: operating independently to meet deadlines and responsibility ----
  { id: "d51", phase: "discussion", tags: ["B1"], text: "Example of a task from start to finish, including difficult parts and how they were overcome." },
  { id: "d52", phase: "discussion", tags: ["B1"], text: "Tell me about a time in your role where you've had to step up and take responsibility for your work." },

  // ---- B4: collaborative working across roles, inclusion & diversity ----
  { id: "d53", phase: "discussion", tags: ["B4"], text: "Have you experienced any challenges with communicating with people in your business?" },

  // ---- B5: integrity, ethics, legal/regulatory, data protection ----
  { id: "d54", phase: "discussion", tags: ["B5"], text: "What is GDPR? What does it apply to, and how does it apply to you specifically?" },
  { id: "d55", phase: "discussion", tags: ["B5"], text: "How do you ensure data is kept safe at work, and why does that matter at your workplace?" },
  { id: "d56", phase: "discussion", tags: ["B5"], text: "What do you do in the event of a data breach?" },
  { id: "d57", phase: "discussion", tags: ["B5"], text: "How do your personal ethics come into your work as a software engineer?" },

  // ---- B6: responding to unexpected minor changes, using initiative ----
  { id: "d58", phase: "discussion", tags: ["B6"], text: "Talk me through a problem you have experienced - what were your steps, how did you work through it, and what solution did you find? How did you use your initiative to decide which solution was best?" },
  { id: "d59", phase: "discussion", tags: ["B6"], text: "Did you escalate that problem at any point? How did you decide when the best time to escalate was?" },

  // ---- B7: effective communication, technical and non-technical (distinction) ----
  { id: "d60", phase: "discussion", tags: ["B7"], text: "Tell me about a time when you communicated to a tech/non-tech audience. How did you tailor your communication for the different audiences, and why was that beneficial?" },

  // ---- B8: curiosity, exploring new techniques, tenacity ----
  { id: "d61", phase: "discussion", tags: ["B8"], text: "Tell me about the context of the ticket you're solving right now - who's using it, who's paying for it, why, and what are their lives like? How do you integrate that understanding into your work?" },

  // ---- B9: continued professional development, own initiative ----
  { id: "d62", phase: "discussion", tags: ["B9"], text: "What CPD have you completed over the course of this Apprenticeship, and why was that particular course/topic important to you?" },
  { id: "d63", phase: "discussion", tags: ["B9"], text: "What learning or skills have you developed through that CPD, how have you applied it in a ticket or project, and how has it added value to your business?" },
  { id: "d64", phase: "discussion", tags: ["B9"], text: "What have you learned over your apprenticeship based on your own initiative?" },
  { id: "d65", phase: "discussion", tags: ["B9"], text: "What have you done to develop as a software developer in the past month?" },
  { id: "d66", phase: "discussion", tags: ["B9"], text: "How do you know you are making progress?" },

  // ---- DISTINCTION: K4, S15, B7 comms cluster - compare/contrast methods ----
  { id: "d67", phase: "discussion", tags: ["K4", "S15", "B7"], text: "Have you demo-ed or presented before? If so, what were the key points you needed to get across when communicating?" },
  { id: "d68", phase: "discussion", tags: ["K4", "S15", "B7"], text: "How do you communicate with your team? What are the benefits or disadvantages of using this method?" },
  { id: "d69", phase: "discussion", tags: ["K4", "S15", "B7"], text: "Who are your end users or stakeholders, and how do you ensure their needs are being met when working on a given project? If you don't speak to them directly, what does that chain of communication look like?" },
  { id: "d70", phase: "discussion", tags: ["K4", "S15", "B7"], text: "How does feedback from a stakeholder or end user get to you, and have you had to change something in a project following that feedback?" },
  { id: "d71", phase: "discussion", tags: ["K4", "S15", "B7"], text: "How does your communication change when speaking to someone technical vs non-technical?" },
  { id: "d72", phase: "discussion", tags: ["K4", "S15", "B7"], text: "Tell me about a time you communicated with someone outside of your team. How have you influenced them with your communication?" },
  { id: "d73", phase: "discussion", tags: ["K4", "S15", "B7"], text: "Tell me about a time when your communication has had a positive impact. How did you know?" },
  { id: "d74", phase: "discussion", tags: ["K4", "S15", "B7"], text: "How do the designers communicate as compared to the developers, and what sorts of documents do they use differently?" },
  { id: "d75", phase: "discussion", tags: ["K4", "S15", "B7"], text: "How do you speak to clients as opposed to your colleagues, and how do you use that to communicate effectively with these different audiences?" },

  // ---- DISTINCTION: K12 - evaluate testing frameworks/methodologies, justify choice ----
  { id: "d76", phase: "discussion", tags: ["K12"], text: "Why does your company - and this project specifically - use these particular languages or testing frameworks? What are the benefits and disadvantages of using them, and what best practices do you follow?" },
  { id: "d77", phase: "discussion", tags: ["K12"], text: "Tell me about a time when you have successfully used these languages or frameworks." },
  { id: "d78", phase: "discussion", tags: ["K12"], text: "How have you been involved in these conversations or discussions?" },
];

export function bankFor(phase: Phase): Question[] {
  return phase === "discussion" ? DISCUSSION_QUESTIONS : PROJECT_QUESTIONS;
}

export function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Refs cite one or more portfolio pages ("p.30-31", "p.11/15/17", "p.58-59").
// Take the first page number mentioned as the one to preview.
export function firstPortfolioPage(ref: string): number | null {
  const match = ref.match(/p\.(\d+)/);
  return match ? Number(match[1]) : null;
}
