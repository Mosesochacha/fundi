import type { Metadata } from "next";
import LegalDocument, {
  type LegalSection,
} from "@/components/legal/LegalDocument";

export const metadata: Metadata = {
  title: "Terms and Conditions | Tesilix",
  description:
    "Read the Tesilix Terms and Conditions governing use of our skilled worker marketplace.",
};

const SECTIONS: LegalSection[] = [
  {
    number: "1",
    title: "Introduction and Acceptance",
    blocks: [
      {
        type: "p",
        text: 'Welcome to Tesilix ("Platform", "we", "us", "our"). Tesilix is a skilled worker marketplace that connects employers with qualified workers ("Fundis") across Kenya and East Africa.',
      },
      {
        type: "p",
        text: "By accessing or using the Tesilix platform — including our website, mobile application, and related services — you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our platform.",
      },
      {
        type: "p",
        text: "These Terms constitute a legally binding agreement between you and Tesilix. We reserve the right to update these Terms at any time, and your continued use of the platform constitutes acceptance of any changes.",
      },
    ],
  },
  {
    number: "2",
    title: "Definitions",
    blocks: [
      {
        type: "ul",
        items: [
          '"Platform" refers to the Tesilix website, mobile application, and all related services.',
          '"Worker" or "Fundi" refers to a registered skilled worker offering services through the Platform.',
          '"Employer" refers to a registered user seeking to hire skilled workers.',
          '"User" refers to any registered individual using the Platform, whether as a Worker or Employer.',
          '"Job Request" refers to a hiring request submitted by an Employer to a Worker through the Platform.',
          '"Services" refers to the skilled labour services offered and performed through the Platform.',
        ],
      },
    ],
  },
  {
    number: "3",
    title: "Eligibility",
    blocks: [
      {
        type: "p",
        text: "To register and use the Tesilix Platform, you must:",
      },
      {
        type: "ul",
        items: [
          "Be at least 18 years of age.",
          "Be a resident of Kenya or a supported East African country.",
          "Provide accurate and truthful registration information.",
          "Have the legal capacity to enter into a binding agreement.",
          "Not have been previously suspended or banned from the Platform.",
        ],
      },
      {
        type: "p",
        text: "By registering, you confirm that all information provided is accurate, current, and complete.",
      },
    ],
  },
  {
    number: "4",
    title: "Account Registration and Security",
    blocks: [
      { type: "h2", text: "4.1 Registration" },
      {
        type: "p",
        text: "Users must register an account to access the Platform's core features. You may register using a valid email address and password, or through Google OAuth.",
      },
      { type: "h2", text: "4.2 Account Responsibility" },
      {
        type: "p",
        text: "You are solely responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately at support@tesilix.com if you suspect any unauthorised access to your account.",
      },
      { type: "h2", text: "4.3 Account Accuracy" },
      {
        type: "p",
        text: "You agree to keep your profile information accurate and up to date. Tesilix reserves the right to suspend accounts found to contain false or misleading information.",
      },
    ],
  },
  {
    number: "5",
    title: "Worker Obligations",
    blocks: [
      { type: "p", text: "Workers registered on the Platform agree to:" },
      {
        type: "ul",
        items: [
          "Provide accurate information about their skills, qualifications, experience, and certifications.",
          "Honour confirmed job requests and communicate promptly with Employers.",
          "Perform services with reasonable care, skill, and diligence.",
          "Maintain professional conduct at all times.",
          "Not misrepresent their identity, qualifications, or capabilities.",
          "Comply with all applicable Kenyan laws and regulations.",
          "Not solicit Employers to transact outside the Platform to avoid fees.",
        ],
      },
    ],
  },
  {
    number: "6",
    title: "Employer Obligations",
    blocks: [
      { type: "p", text: "Employers registered on the Platform agree to:" },
      {
        type: "ul",
        items: [
          "Provide accurate descriptions of jobs and work requirements.",
          "Treat Workers with respect and dignity at all times.",
          "Honour confirmed job agreements and agreed payment terms.",
          "Provide a safe working environment for Workers.",
          "Not engage Workers in illegal or unethical activities.",
          "Not solicit Workers to transact outside the Platform to avoid fees.",
        ],
      },
    ],
  },
  {
    number: "7",
    title: "Platform Role and Limitations",
    blocks: [
      {
        type: "p",
        text: "Tesilix is a marketplace platform and technology provider. We facilitate connections between Workers and Employers but are not a party to the service agreements between them.",
      },
      { type: "p", text: "Tesilix does not:" },
      {
        type: "ul",
        items: [
          "Employ or act as an agent for any Worker.",
          "Guarantee the quality, safety, or legality of services performed.",
          "Guarantee the conduct or reliability of any User.",
          "Verify all certifications or qualifications claimed by Workers.",
        ],
      },
      {
        type: "p",
        text: "Workers are independent contractors, not employees of Tesilix. Employers are responsible for their own compliance with applicable employment and contractor laws.",
      },
    ],
  },
  {
    number: "8",
    title: "Reviews and Ratings",
    blocks: [
      {
        type: "p",
        text: "Both Workers and Employers may leave reviews following completed jobs. Reviews must be:",
      },
      {
        type: "ul",
        items: [
          "Honest and based on genuine experience.",
          "Free from offensive, defamatory, or inappropriate content.",
          "Not submitted in exchange for payment or other incentives.",
        ],
      },
      {
        type: "p",
        text: "Tesilix reserves the right to remove reviews that violate these guidelines without notice.",
      },
    ],
  },
  {
    number: "9",
    title: "Prohibited Conduct",
    blocks: [
      { type: "p", text: "Users are strictly prohibited from:" },
      {
        type: "ul",
        items: [
          "Creating fake accounts or impersonating any person or entity.",
          "Using the Platform for any unlawful purpose.",
          "Harassing, threatening, or abusing other Users.",
          "Posting false, misleading, or fraudulent information.",
          "Circumventing the Platform to avoid transaction fees.",
          "Scraping, copying, or reproducing Platform content without permission.",
          "Attempting to gain unauthorised access to the Platform or other users' accounts.",
          "Uploading malware, viruses, or any harmful code.",
        ],
      },
      {
        type: "p",
        text: "Violation of these prohibitions may result in immediate account suspension or termination.",
      },
    ],
  },
  {
    number: "10",
    title: "Intellectual Property",
    blocks: [
      {
        type: "p",
        text: "All content on the Tesilix Platform — including but not limited to the logo, design, code, text, graphics, and user interface — is the exclusive property of Tesilix and is protected by applicable intellectual property laws.",
      },
      {
        type: "p",
        text: "Users retain ownership of content they upload (such as portfolio photos and profile information) but grant Tesilix a non-exclusive, royalty-free licence to display and use such content for the operation and promotion of the Platform.",
      },
    ],
  },
  {
    number: "11",
    title: "Privacy",
    blocks: [
      {
        type: "p",
        text: "Your use of the Platform is also governed by our Privacy Policy, which is incorporated into these Terms by reference. By using the Platform, you consent to the collection and use of your information as described in our Privacy Policy.",
      },
    ],
  },
  {
    number: "12",
    title: "Termination",
    blocks: [
      {
        type: "p",
        text: "Tesilix reserves the right to suspend or terminate any account at our sole discretion, with or without notice, for violations of these Terms or for any conduct we determine to be harmful to the Platform, other Users, or third parties.",
      },
      {
        type: "p",
        text: "You may deactivate your account at any time through your account settings. Deactivation does not delete your data immediately — please refer to our Privacy Policy for details on data retention.",
      },
    ],
  },
  {
    number: "13",
    title: "Limitation of Liability",
    blocks: [
      {
        type: "p",
        text: "To the fullest extent permitted by applicable Kenyan law, Tesilix shall not be liable for:",
      },
      {
        type: "ul",
        items: [
          "Any indirect, incidental, special, or consequential damages.",
          "Loss of profits, revenue, data, or goodwill.",
          "Personal injury or property damage arising from services performed by Workers.",
          "Any conduct or content of third-party Users.",
        ],
      },
      {
        type: "p",
        text: "Our total aggregate liability to you shall not exceed the amount paid by you to Tesilix in the three months preceding the event giving rise to the claim.",
      },
    ],
  },
  {
    number: "14",
    title: "Dispute Resolution",
    blocks: [
      {
        type: "p",
        text: "In the event of a dispute between an Employer and a Worker, Tesilix may, at its discretion, offer mediation assistance but is not obligated to resolve disputes between Users.",
      },
      {
        type: "p",
        text: "These Terms shall be governed by the laws of Kenya. Any disputes shall be subject to the exclusive jurisdiction of the courts of Nairobi, Kenya.",
      },
    ],
  },
  {
    number: "15",
    title: "Changes to These Terms",
    blocks: [
      {
        type: "p",
        text: "We may update these Terms from time to time. We will notify registered Users of material changes via email or through the Platform. Your continued use of the Platform after such notification constitutes acceptance of the updated Terms.",
      },
    ],
  },
  {
    number: "16",
    title: "Contact Us",
    blocks: [
      {
        type: "p",
        text: "If you have any questions about these Terms and Conditions, please contact us at:",
      },
      {
        type: "lines",
        items: [
          "Tesilix",
          "Email: support@tesilix.com",
          "Website: tesilix.com",
          "Nairobi, Kenya",
        ],
      },
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalDocument
      docTitle="Terms and Conditions"
      effectiveDate="24 June 2026"
      sections={SECTIONS}
    />
  );
}
