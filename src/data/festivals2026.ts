// src/data/festivals2026.ts
// All major, minor, Ekadashi, Purnima, and Amavasya dates for 2026
// Dates are in IST (India Standard Time). Update this file annually.

export interface FestivalSeed {
  name: string;
  date: string; // ISO date string YYYY-MM-DD
  endDate?: string; // for multi-day festivals
  category: "major" | "minor" | "ekadashi" | "purnima" | "amavasya";
  description: string;
  deity?: string;
  isMultiDay: boolean;
  year: number;
}

export const festivals2026: FestivalSeed[] = [
  // ── JANUARY ──────────────────────────────────────────────────────────
  {
    name: "Saphala Ekadashi",
    date: "2026-01-03",
    category: "ekadashi",
    description:
      "Krishna Paksha Ekadashi in Margashirsha month. Fasting on this day is said to bestow success and fulfillment.",
    deity: "Vishnu",
    isMultiDay: false,
    year: 2026,
  },
  {
    name: "Posh Purnima",
    date: "2026-01-13",
    category: "purnima",
    description:
      "Full moon day of Pausha month. Sacred for bathing in holy rivers and performing puja.",
    deity: "Vishnu",
    isMultiDay: false,
    year: 2026,
  },
  {
    name: "Makar Sankranti",
    date: "2026-01-14",
    category: "major",
    description:
      "Solar festival marking the sun's transition into Capricorn. Celebrated with kite flying, sesame sweets, and holy dips.",
    deity: "Surya",
    isMultiDay: false,
    year: 2026,
  },
  {
    name: "Pongal",
    date: "2026-01-14",
    category: "major",
    description:
      "South Indian harvest festival celebrated over four days with thanksgiving to the Sun God.",
    deity: "Surya",
    isMultiDay: true,
    endDate: "2026-01-17",
    year: 2026,
  },
  {
    name: "Putrada Ekadashi",
    date: "2026-01-14",
    category: "ekadashi",
    description:
      "Shukla Paksha Ekadashi in Pausha month. Observed for the blessing of children and progeny.",
    deity: "Vishnu",
    isMultiDay: false,
    year: 2026,
  },
  {
    name: "Vasant Panchami",
    date: "2026-01-23",
    category: "minor",
    description:
      "Celebration of the arrival of spring and worship of Goddess Saraswati, the deity of knowledge and arts.",
    deity: "Saraswati",
    isMultiDay: false,
    year: 2026,
  },
  {
    name: "Shattila Ekadashi",
    date: "2026-01-29",
    category: "ekadashi",
    description:
      "Krishna Paksha Ekadashi in Magha month. Named after the use of sesame (til) in rituals on this day.",
    deity: "Vishnu",
    isMultiDay: false,
    year: 2026,
  },

  // ── FEBRUARY ─────────────────────────────────────────────────────────
  {
    name: "Maha Purnima",
    date: "2026-02-12",
    category: "purnima",
    description:
      "Full moon of Magha month. Highly auspicious for bathing in sacred rivers and performing charity.",
    deity: "Vishnu",
    isMultiDay: false,
    year: 2026,
  },
  {
    name: "Jaya Ekadashi",
    date: "2026-02-12",
    category: "ekadashi",
    description:
      "Shukla Paksha Ekadashi in Magha month. Fasting on Jaya Ekadashi is said to liberate one from sins.",
    deity: "Vishnu",
    isMultiDay: false,
    year: 2026,
  },
  {
    name: "Maha Shivaratri",
    date: "2026-02-26",
    category: "major",
    description:
      "The great night of Lord Shiva. Devotees fast, chant Om Namah Shivaya, and perform night-long vigils.",
    deity: "Shiva",
    isMultiDay: false,
    year: 2026,
  },
  {
    name: "Vijaya Ekadashi",
    date: "2026-02-27",
    category: "ekadashi",
    description:
      "Krishna Paksha Ekadashi in Phalguna month. Vijaya Ekadashi bestows victory in endeavors.",
    deity: "Vishnu",
    isMultiDay: false,
    year: 2026,
  },

  // ── MARCH ────────────────────────────────────────────────────────────
  {
    name: "Falgun Purnima",
    date: "2026-03-13",
    category: "purnima",
    description:
      "Full moon of Phalguna month, celebrated as Holi Purnima. The night of Holika Dahan.",
    deity: "Vishnu",
    isMultiDay: false,
    year: 2026,
  },
  {
    name: "Amalaki Ekadashi",
    date: "2026-03-13",
    category: "ekadashi",
    description:
      "Shukla Paksha Ekadashi in Phalguna month. Worshipping the Amla (gooseberry) tree on this day is auspicious.",
    deity: "Vishnu",
    isMultiDay: false,
    year: 2026,
  },
  {
    name: "Holika Dahan",
    date: "2026-03-13",
    category: "major",
    description:
      "The bonfire night before Holi. Symbolizes the victory of devotion over evil.",
    deity: "Vishnu",
    isMultiDay: false,
    year: 2026,
  },
  {
    name: "Holi",
    date: "2026-03-14",
    category: "major",
    description:
      "Festival of colors celebrating the triumph of good over evil and the arrival of spring.",
    deity: "Krishna",
    isMultiDay: false,
    year: 2026,
  },
  {
    name: "Papmochani Ekadashi",
    date: "2026-03-27",
    category: "ekadashi",
    description:
      "Krishna Paksha Ekadashi in Chaitra month. This Ekadashi destroys sins (papa) of the devotee.",
    deity: "Vishnu",
    isMultiDay: false,
    year: 2026,
  },
  {
    name: "Chaitra Navratri",
    date: "2026-03-28",
    endDate: "2026-04-05",
    category: "major",
    description:
      "Nine nights of Goddess Durga worship in the Hindu New Year month of Chaitra.",
    deity: "Durga",
    isMultiDay: true,
    year: 2026,
  },
  {
    name: "Ugadi",
    date: "2026-03-28",
    category: "major",
    description:
      "Telugu and Kannada New Year. Marks the beginning of a new Hindu lunar calendar year.",
    isMultiDay: false,
    year: 2026,
  },
  {
    name: "Gudi Padwa",
    date: "2026-03-28",
    category: "major",
    description:
      "Marathi New Year. People erect Gudi (flag) to welcome prosperity and good fortune.",
    isMultiDay: false,
    year: 2026,
  },

  // ── APRIL ────────────────────────────────────────────────────────────
  {
    name: "Ram Navami",
    date: "2026-04-05",
    category: "major",
    description:
      "Birthday of Lord Rama. Devotees fast, sing Ram katha, and recite the Ramayana.",
    deity: "Rama",
    isMultiDay: false,
    year: 2026,
  },
  {
    name: "Kamada Ekadashi",
    date: "2026-04-11",
    category: "ekadashi",
    description:
      "Shukla Paksha Ekadashi in Chaitra. Kamada Ekadashi fulfills desires of the devotee.",
    deity: "Vishnu",
    isMultiDay: false,
    year: 2026,
  },
  {
    name: "Hanuman Jayanti",
    date: "2026-04-11",
    category: "major",
    description:
      "Birthday of Lord Hanuman. Devotees recite Hanuman Chalisa and visit Hanuman temples.",
    deity: "Hanuman",
    isMultiDay: false,
    year: 2026,
  },
  {
    name: "Chaitra Purnima",
    date: "2026-04-11",
    category: "purnima",
    description:
      "Full moon of Chaitra month. Auspicious for worship and charity.",
    isMultiDay: false,
    year: 2026,
  },
  {
    name: "Varuthini Ekadashi",
    date: "2026-04-26",
    category: "ekadashi",
    description:
      "Krishna Paksha Ekadashi in Vaishakha. Said to destroy sins and grant liberation.",
    deity: "Vishnu",
    isMultiDay: false,
    year: 2026,
  },
  {
    name: "Akshaya Tritiya",
    date: "2026-04-28",
    category: "minor",
    description:
      "One of the most auspicious days of the year. Charitable acts and new beginnings are highly favored.",
    deity: "Vishnu",
    isMultiDay: false,
    year: 2026,
  },

  // ── MAY ──────────────────────────────────────────────────────────────
  {
    name: "Mohini Ekadashi",
    date: "2026-05-11",
    category: "ekadashi",
    description:
      "Shukla Paksha Ekadashi in Vaishakha. Worshipping Lord Vishnu as Mohini liberates from illusion.",
    deity: "Vishnu",
    isMultiDay: false,
    year: 2026,
  },
  {
    name: "Vaishakh Purnima",
    date: "2026-05-11",
    category: "purnima",
    description:
      "Full moon of Vaishakha, also celebrated as Buddha Purnima (birthday of Gautama Buddha).",
    isMultiDay: false,
    year: 2026,
  },
  {
    name: "Apara Ekadashi",
    date: "2026-05-25",
    category: "ekadashi",
    description:
      "Krishna Paksha Ekadashi in Jyeshtha. Fasting on this day removes great sins.",
    deity: "Vishnu",
    isMultiDay: false,
    year: 2026,
  },

  // ── JUNE ─────────────────────────────────────────────────────────────
  {
    name: "Nirjala Ekadashi",
    date: "2026-06-10",
    category: "ekadashi",
    description:
      "The most powerful Ekadashi — a waterless fast observed in the scorching heat. Equivalent to all 24 Ekadashis combined.",
    deity: "Vishnu",
    isMultiDay: false,
    year: 2026,
  },
  {
    name: "Jyeshtha Purnima",
    date: "2026-06-10",
    category: "purnima",
    description:
      "Full moon of Jyeshtha month. Sacred for Vat Savitri vrat by married women.",
    isMultiDay: false,
    year: 2026,
  },
  {
    name: "Yogini Ekadashi",
    date: "2026-06-24",
    category: "ekadashi",
    description:
      "Krishna Paksha Ekadashi in Ashadha month. Observing this fast is said to heal diseases.",
    deity: "Vishnu",
    isMultiDay: false,
    year: 2026,
  },

  // ── JULY ─────────────────────────────────────────────────────────────
  {
    name: "Devshayani Ekadashi",
    date: "2026-07-09",
    category: "ekadashi",
    description:
      "Lord Vishnu goes into yogic sleep (Yoga Nidra) on this day. Marks the beginning of Chaturmas.",
    deity: "Vishnu",
    isMultiDay: false,
    year: 2026,
  },
  {
    name: "Ashadh Purnima",
    date: "2026-07-09",
    category: "purnima",
    description:
      "Full moon of Ashadha month, celebrated as Guru Purnima — the day to honor one's spiritual teacher.",
    deity: "Guru",
    isMultiDay: false,
    year: 2026,
  },
  {
    name: "Guru Purnima",
    date: "2026-07-09",
    category: "major",
    description:
      "Day to honor and express gratitude to spiritual and academic gurus. Observed by disciples across traditions.",
    deity: "Guru",
    isMultiDay: false,
    year: 2026,
  },
  {
    name: "Kamika Ekadashi",
    date: "2026-07-23",
    category: "ekadashi",
    description:
      "Krishna Paksha Ekadashi in Shravana. Associated with Lord Shiva; fasting washes away sins.",
    deity: "Shiva",
    isMultiDay: false,
    year: 2026,
  },

  // ── AUGUST ───────────────────────────────────────────────────────────
  {
    name: "Shravan Putrada Ekadashi",
    date: "2026-08-07",
    category: "ekadashi",
    description:
      "Shukla Paksha Ekadashi in Shravana. Observed by parents seeking blessings for their children.",
    deity: "Vishnu",
    isMultiDay: false,
    year: 2026,
  },
  {
    name: "Shravan Purnima",
    date: "2026-08-08",
    category: "purnima",
    description:
      "Full moon of Shravana month. Celebrated as Raksha Bandhan across North India.",
    isMultiDay: false,
    year: 2026,
  },
  {
    name: "Raksha Bandhan",
    date: "2026-08-08",
    category: "major",
    description:
      "Festival of the bond between brothers and sisters. Sisters tie a protective thread (rakhi) on brothers' wrists.",
    isMultiDay: false,
    year: 2026,
  },
  {
    name: "Annada Ekadashi",
    date: "2026-08-22",
    category: "ekadashi",
    description:
      "Krishna Paksha Ekadashi in Bhadrapada. Fasting and donating food on this day is highly meritorious.",
    deity: "Vishnu",
    isMultiDay: false,
    year: 2026,
  },
  {
    name: "Janmashtami",
    date: "2026-08-26",
    category: "major",
    description:
      "Birthday of Lord Krishna. Celebrated at midnight with devotional songs, dahi-handi, and temple decorations.",
    deity: "Krishna",
    isMultiDay: false,
    year: 2026,
  },

  // ── SEPTEMBER ────────────────────────────────────────────────────────
  {
    name: "Bhadrapad Purnima",
    date: "2026-09-06",
    category: "purnima",
    description:
      "Full moon of Bhadrapada month. Associated with ancestor worship (Pitru Paksha).",
    isMultiDay: false,
    year: 2026,
  },
  {
    name: "Parsva Ekadashi",
    date: "2026-09-06",
    category: "ekadashi",
    description:
      "Shukla Paksha Ekadashi in Bhadrapada. Lord Vishnu turns from his side; Chaturmas nears its end.",
    deity: "Vishnu",
    isMultiDay: false,
    year: 2026,
  },
  {
    name: "Ganesh Chaturthi",
    date: "2026-09-11",
    category: "major",
    description:
      "Birthday of Lord Ganesha. A 10-day celebration with large pandals, processions, and immersion on the last day.",
    deity: "Ganesha",
    isMultiDay: true,
    endDate: "2026-09-20",
    year: 2026,
  },
  {
    name: "Pitru Paksha",
    date: "2026-09-07",
    endDate: "2026-09-21",
    category: "minor",
    description:
      "Fortnight dedicated to performing Shraddha rituals for deceased ancestors.",
    isMultiDay: true,
    year: 2026,
  },
  {
    name: "Indira Ekadashi",
    date: "2026-09-21",
    category: "ekadashi",
    description:
      "Krishna Paksha Ekadashi in Ashwina. Especially meritorious for liberating ancestors from suffering.",
    deity: "Vishnu",
    isMultiDay: false,
    year: 2026,
  },

  // ── OCTOBER ──────────────────────────────────────────────────────────
  {
    name: "Sharad Navratri",
    date: "2026-10-05",
    endDate: "2026-10-13",
    category: "major",
    description:
      "Nine nights of Goddess Durga worship. The most widely celebrated Navratri with Garba, Dandiya, and fasting.",
    deity: "Durga",
    isMultiDay: true,
    year: 2026,
  },
  {
    name: "Ashwin Purnima",
    date: "2026-10-05",
    category: "purnima",
    description:
      "Full moon of Ashwina month. Observed with Sharad Purnima celebrations and moonlit festivities.",
    isMultiDay: false,
    year: 2026,
  },
  {
    name: "Papankusha Ekadashi",
    date: "2026-10-05",
    category: "ekadashi",
    description:
      "Shukla Paksha Ekadashi in Ashwina. Said to destroy all sins like a hook (ankusha) removes an elephant.",
    deity: "Vishnu",
    isMultiDay: false,
    year: 2026,
  },
  {
    name: "Dussehra",
    date: "2026-10-14",
    category: "major",
    description:
      "Vijayadashami — celebrating the victory of Lord Rama over Ravana and Goddess Durga over Mahishasura.",
    deity: "Rama",
    isMultiDay: false,
    year: 2026,
  },
  {
    name: "Rama Ekadashi",
    date: "2026-10-19",
    category: "ekadashi",
    description:
      "Krishna Paksha Ekadashi in Kartika. Fasting on Rama Ekadashi is equivalent to performing Ashwamedha Yagna.",
    deity: "Vishnu",
    isMultiDay: false,
    year: 2026,
  },
  {
    name: "Karva Chauth",
    date: "2026-10-23",
    category: "minor",
    description:
      "Festival where married women fast from sunrise to moonrise for the longevity and well-being of their husbands.",
    isMultiDay: false,
    year: 2026,
  },

  // ── NOVEMBER ─────────────────────────────────────────────────────────
  {
    name: "Dhanteras",
    date: "2026-11-03",
    category: "major",
    description:
      "First day of Diwali celebrations. Auspicious for purchasing gold, silver, and new utensils.",
    deity: "Lakshmi",
    isMultiDay: false,
    year: 2026,
  },
  {
    name: "Narak Chaturdashi",
    date: "2026-11-04",
    category: "major",
    description:
      "Choti Diwali. Lord Krishna defeated the demon Narakasura on this day. Celebrated with oil baths and firecrackers.",
    deity: "Krishna",
    isMultiDay: false,
    year: 2026,
  },
  {
    name: "Diwali",
    date: "2026-11-05",
    category: "major",
    description:
      "Festival of Lights. Goddess Lakshmi is worshipped for wealth and prosperity. Homes are lit with diyas.",
    deity: "Lakshmi",
    isMultiDay: false,
    year: 2026,
  },
  {
    name: "Govardhan Puja",
    date: "2026-11-06",
    category: "major",
    description:
      "Lord Krishna lifted Govardhan hill to protect devotees. Annakut — a mountain of food — is offered to the deity.",
    deity: "Krishna",
    isMultiDay: false,
    year: 2026,
  },
  {
    name: "Bhai Dooj",
    date: "2026-11-07",
    category: "major",
    description:
      "Sisters perform aarti for their brothers and pray for their long life. Similar to Raksha Bandhan.",
    isMultiDay: false,
    year: 2026,
  },
  {
    name: "Devutthana Ekadashi",
    date: "2026-11-19",
    category: "ekadashi",
    description:
      "Lord Vishnu awakens from his Yoga Nidra (cosmic sleep) on this day. Also called Prabodhini Ekadashi. Marks the end of Chaturmas.",
    deity: "Vishnu",
    isMultiDay: false,
    year: 2026,
  },
  {
    name: "Kartik Purnima",
    date: "2026-11-20",
    category: "purnima",
    description:
      "Full moon of Kartika month. Celebrated as Dev Deepawali in Varanasi with lakhs of lamps lit on the ghats.",
    deity: "Vishnu",
    isMultiDay: false,
    year: 2026,
  },
  {
    name: "Dev Deepawali",
    date: "2026-11-20",
    category: "minor",
    description:
      "Diwali of the Gods. Celebrated 15 days after Diwali in Varanasi with spectacular lamp-lighting on Ganga ghats.",
    isMultiDay: false,
    year: 2026,
  },

  // ── DECEMBER ─────────────────────────────────────────────────────────
  {
    name: "Utpanna Ekadashi",
    date: "2026-12-04",
    category: "ekadashi",
    description:
      "Krishna Paksha Ekadashi in Margashirsha. The Ekadashi deity is said to have been born on this day.",
    deity: "Vishnu",
    isMultiDay: false,
    year: 2026,
  },
  {
    name: "Margashirsha Purnima",
    date: "2026-12-04",
    category: "purnima",
    description:
      "Full moon of Margashirsha month. Auspicious for worship and pilgrimages.",
    isMultiDay: false,
    year: 2026,
  },
  {
    name: "Mokshada Ekadashi",
    date: "2026-12-19",
    category: "ekadashi",
    description:
      "Shukla Paksha Ekadashi in Margashirsha. The day the Bhagavad Gita was spoken by Lord Krishna — also celebrated as Gita Jayanti.",
    deity: "Krishna",
    isMultiDay: false,
    year: 2026,
  },
  {
    name: "Gita Jayanti",
    date: "2026-12-19",
    category: "minor",
    description:
      "Anniversary of the day Lord Krishna spoke the Bhagavad Gita to Arjuna on the battlefield of Kurukshetra.",
    deity: "Krishna",
    isMultiDay: false,
    year: 2026,
  },
];
