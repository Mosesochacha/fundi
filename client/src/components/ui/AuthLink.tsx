import Link from "next/link";

interface AuthLinkProps {
  question: string;
  linkText: string;
  href: string;
}

export default function AuthLink({ question, linkText, href }: AuthLinkProps) {
  return (
    <p className="text-center text-[14px] text-gray-600 font-dm-sans">
      {question}{" "}
      <Link href={href} className="font-medium" style={{ color: "var(--orange-500)" }}>
        {linkText} →
      </Link>
    </p>
  );
}
