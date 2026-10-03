import { describe, expect, it } from "vitest";
import { classify, detectLang, fuzzyEq, localAnswer, type NoteContext } from "../ai-local";

const notes: NoteContext[] = [
  { title: "Dentist", content: "Bring the card", date: "2026-09-16", time: "09:30", endTime: "10:00", priority: "high", category: "health", tags: ["health"], checklist: [{ text: "Bring the card", done: false }] },
  { title: "Rapport trimestriel", content: "Relire les chiffres", date: "2026-09-17", time: "14:00", priority: "urgent", category: "work", tags: ["work"], checklist: [] },
  { title: "Marseille weekend", content: "Train Friday", date: "2026-09-20", priority: "low", category: "personal", tags: ["travel"], checklist: [{ text: "Buy film", done: true }] },
];
const today = "2026-09-16";

describe("language detection", () => {
  it("detects French, English, Spanish, German", () => {
    expect(detectLang("bonjour, que dois je faire aujourd'hui ?")).toBe("fr");
    expect(detectLang("what should I do today")).toBe("en");
    expect(detectLang("hola, qué tengo hoy")).toBe("es");
    expect(detectLang("hallo, was steht heute an")).toBe("de");
    expect(detectLang("???", "fr")).toBe("fr");
  });
});

describe("fuzzy matching + intents", () => {
  it("tolerates typos and stems", () => {
    expect(fuzzyEq("aujourdhui", "aujourd")).toBe(true);
    expect(fuzzyEq("prioritee", "priorit")).toBe(true);
    expect(fuzzyEq("tomorow", "tomorrow")).toBe(true);
    expect(fuzzyEq("cat", "category")).toBe(false);
  });
  it("classifies small talk and questions", () => {
    expect(classify("hi")).toBe("greeting");
    expect(classify("Bonjour !")).toBe("greeting");
    expect(classify("merci")).toBe("thanks");
    expect(classify("ça va ?")).toBe("howareyou");
    expect(classify("what can you do")).toBe("help");
    expect(classify("que dois-je faire aujourdhui")).toBe("today");
    expect(classify("qu est ce qu il me reste a faire")).toBe("tasks");
    expect(classify("sur quoi me concentrer")).toBe("priority");
    expect(classify("what about tomorow")).toBe("tomorrow");
    expect(classify("resume tout")).toBe("summary");
    expect(classify("combien de notes j ai")).toBe("count");
    expect(classify("dentist")).toBe("search");
  });
});

describe("answers", () => {
  it("greets back in the user's language", () => {
    expect(localAnswer("Bonjour", notes, today)).toMatch(/^Salut/);
    expect(localAnswer("hey", notes, today)).toMatch(/^Hi/);
    expect(localAnswer("hola", notes, today)).toMatch(/Hola/);
  });
  it("answers the day in French with times and end time", () => {
    const a = localAnswer("c'est quoi ma journée aujourd'hui", notes, today);
    expect(a).toContain("Voici ta journée");
    expect(a).toContain("**Dentist** à 09:30–10:00");
    expect(a).toContain("Commence par **Dentist**");
  });
  it("handles tomorrow, priorities, tasks, count", () => {
    expect(localAnswer("what about tomorrow", notes, today)).toContain("Rapport trimestriel");
    expect(localAnswer("sur quoi me concentrer ?", notes, today)).toContain("**Rapport trimestriel**");
    expect(localAnswer("what's left to do", notes, today)).toContain("Bring the card");
    expect(localAnswer("combien de notes", notes, today)).toContain("**3 notes**");
  });
  it("finds notes by fuzzy keyword and falls back gracefully", () => {
    expect(localAnswer("dentsit", notes, today)).toContain("**Dentist**");
    expect(localAnswer("marseile", notes, today)).toContain("**Marseille weekend**");
    expect(localAnswer("licorne violette", notes, today, "fr")).toMatch(/rien trouvé/); // browser language as fallback
  });
  it("explains itself on an empty vault", () => {
    expect(localAnswer("ma journée", [], today)).toMatch(/vide/);
  });
});