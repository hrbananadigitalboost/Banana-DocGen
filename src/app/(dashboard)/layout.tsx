import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth/auth";
import { isSystemAdmin } from "@/lib/rbac/permissions";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/surat/baru", label: "Buat Surat" },
  { href: "/master/karyawan", label: "Master Karyawan" },
  { href: "/master/klien", label: "Master Klien" },
];

const ADMIN_NAV_ITEMS = [{ href: "/pengaturan/users", label: "Kelola User" }];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  // Defense in depth: proxy.ts already redirects unauthenticated requests,
  // but every layout/action re-checks per Next.js 16 guidance (proxy matchers
  // can silently miss routes after a refactor).
  if (!session?.user) redirect("/login");

  const navItems = isSystemAdmin(session.user.role)
    ? [...NAV_ITEMS, ...ADMIN_NAV_ITEMS]
    : NAV_ITEMS;

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 shrink-0 flex-col justify-between border-r border-slate-200 bg-white p-4">
        <div>
          <div className="mb-6 px-2">
            <h1 className="text-sm font-semibold text-slate-900">BDB DocGen</h1>
            <p className="text-xs text-slate-500">PT. Banana Digital Boost</p>
          </div>
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="border-t border-slate-200 pt-4">
          <p className="px-2 text-xs text-slate-500">{session.user.name}</p>
          <p className="px-2 text-xs font-medium text-slate-700">{session.user.role}</p>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              Keluar
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 bg-slate-50 p-8">{children}</main>
    </div>
  );
}
