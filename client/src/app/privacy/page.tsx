import type { Metadata } from "next";
import LegalDocument, {
  type LegalSection,
} from "@/components/legal/LegalDocument";

export const metadata: Metadata = {
  title: "Privacy Policy | Tesilix",
  description:
    "Read the Tesilix Privacy Policy and learn how we protect your personal data.",
};

const SECTIONS: LegalSection[] = [
  {
    number: "1",
    title: "Introduction",
    blocks: [
      {
        type: "p",
        text: 'Tesilix ("we", "us", "our") is committed to protecting your personal information. This Privacy Policy explains how we collect, use, store, share, and protect your personal data when you use the Tesilix platform.',
      },
      {
        type: "p",
        text: "This policy applies to all Users of the Tesilix website and mobile application, including Workers and Employers. By using our Platform, you consent to the practices described in this Privacy Policy.",
      },
      {
        type: "p",
        text: "We comply with the Kenya Data Protection Act, 2019 and all applicable data protection regulations.",
      },
    ],
  },
  {
    number: "2",
    title: "Information We Collect",
    blocks: [
      { type: "h2", text: "2.1 Information You Provide Directly" },
      {
        type: "ul",
        items: [
          "Full name, email address, and phone number at registration.",
          "Profile information including location, trade, experience, and qualifications.",
          "Portfolio photos and work samples uploaded to your profile.",
          "Certifications and credentials you choose to upload.",
          "Communications with other Users through our messaging system.",
          "Reviews and ratings you submit.",
          "Payment information when applicable.",
        ],
      },
      { type: "h2", text: "2.2 Information Collected Automatically" },
      {
        type: "ul",
        items: [
          "Device information including device type, operating system, and browser type.",
          "IP address and approximate location data.",
          "Usage data including pages visited, features used, and time spent on the Platform.",
          "Log data including access times, errors, and referring URLs.",
        ],
      },
      { type: "h2", text: "2.3 Information from Third Parties" },
      {
        type: "ul",
        items: [
          "If you register using Google OAuth, we receive your name, email address, and profile picture from Google.",
          "We may receive verification information from identity verification services.",
        ],
      },
    ],
  },
  {
    number: "3",
    title: "How We Use Your Information",
    blocks: [
      { type: "p", text: "We use your personal information to:" },
      {
        type: "ul",
        items: [
          "Create and manage your account.",
          "Enable connections between Workers and Employers.",
          "Display your profile to relevant users based on location and trade.",
          "Send job request notifications and platform updates.",
          "Process payments and transaction records (when applicable).",
          "Verify your identity and prevent fraud.",
          "Improve our platform and user experience.",
          "Respond to your inquiries and provide customer support.",
          "Comply with our legal obligations under Kenyan law.",
          "Send marketing communications (with your consent, which you may withdraw at any time).",
        ],
      },
    ],
  },
  {
    number: "4",
    title: "Legal Basis for Processing",
    blocks: [
      {
        type: "p",
        text: "Under the Kenya Data Protection Act, 2019, we process your personal data on the following legal bases:",
      },
      {
        type: "ul",
        items: [
          "Contract: Processing necessary to provide our services to you.",
          "Legitimate Interests: Improving our platform, preventing fraud, and ensuring security.",
          "Consent: For marketing communications and optional features.",
          "Legal Obligation: Compliance with applicable Kenyan laws and regulations.",
        ],
      },
    ],
  },
  {
    number: "5",
    title: "How We Share Your Information",
    blocks: [
      { type: "h2", text: "5.1 With Other Users" },
      {
        type: "p",
        text: "Your public profile information — including your name, trade, location, portfolio, ratings, and reviews — is visible to other registered Users and visitors to the Platform.",
      },
      {
        type: "p",
        text: "Your contact details and private messages are only shared with Users you directly engage with.",
      },
      { type: "h2", text: "5.2 With Service Providers" },
      {
        type: "p",
        text: "We share data with trusted third-party service providers who assist us in operating the Platform, including:",
      },
      {
        type: "ul",
        items: [
          "Cloud hosting providers (for data storage and infrastructure).",
          "Payment processors (for transaction processing).",
          "Analytics providers (for platform improvement).",
          "Communication services (for email and push notifications).",
        ],
      },
      {
        type: "p",
        text: "All service providers are contractually required to protect your data and may not use it for their own purposes.",
      },
      { type: "h2", text: "5.3 Legal Requirements" },
      {
        type: "p",
        text: "We may disclose your information if required to do so by law, court order, or governmental authority, or when we believe disclosure is necessary to protect our rights or the safety of our Users.",
      },
      { type: "h2", text: "5.4 Business Transfers" },
      {
        type: "p",
        text: "In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction. We will notify you of any such change.",
      },
    ],
  },
  {
    number: "6",
    title: "Data Storage and Security",
    blocks: [
      {
        type: "p",
        text: "Your data is stored on secure servers. We implement appropriate technical and organisational measures to protect your personal information against unauthorised access, alteration, disclosure, or destruction, including:",
      },
      {
        type: "ul",
        items: [
          "Encryption of data in transit (HTTPS/TLS).",
          "Encrypted storage of sensitive information.",
          "Access controls limiting who can access personal data.",
          "Regular security assessments and monitoring.",
        ],
      },
      {
        type: "p",
        text: "While we take security seriously, no system is completely secure. We encourage you to use a strong password and to notify us immediately if you suspect any unauthorised access to your account.",
      },
    ],
  },
  {
    number: "7",
    title: "Data Retention",
    blocks: [
      {
        type: "p",
        text: "We retain your personal information for as long as your account is active or as necessary to provide our services. Specifically:",
      },
      {
        type: "ul",
        items: [
          "Active account data: retained for the duration of your account.",
          "Deactivated account data: retained for 12 months after deactivation, then deleted or anonymised.",
          "Transaction records: retained for 7 years as required by Kenyan tax and financial regulations.",
          "Communications: retained for 24 months then deleted.",
        ],
      },
      {
        type: "p",
        text: "You may request deletion of your data at any time (see Section 9 — Your Rights).",
      },
    ],
  },
  {
    number: "8",
    title: "Cookies and Tracking",
    blocks: [
      {
        type: "p",
        text: "We use cookies and similar tracking technologies to:",
      },
      {
        type: "ul",
        items: [
          "Maintain your login session.",
          "Remember your preferences.",
          "Analyse how the Platform is used.",
          "Improve performance and user experience.",
        ],
      },
      {
        type: "p",
        text: "You can control cookie settings through your browser. Disabling cookies may affect the functionality of the Platform. We do not sell your data to advertisers or use it for targeted advertising.",
      },
    ],
  },
  {
    number: "9",
    title: "Your Rights",
    blocks: [
      {
        type: "p",
        text: "Under the Kenya Data Protection Act, 2019, you have the following rights regarding your personal data:",
      },
      {
        type: "ul",
        items: [
          "Right of Access: Request a copy of the personal data we hold about you.",
          "Right to Rectification: Request correction of inaccurate or incomplete data.",
          "Right to Erasure: Request deletion of your personal data, subject to legal obligations.",
          "Right to Restrict Processing: Request that we limit how we use your data.",
          "Right to Data Portability: Receive your data in a structured, machine-readable format.",
          "Right to Object: Object to processing based on legitimate interests.",
          "Right to Withdraw Consent: Withdraw consent for marketing communications at any time.",
        ],
      },
      {
        type: "p",
        text: "To exercise any of these rights, contact us at privacy@tesilix.com. We will respond within 21 days as required by the Kenya Data Protection Act.",
      },
    ],
  },
  {
    number: "10",
    title: "Children's Privacy",
    blocks: [
      {
        type: "p",
        text: "The Tesilix Platform is not directed at children under the age of 18. We do not knowingly collect personal information from minors. If we become aware that a child under 18 has provided us with personal information, we will delete it immediately.",
      },
      {
        type: "p",
        text: "If you believe a minor has registered on our Platform, please contact us at support@tesilix.com.",
      },
    ],
  },
  {
    number: "11",
    title: "Third-Party Links",
    blocks: [
      {
        type: "p",
        text: "The Platform may contain links to third-party websites or services. We are not responsible for the privacy practices of those third parties. We encourage you to review the privacy policies of any third-party sites you visit.",
      },
    ],
  },
  {
    number: "12",
    title: "Changes to This Privacy Policy",
    blocks: [
      {
        type: "p",
        text: "We may update this Privacy Policy from time to time to reflect changes in our practices or applicable law. We will notify you of material changes via email or through the Platform at least 14 days before the changes take effect.",
      },
      {
        type: "p",
        text: "Your continued use of the Platform after the effective date of any changes constitutes acceptance of the updated Privacy Policy.",
      },
    ],
  },
  {
    number: "13",
    title: "Data Protection Officer",
    blocks: [
      {
        type: "p",
        text: "We have appointed a Data Protection Officer responsible for overseeing compliance with this Privacy Policy and the Kenya Data Protection Act.",
      },
    ],
  },
  {
    number: "14",
    title: "Contact Us",
    blocks: [
      {
        type: "p",
        text: "For any questions, concerns, or requests relating to this Privacy Policy or your personal data, please contact us at:",
      },
      {
        type: "lines",
        items: [
          "Tesilix — Data Privacy",
          "Email: privacy@tesilix.com",
          "Support: support@tesilix.com",
          "Website: tesilix.com",
          "Nairobi, Kenya",
        ],
      },
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalDocument
      docTitle="Privacy Policy"
      effectiveDate="24 June 2026"
      sections={SECTIONS}
    />
  );
}
