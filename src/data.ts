// ─── All personal content lives here. Edit this file to update the site. ───

export const PROFILE = {
  name: 'Sugethan Sekaran',
  role: 'Associate Manager, Data Validation · Operations APAC',
  tagline:
    'I lead production operations across APAC — building procedures, automations and process improvements that make data faster, cleaner and more trustworthy.',
  location: 'Kuala Lumpur, Malaysia',
  email: 'sugethan.ss@outlook.com',
  links: [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/suge2305/' },
    { label: 'Email', href: 'mailto:sugethan.ss@outlook.com' },
  ],
}

export type Sticker = {
  /** Look of the sticker (default 'label') */
  style?: 'label' | 'logo' | 'roundel' | 'travel' | 'stamp' | 'badge' | 'ticket' | 'chart' | 'holo'
  /** Main text (for 'roundel' it runs around the ring) */
  text: string
  /** Second line / small print */
  sub?: string
  /** Small heading on 'travel' and 'ticket' */
  kicker?: string
  /** Emoji or symbol for 'stamp' and 'roundel' */
  icon?: string
  /** File in public/logos/ for 'logo' and 'roundel' */
  logo?: string
  /** Which way the mini chart goes on 'chart' (both shown in green = good) */
  trend?: 'up' | 'down'
  /** Shape for 'label' / 'holo' / 'logo' */
  shape?: 'pill' | 'circle' | 'rect' | 'burst' | 'tag'
  bg?: string
  fg?: string
  accent?: string
  /** Relative size within its cluster (default 1) — clusters are auto-scaled to fill their space */
  scale?: number
}

/**
 * Sections of the story. The briefcase spins to a fresh face for each one, and
 * that section's stickers slap on while the old ones peel off.
 */
export const CHAPTERS = ['About', 'Education', 'Work', 'Recognition', 'Toolkit'] as const
export type Chapter = (typeof CHAPTERS)[number]

/** Stickers covering the briefcase in the opening shot */
export const HERO_STICKERS: Sticker[] = [
  { text: 'Sugethan', shape: 'tag', scale: 1.3 },
  { style: 'travel', text: 'KUALA LUMPUR', sub: 'MALAYSIA', bg: '#f3e6c8', fg: '#1f4e9c', accent: '#e5383b', scale: 1.2 },
  { style: 'roundel', text: 'Data · Validation · Operations · ', icon: '📊', bg: '#2a7f62' },
  { style: 'stamp', text: 'Photography', icon: '📷', sub: 'MY', bg: '#e9a23b' },
  { style: 'holo', text: 'APAC', shape: 'burst' },
  { style: 'ticket', text: 'KUL ✈ APAC', kicker: 'Boarding pass', sub: 'Data · Ops · Leadership', bg: '#e5383b' },
  { text: '🇲🇾', shape: 'circle', bg: '#ffffff' },
]

export type ResumeEntry = {
  chapter: Exclude<Chapter, 'About'>
  period: string
  title: string
  org: string
  summary: string
  /** Headline numbers shown large on the card */
  stats?: { value: string; label: string }[]
  tags: string[]
  /** Short label printed on the book's spine */
  spine: string
  /** Stickers inside the book (the first one also goes on the cover) */
  stickers: Sticker[]
}

// In story order. Each entry gets its own patch of the briefcase, which its
// stickers are packed into edge to edge. Entries of the same chapter share one face.
export const RESUME: ResumeEntry[] = [
  {
    chapter: 'Education',
    period: '2016 — 2019',
    title: 'B.IT (Hons), Software Engineering',
    spine: 'B.IT · UTP',
    org: 'Universiti Teknologi PETRONAS',
    summary: 'Bachelor of Information Technology with a Software Engineering major. GPA 3.41.',
    tags: ['Software Engineering'],
    stickers: [
      { style: 'roundel', text: 'Universiti Teknologi PETRONAS · ', logo: 'utp.png', bg: '#1f4e9c', accent: '#ffffff', scale: 1.25 },
      { style: 'ticket', text: 'B.IT (Hons)', kicker: 'Graduated', sub: 'Seri Iskandar · Perak', bg: '#1f4e9c' },
      { style: 'stamp', text: 'Software Eng.', icon: '💻', sub: '16', bg: '#d98f2b' },
      { text: '3.41', sub: 'GPA', shape: 'burst', bg: '#e5383b' },
    ],
  },
  {
    chapter: 'Education',
    period: '2018 — 2019',
    title: 'Research Trainee',
    spine: 'Hitachi · Japan',
    org: 'Center for Exploratory Research, Hitachi Ltd. · Saitama, Japan',
    summary: 'Research trainee internship at Hitachi’s Center for Exploratory Research in Japan. Worked on a project to improve the accuracy of a machine learning model for predicting equipment failures.',
    tags: ['Research', 'Japan'],
    stickers: [
      { style: 'logo', logo: 'hitachi.svg', text: 'Hitachi', scale: 1.6 },
      { style: 'travel', text: 'SAITAMA', sub: 'JAPAN · 2018', fg: '#b3261e', accent: '#f2c14e', scale: 1.2 },
      { style: 'ticket', text: 'KUL ✈ NRT', kicker: 'Research trip', sub: '2018 — 2019', bg: '#b3261e' },
      { style: 'stamp', text: 'Research', icon: '🔬', sub: '¥', bg: '#2f6f8f' },
      { text: '🇯🇵', shape: 'circle', bg: '#ffffff' },
    ],
  },
  {
    chapter: 'Work',
    period: '2020 — 2021',
    title: 'Graduate Trainee',
    spine: 'Nielsen',
    org: 'Nielsen',
    summary: 'Started my career in data operations through the Nielsen graduate programme. Learned the ropes of data processing, validation and reporting, and contributed to several process improvement initiatives.',
    tags: ['Data Operations'],
    stickers: [
      { style: 'logo', logo: 'nielsen.svg', text: 'Nielsen', scale: 1.2 },
      { style: 'ticket', text: 'DAY ONE', kicker: 'Graduate trainee', sub: 'Nielsen · 2020', bg: '#0a66c2' },
      { style: 'stamp', text: 'Growth', icon: '🌱', sub: '20', bg: '#2a7f62' },
    ],
  },
  {
    chapter: 'Work',
    period: 'Jan 2021 — Sep 2022',
    title: 'Data Processing Specialist',
    spine: 'NIQ · Specialist',
    org: 'NielsenIQ',
    summary:
      'Built Python scripts and automation that made data processing faster and more accurate, and produced analytical reports with cross-functional teams.',
    stats: [
      { value: '+25%', label: 'Data accuracy' },
      { value: '−40%', label: 'Processing time' },
    ],
    tags: ['Python', 'Automation', 'Reporting'],
    stickers: [
      { style: 'logo', logo: 'niq.svg', text: 'NIQ', scale: 1.1 },
      { style: 'chart', text: '+25%', sub: 'Data accuracy', trend: 'up' },
      { style: 'chart', text: '−40%', sub: 'Processing time', trend: 'down', bg: '#f2a33a' },
      { style: 'logo', logo: 'python.svg', text: 'Python', scale: 0.7 },
    ],
  },
  {
    chapter: 'Work',
    period: 'Oct 2022 — Jan 2024',
    title: 'Senior Data Processing Specialist',
    spine: 'NIQ · Senior',
    org: 'NielsenIQ',
    summary:
      'Introduced SOPs and automation tools for data quality, led process-improvement and training initiatives, and mentored junior team members.',
    stats: [
      { value: '−95%', label: 'Quality escapes' },
      { value: '+35%', label: 'Productivity' },
      { value: '−40%', label: 'Error rate' },
    ],
    tags: ['Data Quality', 'Automation', 'Mentoring'],
    stickers: [
      { style: 'chart', text: '−95%', sub: 'Quality escapes', trend: 'down', bg: '#e5383b', scale: 1.1 },
      { style: 'chart', text: '+35%', sub: 'Productivity', trend: 'up', bg: '#7b61ff' },
      { style: 'stamp', text: 'Mentor', icon: '🤝', sub: '22', bg: '#7b61ff' },
      { text: 'SOPs', shape: 'rect', bg: '#1f2a44' },
    ],
  },
  {
    chapter: 'Work',
    period: 'Feb 2024 — Now',
    title: 'Associate Manager, Operations',
    spine: 'NIQ · Assoc. Manager',
    org: 'NielsenIQ',
    summary:
      'Leading data strategy and governance for regional operations — closing process gaps, driving compliance and turning market research into strategic insight for cross-functional teams.',
    stats: [
      { value: '+20%', label: 'KPI improvement' },
      { value: '>90%', label: 'Compliance rate' },
    ],
    tags: ['Data Governance', 'Strategy', 'Leadership'],
    stickers: [
      { style: 'holo', text: 'TEAM LEAD', shape: 'burst', scale: 1.1 },
      { style: 'chart', text: '+20%', sub: 'KPIs', trend: 'up', bg: '#2a7f62' },
      { style: 'roundel', text: 'Governance · Compliance · Strategy · ', icon: '🛡️', bg: '#1f2a44' },
      { style: 'travel', text: 'APAC', kicker: 'Leading', sub: 'OPERATIONS', fg: '#1f2a44', accent: '#f2c14e' },
    ],
  },
  {
    chapter: 'Recognition',
    period: '2024',
    title: 'Digital Champion',
    spine: 'Digital Champion',
    org: 'Hall of Fame Awards · NIQ',
    summary:
      'Impact Award for driving digital transformation — optimising data processes, expanding automation and making reporting more efficient.',
    tags: ['Automation', 'Digital Transformation'],
    stickers: [
      { style: 'badge', text: 'Digital Champion', sub: '2024', bg: '#f2b632', scale: 1.2 },
      { style: 'holo', text: 'HALL OF FAME' },
      { style: 'stamp', text: 'Impact award', icon: '🏆', sub: '24', bg: '#1f2a44' },
      { style: 'logo', logo: 'niq.svg', text: 'NIQ', scale: 0.9 },
    ],
  },
  {
    chapter: 'Recognition',
    period: '2023',
    title: 'Team of the Year · NOC Star · Most Valuable Team',
    spine: 'Awards 2023',
    org: 'NIQ',
    summary:
      'Part of the Malaysia–Singapore Operations team recognised for the best performance in the region, plus a NOC Star Award for training new Data Validation staff.',
    tags: ['Team', 'Training', 'Quality'],
    stickers: [
      { style: 'badge', text: 'Team of the Year', sub: '2023', bg: '#7b61ff', scale: 1.1 },
      { style: 'badge', text: 'NOC Star', sub: '2023', bg: '#e5383b' },
      { style: 'ticket', text: 'MVT · Q1 2023', kicker: 'Most valuable team', sub: 'Malaysia – Singapore', bg: '#2a7f62' },
      { text: '🇲🇾', shape: 'circle', bg: '#ffffff', scale: 0.8 },
      { text: '🇸🇬', shape: 'circle', bg: '#ffffff', scale: 0.8 },
    ],
  },
  {
    chapter: 'Toolkit',
    period: 'Always learning',
    title: 'Certifications & tools',
    spine: 'Toolkit',
    org: 'Google · IBM · NielsenIQ',
    summary:
      'Google Data Analytics and IT certificates, IBM Python for data analysis and visualisation, and NIQ’s RACE Machine Learning programme.',
    tags: ['Python', 'SQL', 'Power BI', 'Tableau'],
    stickers: [
      { style: 'logo', logo: 'google.svg', text: 'Google', scale: 1.1 },
      { style: 'logo', logo: 'ibm.svg', text: 'IBM' },
      { style: 'roundel', text: 'Machine Learning · RACE 2021 · ', icon: '🤖', bg: '#7b61ff' },
      { style: 'logo', logo: 'powerbi.svg', text: 'Power BI', scale: 0.8 },
      { style: 'logo', logo: 'tableau.png', text: 'Tableau', scale: 1.3 },
      { style: 'logo', logo: 'pandas.svg', text: 'pandas', scale: 0.8 },
      { style: 'logo', logo: 'python.svg', text: 'Python', scale: 0.7 },
      { text: 'SQL', shape: 'circle', bg: '#e5383b' },
      { text: 'R', shape: 'circle', bg: '#1f4e9c' },
      { style: 'stamp', text: 'Data Analytics', icon: '📈', sub: '22', bg: '#2a7f62' },
    ],
  },
]

export const SKILLS: { group: string; items: string[] }[] = [
  { group: 'Expertise', items: ['Data Analysis & Visualization', 'Data Validation', 'Machine Learning', 'Data Governance & Compliance'] },
  { group: 'Languages', items: ['Python', 'R', 'SQL'] },
  { group: 'Libraries', items: ['Pandas', 'NumPy', 'Scikit-Learn', 'Matplotlib'] },
  { group: 'Tools', items: ['Power BI', 'Tableau', 'Excel', 'PowerPoint', 'MySQL', 'SQLite', 'Trino', 'Jupyter', 'PyCharm', 'VS Code'] },
  { group: 'Soft skills', items: ['Analytical Thinking', 'Critical Thinking', 'Communication', 'Adaptability', 'Process Improvement'] },
]

export const CERTIFICATES: { name: string; issuer: string; year: string }[] = [
  { name: 'Data Analytics Professional Certificate', issuer: 'Google', year: '2022' },
  { name: 'IT Professional Certificate', issuer: 'Google', year: '2022' },
  { name: 'Find Your Greatness', issuer: 'NielsenIQ', year: '2022' },
  { name: 'RACE Machine Learning Graduate', issuer: 'NielsenIQ', year: '2021' },
  { name: 'Data Analysis with Python', issuer: 'IBM', year: '2021' },
  { name: 'Data Visualization with Python', issuer: 'IBM', year: '2021' },
  { name: 'Python 101 for Data Science', issuer: 'IBM', year: '2021' },
  { name: 'Bronze Award — Trust & Accountability', issuer: 'NielsenIQ', year: '2021' },
  { name: 'Bronze Award — Engage-Include-Decide', issuer: 'NielsenIQ', year: '2021' },
]

export const HOBBIES = ['Photography']
