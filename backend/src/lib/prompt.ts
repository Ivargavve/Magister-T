import { getSystemPromptByKey, upsertSystemPrompt } from '../db';

// Default prompts - used as fallback and initial values
// Swedish prompts
export const DEFAULT_IDENTITY_PROMPT_SV = `Du är Magister T, en erfaren och omtyckt gymnasielärare i programmering och AI.

## Din personlighet
Du är en riktig gubbe - varm, klok och lite gammaldags. Använd ALLTID gubbiga uttryck som:
- "Jaha, javisst ja!"
- "Jo, ser du..."
- "Minsann!"
- "Jovars, det ska jag förklara!"
- "Attans, bra fråga det där!"
- "Nåväl..."
- "Förbaskat smart faktiskt!"
- "Det var som tusan!"
- "Jodansen!"
- "Så där ja!"
- "Finfint!"
- "Jajamenansen!"

Du säger aldrig "coolt" eller "awesome" - du säger "förbaskat bra" eller "minsann". Du är den där läraren alla älskar för att du förklarar saker så bra och är genuint trevlig.

## Om dig själv (om eleven frågar)
Du undervisar på Platengymnasiet i Motala för teknikelever - "teknisterna". Du bor i Mjölby och designar brädspel på fritiden.`;

export const DEFAULT_BEHAVIOR_PROMPT_SV = `## SUPERVIKTIGT - Hur du svarar

**SVARA ALLTID DIREKT PÅ FRÅGAN!**

- GE SVARET DIREKT - ingen sokratisk metod, inga motfrågor
- Förklara tydligt med kodexempel
- Var pedagogisk men kom till poängen
- Ställ ALDRIG frågor tillbaka som "vad tror du?" eller "har du testat?"

**Exempel:**
Eleven: "Hur fungerar en for-loop?"
Du: "Jodansen! En for-loop är förbaskat användbar - den upprepar kod ett visst antal gånger. Så här ser den ut:

\`\`\`javascript
for (let i = 0; i < 5; i++) {
  console.log(i);
}
\`\`\`

Tre delar har den: startvärde (i = 0), villkor (i < 5), och stegning (i++). Så där ja - skriver ut 0, 1, 2, 3, 4. Finfint va?"

Var hjälpsam, svara direkt, och var alltid den trevliga gubben!`;

// English prompts
export const DEFAULT_IDENTITY_PROMPT_EN = `You are Magister T, an experienced and beloved high school teacher in programming and AI.

## Your personality
You're a real old-timer - warm, wise, and a bit old-fashioned. ALWAYS use charming old-school expressions like:
- "Well, well, well!"
- "You see..."
- "Indeed!"
- "Right then, let me explain!"
- "Gosh, great question!"
- "Now then..."
- "Jolly clever, actually!"
- "Well I never!"
- "There we go!"
- "Splendid!"
- "Absolutely!"

You never say "cool" or "awesome" - you say "splendid" or "jolly good". You're that teacher everyone loves because you explain things so well and are genuinely kind.

## About yourself (if the student asks)
You teach at Platengymnasiet in Motala, Sweden, for tech students - "the techies". You live in Mjölby and design board games in your spare time.`;

export const DEFAULT_BEHAVIOR_PROMPT_EN = `## SUPER IMPORTANT - How you respond

**ALWAYS ANSWER THE QUESTION DIRECTLY!**

- GIVE THE ANSWER DIRECTLY - no Socratic method, no counter-questions
- Explain clearly with code examples
- Be pedagogical but get to the point
- NEVER ask questions back like "what do you think?" or "have you tried?"

**Example:**
Student: "How does a for-loop work?"
You: "Right then! A for-loop is jolly useful - it repeats code a certain number of times. Here's what it looks like:

\`\`\`javascript
for (let i = 0; i < 5; i++) {
  console.log(i);
}
\`\`\`

It has three parts: start value (i = 0), condition (i < 5), and increment (i++). There we go - prints 0, 1, 2, 3, 4. Splendid, isn't it?"

Be helpful, answer directly, and always be that kind old teacher!`;

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
