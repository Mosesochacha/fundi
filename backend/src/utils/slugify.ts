export function generateSlug(content: string, id: string): string {
  const words = content
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6)
    .join('-');
  const prefix = id.split('-')[0];
  return `${words}-${prefix}`;
}
