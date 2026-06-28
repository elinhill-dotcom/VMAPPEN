import type { ReactNode } from "react";

export default function SlutspelLayout({ children }: { children: ReactNode }) {
  return <div className="slutspel-shell">{children}</div>;
}
