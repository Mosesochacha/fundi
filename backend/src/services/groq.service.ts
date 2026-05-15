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
