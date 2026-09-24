export type JoinLicense = { number: string; state: string };
export type JoinRate = {
  service_type: string;
  duration_minutes: number;
  price_cents: number;
};
export type JoinCard = { prompt: string; answer: string; tag: string };
export type JoinLocation = {
  address: string;
  address2?: string;
  state: string;
  zip: string;
};

export type JoinDraft = {
  name: string;
  credential: string;
  yearsPracticing: number | "";
  education: string[];
  credentials: string[];
  licenses: JoinLicense[];
  photoKey: string | null;
  videoKey: string | null;
  openToNewClients: boolean;
  virtual: boolean;
  inPerson: boolean;
  specialties: string[];
  modalities: string[];
  insurance: string[];
  identity: string[];
  location: JoinLocation | null;
  rates: JoinRate[];
  cards: JoinCard[];
  about: string;
  email: string;
  phone: string;
  outreach: string[];
  feedback: string;
};
