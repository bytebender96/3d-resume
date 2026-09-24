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

export type ResumeEntry = {
  period: string
  title: string
  org: string
  summary: string
  /** Headline numbers shown large on the card */
  stats?: { value: string; label: string }[]
  tags: string[]
}

// Each entry gets its own floating 3D object the camera visits.
// Add or remove entries freely — the camera path adapts automatically.
export const RESUME: ResumeEntry[] = [
  {
    period: 'Feb 2024 — Now',
    title: 'Team Lead, Operations',
    org: 'NielsenIQ',
    summary:
      'Leading data strategy and governance for regional operations — closing process gaps, driving compliance and turning market research into strategic insight for cross-functional teams.',
    stats: [
      { value: '+20%', label: 'KPI improvement' },
      { value: '>90%', label: 'Compliance rate' },
    ],
    tags: ['Data Governance', 'Strategy', 'Leadership'],
  },
  {
    period: 'Oct 2022 — Jan 2024',
    title: 'Senior Data Processing Specialist',
    org: 'NielsenIQ',
    summary:
      'Introduced SOPs and automation tools for data quality, led process-improvement and training initiatives, and mentored junior team members.',
    stats: [
      { value: '−95%', label: 'Quality escapes' },
      { value: '+35%', label: 'Productivity' },
      { value: '−40%', label: 'Error rate' },
    ],
    tags: ['Data Quality', 'Automation', 'Mentoring'],
  },
  {
    period: 'Jan 2021 — Sep 2022',
    title: 'Data Processing Specialist',
    org: 'NielsenIQ',
    summary:
      'Built Python scripts and automation that made data processing faster and more accurate, and produced analytical reports with cross-functional teams.',
    stats: [
      { value: '+25%', label: 'Data accuracy' },
      { value: '−40%', label: 'Processing time' },
    ],
    tags: ['Python', 'Automation', 'Reporting'],
  },
  {
    period: '2020 — 2021',
    title: 'Graduate Trainee',
    org: 'Nielsen',
    summary: 'Started my career in data operations through the Nielsen graduate programme.',
    tags: ['Data Operations'],
  },
  {
    period: '2018 — 2019',
    title: 'Research Trainee',
    org: 'Center for Exploratory Research, Hitachi Ltd. · Saitama, Japan',
    summary: 'Research traineeship at Hitachi’s Center for Exploratory Research in Japan.',
    tags: ['Research', 'Japan'],
  },
  {
    period: '2016 — 2019',
    title: 'B.IT (Hons), Software Engineering',
    org: 'Universiti Teknologi PETRONAS',
    summary: 'Bachelor of Information Technology with a Software Engineering major. GPA 3.41.',
    tags: ['Software Engineering'],
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
