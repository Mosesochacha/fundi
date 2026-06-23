import { redirect } from "next/navigation";

// Employers don't have a separate public profile; their details live in
// account settings. Redirect instead of 404-ing /employer/profile.
export default function EmployerProfilePage() {
  redirect("/employer/settings");
}
