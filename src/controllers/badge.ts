export interface IBadgeInfo {
  name: string;
  type: string;
}

export function determineBadges(logCount: number): IBadgeInfo[] {
  const badges: IBadgeInfo[] = [];

  if (logCount >= 10000000)
    badges.push({ name: "Celestial Chanter Badge", type: "Ultimate" });
  if (logCount >= 5000000)
    badges.push({ name: "Eternal Enlightener Badge", type: "Grand Master" });
  if (logCount >= 1000000)
    badges.push({ name: "Spiritual Sovereign Badge", type: "Master" });
  if (logCount >= 500000)
    badges.push({ name: "Guardian of Grails Badge", type: "Expert" });
  if (logCount >= 100000)
    badges.push({ name: "Mythic Mantrika Badge", type: "Professional" });
  if (logCount >= 50000)
    badges.push({ name: "Sage of Scripts Badge", type: "Skilled" });
  if (logCount >= 10000)
    badges.push({ name: "Mantra Master Badge", type: "Experienced" });
  if (logCount >= 1000)
    badges.push({ name: "Sacred Scriptor Badge", type: "Intermediate" });
  if (logCount >= 500)
    badges.push({ name: "Dharma Writer Badge", type: "Novice" });
  if (logCount >= 100)
    badges.push({ name: "Devotee’s Dedication Badge", type: "Beginner" });
  if (logCount >= 1)
    badges.push({ name: "Seeker’s Start Badge", type: "Starter" });

  return badges;
}
