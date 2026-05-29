"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

function AdminIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const adminActive = pathname.startsWith("/admin");

  return (
    <header className="site-header">
      <div className="site-header__banner-wrap">
        <Image
          src="/super-vmapp-banner.png"
          alt="SUPER VM-APP — familjetipset för Fotbolls-VM 2026"
          width={1200}
          height={400}
          className="site-header__banner"
          priority
          sizes="(max-width: 72rem) 100vw, 72rem"
        />
        <div className="site-header__banner-shine" aria-hidden />
        <Link
          href="/admin"
          className={`site-header__admin ${adminActive ? "site-header__admin--active" : ""}`}
          title="Admin"
          aria-label="Admin"
        >
          <AdminIcon />
        </Link>
      </div>
      <div className="site-header__tagline-bar">
        <p className="site-header__tagline">
          Familjetipset · Tippa · Heja Sverige · Ha kul
        </p>
      </div>
    </header>
  );
}
