import RequireAuth from "@/shared/RequireAuth";

export default function RelayStationLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}
