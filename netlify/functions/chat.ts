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
  // Endast POST-requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Metoden är inte tillåten' }),
    }
  }

  // Kontrollera API-nyckel
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

    // Initiera Gemini
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: MAGISTER_T_SYSTEM_PROMPT,
    })

    // Konvertera meddelanden till Gemini-format
    const history = messages.slice(0, -1).map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }))

    const lastMessage = messages[messages.length - 1]

    // Starta chatt med historik
    const chat = model.startChat({
      history: history as any,
    })

    // Skicka senaste meddelandet
    const result = await chat.sendMessage(lastMessage.content)
    const response = result.response.text()

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ response }),
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
