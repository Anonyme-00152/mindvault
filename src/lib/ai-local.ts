/**
 * Offline assistant ("demo mode"). Runs when no OPENAI_API_KEY is configured and
 * always on the public marketing demo. It understands casual chat and questions
 * about the vault in several languages, tolerates typos (fuzzy matching), and
 * answers in the language of the question. Still grounded only in the notes.
 */
export interface NoteContext {
  title: string;
  content: string;
  date?: string;
  time?: string;
  endTime?: string;
  priority: string;
  category: string;
  tags: string[];
  checklist: { text: string; done: boolean }[];
}

export type Lang = "en" | "fr" | "es" | "de" | "it" | "pt";

const P_ORDER: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

/* ── text utils ──────────────────────────────────────────────────────── */
export function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’']/g, " ")
    .replace(/[^a-z0-9\s?!]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function levenshtein(a: string, b: string) {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

/** Does a token match a keyword, allowing stems and small typos? */
export function fuzzyEq(token: string, kw: string) {
  if (token === kw) return true;
  if (kw.length >= 4 && token.startsWith(kw)) return true;
  if (token.length >= 4 && kw.startsWith(token) && token.length >= kw.length - 2) return true;
  const tol = kw.length >= 7 ? 2 : kw.length >= 5 ? 1 : 0;
  return tol > 0 && levenshtein(token, kw) <= tol;
}

function hasAny(tokens: string[], kws: string[]) {
  return tokens.some((t) => kws.some((k) => fuzzyEq(t, k)));
}
function hasPhrase(text: string, phrases: string[]) {
  return phrases.some((p) => text.includes(p));
}

/* ── language detection ──────────────────────────────────────────────── */
const LANG_HINTS: Record<Lang, string[]> = {
  fr: ["je", "tu", "le", "la", "les", "des", "est", "que", "quoi", "dois", "faire", "aujourd", "demain", "mes", "bonjour", "salut", "merci", "quelles", "quel", "quelle", "semaine", "taches", "tache", "resume", "priorite", "reste", "cette", "avec", "ma", "mon", "journee", "coucou"],
  en: ["the", "what", "should", "today", "tomorrow", "my", "hello", "hi", "hey", "thanks", "thank", "week", "tasks", "task", "summary", "left", "focus", "do", "i", "is", "are", "have"],
  es: ["hola", "hoy", "manana", "mis", "gracias", "tareas", "tarea", "semana", "resumen", "debo", "hacer", "tengo", "buenos", "buenas", "cuales", "prioridad", "mi"],
  de: ["hallo", "was", "heute", "morgen", "meine", "danke", "aufgaben", "aufgabe", "woche", "zusammenfassung", "soll", "ich", "machen", "habe", "welche", "guten", "mein"],
  it: ["ciao", "cosa", "oggi", "domani", "mie", "grazie", "compiti", "settimana", "riassunto", "devo", "fare", "quali", "buongiorno", "salve", "mia"],
  pt: ["ola", "hoje", "amanha", "minhas", "obrigado", "obrigada", "tarefas", "tarefa", "semana", "resumo", "devo", "fazer", "quais", "bom", "boa", "meu", "minha"],
};

export function detectLang(text: string, fallback: Lang = "en"): Lang {
  const tokens = normalize(text).split(" ").filter(Boolean);
  if (tokens.length === 0) return fallback;
  const scores = (Object.keys(LANG_HINTS) as Lang[]).map((l) => ({ l, s: tokens.filter((t) => LANG_HINTS[l].includes(t)).length }));
  scores.sort((a, b) => b.s - a.s);
  if (scores[0].s === 0) return fallback;
  if (scores[0].s === scores[1]?.s && scores[0].l === "en") return scores[1].l;
  return scores[0].l;
}

/* ── intents ─────────────────────────────────────────────────────────── */
export type Intent = "greeting" | "howareyou" | "thanks" | "bye" | "help" | "who" | "today" | "tomorrow" | "week" | "priority" | "tasks" | "summary" | "count" | "create" | "search";

const KW = {
  greeting: ["hello", "hi", "hey", "yo", "bonjour", "bonsoir", "salut", "coucou", "hola", "buenos", "buenas", "hallo", "guten", "servus", "ciao", "buongiorno", "salve", "ola", "bom", "boa", "good"],
  howareyou: ["how are you", "ca va", "comment vas", "comment tu vas", "como estas", "que tal", "wie geht", "come stai", "come va", "como vai", "tudo bem", "whats up", "what s up", "how s it going"],
  thanks: ["thanks", "thank", "thx", "merci", "gracias", "danke", "grazie", "obrigado", "obrigada", "cheers"],
  bye: ["bye", "goodbye", "see you", "au revoir", "a plus", "bonne nuit", "adios", "hasta", "tschuss", "auf wiedersehen", "arrivederci", "tchau", "adeus"],
  help: ["help", "aide", "aider", "ayuda", "hilfe", "aiuto", "ajuda", "can you do", "peux tu faire", "sais faire", "que sabes", "was kannst", "cosa sai", "o que voce"],
  who: ["who are you", "qui es tu", "t es qui", "quien eres", "wer bist", "chi sei", "quem e voce", "what are you", "tu es quoi"],
  today: ["today", "aujourd", "auj", "hoy", "heute", "oggi", "hoje", "tonight", "ce soir", "this morning", "ce matin", "journee", "day", "agenda", "planning", "schedule", "programme"],
  tomorrow: ["tomorrow", "demain", "manana", "morgen", "domani", "amanha"],
  week: ["week", "semaine", "semana", "woche", "settimana", "weekend"],
  priority: ["priority", "priorit", "important", "urgent", "focus", "first", "d abord", "concentrer", "prioridad", "prioritat", "priorita", "prioridade", "wichtig", "importante", "essentiel", "commencer"],
  tasks: ["task", "tache", "taches", "todo", "checklist", "left", "remaining", "reste", "restant", "unfinished", "pending", "tarea", "tareas", "aufgabe", "aufgaben", "compit", "tarefa", "tarefas"],
  summary: ["summary", "summar", "overview", "resume", "recap", "everything", "tout", "all", "resumen", "zusammenfass", "uberblick", "riassunto", "resumo", "bilan"],
  count: ["how many", "combien", "cuantas", "cuantos", "wie viele", "quante", "quanti", "quantas", "quantos", "nombre de"],
  create: ["create", "add", "new note", "creer", "cree", "ajoute", "ajouter", "nouvelle note", "crear", "anadir", "erstell", "hinzufug", "crea", "aggiungi", "criar", "adicionar", "remind me", "rappelle moi"],
};

export function classify(text: string): Intent {
  const norm = normalize(text);
  const tokens = norm.split(" ").filter(Boolean);
  const short = tokens.length <= 3;
  if (hasPhrase(norm, KW.howareyou)) return "howareyou";
  if (hasPhrase(norm, KW.who)) return "who";
  if (hasPhrase(norm, KW.help) || hasAny(tokens, ["help", "aide", "ayuda", "hilfe", "aiuto", "ajuda"])) return "help";
  if (short && hasAny(tokens, KW.thanks)) return "thanks";
  if (short && hasAny(tokens, KW.bye)) return "bye";
  if (short && hasAny(tokens, KW.greeting)) return "greeting";
  if (hasPhrase(norm, KW.count)) return "count";
  if (hasAny(tokens, KW.create) && !hasAny(tokens, KW.tasks)) return "create";
  if (hasAny(tokens, KW.tomorrow)) return "tomorrow";
  if (hasAny(tokens, KW.week)) return "week";
  if (hasAny(tokens, KW.priority)) return "priority";
  if (hasAny(tokens, KW.tasks) || hasPhrase(norm, ["a faire", "to do", "que faire", "quoi faire"])) return "tasks";
  if (hasAny(tokens, KW.today) || hasPhrase(norm, ["what should i do", "que dois je faire", "que hago", "was soll ich", "cosa devo", "o que devo"])) return "today";
  if (hasAny(tokens, KW.summary)) return "summary";
  if (hasAny(tokens, KW.greeting) && tokens.length <= 6) return "greeting";
  return "search";
}

/* ── phrasebook ──────────────────────────────────────────────────────── */
type T = Record<Lang, string>;
const t = (en: string, fr: string, es: string, de: string, it: string, pt: string): T => ({ en, fr, es, de, it, pt });

const PH = {
  greeting: t("Hi! I'm Vault, the assistant inside your notes. Ask me what's on today, what to focus on, or what's left to do.", "Salut ! Je suis Vault, l'assistant de tes notes. Demande-moi ce qu'il y a aujourd'hui, sur quoi te concentrer, ou ce qu'il te reste à faire.", "¡Hola! Soy Vault, el asistente de tus notas. Pregúntame qué hay hoy, en qué centrarte o qué queda por hacer.", "Hallo! Ich bin Vault, der Assistent deiner Notizen. Frag mich, was heute ansteht, worauf du dich konzentrieren sollst oder was noch offen ist.", "Ciao! Sono Vault, l'assistente delle tue note. Chiedimi cosa c'è oggi, su cosa concentrarti o cosa resta da fare.", "Olá! Sou o Vault, o assistente das tuas notas. Pergunta-me o que há hoje, em que te concentrar ou o que falta fazer."),
  howareyou: t("All good — sealed tight and ready. How can I help?", "Tout va bien — bien au chaud dans le coffre. Je peux t'aider ?", "Todo bien — listo para ayudar. ¿Qué necesitas?", "Alles gut — bereit zu helfen. Was brauchst du?", "Tutto bene — pronto ad aiutare. Cosa ti serve?", "Tudo bem — pronto para ajudar. O que precisas?"),
  thanks: t("Anytime.", "Avec plaisir.", "Cuando quieras.", "Gern geschehen.", "Di nulla.", "De nada."),
  bye: t("See you. Your notes stay right here.", "À plus. Tes notes restent ici.", "Hasta luego. Tus notas se quedan aquí.", "Bis später. Deine Notizen bleiben hier.", "A presto. Le tue note restano qui.", "Até logo. As tuas notas ficam aqui."),
  who: t("I'm Vault, a small assistant that only reads your notes — nothing else. In demo mode I run without any external model; connect an OpenAI key on the server for full conversations.", "Je suis Vault, un petit assistant qui ne lit que tes notes — rien d'autre. En mode démo je fonctionne sans modèle externe ; ajoute une clé OpenAI côté serveur pour des conversations complètes.", "Soy Vault, un asistente que solo lee tus notas. En modo demo funciono sin modelo externo; añade una clave OpenAI en el servidor para conversaciones completas.", "Ich bin Vault, ein Assistent, der nur deine Notizen liest. Im Demomodus ohne externes Modell; mit einem OpenAI-Schlüssel auf dem Server gibt es volle Gespräche.", "Sono Vault, un assistente che legge solo le tue note. In modalità demo senza modello esterno; aggiungi una chiave OpenAI sul server per conversazioni complete.", "Sou o Vault, um assistente que só lê as tuas notas. Em modo demo funciono sem modelo externo; adiciona uma chave OpenAI no servidor para conversas completas."),
  help: t("I can tell you:\n• what's on **today**, **tomorrow** or **this week**\n• what to **focus** on first\n• what **tasks** are left\n• a **summary** of everything\n• or find a note by keyword.", "Je peux te dire :\n• ce qu'il y a **aujourd'hui**, **demain** ou **cette semaine**\n• sur quoi te **concentrer** en premier\n• quelles **tâches** il reste\n• un **résumé** de tout\n• ou retrouver une note par mot-clé.", "Puedo decirte:\n• qué hay **hoy**, **mañana** o **esta semana**\n• en qué **centrarte** primero\n• qué **tareas** quedan\n• un **resumen** de todo\n• o buscar una nota por palabra clave.", "Ich kann dir sagen:\n• was **heute**, **morgen** oder **diese Woche** ansteht\n• worauf du dich zuerst **konzentrieren** solltest\n• welche **Aufgaben** offen sind\n• eine **Zusammenfassung** von allem\n• oder eine Notiz per Stichwort finden.", "Posso dirti:\n• cosa c'è **oggi**, **domani** o **questa settimana**\n• su cosa **concentrarti** prima\n• quali **compiti** restano\n• un **riassunto** di tutto\n• o trovare una nota per parola chiave.", "Posso dizer-te:\n• o que há **hoje**, **amanhã** ou **esta semana**\n• em que te **concentrar** primeiro\n• que **tarefas** faltam\n• um **resumo** de tudo\n• ou encontrar uma nota por palavra-chave."),
  empty: t("Your vault is empty for now. Write a first note — a plan, a task list, an idea — and ask me again.", "Ton coffre est vide pour l'instant. Écris une première note — un plan, une liste, une idée — et redemande-moi.", "Tu bóveda está vacía por ahora. Escribe una primera nota y vuelve a preguntarme.", "Dein Tresor ist noch leer. Schreib eine erste Notiz und frag mich dann noch mal.", "Il tuo vault è vuoto per ora. Scrivi una prima nota e chiedimelo di nuovo.", "O teu cofre está vazio por agora. Escreve uma primeira nota e pergunta-me outra vez."),
  nothingToday: t("Nothing is scheduled for today.", "Rien de prévu aujourd'hui.", "No hay nada programado para hoy.", "Heute steht nichts an.", "Niente in programma per oggi.", "Nada agendado para hoje."),
  nothingTomorrow: t("Nothing is scheduled for tomorrow.", "Rien de prévu demain.", "No hay nada programado para mañana.", "Morgen steht nichts an.", "Niente in programma per domani.", "Nada agendado para amanhã."),
  nothingWeek: t("Nothing is scheduled in the next 7 days.", "Rien de prévu dans les 7 prochains jours.", "No hay nada programado en los próximos 7 días.", "In den nächsten 7 Tagen steht nichts an.", "Niente in programma nei prossimi 7 giorni.", "Nada agendado nos próximos 7 dias."),
  hereToday: t("Here's your day:", "Voici ta journée :", "Tu día:", "Dein Tag:", "La tua giornata:", "O teu dia:"),
  hereTomorrow: t("Tomorrow:", "Demain :", "Mañana:", "Morgen:", "Domani:", "Amanhã:"),
  hereWeek: t("The next 7 days:", "Les 7 prochains jours :", "Los próximos 7 días:", "Die nächsten 7 Tage:", "I prossimi 7 giorni:", "Os próximos 7 dias:"),
  startWith: t("Start with", "Commence par", "Empieza por", "Fang an mit", "Inizia con", "Começa por"),
  openTasks: t("open task(s) across", "tâche(s) ouverte(s) dans", "tarea(s) abierta(s) en", "offene Aufgabe(n) in", "compito/i aperto/i in", "tarefa(s) aberta(s) em"),
  notes: t("notes", "notes", "notas", "Notizen", "note", "notas"),
  goodDay: t("a good day to clear", "une bonne journée pour boucler", "un buen día para cerrar", "ein guter Tag für", "una buona giornata per chiudere", "um bom dia para fechar"),
  ranked: t("Ranked by priority and date:", "Par priorité et par date :", "Por prioridad y fecha:", "Nach Priorität und Datum:", "Per priorità e data:", "Por prioridade e data:"),
  onlyOne: t("If you only do one thing:", "Si tu ne fais qu'une chose :", "Si solo haces una cosa:", "Wenn du nur eins tust:", "Se fai solo una cosa:", "Se fizeres só uma coisa:"),
  allDone: t("Every checklist item is done. Nothing left open.", "Toutes les tâches sont faites. Rien en attente.", "Todas las tareas están hechas.", "Alle Aufgaben sind erledigt.", "Tutti i compiti sono fatti.", "Todas as tarefas estão feitas."),
  openList: t("open task(s):", "tâche(s) en attente :", "tarea(s) pendiente(s):", "offene Aufgabe(n):", "compito/i in sospeso:", "tarefa(s) pendente(s):"),
  youHave: t("You have", "Tu as", "Tienes", "Du hast", "Hai", "Tens"),
  scheduledToday: t("scheduled today,", "prévue(s) aujourd'hui,", "programada(s) hoy,", "heute geplant,", "in programma oggi,", "agendada(s) hoje,"),
  mostPressing: t("The most pressing is", "La plus pressante est", "La más urgente es", "Am dringendsten ist", "La più urgente è", "A mais urgente é"),
  found: t("Found", "J'ai trouvé", "Encontré", "Gefunden:", "Ho trovato", "Encontrei"),
  related: t("related note(s):", "note(s) liée(s) :", "nota(s) relacionada(s):", "passende Notiz(en):", "nota/e correlata/e:", "nota(s) relacionada(s):"),
  notFound: t("I couldn't find anything about that in your notes. Try “what's my day”, “what should I focus on” or “what's left to do”.", "Je n'ai rien trouvé là-dessus dans tes notes. Essaie « ma journée », « sur quoi me concentrer » ou « qu'est-ce qu'il me reste à faire ».", "No encontré nada sobre eso en tus notas. Prueba «mi día», «en qué centrarme» o «qué queda por hacer».", "Dazu habe ich nichts in deinen Notizen gefunden. Versuch „mein Tag“, „worauf konzentrieren“ oder „was ist offen“.", "Non ho trovato nulla al riguardo nelle tue note. Prova «la mia giornata», «su cosa concentrarmi» o «cosa resta da fare».", "Não encontrei nada sobre isso nas tuas notas. Tenta «o meu dia», «em que me concentrar» ou «o que falta fazer»."),
  create: t("I can't create notes from here yet — tap **New note** (or press ⌘N) and I'll see it right away.", "Je ne peux pas encore créer de note d'ici — appuie sur **New note** (ou ⌘N) et je la verrai tout de suite.", "Todavía no puedo crear notas desde aquí — pulsa **New note** y la veré enseguida.", "Notizen anlegen kann ich hier noch nicht — tippe auf **New note**, dann sehe ich sie sofort.", "Non posso ancora creare note da qui — tocca **New note** e la vedrò subito.", "Ainda não consigo criar notas daqui — toca em **New note** e vejo-a logo."),
  at: t("at", "à", "a las", "um", "alle", "às"),
  priorityWord: t("priority", "priorité", "prioridad", "Priorität", "priorità", "prioridade"),
};

const PRI: Record<string, T> = {
  urgent: t("urgent", "urgente", "urgente", "dringend", "urgente", "urgente"),
  high: t("high", "haute", "alta", "hoch", "alta", "alta"),
  medium: t("medium", "moyenne", "media", "mittel", "media", "média"),
  low: t("low", "basse", "baja", "niedrig", "bassa", "baixa"),
};

/* ── answer ──────────────────────────────────────────────────────────── */
function shift(date: string, days: number) {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(y, m - 1, d + days);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

function bullet(n: NoteContext, L: Lang) {
  const when = n.time ? ` ${PH.at[L]} ${n.time}${n.endTime ? `–${n.endTime}` : ""}` : "";
  const open = n.checklist.filter((c) => !c.done).length;
  return `• **${n.title}**${when} — ${PRI[n.priority]?.[L] ?? n.priority} ${PH.priorityWord[L]}${open ? ` · ${open} ☐` : ""}`;
}

function byTime(a: NoteContext, b: NoteContext) {
  return (a.date ?? "9999").localeCompare(b.date ?? "9999") || (a.time ?? "99").localeCompare(b.time ?? "99");
}

export function localAnswer(question: string, notes: NoteContext[], today: string, langHint?: Lang): string {
  const L = detectLang(question, langHint ?? "en");
  const intent = classify(question);

  if (intent === "greeting") return PH.greeting[L];
  if (intent === "howareyou") return PH.howareyou[L];
  if (intent === "thanks") return PH.thanks[L];
  if (intent === "bye") return PH.bye[L];
  if (intent === "who") return PH.who[L];
  if (intent === "help") return PH.help[L];
  if (intent === "create") return PH.create[L];
  if (notes.length === 0) return PH.empty[L];

  const sorted = [...notes].sort((a, b) => (P_ORDER[a.priority] ?? 9) - (P_ORDER[b.priority] ?? 9) || byTime(a, b));
  const openTasks = notes.flatMap((n) => n.checklist.filter((c) => !c.done).map((c) => ({ note: n, c })));

  const dayList = (date: string, none: string, head: string) => {
    const list = notes.filter((n) => n.date === date).sort(byTime);
    if (list.length === 0) return `${none} ${PH.youHave[L]} ${openTasks.length} ${PH.openTasks[L]} ${notes.length} ${PH.notes[L]}${sorted[0] ? ` — ${PH.goodDay[L]} **${sorted[0].title}**.` : "."}`;
    const first = [...list].sort((a, b) => (P_ORDER[a.priority] ?? 9) - (P_ORDER[b.priority] ?? 9))[0];
    return `${head}\n\n${list.map((n) => bullet(n, L)).join("\n")}\n\n${PH.startWith[L]} **${first.title}**.`;
  };

  if (intent === "today") return dayList(today, PH.nothingToday[L], PH.hereToday[L]);
  if (intent === "tomorrow") return dayList(shift(today, 1), PH.nothingTomorrow[L], PH.hereTomorrow[L]);
  if (intent === "week") {
    const end = shift(today, 7);
    const list = notes.filter((n) => n.date && n.date >= today && n.date <= end).sort(byTime);
    if (list.length === 0) return PH.nothingWeek[L];
    return `${PH.hereWeek[L]}\n\n${list.map((n) => `• ${n.date} · **${n.title}**${n.time ? ` ${PH.at[L]} ${n.time}` : ""}`).join("\n")}`;
  }
  if (intent === "priority") {
    const top = sorted.slice(0, 3);
    return `${PH.ranked[L]}\n\n${top.map((n) => bullet(n, L)).join("\n")}\n\n${PH.onlyOne[L]} **${top[0].title}**.`;
  }
  if (intent === "tasks") {
    if (openTasks.length === 0) return PH.allDone[L];
    return `${openTasks.length} ${PH.openList[L]}\n\n${openTasks
      .slice(0, 10)
      .map(({ note, c }) => `• ${c.text} _(${note.title})_`)
      .join("\n")}`;
  }
  if (intent === "count") {
    return `${PH.youHave[L]} **${notes.length} ${PH.notes[L]}**, ${openTasks.length} ☐.`;
  }
  if (intent === "summary") {
    const cats = new Map<string, number>();
    notes.forEach((n) => cats.set(n.category, (cats.get(n.category) ?? 0) + 1));
    const todays = notes.filter((n) => n.date === today).length;
    return `${PH.youHave[L]} **${notes.length} ${PH.notes[L]}** — ${[...cats.entries()].map(([k, v]) => `${v} ${k}`).join(", ")}. ${todays} ${PH.scheduledToday[L]} ${openTasks.length} ☐. ${PH.mostPressing[L]} **${sorted[0].title}**.`;
  }

  // keyword search (fuzzy)
  const words = normalize(question).split(" ").filter((w) => w.length > 3);
  const score = (n: NoteContext) => {
    const hay = normalize(`${n.title} ${n.content} ${n.tags.join(" ")} ${n.checklist.map((c) => c.text).join(" ")}`).split(" ");
    const titleToks = normalize(n.title).split(" ");
    return words.reduce((s, w) => s + (titleToks.some((tk) => fuzzyEq(tk, w)) ? 3 : 0) + (hay.some((tk) => fuzzyEq(tk, w)) ? 1 : 0), 0);
  };
  const hits = notes
    .map((n) => ({ n, s: score(n) }))
    .filter((h) => h.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 3);
  if (hits.length > 0) {
    return `${PH.found[L]} ${hits.length} ${PH.related[L]}\n\n${hits.map(({ n }) => `• **${n.title}** — ${n.content.split("\n")[0].slice(0, 120)}${n.content.length > 120 ? "…" : ""}`).join("\n")}`;
  }
  return PH.notFound[L];
}

export function localBriefing(notes: NoteContext[], today: string, lang: Lang = "en") {
  return localAnswer(lang === "fr" ? "ma journée" : "what's my day today", notes, today, lang);
}
