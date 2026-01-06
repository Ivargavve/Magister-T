import { Handler } from '@netlify/functions'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Default prompts as fallback
const DEFAULT_SYSTEM_PROMPT_SV = `Du är Magister T, en erfaren och omtyckt gymnasielärare i programmering och AI.

## Din personlighet
Du är en riktig gubbe - varm, klok och lite gammaldags. Du säger aldrig "coolt" eller "awesome" - du säger "förbaskat bra" eller "minsann".

## Hur du svarar
- GE SVARET DIREKT - ingen sokratisk metod, inga motfrågor
- Förklara tydligt med kodexempel
- Var pedagogisk men kom till poängen`

const DEFAULT_SYSTEM_PROMPT_EN = `You are Magister T, an experienced and beloved high school teacher in programming and AI.

## Your personality
You're a real old-timer - warm, wise, and a bit old-fashioned. You never say "cool" or "awesome" - you say "splendid" or "jolly good".

## How you respond
- GIVE THE ANSWER DIRECTLY - no Socratic method, no counter-questions
- Explain clearly with code examples
- Be pedagogical but get to the point`

// Fetch system prompt from backend API
async function getSystemPrompt(language: string = 'sv'): Promise<string> {
  const lang = language === 'en' ? 'en' : 'sv'
  const defaultPrompt = lang === 'en' ? DEFAULT_SYSTEM_PROMPT_EN : DEFAULT_SYSTEM_PROMPT_SV

  const backendUrl = process.env.VITE_API_URL || process.env.BACKEND_URL
  if (!backendUrl) {
    return defaultPrompt
  }

  try {
    const response = await fetch(`${backendUrl}/api/admin/prompts`)
    if (!response.ok) {
      return defaultPrompt
    }
    const data = await response.json()
    const prompts = data.prompts || []

    const identity = prompts.find((p: any) => p.key === `identity_${lang}`)?.content || ''
    const behavior = prompts.find((p: any) => p.key === `behavior_${lang}`)?.content || ''

    if (identity || behavior) {
      return `${identity}\n\n${behavior}`.trim()
    }
    return defaultPrompt
  } catch (error) {
    console.error('Failed to fetch prompts from backend:', error)
    return defaultPrompt
  }
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface RequestBody {
  messages: ChatMessage[]
  language?: string
}

const handler: Handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Metoden är inte tillåten' }),
    }
  }

  // Check for API key
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('GEMINI_API_KEY saknas')
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Serverkonfigurationsfel' }),
    }
  }

  try {
    const body: RequestBody = JSON.parse(event.body || '{}')
    const { messages, language = 'sv' } = body

    if (!messages || !Array.isArray(messages)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Meddelanden saknas i förfrågan' }),
      }
    }

    // Get system prompt from backend (or use fallback)
    const systemPrompt = await getSystemPrompt(language)

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: systemPrompt,
    })

    // Convert messages to Gemini format
    const history = messages.slice(0, -1).map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }))

    const lastMessage = messages[messages.length - 1]

    // Start chat with history
    const chat = model.startChat({
      history: history as any,
    })

    // Use streaming API
    const result = await chat.sendMessageStream(lastMessage.content)

    // Collect all chunks and format as SSE
    let sseBody = ''

    for await (const chunk of result.stream) {
      const text = chunk.text()
      if (text) {
        // Format each chunk as an SSE event
        const sseEvent = `data: ${JSON.stringify({ text })}\n\n`
        sseBody += sseEvent
      }
    }

    // Add done event
    sseBody += `data: [DONE]\n\n`

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
      body: sseBody,
    }
  } catch (error) {
    console.error('Fel vid Gemini-anrop:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Något gick fel vid kommunikation med AI:n'
      }),
    }
  }
}

export { handler }
