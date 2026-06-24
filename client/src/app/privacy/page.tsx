import type { Metadata } from "next";
import LegalLayout from "@/components/legal/LegalLayout";

export const metadata: Metadata = {
  title: "Privacy Policy | Tesilix",
  description: "How Tesilix collects, uses and protects your information.",
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" updated="June 2026">
      <p>
        This policy explains what information Tesilix collects, how we use it,
        and the choices you have. We aim to collect only what we need to run the
        platform and to keep your data safe.
      </p>

      <h2>1. Information we collect</h2>
      <ul>
        <li>
          <strong>Account details</strong> - your name, email, phone number and
          password.
        </li>
        <li>
          <strong>Profile information</strong> - for workers: trade, location,
          rate, bio, photos, experience and certifications; for employers: the
          trades you hire for and your location.
        </li>
        <li>
          <strong>Usage data</strong> - basic technical information such as
          device, browser and pages viewed, used to keep the service secure and
          working.
        </li>
      </ul>

      <h2>2. How we use your information</h2>
      <ul>
        <li>To create and operate your account.</li>
        <li>To show worker profiles to employers and connect the two sides.</li>
        <li>To verify accounts (e.g. email and phone) and prevent abuse.</li>
        <li>
          To send essential notifications about your account and activity.
        </li>
      </ul>

      <h2>3. What we share</h2>
      <p>
        Worker profile details you choose to publish are visible to others on
        the platform. We do <strong>not</strong> sell your personal data. We
        share information only with service providers that help us run Tesilix
        (such as hosting, email and verification), and where required by law.
      </p>

      <h2>4. Your phone number</h2>
      <p>
        Phone numbers are used for verification and account security. They are
        not shown publicly unless you explicitly choose to display contact
        details on your profile.
      </p>

      <h2>5. Cookies</h2>
      <p>
        We use essential cookies to keep you signed in and to keep the platform
        secure. We do not use them to track you across other websites.
      </p>

      <h2>6. Data retention</h2>
      <p>
        We keep your information for as long as your account is active. If you
        delete your account, we remove or anonymise your personal data, except
        where we must keep records to meet legal obligations.
      </p>

      <h2>7. Your rights</h2>
      <p>
        You can access, update or delete your information from your account
        settings, or by contacting us. You may also ask for a copy of the
        personal data we hold about you.
      </p>

      <h2>8. Security</h2>
      <p>
        We use industry-standard measures to protect your data, including
        encryption in transit and hashed passwords. No system is perfectly
        secure, so please use a strong, unique password.
      </p>

      <h2>9. Changes</h2>
      <p>
        We may update this policy from time to time. We&rsquo;ll post the
        updated version here with a new date.
      </p>
    </LegalLayout>
  );
}
