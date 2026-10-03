import type { Note } from "./types";
import { toISODate } from "./utils";

/**
 * Real-looking content, deliberately not lorem ipsum. Shown on first launch so the
 * vault never feels empty, and reused by the marketing site's "vault" sequence.
 */
export function seedNotes(now = new Date()): Note[] {
  const d = (offset: number) => {
    const x = new Date(now);
    x.setDate(x.getDate() + offset);
    return toISODate(x);
  };
  const ts = (offsetH: number) => new Date(now.getTime() - offsetH * 3600_000).toISOString();

  return [
    {
      id: "seed_01",
      title: "Portfolio case study — MindVault",
      content:
        "Write the story, not the feature list. Open with the problem (scattered thoughts, five apps), then the metaphor: a vault made of light.\n\nStructure: context → constraints → craft → outcome. Include the 60s film of the scroll sequence.",
      checklist: [
        { id: "c1", text: "Record the vault-opening sequence at 60fps", done: true },
        { id: "c2", text: "Write the 'why monochrome' paragraph", done: false },
        { id: "c3", text: "Export OG image 1200×630", done: false },
      ],
      date: d(0),
      time: "14:00",
      priority: "high",
      category: "work",
      tags: ["portfolio", "design"],
      pinned: true,
      createdAt: ts(30),
      updatedAt: ts(2),
    },
    {
      id: "seed_02",
      title: "Reading: The Shape of Design",
      content:
        "\"The desire to be understood is the desire to be seen.\" Chapter on improvisation — design as jazz, structure that leaves room.\n\nRevisit the chapter on gifts when writing the manifesto.",
      checklist: [],
      date: d(1),
      priority: "low",
      category: "ideas",
      tags: ["reading", "craft"],
      pinned: false,
      createdAt: ts(80),
      updatedAt: ts(20),
    },
    {
      id: "seed_03",
      title: "Run — 10k tempo",
      content: "Zone 3, negative split. Warm up 2k easy, 6k at 4:40/km, 2k cool down. Hydrate the night before.",
      checklist: [
        { id: "c1", text: "Charge the watch", done: true },
        { id: "c2", text: "Lay out kit", done: false },
      ],
      date: d(0),
      time: "07:00",
      priority: "medium",
      category: "health",
      tags: ["running"],
      pinned: false,
      createdAt: ts(50),
      updatedAt: ts(9),
    },
    {
      id: "seed_04",
      title: "Q4 budget — subscriptions audit",
      content:
        "Cancel the two design tools I haven't opened since June. Move domain renewals to the annual plan. Total monthly saving ≈ €64.",
      checklist: [
        { id: "c1", text: "List every recurring charge", done: true },
        { id: "c2", text: "Cancel unused tools", done: false },
        { id: "c3", text: "Switch domains to annual", done: false },
      ],
      date: d(3),
      priority: "medium",
      category: "finance",
      tags: ["money"],
      pinned: false,
      createdAt: ts(120),
      updatedAt: ts(30),
    },
    {
      id: "seed_05",
      title: "Idea: notes that remember where you were",
      content:
        "A note reopens exactly at the sentence you left. Scroll position, caret, even the time of day as ambient context. Small detail, enormous feeling of continuity.",
      checklist: [],
      priority: "low",
      category: "ideas",
      tags: ["product", "ux"],
      pinned: true,
      createdAt: ts(200),
      updatedAt: ts(60),
    },
    {
      id: "seed_06",
      title: "Call with Léa — grant application",
      content: "Bring the timeline and the two-page summary. She asked for the risk section to be more honest, less polished.",
      checklist: [{ id: "c1", text: "Print the summary", done: false }],
      date: d(2),
      time: "11:30",
      priority: "urgent",
      category: "work",
      tags: ["meeting"],
      pinned: false,
      createdAt: ts(40),
      updatedAt: ts(5),
    },
    {
      id: "seed_07",
      title: "Weekend: Marseille",
      content: "Train Friday 18:04. Calanques on Saturday if the wind drops. Bring the film camera — the light at Sormiou at 7pm.",
      checklist: [
        { id: "c1", text: "Book the train", done: true },
        { id: "c2", text: "Buy film", done: false },
      ],
      date: d(5),
      priority: "low",
      category: "personal",
      tags: ["travel"],
      pinned: false,
      createdAt: ts(150),
      updatedAt: ts(48),
    },
  ];
}
