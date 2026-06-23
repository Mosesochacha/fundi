import type { Metadata } from "next";
import LegalLayout from "@/components/legal/LegalLayout";

export const metadata: Metadata = {
  title: "Terms of Service | Fundi",
  description: "The terms that govern your use of Fundi.",
};

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" updated="June 2026">
      <p>
        Welcome to Fundi. These terms govern your access to and use of the Fundi
        platform — our website, apps and services that connect people who need
        work done with skilled workers (&ldquo;fundis&rdquo;). By creating an
        account or using Fundi, you agree to these terms.
      </p>

      <h2>1. What Fundi is</h2>
      <p>
        Fundi is a marketplace that helps employers discover and contact skilled
        workers, and helps workers showcase their skills and find jobs. Fundi is
        <strong> not</strong> a party to any agreement reached between an
        employer and a worker, does not employ workers, and does not guarantee
        the quality, safety or legality of any job or service. Any contract for
        work is strictly between the employer and the worker.
      </p>

      <h2>2. Eligibility & accounts</h2>
      <ul>
        <li>You must be at least 18 years old to use Fundi.</li>
        <li>
          You agree to provide accurate information and to keep your account
          details up to date.
        </li>
        <li>
          You are responsible for activity under your account and for keeping
          your password secure.
        </li>
      </ul>

      <h2>3. Workers and employers</h2>
      <p>
        Workers are responsible for the services they offer and for performing
        them lawfully and competently. Employers are responsible for describing
        jobs accurately, for agreeing terms directly with the worker, and for
        paying agreed amounts. Reviews may only be left by employers who
        completed a job with the worker they are reviewing.
      </p>

      <h2>4. Payments</h2>
      <p>
        Unless stated otherwise, payments for work are arranged and made directly
        between employers and workers. Fundi does not process payments for jobs
        and takes no commission on agreed rates for founding workers.
      </p>

      <h2>5. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Post false, misleading, or fraudulent information.</li>
        <li>Harass, threaten, or discriminate against others.</li>
        <li>Use the platform for unlawful purposes or to bypass our safeguards.</li>
        <li>Scrape, copy, or misuse other users&rsquo; data.</li>
      </ul>

      <h2>6. Content & reviews</h2>
      <p>
        You retain ownership of content you post, but grant Fundi a licence to
        host and display it so the platform can function. We may remove content
        that violates these terms. Reviews must be honest and based on real
        experiences.
      </p>

      <h2>7. Disclaimers & liability</h2>
      <p>
        Fundi is provided &ldquo;as is&rdquo;. To the fullest extent permitted by
        law, Fundi is not liable for the conduct of any user, for any job or
        service arranged through the platform, or for any indirect or
        consequential loss. You use Fundi at your own risk and should take normal
        precautions when hiring or working.
      </p>

      <h2>8. Suspension & termination</h2>
      <p>
        We may suspend or terminate accounts that breach these terms or that we
        reasonably believe pose a risk to the community. You may stop using Fundi
        and delete your account at any time.
      </p>

      <h2>9. Changes</h2>
      <p>
        We may update these terms from time to time. We&rsquo;ll post the updated
        version here with a new date; continued use of Fundi means you accept the
        changes.
      </p>
    </LegalLayout>
  );
}
