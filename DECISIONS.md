# DECISIONS.md — journal des décisions de la refonte MindVault

Toutes les décisions prises en autonomie pendant la refonte, avec le raisonnement. Rédigé pour que tu puisses les défendre en entretien ou les inverser en connaissance de cause.

---

## 1. Stratégie produit

### 1.1 Deux surfaces au lieu d'une
**Décision :** séparer un **site vitrine cinématique** (`/`) et **l'application** (`/app`).
**Pourquoi :** Awwwards récompense des expériences narratives au scroll, presque jamais des dashboards. Le site vitrine est le candidat ; l'app est la preuve d'ingénierie. Les deux partagent le design system.

### 1.2 Anglais partout, documentation en français
**Décision :** l'interface (site + app) est en anglais ; `DECISIONS.md` est en français.
**Pourquoi :** le jury Awwwards et la majorité des studios sont internationaux ; un produit en anglais dans un portfolio français est la norme du secteur. L'i18n `fr` est une extension simple (les textes sont dans des tableaux), mais hors périmètre pour ne pas diluer l'effort.

### 1.3 Nom, ton, concept
**Décision :** garder **MindVault** et pousser la métaphore : *un coffre de verre noir traversé par la lumière*. Slogan « Your mind, vaulted. ».
**Pourquoi :** le nom existait déjà, il est bon. Une métaphore physique donne une raison d'être à la 3D (ce n'est pas de la déco : le coffre **s'ouvre** au scroll).

---

## 2. Stack technique

| Choix | Alternative écartée | Raison |
| --- | --- | --- |
| **Next.js 15 (App Router)** | Vite + Vercel functions | Il faut un serveur pour protéger la clé OpenAI et signer les sessions ; Next donne routes API, middleware Edge, OG image, SEO, `next/font` en un seul outil. Pinné en 15.x (16 est sorti mais les APIs que je maîtrise sont celles de 15 — moins de risque de régression). |
| **React 19.2.4** (pinné exact) | 19.3 | `@react-three/fiber` 9.7 exige `react <19.3`. |
| **Tailwind v4 + tokens CSS** | CSS-in-JS, inline styles | L'ancien code avait tout en `style={{}}` : impossible à thémer. Les tokens (`--bg`, `--fg`, `--line`…) sont la seule source de vérité ; Tailwind les expose via `@theme inline`. |
| **GSAP 3.15** (ScrollTrigger, SplitText, DrawSVG, CustomEase) | Framer Motion seul | GSAP est gratuit à 100 % depuis le rachat par Webflow, et c'est l'outil de référence des sites Awwwards pour le scroll. |
| **Lenis** | ScrollSmoother, Locomotive | Le standard actuel ; léger ; se branche sur le ticker GSAP. |
| **React Three Fiber + drei** | Three.js vanilla, Spline | `MeshTransmissionMaterial` donne le verre réfractif en quelques lignes ; R3F s'intègre au cycle React. Spline aurait ajouté une dépendance externe et un chargement réseau. |
| **Motion (ex-Framer)** dans l'app | GSAP Flip | Les animations de layout React (grille ↔ liste, modale partagée) sont plus naturelles avec `layout`/`layoutId`. GSAP reste pour le scroll et les timelines. |
| **Dexie (IndexedDB)** | localStorage | L'ancien stockage base64 en localStorage plafonnait à ~5 Mo : l'app cassait dès quelques images. IndexedDB stocke des `Blob` natifs, sans limite pratique, avec transactions. |
| **Zustand** | React Context | Pas de re-render en cascade ; store minuscule. Les valeurs par frame (scroll, souris) sont dans un objet mutable `motionState` hors React, lu dans `useFrame`. |
| **cmdk** | Fait maison | Palette ⌘K accessible, clavier-first, 3 Ko. |
| **npm** | pnpm | pnpm n'est pas installé sur la machine ; npm suffit. |
| **Webflow** | — | **Écarté.** Webflow est un outil no-code qui génère son propre HTML ; incompatible avec une app React/Three. Ce qu'il fallait prendre de Webflow, c'est GSAP (maintenant gratuit). |

---

## 3. Sécurité (les points rédhibitoires de l'ancien code)

### 3.1 Mot de passe et clé API hors du bundle
**Avant :** identifiants en dur dans `useAuth.ts`, clé OpenAI en `VITE_OPENAI_API_KEY` (donc dans le JS téléchargé par n'importe qui).
**Après :**
- `AUTH_USER` / `AUTH_PASSWORD` / `SESSION_SECRET` / `OPENAI_API_KEY` sont **server-only** (aucun préfixe `NEXT_PUBLIC_`).
- Login via `POST /api/auth/login` → cookie **httpOnly, SameSite=Lax, Secure en prod**, signé HMAC-SHA256 (`user.exp.signature`), 7 jours.
- Vérification en **Web Crypto** pour que le même code tourne dans le middleware Edge et dans Node.
- Comparaison à temps constant, padding des chaînes pour ne pas fuiter la longueur.
- Throttle : 5 échecs / IP / minute, délai fixe de 400 ms sur échec.
- `middleware.ts` protège `/app/*` et renvoie `/login` → `/app` si déjà connecté.

### 3.2 Pas de base utilisateurs
**Décision :** un seul compte défini par variables d'environnement.
**Pourquoi :** c'est un vault **personnel** et local-first : les données sont dans le navigateur, un multi-comptes n'aurait aucun sens sans backend de données. Brancher Clerk/Supabase serait de la complexité pour la démo. Le point est documenté comme extension possible.

### 3.3 Identifiants de démo affichés
**Décision :** l'écran de login affiche les identifiants tant que `NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS=true`.
**Pourquoi :** un recruteur ou un juré doit pouvoir entrer sans te contacter. À passer à `false` si tu veux un vault privé.

### 3.4 Headers de sécurité
`X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` via `next.config.ts`.

---

## 4. IA

### 4.1 Proxy serveur + streaming
`POST /api/ai` streame du texte brut (`ReadableStream`) ; le client affiche mot par mot avec un curseur. Le modèle par défaut est `gpt-4.1-mini` (comme avant), configurable via `OPENAI_MODEL`.

### 4.2 Mode démo sans clé
**Décision :** sans `OPENAI_API_KEY`, l'assistant tourne sur une heuristique locale (`lib/ai-local.ts`) : agenda du jour, priorités, tâches ouvertes, résumé, recherche par mots-clés.
**Pourquoi :** le site doit fonctionner de bout en bout **même sans clé** (jury, recruteur, ta démo hors-ligne). La démo publique du site vitrine (`demo: true`) **utilise toujours le mode local** pour ne jamais consommer tes crédits depuis une page publique — et elle n'est accessible qu'avec le jeu de notes d'exemple.

### 4.3 Contexte envoyé
Les notes sont envoyées **uniquement** au moment d'une question (max 120 notes, 400 caractères chacune), jamais stockées côté serveur. Cohérent avec la promesse « nothing leaves your device » — nuancée honnêtement dans la section Privacy (« only when you ask »).

---

## 5. Design

### 5.1 Quasi-monochrome + un accent spectral
Palette noir `#050505` / blanc `#f4f4f2` sur un axe de luminance, **plus un accent** (retour utilisateur : « un peu plus de couleur ») : un dégradé violet → cyan → menthe (`--brand`, `--brand-2`, `--brand-3`, `--grad`) — la couleur que produit la lumière quand le verre la disperse, donc cohérent avec le concept. Il est appliqué avec parcimonie : ponctuation serif des titres, un mot par titre, numéros de section, barre active de la nav, jour sélectionné du calendrier, barres d'activité, bulles utilisateur du chat, halo et lumières de la scène 3D, focus des champs, sélection de texte. Les boutons principaux restent blancs mais gagnent un halo coloré. Les couleurs de priorité (rouge/orange/jaune/vert) restent réservées à l'information. Le thème clair a sa propre version plus saturée du dégradé.

### 5.2 Typographie
- **Geist** (sans, variable) pour le display et l'UI — lettrage serré (`-0.045em`) en grand.
- **Instrument Serif italic** pour la ponctuation et les mots d'accent (« *anything* », « *the vault* »). Le mélange sans + serif italique est la signature des sites primés 2025-26.
- **Geist Mono** pour les eyebrows, dates, chips.
Chargées via `next/font/google` (self-hosted au build, pas de requête tierce au runtime).

### 5.3 Curseur custom
Point + anneau en `mix-blend-mode: difference`, suivi avec `gsap.quickTo` (lerp), états `hover` / `text` (disque plein + label « Open », « Enter ») / `hidden` (sur les champs et le canvas). Désactivé automatiquement sur écrans tactiles (`pointer: fine`).

### 5.4 Mode clair
L'**app** a un thème clair complet (tokens redéfinis sur `[data-theme=light]`, initialisé avant le premier paint pour éviter le flash). Le **site vitrine reste sombre volontairement** : c'est une pièce cinématique, le noir est le décor.

### 5.5 Section numbering
Les sections du site sont numérotées 01 → 08 (vault, 4 features, live demo, privacy, begin) — un fil de lecture éditorial.

---

## 6. Le site vitrine, séquence par séquence

| # | Section | Technique | Pourquoi ce choix |
| --- | --- | --- | --- |
| 0 | **Preloader** | Compteur 000→100, mots qui sortent par masque, rideau `clip-path`. Une fois par session (`sessionStorage`). | Pose le ton en 2 s ; ne pas le rejouer à chaque navigation. Pendant le preloader, Lenis est stoppé. |
| 1 | **Hero** | Titre `SplitText` (lignes → mots → caractères, `rotateX` + masque), monolithe R3F derrière. | Les caractères sont scindés **après** les mots pour que la ponctuation ne se retrouve jamais seule en début de ligne (bug rencontré et corrigé). La ponctuation reçoit la classe serif post-split. |
| 2 | **Ouverture du coffre** | Section de 300 vh, contenu `sticky`, `ScrollTrigger` scrubbé qui écrit `motionState.vault` ; le canvas lit cette valeur dans `useFrame` (les deux dalles s'écartent, un cœur lumineux additif grandit, la caméra recule). Six cartes HTML en 3D volent depuis le centre. | **`position: sticky` plutôt que `pin`** : le pin de GSAP transforme un `pin-spacer`, ce qui casse `position: fixed` des descendants — et le canvas doit rester à l'écran sur hero + vault. Une courbe `vp()` retient l'ouverture 14 % du scroll pour que le titre soit lisible avant que la lumière n'arrive. |
| 3 | **Features** | Scroll horizontal (`pin: true` cette fois, aucun descendant fixed), 4 panneaux, titres révélés avec `containerAnimation`. Mockups produit **en HTML/CSS**, pas en images. | Des mockups HTML sont nets à tout DPR, thémables, animables, et pèsent 0 Ko. Sur mobile, on repasse en vertical (`gsap.matchMedia`). |
| 4 | **Ask (démo live)** | Vraie requête vers `/api/ai` (mode local), réponse streamée, les cartes citées s'illuminent. | Une démo qui marche vraiment vaut plus qu'une vidéo. Ça ne coûte rien (pas de clé). |
| 5 | **Privacy** | Fond noir absolu, phrase révélée mot à mot au scrub, cadenas dessiné en `DrawSVG`. | Respiration après trois sections denses. Contraste rythmique = critère jury. |
| 6 | **Manifesto** | Marquee CSS infini (pause au survol), compteurs. | Section « pause », très peu coûteuse. |
| 7 | **Footer** | Titre géant qui suit la souris (`quickTo` x + rotateY), heure locale, statut. | Le CTA final doit être le plus grand élément de la page. |

### 6.1 Le monolithe (R3F)
- Deux demi-dalles `BoxGeometry` + `MeshTransmissionMaterial` (samples 6, résolution 512, aberration chromatique 0.14, `attenuationColor #9a9aa8`, `attenuationDistance 2.5`).
  *Réglage clé* : avec une atténuation courte le verre devenait **noir opaque** (loi de Beer-Lambert). Corrigé.
- **Halo** : un plan avec dégradé radial derrière le verre. Sans lui, le verre n'a rien à réfracter et devient invisible sur fond noir.
- **Environnement procédural** (`<Environment>` + `Lightformer`) : aucun HDR à télécharger, fonctionne hors-ligne, 0 requête réseau.
- **Sparkles** de drei pour les particules.
- `dpr` plafonné à 1.5 ; canvas chargé en `dynamic(..., { ssr: false })` pour ne pas peser sur le First Load JS (page d'accueil : 195 Ko de JS partagé, Three chargé après).
- `gsap.ticker.lagSmoothing(0)` global : sans ça, sur GPU faible, une frame WebGL longue étirait les timelines (bug observé en test headless : l'animation d'entrée du login durait 10× trop longtemps).

### 6.2 Événement « ready »
Le preloader, la nav et le hero devaient se synchroniser. Un `window.dispatchEvent` se perdait quand le preloader terminait avant que la nav ait posé son listener (visite suivante). Remplacé par `lib/ready.ts` : un signal **mémorisé** (`markReady` / `onReady` appelle immédiatement si déjà prêt).

---

## 7. L'application

### 7.1 Routes réelles
`/app`, `/app/notes`, `/app/calendar`, `/app/ask`, `/app/files`, `/app/export` — au lieu d'un `switch(currentView)`. URLs partageables, code splitting par page, transition d'entrée (fade + blur) à chaque changement de route.

**Bug corrigé :** avec `AnimatePresence mode="wait"` + animation de sortie, la page de destination héritait des styles de sortie (`opacity: 0`) et restait noire (Notes → Dashboard). Conflit connu entre AnimatePresence et l'App Router de Next. Résolu en gardant uniquement l'animation d'entrée (clé = pathname). Les touches `1`–`6` naviguent réellement (elles étaient affichées sans être câblées). Annuler une nouvelle note à laquelle on a attaché un fichier supprime le brouillon créé pour l'attachement (plus de note « Untitled » orpheline).

### 7.2 Modèle de données
- `notes` (Dexie, index sur `date`, `updatedAt`, `priority`, `category`, `pinned`, `*tags`)
- `files` **table séparée** avec `Blob` — les notes restent légères, un fichier peut être supprimé indépendamment.
- `messages` (historique IA), `meta` (flag de seed).
- **Aucune note d'exemple dans l'app** (retour utilisateur) : le vault démarre vide, avec des états vides soignés. Les navigateurs qui avaient reçu le seed initial voient ces notes retirées une fois (`ensureClean`), sauf si elles ont été modifiées. Le **site vitrine** garde ses 7 notes d'exemple (`lib/seed.ts`) : c'est du contenu marketing, clairement annoncé comme « sample notes ».

### 7.3 Éditeur
Modale plein écran (mobile : bottom-sheet) : titre display, priorité, catégorie, date, heure, texte, checklist inline, tags, pièces jointes (drag & drop), image de couverture, épingler, supprimer avec **double-clic de confirmation** (pas de `confirm()` natif). `⌘↵` sauvegarde, `Esc` ferme.
Un éditeur TipTap (rich text) a été **écarté** : +150 Ko et une complexité de sérialisation qui n'apporte rien à la démo. Le texte est du plain text avec retours à la ligne préservés.

**Bug corrigé :** ouvrir un nouvel éditeur pendant l'animation de sortie du précédent réutilisait l'instance (même `key`) et **écrasait la note précédente**. Chaque ouverture incrémente `editorSeq`, utilisé comme `key`.

### 7.4 Notes
Grille ↔ liste (préférence persistée), filtres catégorie/priorité/tag, recherche plein-texte (titre, contenu, tags, tâches), tri (récent / date / priorité), épinglées en premier. Motion `layout` pour réorganiser physiquement les cartes.

**Bug corrigé :** deux `NoteCard` de la même note (Today + Pinned sur le dashboard) partageaient un `layoutId` → Motion en masquait une. Le `layoutId` n'est posé que sur la grille principale.

### 7.5 Calendrier
Mois + agenda, semaine ISO, points de priorité par jour, transition directionnelle au changement de mois, **double-clic sur un jour = nouvelle note pré-datée**.

### 7.6 Ask
Historique persistant (Dexie), streaming, indicateur « Model connected / Demo mode » via `/api/ai/status` (ne révèle jamais la clé).

### 7.7 Fichiers
Galerie filtrée par type, prévisualisation image/vidéo/PDF (`iframe`), téléchargement, suppression. `URL.createObjectURL` révoqué au démontage (hook `useObjectURL`).

### 7.8 Export
- **ZIP** : un `.md` par note (front-matter lisible, checklist en `- [x]`), dossier `files/`, `index.json`.
- **PDF** : jsPDF, pagination, numéros de page.
- **Backup JSON** complet + **restauration** (remplace l'ancien « Transfer »).
- **Danger zone** : effacer le vault, double-clic de confirmation.

### 7.9 Dashboard
Compteurs animés via un composant `Counter` (l'implémentation par mutation DOM était remise à zéro par les re-renders React — remplacée), sparkline d'activité 14 jours, Today / Pinned.

### 7.10 Palette ⌘K
Actions (nouvelle note, thème, recherche), navigation (1–6), recherche dans les notes. `⌘N` nouvelle note.

---

## 7b. Intégration iPhone (PWA, notifications, calendrier)

Ce qu'un iPhone accepte d'une web app, et comment c'est fait :

| Capacité | iOS | Implémentation |
| --- | --- | --- |
| **Installer sur l'écran d'accueil** | Safari → Partager → « Sur l'écran d'accueil » | `app/manifest.ts` (standalone, `start_url: /app`, raccourcis), `app/icon.tsx` + `app/apple-icon.tsx` (PNG générés au build, pas de fichiers binaires à maintenir), meta `apple-mobile-web-app-capable`, `viewport-fit: cover`. Bannière `InstallBanner` sur Safari iOS uniquement, une fois. |
| **Notifications push** | iOS 16.4+, **uniquement depuis l'app installée** | Web Push standard (VAPID) via `web-push`. Service worker `public/sw.js` (événements `push`, `notificationclick` → ouvre `/app/notes?open=<id>`, `pushsubscriptionchange`). Routes `/api/push/*`. Le client est la source de vérité des rappels : il envoie la liste (titre + heure + lien) à chaque changement de notes. |
| **Rappels à l'heure** | Pas de timer en arrière-plan sur iOS | Deux voies : (1) **app ouverte** → le scheduler local (`runLocalScheduler`, toutes les 30 s) affiche la notification via le SW ; (2) **app fermée** → le serveur (`/api/push/tick`) envoie le push. Le tick est appelé par **Vercel Cron chaque minute** (`vercel.json`, `Bearer CRON_SECRET`) et, opportunément, par tout client ouvert. |
| **Stockage serveur** | — | `lib/push-store.ts` : fichier JSON (`.data/push.json`) en local/auto-hébergé, **Upstash Redis** (REST, plan gratuit) sur Vercel — choisi par variables d'env. Un enregistrement par navigateur : abonnement + rappels + ids déjà envoyés. Une souscription 404/410 est supprimée (sauf si elle a moins de 2 min : FCM peut répondre 410 juste après la création — observé en test). |
| **Ajouter au Calendrier** | Safari ouvre un `.ics` → feuille « Ajouter à Calendrier » | `lib/ics.ts` (RFC 5545 : échappement, pliage à 75 octets, `VALARM`, all-day). `GET /api/ics?…` sert le fichier en `text/calendar` — **iOS ignore les `blob:`/`data:`**, il faut une vraie URL. Bouton dans l'éditeur, menu Google Calendar, et **proposition automatique** (toast avec action) après la sauvegarde d'une note datée. |
| **Partager** | Feuille de partage iOS | Web Share API (`navigator.share`), repli presse-papiers. Bouton dans l'éditeur. |
| **Badge sur l'icône** | iOS 16.4+ (installée) | `navigator.setAppBadge(nombre de notes du jour)`. |
| **Hors-ligne** | — | SW : `_next/static` en cache-first, pages `/app/*` en network-first avec repli cache (les données sont déjà dans IndexedDB). |
| **Stockage persistant** | — | `navigator.storage.persist()` proposé dans Réglages. |
| **Vibration / haptique** | Non supporté par iOS web | Écarté. |

**Page Réglages** (`/app/settings`) : état des capacités (support push, VAPID serveur, permission, installée ou non), activation, délai de rappel (0–60 min), **« Test on this device »** (notification locale) et **« Send a real push »** (push réel via le service push), rappels à venir, calendrier, stockage, thème.

**Vie privée** : seul le titre et l'heure des notes quittent l'appareil, uniquement si les notifications sont activées ; désactiver efface la liste côté serveur. Dit explicitement dans Réglages.

**Tests**
- Unitaires (Vitest, 25) : ICS (échappement, pliage, all-day, aller-retour query), rappels (délai, opt-out, passé, fenêtre), store fichier (concurrence, ids), scheduler (envoi unique, 410 → suppression, erreur transitoire), auth (signature, expiration, altération).
- E2E headless (30 vérifications) : manifest/icônes/SW/meta iOS, page Réglages, notification locale via SW, API push complète (abonnement, rappels, tick, 401/400, secret cron), `.ics` (type MIME, contenu, téléchargement), prompt après sauvegarde, deep link `?open=`, raccourci `?new=1`, partage, émulation iPhone 14 Safari (bannière) et iPhone installée (bannière masquée).
- **Push réel** (profil Chrome persistant — les contextes incognito de Playwright n'ont pas accès à l'API Push) : abonnement FCM → « Send a real push » → notification reçue ; note à H+1 min → tick serveur → notification reçue.
- Ce qui n'est **pas** testable ici : l'iPhone physique. Checklist dans le README.

## 7c. Passe « format téléphone » (retour utilisateur sur iPhone installé)

| Problème constaté | Cause | Correction |
| --- | --- | --- |
| En-tête sous la barre de statut iPhone (heure qui chevauche le logo, hamburger/recherche inaccessibles) en mode installé | `black-translucent` + `viewport-fit=cover` étendent la page sous la barre de statut | Marges `env(safe-area-inset-*)` (`--sat/--sab/--sal/--sar`) sur l'en-tête, le volet, l'éditeur, le composer du chat, le toast, la bannière, le login. |
| Le menu hamburger fait défiler la page derrière lui | volet `fixed` sans défilement propre ; iOS propage le scroll | Volet en `overflow-y:auto; overscroll-behavior:contain`, largeur `min(300px, 85vw)`, `body.scroll-lock` (overflow hidden + `touch-action:none`) tant qu'il est ouvert, fermeture automatique à la navigation. |
| Dans l'éditeur, taper une lettre dans le texte renvoie le curseur dans le titre ; le sélecteur d'heure se ferme après le premier chiffre | un `useEffect` avec `[note]` en dépendance refaisait `titleRef.focus()` à **chaque frappe** | Focus du titre une seule fois au montage (et jamais sur écran tactile, pour ne pas ouvrir le clavier d'office). Les raccourcis clavier ont leur propre effet. |
| Zoom au clic / à l'ouverture du clavier | iOS zoome sur tout champ < 16 px ; page zoomable | `@media (pointer: coarse)` → champs à 16 px ; viewport `maximum-scale=1, user-scalable=no, interactive-widget=resizes-content` ; `touch-action: manipulation` (pas de double-tap zoom). Compromis assumé : pas de pinch-zoom dans l'app, comme une app native. |
| Le clavier cache l'éditeur | modale en bottom-sheet | Sur téléphone, l'éditeur est une **feuille plein écran** (`100dvh`) avec corps défilant : le champ actif reste visible quand le clavier monte. |
| Bannière « Ajouter à l'écran d'accueil » par-dessus le composer du chat | bannière globale | Affichée uniquement sur le Dashboard. |

**Heure de fin + rappel par note.** `Note.endTime` (durée de l'événement `.ics`), `Note.remindMin` (0 = à l'heure, 5/10/15/30/60/120/1440 min avant, `null` = désactivé, `undefined` = réglage global) et `Note.remindDay` pour les notes sans heure (`"same"` = ce jour-là à 09:00, `"before"` = la veille à 09:00). L'ancien booléen `remind` reste lu pour compatibilité. L'alarme du `.ics` suit le rappel de la note (pour les journées entières, `TRIGGER:PT540M` = 09:00 le jour même). Les cartes affichent `14:30–15:15`.

**Assistant conversationnel multilingue (mode démo).** Sans clé OpenAI, `lib/ai-local.ts` fait maintenant : détection de langue (fr/en/es/de/it/pt) avec repli sur la langue du téléphone ; intentions (salutations, « ça va », merci, au revoir, aide, qui es-tu, aujourd'hui, demain, semaine, priorités, tâches, résumé, compter, créer, recherche) ; **tolérance aux fautes** (Levenshtein ≤ 1–2 selon la longueur + radicaux) ; réponses rédigées dans la langue détectée. Interface refaite : avatar, statut du modèle, suggestions dans la langue du téléphone, bulles avec heure, indicateur « écrit… », composer auto-extensible collé en bas (Entrée envoie), plein écran mobile. **Limite honnête** : ce n'est pas un LLM ; pour une vraie conversation libre, ajouter `OPENAI_API_KEY` dans Vercel — le prompt système impose alors de répondre dans la langue de l'utilisateur et de tolérer les fautes.

**Tests ajoutés** : 10 unitaires (ICS fin/alarmes, rappels par note, IA : langue, intentions, fautes, réponses) → 35 au total ; tournée E2E « utilisateur iPhone » (21 vérifications : viewport, en-tête, volet + verrouillage, saisie, focus des sélecteurs, heure de fin, rappels, `.ics`, réglages, chat en français avec fautes, composer, tailles de champs).

## 8. Performance & accessibilité

- Three.js, JSZip, jsPDF, OpenAI SDK chargés **à la demande** (`dynamic` / `import()`).
- First Load JS : 103 Ko partagé, page d'accueil 195 Ko avant le canvas.
- `prefers-reduced-motion` : Lenis désactivé, intro du hero affichée sans animation, animations CSS neutralisées.
- Curseur custom désactivé sans pointeur fin ; tous les contrôles restent utilisables au clavier (`aria-label` sur les boutons icône, `aria-live` sur les erreurs, `role=dialog`).
- Images : uniquement des blobs utilisateur (`<img>` natif justifié, pas d'optimisation possible sur des object URLs).
- Polices self-hosted, `display: swap`.
- Headless QA : la page compile sans erreur console (les seules entrées sont le 401 attendu du test « mauvais mot de passe » et la 404 testée).

---

## 9. Outillage & vérification

- **Travailler hors de OneDrive.** Le dossier portfolio est synchronisé par OneDrive : la synchro a rendu le dev server extrêmement lent (jusqu'à 190 s par page) puis a **cassé les builds** (`EINVAL readlink`, `UNKNOWN write` dans `.next`). Le projet est donc développé et construit dans **`C:\dev\mindvault`** (copie non synchronisée) ; la source est recopiée dans le dossier portfolio pour archivage. Règle : `node_modules` et `.next` ne doivent jamais être synchronisés. Dev en **Turbopack** (`next dev --turbopack`).
- **QA headless** avec `playwright-core` + le Chrome installé (aucun téléchargement de navigateur) : captures du site à 10 positions de scroll, tournée complète de l'app (login erreur/succès, création de note, ⌘K, calendrier, streaming IA, upload de fichier, prévisualisation, exports ZIP/PDF/backup, thème clair, mobile, 404). Scripts dans le scratchpad de session, non livrés dans le zip (pas du code produit).
- La QA tourne sur le **build de production** (`next start`) : c'est ce qui sera déployé, et c'est reproductible.

---

## 10. Ce qui reste volontairement hors périmètre (pistes)

1. **i18n fr/en** — textes déjà centralisés dans des tableaux.
2. **Auth multi-utilisateurs + sync chiffrée** (Supabase/Clerk) — contredit « local-first » ; à faire seulement si le produit devient collaboratif.
3. **PWA installable + offline complet** (service worker) — le socle IndexedDB est prêt.
4. **Drag & drop de cartes** (dnd-kit) — le tri manuel n'apporte pas grand-chose face aux filtres.
5. **Sons UI** (Howler) — subtils, mais à valider en vrai avant d'ajouter.
6. **Vidéo de case study 60 s** — à enregistrer sur la séquence 2 (ouverture du coffre) et la démo IA.
7. **Soumission Awwwards** — domaine custom obligatoire ; viser Honorable Mention d'abord ; soumettre en parallèle à CSS Design Awards et FWA.
