# MindVault — Assistant Personnel Intelligent

> Application personnelle intelligente avec interface premium futuriste.
> Style : minimalisme futuriste + luxe technologique.

## Fonctionnalités

- **Notes intelligentes** : texte libre, checklist, fichiers (images/vidéos/docs), image de couverture, tags, priorité, catégorie
- **Calendrier dynamique** : vue mensuelle + agenda, association date/heure, navigation intuitive
- **Assistant IA** : analyse des notes, résumé quotidien, priorisation via GPT-4.1-mini
- **Gestion de fichiers** : upload local, prévisualisation, téléchargement
- **Export** : ZIP (notes Markdown + fichiers) et PDF par semaine/mois/année/tout
- **Stockage 100% local** : localStorage avec vérification d'intégrité

## Stack technique

- React 19 + TypeScript + Vite 8
- TailwindCSS v4
- OpenAI API (GPT-4.1-mini)
- JSZip + jsPDF
- date-fns + lucide-react

## Installation

```bash
pnpm install
cp .env.example .env
# Renseigner VITE_OPENAI_API_KEY dans .env
pnpm dev
```

## Déploiement Vercel

1. Connecter le dépôt GitHub à Vercel
2. Build command : `pnpm build`
3. Output directory : `dist`
4. Ajouter `VITE_OPENAI_API_KEY` dans les variables d'environnement Vercel

## Direction artistique

Palette monochrome (#0A0A0A / #FFFFFF / #2A2A2A), glassmorphism, typographie Inter,
animations cubic-bezier(0.4,0,0.2,1), curseur custom mix-blend-mode:difference,
effets light sweep, noise texture subtile.
