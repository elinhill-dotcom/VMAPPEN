/** All nations in the 2026 group stage (English names). */
export const ALL_TEAMS = [
  "Mexico",
  "South Korea",
  "South Africa",
  "Czech Republic",
  "Canada",
  "Qatar",
  "Switzerland",
  "Bosnia and Herzegovina",
  "Brazil",
  "Morocco",
  "Haiti",
  "Scotland",
  "USA",
  "Paraguay",
  "Australia",
  "Turkey",
  "Germany",
  "Curaçao",
  "Ivory Coast",
  "Ecuador",
  "Netherlands",
  "Japan",
  "Tunisia",
  "Sweden",
  "Belgium",
  "Iran",
  "New Zealand",
  "Egypt",
  "Spain",
  "Saudi Arabia",
  "Uruguay",
  "Cape Verde",
  "France",
  "Senegal",
  "Norway",
  "Iraq",
  "Argentina",
  "Algeria",
  "Austria",
  "Jordan",
  "Portugal",
  "Uzbekistan",
  "Colombia",
  "DR Congo",
  "England",
  "Ghana",
  "Croatia",
  "Panama",
] as const;

export const FEATURED_TEAMS = ["Sweden", "Sverige"] as const;

export function isFeaturedTeam(name: string): boolean {
  return (FEATURED_TEAMS as readonly string[]).includes(name);
}

export function isFeaturedMatch(home: string, away: string): boolean {
  return isFeaturedTeam(home) || isFeaturedTeam(away);
}
