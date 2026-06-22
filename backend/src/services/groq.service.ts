import Groq from 'groq-sdk';

let _groq: Groq | null = null;
const getGroq = (): Groq => {
  if (!_groq) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY environment variable is not set');
    }
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return _groq;
};

interface GenerateProfileInput {
  fullName?: string;
  profession: string;
  location?: string;
  yearsExperience?: number;
  differentiator?: string;
}

export const generateProfile = async ({ fullName, profession, location, yearsExperience, differentiator }: GenerateProfileInput) => {
  const experience = yearsExperience ? `${yearsExperience} years of experience` : 'some experience';
  const loc = location || 'Kenya';
  const name = fullName || 'the professional';

  const completion = await getGroq().chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      {
        role: 'system',
        content: `You are helping a ${profession} in ${loc}, Kenya create a professional profile. Write in first person (e.g. "I am..."). Be warm, confident, and specific. Return ONLY valid JSON with these exact keys: tagline, bio, services, callToAction. services must be an array of 4-6 short strings. bio must be 2-3 sentences (max 200 words). tagline must be under 80 characters.`,
      },
      {
        role: 'user',
        content: `Name: ${name}\nProfession: ${profession}\nLocation: ${loc}\nExperience: ${experience}\nWhat makes me stand out: ${differentiator || 'quality work and professionalism'}\n\nGenerate my profile. Return only JSON.`,
      },
    ],
    temperature: 0.7,
    max_tokens: 400,
  });

  const raw = completion.choices[0].message.content?.trim() ?? '{}';
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid AI response');
  const parsed = JSON.parse(jsonMatch[0]);

  return {
    tagline: String(parsed.tagline || `${profession} in ${loc}`).slice(0, 100),
    bio: String(parsed.bio || ''),
    services: Array.isArray(parsed.services) ? parsed.services.slice(0, 6).map(String) : [],
    callToAction: String(parsed.callToAction || 'Get in touch'),
  };
};

/**
 * Free-text "find a fundi" helper. The customer describes their job; we tell
 * them which trade they need, what to look for, and a question or two to ask.
 * Returns plain text (no JSON), kept short for the Ask-AI modal.
 */
export const findFundi = async (jobDescription: string): Promise<string> => {
  const trades =
    'Plumber, Electrician, Carpenter, Painter, Mason, Welder, Mechanic, Gardener, Cleaner, House help, AC Technician, Solar Technician, Tiler, Chef';

  const completion = await getGroq().chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      {
        role: 'system',
        content: `You are Fundi's friendly assistant, helping a customer find the right tradesperson (a "fundi"). Available trades: ${trades}. In 3 to 4 short sentences, tell the customer which trade they need, what to look for in a good fundi for that job, and one or two useful questions to ask before hiring. Be warm and concise. Do not invent specific prices. Return only the advice as plain text, no preamble.`,
      },
      {
        role: 'user',
        content: `The customer describes their job: "${jobDescription}". Which fundi do they need?`,
      },
    ],
    temperature: 0.6,
    max_tokens: 260,
  });

  return completion.choices[0].message.content?.trim() ?? '';
};

export const polishPost = async (roughText: string, profession: string, postType: string) => {
  const completion = await getGroq().chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      {
        role: 'system',
        content: `You are helping a ${profession} in Kenya write a professional social media post. Make it sound human, warm, and proud of their work. Add 2-3 relevant hashtags at the end. Keep it under 200 words. Return only the post text, nothing else.`,
      },
      {
        role: 'user',
        content: `Post type: ${postType}\nRough notes: ${roughText}\nWrite the polished post:`,
      },
    ],
    temperature: 0.8,
    max_tokens: 200,
  });

  return completion.choices[0].message.content?.trim() ?? '';
};
