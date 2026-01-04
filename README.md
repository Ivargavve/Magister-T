# Magister T - AI-assistent för lärande

En pedagogisk AI-chattbot som hjälper gymnasieelever att **tänka själva** istället för att ge direkta svar.

## Om Magister T

Magister T (Markus Tångring) är en AI- och programmeringslärare från Mjölby. Hans filosofi är enkel: elever lär sig bäst genom att resonera sig fram till svaren själva.

### Pedagogisk approach

- Ställer motfrågor istället för att ge svar direkt
- Guidar eleven genom problemlösningsprocessen
- Uppmuntrar till självständigt tänkande
- Ger hints och ledtrådar vid behov

## Tech Stack

- **Frontend:** Vite + React + TypeScript
- **Styling:** Tailwind CSS
- **AI:** Google Gemini API
- **Serverless:** Netlify Functions
- **Deployment:** Netlify

## Projektstruktur

```
magister-t/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── components/
│   │   ├── Chat.tsx
│   │   ├── Message.tsx
│   │   ├── Input.tsx
│   │   └── MagisterAvatar.tsx    # Animerad avatar
│   ├── assets/
│   │   └── magister-t/
│   │       ├── frame-1.png       # Animationsram 1
│   │       ├── frame-2.png       # Animationsram 2
│   │       └── frame-3.png       # Animationsram 3
│   ├── lib/
│   │   └── prompt.ts
│   └── index.css
├── netlify/
│   └── functions/
│       └── chat.ts
├── public/
├── .env.local                    # Lokal API-nyckel (gitignored)
├── netlify.toml
└── package.json
```

## Grafik

Projektet inkluderar en animerad avatar av Magister T som växlar mellan 3 bilder för att skapa en levande känsla. Avataren reagerar på:
- Idle-läge (lugn animation)
- När AI:n "tänker" (snabbare animation)
- När svar levereras

## Installation

```bash
# Klona repot
git clone <repo-url>
cd magister-t

# Installera dependencies
npm install

# Skapa miljövariabler
cp .env.example .env.local
# Lägg till din GEMINI_API_KEY i .env.local

# Starta utvecklingsserver
npm run dev
```

## Miljövariabler

| Variabel | Beskrivning |
|----------|-------------|
| `GEMINI_API_KEY` | Din Google Gemini API-nyckel |

### Lokal utveckling
Skapa `.env.local` i projektets rot:
```
GEMINI_API_KEY=din-api-nyckel-här
```

### Produktion (Netlify)
Lägg till miljövariabeln i Netlify Dashboard:
**Site settings → Environment variables → Add variable**

## Scripts

| Kommando | Beskrivning |
|----------|-------------|
| `npm run dev` | Starta utvecklingsserver |
| `npm run build` | Bygg för produktion |
| `npm run preview` | Förhandsgranska produktionsbygge |
| `npm run lint` | Kör ESLint |

## Deployment

Projektet är konfigurerat för Netlify:

1. Koppla repot till Netlify
2. Lägg till `GEMINI_API_KEY` som environment variable
3. Deploy sker automatiskt vid push till main

## Framtida utveckling

- [ ] Konversationshistorik (localStorage)
- [ ] Ämnesval (AI, Python, Webb)
- [ ] "Jag fastnar"-knapp för extra hints
- [ ] Mörkt/ljust tema
- [ ] Render-backend vid behov för utökad funktionalitet

## Licens

Privat projekt för utbildningssyfte.

---

*Skapad för att hjälpa elever att lära sig tänka, inte bara få svar.*
