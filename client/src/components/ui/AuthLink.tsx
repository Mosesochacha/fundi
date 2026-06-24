import Link from "next/link";

interface AuthLinkProps {
  question: string;
  linkText: string;
  href: string;
}

export default function AuthLink({ question, linkText, href }: AuthLinkProps) {
  return (
    <p className="text-center text-[14px] text-ink-2">
      {question}{" "}
      <Link href={href} className="font-medium text-gold-dark hover:text-navy">
        {linkText} →
      </Link>
    </p>
  );
}
