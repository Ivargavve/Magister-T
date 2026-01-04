import { Handler } from '@netlify/functions'

interface GoogleUserInfo {
  id: string
  email: string
  verified_email: boolean
  name: string
  given_name: string
  family_name: string
  picture: string
}

const handler: Handler = async (event) => {
  // Endast POST-requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Metoden är inte tillåten' }),
    }
  }

  try {
    const body = JSON.parse(event.body || '{}')
    const { token } = body

    if (!token) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Token saknas' }),
      }
    }

    // Verifiera Google access token genom att hämta användarinfo
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      console.error('Google API error:', response.status)
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Ogiltig token' }),
      }
    }

    const googleUser: GoogleUserInfo = await response.json()

    // Skapa en enkel JWT-liknande token (för demo - använd riktig JWT i produktion)
    const userToken = Buffer.from(JSON.stringify({
      id: googleUser.id,
      email: googleUser.email,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 dagar
    })).toString('base64')

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: userToken,
        user: {
          name: googleUser.name,
          email: googleUser.email,
          profile_image: googleUser.picture,
        },
      }),
    }
  } catch (error) {
    console.error('Auth error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Autentiseringsfel' }),
    }
  }
}

export { handler }
