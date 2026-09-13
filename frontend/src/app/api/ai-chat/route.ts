import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/* ─── Clean + validate messages ─── */
function cleanMessages(raw: { role: string; content: string }[]) {
  const cleaned = raw
    .filter(m =>
      m &&
      typeof m.role === 'string' &&
      typeof m.content === 'string' &&
      m.content.trim() !== ''
    )
    .map(m => ({
      role:    m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content.trim(),
    }))

  // Must start with a user message
  if (cleaned.length > 0 && cleaned[0].role !== 'user') {
    return cleaned.slice(1)
  }
  return cleaned
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { system, messages } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages array' }, { status: 400 })
    }

    const groqKey = process.env.GROQ_API_KEY
    if (!groqKey) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY is not set in .env.local' },
        { status: 500 }
      )
    }

    const validMessages = cleanMessages(messages)

    if (validMessages.length === 0) {
      return NextResponse.json({ error: 'No valid messages to send' }, { status: 400 })
    }

    // Call Groq API (OpenAI-compatible endpoint)
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model:       'llama-3.3-70b-versatile',
        max_tokens:  2048,
        temperature: 0.7,
        messages: [
          { role: 'system', content: system || '' },
          ...validMessages,
        ],
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Groq API error:', response.status, errText)
      return NextResponse.json(
        { error: `Groq API error: ${response.status} — ${errText}` },
        { status: response.status }
      )
    }

    const data  = await response.json()
    const reply = data?.choices?.[0]?.message?.content?.trim()

    if (!reply) {
      return NextResponse.json({ error: 'Empty reply from Groq' }, { status: 500 })
    }

    // Return in the same shape the frontend expects
    return NextResponse.json({
      content: [{ type: 'text', text: reply }],
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('AI chat route error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}