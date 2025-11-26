// src/app/(private)/layout.tsx   (server component)
import DashboardWrapper from "./DashboardWrapper"; // note: .. not ./

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return <DashboardWrapper>{children}</DashboardWrapper>;
}
