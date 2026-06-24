export const POST_TYPES = [
  {
    value: "SHOWCASE",
    label: "Showcase",
    hint: "Describe the job you completed...",
  },
  {
    value: "TIP",
    label: "Pro Tip",
    hint: "Share a tip with fellow professionals...",
  },
  { value: "QUESTION", label: "Question", hint: "What do you need help with?" },
  { value: "HIRING", label: "Hiring", hint: "Describe what you need..." },
] as const;

export const FEED_FILTERS = [
  { value: "all", label: "All" },
  { value: "showcase", label: "Showcase" },
  { value: "tip", label: "Tips" },
  { value: "question", label: "Questions" },
  { value: "hiring", label: "Hiring" },
] as const;

export const POST_TYPE_LABELS: Record<string, string> = {
  SHOWCASE: "Showcase",
  TIP: "Pro Tip",
  QUESTION: "Question",
  HIRING: "Hiring",
};
