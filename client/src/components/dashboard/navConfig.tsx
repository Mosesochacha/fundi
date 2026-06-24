import {
  AlertTriangle,
  Briefcase,
  Building2,
  Clock,
  FileText,
  Flag,
  LayoutDashboard,
  MessageSquare,
  Search,
  Settings,
  Star,
  User,
  Users,
} from "lucide-react";
import type { ComponentType } from "react";

export type DashboardRole = "worker" | "employer" | "admin" | "moderator";
export type BadgeKey =
  | "unreadMessages"
  | "unreadRequests"
  | "openReports"
  | "flaggedCount";

type IconType = ComponentType<{
  size?: number | string;
  className?: string;
  strokeWidth?: number;
}>;

export interface NavItem {
  label: string;
  href: string;
  icon: IconType;
  badge?: BadgeKey;
}
export interface NavSection {
  label?: string;
  items: NavItem[];
}
export interface RoleNav {
  sections: NavSection[];
  bottomNav: NavItem[];
}

export const ROLE_LABELS: Record<DashboardRole, string> = {
  worker: "Worker",
  employer: "Employer",
  admin: "Admin",
  moderator: "Moderator",
};

/** Landing route for each role after sign-in / session check. */
export const DASHBOARD_HOME: Record<DashboardRole, string> = {
  worker: "/worker/dashboard",
  employer: "/employer/dashboard",
  admin: "/admin/dashboard",
  moderator: "/moderator/dashboard",
};

/**
 * Map the app's auth model (privilege `role` + `accountType`) onto the unified
 * four-way dashboard role. Admin/moderator privilege wins over account type.
 */
export function dashboardRoleFor(
  role: "user" | "admin" | "moderator" | undefined,
  accountType: "employer" | "worker" | null | undefined,
): DashboardRole {
  if (role === "admin") return "admin";
  if (role === "moderator") return "moderator";
  return accountType === "employer" ? "employer" : "worker";
}

export const NAV_CONFIG: Record<DashboardRole, RoleNav> = {
  worker: {
    sections: [
      {
        label: "Main",
        items: [
          {
            label: "Dashboard",
            href: "/worker/dashboard",
            icon: LayoutDashboard,
          },
          {
            label: "Job requests",
            href: "/worker/requests",
            icon: FileText,
            badge: "unreadRequests",
          },
          {
            label: "Messages",
            href: "/worker/messages",
            icon: MessageSquare,
            badge: "unreadMessages",
          },
        ],
      },
      {
        label: "Profile",
        items: [
          { label: "My profile", href: "/worker/profile", icon: User },
          { label: "My reviews", href: "/worker/reviews", icon: Star },
          { label: "Settings", href: "/worker/settings", icon: Settings },
        ],
      },
    ],
    bottomNav: [
      { label: "Dashboard", href: "/worker/dashboard", icon: LayoutDashboard },
      {
        label: "Requests",
        href: "/worker/requests",
        icon: FileText,
        badge: "unreadRequests",
      },
      {
        label: "Messages",
        href: "/worker/messages",
        icon: MessageSquare,
        badge: "unreadMessages",
      },
      { label: "Profile", href: "/worker/profile", icon: User },
    ],
  },

  employer: {
    sections: [
      {
        label: "Main",
        items: [
          {
            label: "Dashboard",
            href: "/employer/dashboard",
            icon: LayoutDashboard,
          },
          { label: "Find a fundi", href: "/employer/search", icon: Search },
          { label: "My jobs", href: "/employer/jobs", icon: Briefcase },
          {
            label: "Messages",
            href: "/employer/messages",
            icon: MessageSquare,
            badge: "unreadMessages",
          },
        ],
      },
      {
        label: "History",
        items: [
          { label: "Past hires", href: "/employer/hires", icon: Clock },
          { label: "My reviews", href: "/employer/reviews", icon: Star },
        ],
      },
      {
        label: "Other",
        items: [
          { label: "Settings", href: "/employer/settings", icon: Settings },
        ],
      },
    ],
    bottomNav: [
      {
        label: "Dashboard",
        href: "/employer/dashboard",
        icon: LayoutDashboard,
      },
      { label: "Find fundi", href: "/employer/search", icon: Search },
      {
        label: "Messages",
        href: "/employer/messages",
        icon: MessageSquare,
        badge: "unreadMessages",
      },
      { label: "Hires", href: "/employer/hires", icon: Clock },
    ],
  },

  admin: {
    sections: [
      {
        label: "Main",
        items: [
          {
            label: "Dashboard",
            href: "/admin/dashboard",
            icon: LayoutDashboard,
          },
          { label: "Workers", href: "/admin/workers", icon: Users },
          { label: "Employers", href: "/admin/employers", icon: Building2 },
          { label: "Jobs", href: "/admin/jobs", icon: Briefcase },
          { label: "Messages", href: "/admin/messages", icon: MessageSquare },
        ],
      },
      {
        label: "Moderation",
        items: [
          {
            label: "Reports",
            href: "/admin/reports",
            icon: Flag,
            badge: "openReports",
          },
          {
            label: "Flagged users",
            href: "/admin/flagged",
            icon: AlertTriangle,
            badge: "flaggedCount",
          },
          { label: "Reviews", href: "/admin/reviews", icon: Star },
        ],
      },
      {
        label: "System",
        items: [{ label: "Settings", href: "/admin/settings", icon: Settings }],
      },
    ],
    bottomNav: [
      { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      { label: "Workers", href: "/admin/workers", icon: Users },
      {
        label: "Reports",
        href: "/admin/reports",
        icon: Flag,
        badge: "openReports",
      },
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },

  moderator: {
    sections: [
      {
        label: "Main",
        items: [
          {
            label: "Dashboard",
            href: "/moderator/dashboard",
            icon: LayoutDashboard,
          },
          {
            label: "Reports",
            href: "/moderator/reports",
            icon: Flag,
            badge: "openReports",
          },
          {
            label: "Flagged users",
            href: "/moderator/flagged",
            icon: AlertTriangle,
            badge: "flaggedCount",
          },
          { label: "Reviews", href: "/moderator/reviews", icon: Star },
        ],
      },
      {
        label: "Other",
        items: [
          { label: "Settings", href: "/moderator/settings", icon: Settings },
        ],
      },
    ],
    bottomNav: [
      {
        label: "Dashboard",
        href: "/moderator/dashboard",
        icon: LayoutDashboard,
      },
      {
        label: "Reports",
        href: "/moderator/reports",
        icon: Flag,
        badge: "openReports",
      },
      {
        label: "Flagged",
        href: "/moderator/flagged",
        icon: AlertTriangle,
        badge: "flaggedCount",
      },
      { label: "Reviews", href: "/moderator/reviews", icon: Star },
    ],
  },
};
