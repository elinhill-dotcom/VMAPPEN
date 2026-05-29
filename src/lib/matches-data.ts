export type MatchSeed = {
  id: number;
  matchNumber?: number;
  dayLabel: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  homeTeam: string;
  awayTeam: string;
  groupCode?: string;
  stage: string;
  broadcaster?: string;
};

import { formatSvDayLabel } from "./datetime";
import { isFeaturedMatch } from "./teams";

export { isFeaturedMatch };

/** Swedish day heading from calendar date (CEST). */
function svDayLabel(dateStr: string): string {
  return formatSvDayLabel(`${dateStr}T12:00:00+02:00`);
}

/** Full schedule (CEST kickoff times, UTC+2). Group stage = score predictions. */
export const MATCHES: MatchSeed[] = [
  { id: 1, dayLabel: svDayLabel("2026-06-11"), date: "2026-06-11", time: "21:00", homeTeam: "Mexiko", awayTeam: "Sydafrika", groupCode: "A", stage: "group", broadcaster: "TV4" },
  { id: 2, dayLabel: svDayLabel("2026-06-12"), date: "2026-06-12", time: "04:00", homeTeam: "Sydkorea", awayTeam: "Tjeckien", groupCode: "A", stage: "group", broadcaster: "TV4" },
  { id: 3, dayLabel: svDayLabel("2026-06-12"), date: "2026-06-12", time: "21:00", homeTeam: "Kanada", awayTeam: "Bosnien och Hercegovina", groupCode: "B", stage: "group", broadcaster: "SVT" },
  { id: 4, dayLabel: svDayLabel("2026-06-13"), date: "2026-06-13", time: "03:00", homeTeam: "USA", awayTeam: "Paraguay", groupCode: "D", stage: "group", broadcaster: "TV4" },
  { id: 5, dayLabel: svDayLabel("2026-06-13"), date: "2026-06-13", time: "21:00", homeTeam: "Qatar", awayTeam: "Schweiz", groupCode: "B", stage: "group", broadcaster: "TV4" },
  { id: 6, dayLabel: svDayLabel("2026-06-14"), date: "2026-06-14", time: "00:00", homeTeam: "Brasilien", awayTeam: "Marocko", groupCode: "C", stage: "group", broadcaster: "TV4" },
  { id: 7, dayLabel: svDayLabel("2026-06-14"), date: "2026-06-14", time: "03:00", homeTeam: "Haiti", awayTeam: "Skottland", groupCode: "C", stage: "group", broadcaster: "SVT" },
  { id: 8, dayLabel: svDayLabel("2026-06-14"), date: "2026-06-14", time: "06:00", homeTeam: "Australien", awayTeam: "Turkiet", groupCode: "D", stage: "group", broadcaster: "TV4" },
  { id: 9, dayLabel: svDayLabel("2026-06-14"), date: "2026-06-14", time: "19:00", homeTeam: "Tyskland", awayTeam: "Curaçao", groupCode: "E", stage: "group", broadcaster: "TV4" },
  { id: 10, dayLabel: svDayLabel("2026-06-14"), date: "2026-06-14", time: "22:00", homeTeam: "Nederländerna", awayTeam: "Japan", groupCode: "F", stage: "group", broadcaster: "TV4" },
  { id: 11, dayLabel: svDayLabel("2026-06-15"), date: "2026-06-15", time: "01:00", homeTeam: "Elfenbenskusten", awayTeam: "Ecuador", groupCode: "E", stage: "group", broadcaster: "TV4" },
  { id: 12, dayLabel: svDayLabel("2026-06-15"), date: "2026-06-15", time: "04:00", homeTeam: "Sverige", awayTeam: "Tunisien", groupCode: "F", stage: "group" },
  { id: 13, dayLabel: svDayLabel("2026-06-15"), date: "2026-06-15", time: "18:00", homeTeam: "Spanien", awayTeam: "Kap Verde", groupCode: "H", stage: "group", broadcaster: "SVT" },
  { id: 14, dayLabel: svDayLabel("2026-06-15"), date: "2026-06-15", time: "21:00", homeTeam: "Belgien", awayTeam: "Egypten", groupCode: "G", stage: "group", broadcaster: "SVT" },
  { id: 15, dayLabel: svDayLabel("2026-06-16"), date: "2026-06-16", time: "00:00", homeTeam: "Saudiarabien", awayTeam: "Uruguay", groupCode: "H", stage: "group", broadcaster: "TV4" },
  { id: 16, dayLabel: svDayLabel("2026-06-16"), date: "2026-06-16", time: "03:00", homeTeam: "Iran", awayTeam: "Nya Zeeland", groupCode: "G", stage: "group", broadcaster: "TV4" },
  { id: 17, dayLabel: svDayLabel("2026-06-16"), date: "2026-06-16", time: "21:00", homeTeam: "Frankrike", awayTeam: "Senegal", groupCode: "I", stage: "group", broadcaster: "SVT" },
  { id: 18, dayLabel: svDayLabel("2026-06-17"), date: "2026-06-17", time: "00:00", homeTeam: "Irak", awayTeam: "Norge", groupCode: "I", stage: "group", broadcaster: "TV4" },
  { id: 19, dayLabel: svDayLabel("2026-06-17"), date: "2026-06-17", time: "03:00", homeTeam: "Argentina", awayTeam: "Algeriet", groupCode: "J", stage: "group", broadcaster: "TV4" },
  { id: 20, dayLabel: svDayLabel("2026-06-17"), date: "2026-06-17", time: "06:00", homeTeam: "Österrike", awayTeam: "Jordanien", groupCode: "J", stage: "group", broadcaster: "TV4" },
  { id: 21, dayLabel: svDayLabel("2026-06-17"), date: "2026-06-17", time: "19:00", homeTeam: "Portugal", awayTeam: "DR Kongo", groupCode: "K", stage: "group", broadcaster: "TV4" },
  { id: 22, dayLabel: svDayLabel("2026-06-17"), date: "2026-06-17", time: "22:00", homeTeam: "England", awayTeam: "Kroatien", groupCode: "L", stage: "group", broadcaster: "TV4" },
  { id: 23, dayLabel: svDayLabel("2026-06-18"), date: "2026-06-18", time: "01:00", homeTeam: "Ghana", awayTeam: "Panama", groupCode: "L", stage: "group", broadcaster: "TV4" },
  { id: 24, dayLabel: svDayLabel("2026-06-18"), date: "2026-06-18", time: "04:00", homeTeam: "Uzbekistan", awayTeam: "Colombia", groupCode: "K", stage: "group", broadcaster: "TV4" },
  { id: 25, dayLabel: svDayLabel("2026-06-18"), date: "2026-06-18", time: "18:00", homeTeam: "Tjeckien", awayTeam: "Sydafrika", groupCode: "A", stage: "group", broadcaster: "TV4" },
  { id: 26, dayLabel: svDayLabel("2026-06-18"), date: "2026-06-18", time: "21:00", homeTeam: "Schweiz", awayTeam: "Bosnien och Hercegovina", groupCode: "B", stage: "group", broadcaster: "TV4" },
  { id: 27, dayLabel: svDayLabel("2026-06-19"), date: "2026-06-19", time: "00:00", homeTeam: "Kanada", awayTeam: "Qatar", groupCode: "B", stage: "group", broadcaster: "TV4" },
  { id: 28, dayLabel: svDayLabel("2026-06-19"), date: "2026-06-19", time: "03:00", homeTeam: "Mexiko", awayTeam: "Sydkorea", groupCode: "A", stage: "group", broadcaster: "TV4" },
  { id: 29, dayLabel: svDayLabel("2026-06-19"), date: "2026-06-19", time: "21:00", homeTeam: "USA", awayTeam: "Australien", groupCode: "D", stage: "group", broadcaster: "SVT" },
  { id: 30, dayLabel: svDayLabel("2026-06-20"), date: "2026-06-20", time: "00:00", homeTeam: "Skottland", awayTeam: "Marocko", groupCode: "C", stage: "group", broadcaster: "SVT" },
  { id: 31, dayLabel: svDayLabel("2026-06-20"), date: "2026-06-20", time: "03:00", homeTeam: "Brasilien", awayTeam: "Haiti", groupCode: "C", stage: "group", broadcaster: "TV4" },
  { id: 32, dayLabel: svDayLabel("2026-06-20"), date: "2026-06-20", time: "06:00", homeTeam: "Turkiet", awayTeam: "Paraguay", groupCode: "D", stage: "group", broadcaster: "TV4" },
  { id: 33, dayLabel: svDayLabel("2026-06-20"), date: "2026-06-20", time: "19:00", homeTeam: "Nederländerna", awayTeam: "Sverige", groupCode: "F", stage: "group", broadcaster: "TV4" },
  { id: 34, dayLabel: svDayLabel("2026-06-20"), date: "2026-06-20", time: "22:00", homeTeam: "Tyskland", awayTeam: "Elfenbenskusten", groupCode: "E", stage: "group", broadcaster: "TV4" },
  { id: 35, dayLabel: svDayLabel("2026-06-21"), date: "2026-06-21", time: "02:00", homeTeam: "Ecuador", awayTeam: "Curaçao", groupCode: "E", stage: "group", broadcaster: "TV4" },
  { id: 36, dayLabel: svDayLabel("2026-06-21"), date: "2026-06-21", time: "06:00", homeTeam: "Tunisien", awayTeam: "Japan", groupCode: "F", stage: "group", broadcaster: "SVT" },
  { id: 37, dayLabel: svDayLabel("2026-06-21"), date: "2026-06-21", time: "18:00", homeTeam: "Spanien", awayTeam: "Saudiarabien", groupCode: "H", stage: "group", broadcaster: "TV4" },
  { id: 38, dayLabel: svDayLabel("2026-06-21"), date: "2026-06-21", time: "21:00", homeTeam: "Belgien", awayTeam: "Iran", groupCode: "G", stage: "group", broadcaster: "TV4" },
  { id: 39, dayLabel: svDayLabel("2026-06-22"), date: "2026-06-22", time: "00:00", homeTeam: "Uruguay", awayTeam: "Kap Verde", groupCode: "H", stage: "group", broadcaster: "TV4" },
  { id: 40, dayLabel: svDayLabel("2026-06-22"), date: "2026-06-22", time: "03:00", homeTeam: "Nya Zeeland", awayTeam: "Egypten", groupCode: "G", stage: "group", broadcaster: "TV4" },
  { id: 41, dayLabel: svDayLabel("2026-06-22"), date: "2026-06-22", time: "19:00", homeTeam: "Argentina", awayTeam: "Österrike", groupCode: "J", stage: "group", broadcaster: "SVT" },
  { id: 42, dayLabel: svDayLabel("2026-06-22"), date: "2026-06-22", time: "23:00", homeTeam: "Frankrike", awayTeam: "Irak", groupCode: "I", stage: "group", broadcaster: "SVT" },
  { id: 43, dayLabel: svDayLabel("2026-06-23"), date: "2026-06-23", time: "02:00", homeTeam: "Norge", awayTeam: "Senegal", groupCode: "I", stage: "group", broadcaster: "SVT" },
  { id: 44, dayLabel: svDayLabel("2026-06-23"), date: "2026-06-23", time: "05:00", homeTeam: "Jordanien", awayTeam: "Algeriet", groupCode: "J", stage: "group", broadcaster: "TV4" },
  { id: 45, dayLabel: svDayLabel("2026-06-23"), date: "2026-06-23", time: "19:00", homeTeam: "Portugal", awayTeam: "Uzbekistan", groupCode: "K", stage: "group", broadcaster: "SVT" },
  { id: 46, dayLabel: svDayLabel("2026-06-23"), date: "2026-06-23", time: "22:00", homeTeam: "England", awayTeam: "Ghana", groupCode: "L", stage: "group", broadcaster: "SVT" },
  { id: 47, dayLabel: svDayLabel("2026-06-24"), date: "2026-06-24", time: "01:00", homeTeam: "Panama", awayTeam: "Kroatien", groupCode: "L", stage: "group", broadcaster: "TV4" },
  { id: 48, dayLabel: svDayLabel("2026-06-24"), date: "2026-06-24", time: "04:00", homeTeam: "Colombia", awayTeam: "DR Kongo", groupCode: "K", stage: "group", broadcaster: "SVT" },
  { id: 49, dayLabel: svDayLabel("2026-06-24"), date: "2026-06-24", time: "21:00", homeTeam: "Schweiz", awayTeam: "Kanada", groupCode: "B", stage: "group", broadcaster: "TV4" },
  { id: 50, dayLabel: svDayLabel("2026-06-24"), date: "2026-06-24", time: "21:00", homeTeam: "Bosnien och Hercegovina", awayTeam: "Qatar", groupCode: "B", stage: "group", broadcaster: "TV4" },
  { id: 51, dayLabel: svDayLabel("2026-06-25"), date: "2026-06-25", time: "00:00", homeTeam: "Skottland", awayTeam: "Brasilien", groupCode: "C", stage: "group", broadcaster: "TV4" },
  { id: 52, dayLabel: svDayLabel("2026-06-25"), date: "2026-06-25", time: "00:00", homeTeam: "Marocko", awayTeam: "Haiti", groupCode: "C", stage: "group", broadcaster: "TV4" },
  { id: 53, dayLabel: svDayLabel("2026-06-25"), date: "2026-06-25", time: "03:00", homeTeam: "Tjeckien", awayTeam: "Mexiko", groupCode: "A", stage: "group", broadcaster: "SVT" },
  { id: 54, dayLabel: svDayLabel("2026-06-25"), date: "2026-06-25", time: "03:00", homeTeam: "Sydafrika", awayTeam: "Sydkorea", groupCode: "A", stage: "group", broadcaster: "SVT" },
  { id: 55, dayLabel: svDayLabel("2026-06-25"), date: "2026-06-25", time: "22:00", homeTeam: "Curaçao", awayTeam: "Elfenbenskusten", groupCode: "E", stage: "group", broadcaster: "SVT" },
  { id: 56, dayLabel: svDayLabel("2026-06-25"), date: "2026-06-25", time: "22:00", homeTeam: "Ecuador", awayTeam: "Tyskland", groupCode: "E", stage: "group", broadcaster: "SVT" },
  { id: 57, dayLabel: svDayLabel("2026-06-26"), date: "2026-06-26", time: "01:00", homeTeam: "Japan", awayTeam: "Sverige", groupCode: "F", stage: "group", broadcaster: "SVT" },
  { id: 58, dayLabel: svDayLabel("2026-06-26"), date: "2026-06-26", time: "01:00", homeTeam: "Tunisien", awayTeam: "Nederländerna", groupCode: "F", stage: "group", broadcaster: "SVT" },
  { id: 59, dayLabel: svDayLabel("2026-06-26"), date: "2026-06-26", time: "04:00", homeTeam: "Turkiet", awayTeam: "USA", groupCode: "D", stage: "group", broadcaster: "TV4" },
  { id: 60, dayLabel: svDayLabel("2026-06-26"), date: "2026-06-26", time: "04:00", homeTeam: "Paraguay", awayTeam: "Australien", groupCode: "D", stage: "group", broadcaster: "TV4" },
  { id: 61, dayLabel: svDayLabel("2026-06-26"), date: "2026-06-26", time: "21:00", homeTeam: "Norge", awayTeam: "Frankrike", groupCode: "I", stage: "group", broadcaster: "TV4" },
  { id: 62, dayLabel: svDayLabel("2026-06-26"), date: "2026-06-26", time: "21:00", homeTeam: "Senegal", awayTeam: "Irak", groupCode: "I", stage: "group", broadcaster: "TV4" },
  { id: 63, dayLabel: svDayLabel("2026-06-27"), date: "2026-06-27", time: "02:00", homeTeam: "Kap Verde", awayTeam: "Saudiarabien", groupCode: "H", stage: "group", broadcaster: "TV4" },
  { id: 64, dayLabel: svDayLabel("2026-06-27"), date: "2026-06-27", time: "02:00", homeTeam: "Uruguay", awayTeam: "Spanien", groupCode: "H", stage: "group", broadcaster: "TV4" },
  { id: 65, dayLabel: svDayLabel("2026-06-27"), date: "2026-06-27", time: "05:00", homeTeam: "Egypten", awayTeam: "Iran", groupCode: "G", stage: "group", broadcaster: "TV4" },
  { id: 66, dayLabel: svDayLabel("2026-06-27"), date: "2026-06-27", time: "05:00", homeTeam: "Nya Zeeland", awayTeam: "Belgien", groupCode: "G", stage: "group", broadcaster: "TV4" },
  { id: 67, dayLabel: svDayLabel("2026-06-27"), date: "2026-06-27", time: "23:00", homeTeam: "Panama", awayTeam: "England", groupCode: "L", stage: "group", broadcaster: "SVT" },
  { id: 68, dayLabel: svDayLabel("2026-06-27"), date: "2026-06-27", time: "23:00", homeTeam: "Kroatien", awayTeam: "Ghana", groupCode: "L", stage: "group", broadcaster: "SVT" },
  { id: 69, dayLabel: svDayLabel("2026-06-28"), date: "2026-06-28", time: "01:30", homeTeam: "Colombia", awayTeam: "Portugal", groupCode: "K", stage: "group", broadcaster: "TV4" },
  { id: 70, dayLabel: svDayLabel("2026-06-28"), date: "2026-06-28", time: "01:30", homeTeam: "DR Kongo", awayTeam: "Uzbekistan", groupCode: "K", stage: "group", broadcaster: "TV4" },
  { id: 71, dayLabel: svDayLabel("2026-06-28"), date: "2026-06-28", time: "04:00", homeTeam: "Algeriet", awayTeam: "Österrike", groupCode: "J", stage: "group", broadcaster: "TV4" },
  { id: 72, dayLabel: svDayLabel("2026-06-28"), date: "2026-06-28", time: "04:00", homeTeam: "Jordanien", awayTeam: "Argentina", groupCode: "J", stage: "group", broadcaster: "TV4" },
  { id: 73, matchNumber: 65, dayLabel: svDayLabel("2026-06-28"), date: "2026-06-28", time: "21:00", homeTeam: "2A", awayTeam: "2B", stage: "r16", broadcaster: "TV4" },
  { id: 74, matchNumber: 66, dayLabel: svDayLabel("2026-06-29"), date: "2026-06-29", time: "19:00", homeTeam: "1C", awayTeam: "2F", stage: "r16", broadcaster: "TV4" },
  { id: 75, matchNumber: 67, dayLabel: svDayLabel("2026-06-29"), date: "2026-06-29", time: "22:30", homeTeam: "1E", awayTeam: "3A/B/C/D/F", stage: "r16", broadcaster: "SVT" },
  { id: 76, matchNumber: 68, dayLabel: svDayLabel("2026-06-30"), date: "2026-06-30", time: "03:00", homeTeam: "1F", awayTeam: "2C", stage: "r16", broadcaster: "SVT" },
  { id: 77, matchNumber: 69, dayLabel: svDayLabel("2026-06-30"), date: "2026-06-30", time: "19:00", homeTeam: "2E", awayTeam: "2I", stage: "r16", broadcaster: "TV4" },
  { id: 78, matchNumber: 70, dayLabel: svDayLabel("2026-06-30"), date: "2026-06-30", time: "23:00", homeTeam: "1I", awayTeam: "3C/D/F/G/H", stage: "r16", broadcaster: "TV4" },
  { id: 79, matchNumber: 71, dayLabel: svDayLabel("2026-07-01"), date: "2026-07-01", time: "03:00", homeTeam: "1A", awayTeam: "3C/E/F/H/I", stage: "r16", broadcaster: "TV4" },
  { id: 80, matchNumber: 72, dayLabel: svDayLabel("2026-07-01"), date: "2026-07-01", time: "18:00", homeTeam: "1L", awayTeam: "3E/H/I/J/K", stage: "r16", broadcaster: "SVT" },
  { id: 81, matchNumber: 73, dayLabel: svDayLabel("2026-07-01"), date: "2026-07-01", time: "22:00", homeTeam: "1G", awayTeam: "3A/E/H/I/J", stage: "r16", broadcaster: "TV4" },
  { id: 82, matchNumber: 74, dayLabel: svDayLabel("2026-07-02"), date: "2026-07-02", time: "02:00", homeTeam: "1D", awayTeam: "3B/E/F/I/J", stage: "r16", broadcaster: "TV4" },
  { id: 83, matchNumber: 75, dayLabel: svDayLabel("2026-07-02"), date: "2026-07-02", time: "21:00", homeTeam: "1H", awayTeam: "2J", stage: "r16", broadcaster: "SVT" },
  { id: 84, matchNumber: 76, dayLabel: svDayLabel("2026-07-03"), date: "2026-07-03", time: "01:00", homeTeam: "2K", awayTeam: "2L", stage: "r16", broadcaster: "TV4" },
  { id: 85, matchNumber: 77, dayLabel: svDayLabel("2026-07-03"), date: "2026-07-03", time: "05:00", homeTeam: "1B", awayTeam: "3E/F/G/I/J", stage: "r16", broadcaster: "TV4" },
  { id: 86, matchNumber: 78, dayLabel: svDayLabel("2026-07-03"), date: "2026-07-03", time: "20:00", homeTeam: "2D", awayTeam: "2G", stage: "r16", broadcaster: "TV4" },
  { id: 87, matchNumber: 79, dayLabel: svDayLabel("2026-07-04"), date: "2026-07-04", time: "00:00", homeTeam: "1J", awayTeam: "2H", stage: "r16", broadcaster: "TV4" },
  { id: 88, matchNumber: 80, dayLabel: svDayLabel("2026-07-04"), date: "2026-07-04", time: "03:30", homeTeam: "1K", awayTeam: "3D/E/I/J/L", stage: "r16", broadcaster: "SVT" },
  { id: 89, matchNumber: 81, dayLabel: svDayLabel("2026-07-04"), date: "2026-07-04", time: "19:00", homeTeam: "Winner M73", awayTeam: "Winner M75", stage: "r8", broadcaster: "TV4" },
  { id: 90, matchNumber: 82, dayLabel: svDayLabel("2026-07-04"), date: "2026-07-04", time: "23:00", homeTeam: "Winner M74", awayTeam: "Winner M77", stage: "r8", broadcaster: "SVT" },
  { id: 91, matchNumber: 83, dayLabel: svDayLabel("2026-07-05"), date: "2026-07-05", time: "22:00", homeTeam: "Winner M76", awayTeam: "Winner M78", stage: "r8", broadcaster: "TV4" },
  { id: 92, matchNumber: 84, dayLabel: svDayLabel("2026-07-06"), date: "2026-07-06", time: "02:00", homeTeam: "Winner M79", awayTeam: "Winner M80", stage: "r8", broadcaster: "SVT" },
  { id: 93, matchNumber: 85, dayLabel: svDayLabel("2026-07-06"), date: "2026-07-06", time: "21:00", homeTeam: "Winner M83", awayTeam: "Winner M84", stage: "r8", broadcaster: "TV4" },
  { id: 94, matchNumber: 86, dayLabel: svDayLabel("2026-07-07"), date: "2026-07-07", time: "02:00", homeTeam: "Winner M81", awayTeam: "Winner M82", stage: "r8", broadcaster: "TV4" },
  { id: 95, matchNumber: 87, dayLabel: svDayLabel("2026-07-07"), date: "2026-07-07", time: "18:00", homeTeam: "Winner M86", awayTeam: "Winner M88", stage: "r8", broadcaster: "TV4" },
  { id: 96, matchNumber: 88, dayLabel: svDayLabel("2026-07-07"), date: "2026-07-07", time: "22:00", homeTeam: "Winner M85", awayTeam: "Winner M87", stage: "r8", broadcaster: "SVT" },
  { id: 97, matchNumber: 89, dayLabel: svDayLabel("2026-07-09"), date: "2026-07-09", time: "22:00", homeTeam: "Winner M89", awayTeam: "Winner M90", stage: "qf", broadcaster: "TV4" },
  { id: 98, matchNumber: 90, dayLabel: svDayLabel("2026-07-10"), date: "2026-07-10", time: "21:00", homeTeam: "Winner M93", awayTeam: "Winner M94", stage: "qf", broadcaster: "SVT" },
  { id: 99, matchNumber: 91, dayLabel: svDayLabel("2026-07-11"), date: "2026-07-11", time: "23:00", homeTeam: "Winner M91", awayTeam: "Winner M92", stage: "qf", broadcaster: "TV4" },
  { id: 100, matchNumber: 92, dayLabel: svDayLabel("2026-07-12"), date: "2026-07-12", time: "03:00", homeTeam: "Winner M95", awayTeam: "Winner M96", stage: "qf", broadcaster: "SVT" },
  { id: 101, matchNumber: 93, dayLabel: svDayLabel("2026-07-14"), date: "2026-07-14", time: "21:00", homeTeam: "Winner M97", awayTeam: "Winner M98", stage: "sf", broadcaster: "SVT" },
  { id: 102, matchNumber: 94, dayLabel: svDayLabel("2026-07-15"), date: "2026-07-15", time: "21:00", homeTeam: "Winner M99", awayTeam: "Winner M100", stage: "sf", broadcaster: "TV4" },
  { id: 103, matchNumber: 95, dayLabel: svDayLabel("2026-07-18"), date: "2026-07-18", time: "23:00", homeTeam: "Loser M93", awayTeam: "Loser M94", stage: "bronze", broadcaster: "SVT" },
  { id: 104, matchNumber: 96, dayLabel: svDayLabel("2026-07-19"), date: "2026-07-19", time: "21:00", homeTeam: "Winner M93", awayTeam: "Winner M94", stage: "final", broadcaster: "TV4" },
];

export function kickoffIso(date: string, time: string): string {
  const [h, m] = time.split(":").map(Number);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date}T${pad(h)}:${pad(m)}:00+02:00`;
}

export const JAR_CONTRIBUTION_EUR = 100;

export const GROUP_MATCH_IDS = MATCHES.filter((m) => m.stage === "group").map(
  (m) => m.id,
);
export const POINTS_EXACT = 3;
export const POINTS_OUTCOME = 1;
