import RequireAuth from "@/shared/RequireAuth";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}
