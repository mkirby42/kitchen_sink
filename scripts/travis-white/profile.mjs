// Real therapist. Not a demo seed. Do not use @kitchensink.demo or a seed UUID.
// Facts are from thetalkshoppeatx.com (home, fees, services, FAQ, contact)
// and the Psychology Today profile. Blank means the pages did not say.

export const TRAVIS_EMAIL = "thetalkshoppeatx@gmail.com";

export const travisWhite = {
  email: TRAVIS_EMAIL,
  name: "Travis White",
  phone: "(512) 554-2231",
  credential: "PsyD",
  startDate: null,
  openToNewClients: true,
  listed: true,
  virtual: true,
  inPerson: true,
  slidingScale: false,
  superbill: true,
  about: [
    "It’s tough to find your path and easy to lose it. I help college students, grad students, and early to mid-career professionals find their way.",
    "I am a Doctor of Clinical Psychology and a Licensed Psychologist in Texas. I’m married with three young kids. Being a husband and dad has taught me more about myself, people, and the world in general than I could have possibly imagined. I like run a lot, train BJJ when I can, and love to cook and eat. I also play board games when I can find the time, like to stay busy around the house, and love my job as a therapist.",
    "College, grad school, early marriage, and young parenthood have been some of the most challenging and rewarding periods of my life. Nearly as exciting as they’ve been terrifying. I’ve done it all…made mistakes, put it back together, made the same mistakes again, found new mistakes to make, pulled off miraculous triumphs, and spent plenty of time grinding away. Through it all, I’ve tried to stay true to myself and always remain a student to my experiences. I wouldn’t change a bit of it.",
  ].join("\n\n"),
  licenses: [{ number: "38047", state: "TX" }],
  qualifications: [
    { kind: "education", label: "Doctor of Clinical Psychology", position: 0 },
    { kind: "credential", label: "Licensed Psychologist", position: 0 },
  ],
  location: {
    address: "1102 West 6th Street, Austin",
    address2: null,
    state: "TX",
    zip: "78703",
    lat: 30.2723506,
    lon: -97.75514559999999,
  },
  // Fees page: "Individual Counseling $150 (55 minutes)".
  // FAQ also says "$150 per 50 minute session". The fee schedule wins.
  // Psychology Today lists Couple Sessions at $150 with no length, so no couples row.
  rates: [
    { service_type: "Individual", duration_minutes: 55, price_cents: 15000 },
  ],
  tags: [
    { kind: "specialty", label: "Anxiety" },
    { kind: "specialty", label: "Depression" },
    { kind: "specialty", label: "Couples & Relationships" },
    { kind: "specialty", label: "Life Transitions" },
    { kind: "specialty", label: "Panic Attacks" },
    { kind: "specialty", label: "Career" },
    { kind: "specialty", label: "Self Growth" },
    { kind: "specialty", label: "Therapy for Men" },
    { kind: "specialty", label: "College Students" },
    { kind: "specialty", label: "Graduate Students" },
    { kind: "specialty", label: "Early to Mid-Career Professionals" },
    { kind: "specialty", label: "Stress" },
    { kind: "modality", label: "ACT" },
    { kind: "modality", label: "Attachment-Based" },
    { kind: "modality", label: "CBT" },
    { kind: "modality", label: "DBT" },
    { kind: "modality", label: "Narrative" },
    { kind: "modality", label: "Existential" },
    { kind: "modality", label: "Solution Focused Brief (SFBT)" },
    { kind: "modality", label: "Strength-Based" },
    { kind: "insurance", label: "Aetna" },
    { kind: "insurance", label: "BCBS" },
    { kind: "insurance", label: "Medicare" },
    { kind: "insurance", label: "Optum" },
    { kind: "insurance", label: "UnitedHealthcare" },
    { kind: "insurance", label: "Out-of-Network Superbill" },
    { kind: "outreach", label: "email" },
    { kind: "outreach", label: "phone" },
    { kind: "outreach", label: "text" },
  ],
  cards: [
    {
      prompt: "who I work best with...",
      tag: "about",
      answer:
        "I help college students, grad students, and early to mid-career professionals find their way.",
    },
    {
      prompt: "my approach to therapy is...",
      tag: "approach",
      answer:
        "Collaborative, practical, and down-to-earth. Therapy is tailored to your needs and may include insight-oriented work, coping tools, communication skills, and goal-focused support.",
    },
    {
      prompt: "I specialize in unpacking...",
      tag: "specialty",
      answer:
        "Anxiety, depression, panic attacks, relationship concerns, stress, and major life transitions.",
    },
    {
      prompt: "a session with me feels like...",
      tag: "session_vibe",
      answer:
        "It is just two people talking. I work collaboratively and like a lot of feedback. Sometimes the work is very structured, with specific goals. Sometimes it is less structured and more exploratory, with a focus on depth, insight, and discovery.",
    },
    {
      prompt: "outside of session, I...",
      tag: "session_vibe",
      answer:
        "I like run a lot, train BJJ when I can, and love to cook and eat. I also play board games when I can find the time.",
    },
    {
      prompt: "before we start, you should know...",
      tag: "about",
      answer:
        "I am a Doctor of Clinical Psychology and a Licensed Psychologist in Texas. Call, text, or email to set up a free 15-minute consultation.",
    },
  ],
};

export const travisMedia = {
  photoPath: "scripts/travis-white/photo.jpg",
  videoPath: "scripts/travis-white/intro.mp4",
  photoContentType: "image/jpeg",
  videoContentType: "video/mp4",
};
