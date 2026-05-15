interface SettingsHeaderProps {
  title: string;
  description?: string;
}

export default function SettingsHeader({ title, description }: SettingsHeaderProps) {
  return (
    <div className="mb-6">
      <h1 className="font-playfair text-2xl font-bold text-gray-900">{title}</h1>
      {description && (
        <p className="text-sm text-gray-500 mt-1 font-dm-sans">{description}</p>
      )}
    </div>
  );
}
