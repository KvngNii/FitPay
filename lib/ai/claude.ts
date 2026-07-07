// Server-only - never import this from a client component.
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

type ClaudeCallOptions = {
  prompt: string
  maxTokens: number
  systemPrompt?: string
}

export async function callClaude({ prompt, maxTokens, systemPrompt }: ClaudeCallOptions): Promise<string> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: prompt }],
  })

  const block = message.content[0]
  if (block.type !== 'text') {
    throw new Error('Unexpected Claude response type')
  }
  return block.text
}
