interface PageHeaderProps {
  title: string;
  subtitle: string;
}

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 font-playfair leading-tight tracking-tight">
        {title}
      </h1>
      <p className="text-sm text-gray-400 mt-1 font-dm-sans">{subtitle}</p>
    </div>
  );
}
