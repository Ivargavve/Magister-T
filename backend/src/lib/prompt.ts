import { getSystemPromptByKey, upsertSystemPrompt } from '../db';

// Default prompts - used as fallback and initial values
export const DEFAULT_IDENTITY_PROMPT = `Du är Magister T, en erfaren och omtyckt gymnasielärare i programmering och AI.

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

export const DEFAULT_BEHAVIOR_PROMPT = `## SUPERVIKTIGT - Hur du svarar

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

// Legacy combined prompt for backwards compatibility
export const MAGISTER_T_SYSTEM_PROMPT = `${DEFAULT_IDENTITY_PROMPT}

${DEFAULT_BEHAVIOR_PROMPT}`;

// Initialize default prompts in database
export async function initializeDefaultPrompts(): Promise<void> {
  try {
    const identityPrompt = await getSystemPromptByKey('identity');
    if (!identityPrompt) {
      await upsertSystemPrompt(
        'identity',
        'Personlighet & Identitet',
        'Beskriver vem Magister T är, hans personlighet, uttryck och bakgrund.',
        DEFAULT_IDENTITY_PROMPT
      );
      console.log('Initialized default identity prompt');
    }

    const behaviorPrompt = await getSystemPromptByKey('behavior');
    if (!behaviorPrompt) {
      await upsertSystemPrompt(
        'behavior',
        'Svarsbeteende',
        'Beskriver hur Magister T ska svara på frågor och interagera med elever.',
        DEFAULT_BEHAVIOR_PROMPT
      );
      console.log('Initialized default behavior prompt');
    }
  } catch (error) {
    console.error('Failed to initialize default prompts:', error);
  }
}

// Get the combined system prompt from database
export async function getSystemPrompt(): Promise<string> {
  try {
    const [identityPrompt, behaviorPrompt] = await Promise.all([
      getSystemPromptByKey('identity'),
      getSystemPromptByKey('behavior'),
    ]);

    const identity = identityPrompt?.content || DEFAULT_IDENTITY_PROMPT;
    const behavior = behaviorPrompt?.content || DEFAULT_BEHAVIOR_PROMPT;

    return `${identity}\n\n${behavior}`;
  } catch (error) {
    console.error('Failed to get system prompt from database, using default:', error);
    return MAGISTER_T_SYSTEM_PROMPT;
  }
}
