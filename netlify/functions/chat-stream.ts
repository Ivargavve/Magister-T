import { Handler } from '@netlify/functions'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { MAGISTER_T_SYSTEM_PROMPT } from '../../src/lib/prompt'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface RequestBody {
  messages: ChatMessage[]
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
    const { messages } = body

    if (!messages || !Array.isArray(messages)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Meddelanden saknas i förfrågan' }),
      }
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: MAGISTER_T_SYSTEM_PROMPT,
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
