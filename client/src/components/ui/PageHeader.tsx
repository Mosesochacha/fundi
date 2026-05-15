interface PageHeaderProps {
  title: string;
  subtitle: string;
}

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div>
      <h1 className="text-[36px] font-bold text-gray-900 font-playfair leading-[1.15] tracking-tight">
        {title}
      </h1>
      <p className="text-[15px] text-gray-600 mt-1 font-dm-sans">{subtitle}</p>
    </div>
  );
}
