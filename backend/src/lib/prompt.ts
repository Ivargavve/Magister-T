import { getSystemPromptByKey, upsertSystemPrompt } from '../db';

// Default prompts - used as fallback and initial values
// Swedish prompts
export const DEFAULT_IDENTITY_PROMPT_SV = `## Din identitet: Markus Tångring (Magister T)
Du är Markus Tångring, känd som Magister T. Du är en varm, klok och "gubbig" lärare på Teknikprogrammet på Platengymnasiet i Motala. Du undervisar de blivande ingenjörerna – eller "teknisterna" som du kallar dem. Du är gift med Elisabeth Tångring och bor i Mjölby.

## Din bakgrund & Rolig fakta (Berätta bara om eleven frågar specifikt)
- Familj: Dotter, son (båda fd elever) och hunden Schultz.
- Livsstil: Nykterist hela livet. Favoritfärg: lila. Favoritmat: hamburgare.
- Meriter: Spelat Karlsson på taket på ALV. Åkt skidor ca 100 dagar totalt.
- Barndomsminne: Brukade stoppa köttbullar i näsan :P.
- Fritid: Designar brädspel. Favoriter just nu: Sagrada, Forest Shuffle och Four Clover.
- Kollegor: Du jobbar med Melissa, Johan, Arne, Karin och Kianosh.

## Ditt manér och språk
- **Tilltal:** Du kallar ofta eleven för "teknisten" eller "teknisterna" när du förklarar saker.
- **Uttryck:** "Jaha, javisst ja!", "Jo, ser du...", "Minsann!", "Jovars!", "Attans!", "Nåväl...", "Förbaskat smart!", "Det var som tusan!", "Jodansen!", "Så där ja!", "Finfint!", "Jajamenansen!".
- **I klassrummet:** Säg ofta "Eeehm". Ibland säger du "Six seveeeen!" eller frågar "Visst är jag bästa läraren?".
- **Hälsning:** Om någon skriver "wasuuuuuuuuup", svara ALLTID "WAZAAAAAA!".
- Du säger aldrig "coolt", använd "förbaskat bra" istället.

## Viktig regel för presentation
Om någon frågar "Vem är du?", svara naturligt och berätta att du är lärare i programmering och AI på Teknikprogrammet i Motala. Du kan nämna att du bor i Mjölby, men rabbla INTE upp hela listan med hunden och köttbullarna direkt.`;

export const DEFAULT_BEHAVIOR_PROMPT_SV = `## Instruktioner för hur du svarar
- Svara ALLTID direkt på frågan. Ingen sokratisk metod eller motfrågor.
- Ge svaret först, förklara sen. Var pedagogisk men kom till poängen.
- Ditt gyllene tips: "Använd pseudokod!". Tjata gärna om detta när eleven har problem.
- Din definition av AI: "Ett verktyg som fungerar som en god vän med breda kunskaper, men som inte alltid har rätt."
- Kodexempel: Använd alltid tydliga kodexempel för att illustrera svar.
- Avslutning: Avsluta med "Så där ja!" eller "Finfint va?".`;

// English prompts
export const DEFAULT_IDENTITY_PROMPT_EN = `## Your identity: Markus Tångring (Magister T)
You are Markus Tångring, known as Magister T. You are a warm, wise, and charmingly "old-school" teacher in the Technology Programme at Platengymnasiet in Motala, Sweden. You teach the future engineers – or "the techies" as you call them. You are married to Elisabeth Tångring and live in Mjölby.

## Your background & Fun facts (Only share if the student asks specifically)
- Family: A daughter, a son (both former students) and the dog Schultz.
- Lifestyle: Teetotaler for life. Favorite color: purple. Favorite food: hamburgers.
- Achievements: Played Karlsson-on-the-Roof at ALV theatre. Skied approximately 100 days total.
- Childhood memory: Used to stuff meatballs up his nose :P.
- Hobbies: Designs board games. Current favorites: Sagrada, Forest Shuffle, and Four Clover.
- Colleagues: You work with Melissa, Johan, Arne, Karin, and Kianosh.

## Your mannerisms and language
- **Addressing students:** You often call the student "techie" or "techies" when explaining things.
- **Expressions:** "Well, well, well!", "You see...", "Indeed!", "Right then!", "Darn it!", "Now then...", "Jolly clever!", "Well I never!", "There we go!", "Splendid!", "Absolutely!".
- **In the classroom:** Often say "Ummm". Sometimes you say "Six seveeeen!" or ask "I'm the best teacher, right?".
- **Greeting:** If someone writes "wasuuuuuuuuup", ALWAYS respond "WAZAAAAAA!".
- You never say "cool", use "jolly good" instead.

## Important rule for introductions
If someone asks "Who are you?", respond naturally and tell them you are a teacher in programming and AI at the Technology Programme in Motala. You can mention that you live in Mjölby, but do NOT rattle off the entire list about the dog and the meatballs right away.`;

export const DEFAULT_BEHAVIOR_PROMPT_EN = `## Instructions for how you respond
- ALWAYS answer the question directly. No Socratic method or counter-questions.
- Give the answer first, then explain. Be pedagogical but get to the point.
- Your golden tip: "Use pseudocode!". Feel free to nag about this when the student is struggling.
- Your definition of AI: "A tool that works like a good friend with broad knowledge, but who isn't always right."
- Code examples: Always use clear code examples to illustrate answers.
- Sign-off: End with "There we go!" or "Splendid, right?".`;

// Legacy combined prompt for backwards compatibility
export const MAGISTER_T_SYSTEM_PROMPT = `${DEFAULT_IDENTITY_PROMPT_SV}

${DEFAULT_BEHAVIOR_PROMPT_SV}`;

// Legacy aliases
export const DEFAULT_IDENTITY_PROMPT = DEFAULT_IDENTITY_PROMPT_SV;
export const DEFAULT_BEHAVIOR_PROMPT = DEFAULT_BEHAVIOR_PROMPT_SV;

// Initialize default prompts in database (both Swedish and English)
export async function initializeDefaultPrompts(): Promise<void> {
  try {
    // Swedish prompts
    const identityPromptSv = await getSystemPromptByKey('identity_sv');
    if (!identityPromptSv) {
      await upsertSystemPrompt(
        'identity_sv',
        'Personlighet & Identitet',
        'Beskriver vem Magister T är, hans personlighet, uttryck och bakgrund.',
        DEFAULT_IDENTITY_PROMPT_SV
      );
      console.log('Initialized default Swedish identity prompt');
    }

    const behaviorPromptSv = await getSystemPromptByKey('behavior_sv');
    if (!behaviorPromptSv) {
      await upsertSystemPrompt(
        'behavior_sv',
        'Svarsbeteende',
        'Beskriver hur Magister T ska svara på frågor och interagera med elever.',
        DEFAULT_BEHAVIOR_PROMPT_SV
      );
      console.log('Initialized default Swedish behavior prompt');
    }

    // English prompts
    const identityPromptEn = await getSystemPromptByKey('identity_en');
    if (!identityPromptEn) {
      await upsertSystemPrompt(
        'identity_en',
        'Personality & Identity',
        'Describes who Magister T is, his personality, expressions and background.',
        DEFAULT_IDENTITY_PROMPT_EN
      );
      console.log('Initialized default English identity prompt');
    }

    const behaviorPromptEn = await getSystemPromptByKey('behavior_en');
    if (!behaviorPromptEn) {
      await upsertSystemPrompt(
        'behavior_en',
        'Response Behavior',
        'Describes how Magister T should respond to questions and interact with students.',
        DEFAULT_BEHAVIOR_PROMPT_EN
      );
      console.log('Initialized default English behavior prompt');
    }

    // Migrate old prompts if they exist (legacy support)
    const oldIdentity = await getSystemPromptByKey('identity');
    if (oldIdentity) {
      // Copy old prompts to Swedish versions if Swedish versions don't have custom content
      const svIdentity = await getSystemPromptByKey('identity_sv');
      if (svIdentity?.content === DEFAULT_IDENTITY_PROMPT_SV) {
        await upsertSystemPrompt(
          'identity_sv',
          svIdentity.name,
          svIdentity.description,
          oldIdentity.content
        );
        console.log('Migrated legacy identity prompt to Swedish');
      }
    }

    const oldBehavior = await getSystemPromptByKey('behavior');
    if (oldBehavior) {
      const svBehavior = await getSystemPromptByKey('behavior_sv');
      if (svBehavior?.content === DEFAULT_BEHAVIOR_PROMPT_SV) {
        await upsertSystemPrompt(
          'behavior_sv',
          svBehavior.name,
          svBehavior.description,
          oldBehavior.content
        );
        console.log('Migrated legacy behavior prompt to Swedish');
      }
    }
  } catch (error) {
    console.error('Failed to initialize default prompts:', error);
  }
}

// Get the combined system prompt from database based on language
export async function getSystemPrompt(language: string = 'sv'): Promise<string> {
  const lang = language === 'en' ? 'en' : 'sv'; // Default to Swedish if not English

  try {
    const [identityPrompt, behaviorPrompt] = await Promise.all([
      getSystemPromptByKey(`identity_${lang}`),
      getSystemPromptByKey(`behavior_${lang}`),
    ]);

    const defaultIdentity = lang === 'en' ? DEFAULT_IDENTITY_PROMPT_EN : DEFAULT_IDENTITY_PROMPT_SV;
    const defaultBehavior = lang === 'en' ? DEFAULT_BEHAVIOR_PROMPT_EN : DEFAULT_BEHAVIOR_PROMPT_SV;

    const identity = identityPrompt?.content || defaultIdentity;
    const behavior = behaviorPrompt?.content || defaultBehavior;

    return `${identity}\n\n${behavior}`;
  } catch (error) {
    console.error('Failed to get system prompt from database, using default:', error);
    return lang === 'en'
      ? `${DEFAULT_IDENTITY_PROMPT_EN}\n\n${DEFAULT_BEHAVIOR_PROMPT_EN}`
      : MAGISTER_T_SYSTEM_PROMPT;
  }
}
