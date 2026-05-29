import Link from "next/link";

export default function NotFound() {
  return (
    <div className="space-y-4 py-12 text-center">
      <h1 className="burst-heading text-2xl">Sidan finns inte</h1>
      <p className="text-[var(--muted)] text-sm">
        Kontrollera adressen eller gå tillbaka till startsidan.
      </p>
      <Link
        href="/"
        className="inline-block rounded-lg bg-[var(--accent)] px-5 py-2 font-semibold text-[var(--accent-foreground)]"
      >
        Till startsidan
      </Link>
    </div>
  );
}
