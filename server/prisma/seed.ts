import {
  PrismaClient,
  Prisma,
  Role,
  Location,
  POStatus,
  InvoiceStatus,
  GRNStatus,
  MatchStatus,
  PaymentStatus,
  ExpenseStatus,
  StockRequestStatus,
  StockLineOutcome,
} from "@prisma/client";
import { createId } from "@paralleldrive/cuid2";

const prisma = new PrismaClient();

const qStart = new Date("2025-10-01T08:00:00.000Z");
const qEnd = new Date("2025-12-31T17:00:00.000Z");

const money = (n: number) => new Prisma.Decimal(n.toFixed(2));
const int = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(arr: T[]) => arr[int(0, arr.length - 1)];
const maybe = <T,>(value: T, chance = 0.5): T | undefined =>
  Math.random() < chance ? value : undefined;

function dateBetween(start: Date, end: Date, hour = 10) {
  const ms = start.getTime() + Math.random() * (end.getTime() - start.getTime());
  const d = new Date(ms);
  d.setUTCHours(hour, int(0, 59), 0, 0);
  return d;
}

function daysAfter(base: Date, days: number, hour = 10) {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(hour, int(0, 59), 0, 0);
  return d;
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

type CatalogItem = {
  supplierName: string;
  name: string;
  unit: string;
  pack: string;
  category?: string;
  department?: string;
  lotNumber?: string;
  expiryDate?: string;
  defaultPrice?: number;
  reorderPoint?: number;
  minQuantity?: number;
};

type BranchProfile = {
  location: Location;
  salesMin: number;
  salesMax: number;
  requestWeight: number;
  isMainStore?: boolean;
};

const BRANCHES: { id: number; name: string; profile: BranchProfile }[] = [
  {
    id: 1,
    name: "Tapion",
    profile: {
      location: Location.Tapion,
      salesMin: 5200,
      salesMax: 9800,
      requestWeight: 0.35,
      isMainStore: true,
    },
  },
  {
    id: 2,
    name: "Vieux Fort",
    profile: {
      location: Location.vieuxFort,
      salesMin: 2600,
      salesMax: 4700,
      requestWeight: 1.15,
    },
  },
  {
    id: 3,
    name: "Rodney Bay",
    profile: {
      location: Location.rodneyBay,
      salesMin: 2200,
      salesMax: 4100,
      requestWeight: 1.05,
    },
  },
  {
    id: 4,
    name: "Blue Coral",
    profile: {
      location: Location.blueCoral,
      salesMin: 1700,
      salesMax: 3200,
      requestWeight: 0.95,
    },
  },
  {
    id: 5,
    name: "EmCare",
    profile: {
      location: Location.emCare,
      salesMin: 1300,
      salesMax: 2600,
      requestWeight: 0.9,
    },
  },
  {
    id: 6,
    name: "Manoel Street",
    profile: {
      location: Location.manoelStreet,
      salesMin: 1000,
      salesMax: 2100,
      requestWeight: 0.8,
    },
  },
  {
    id: 7,
    name: "MemberCare",
    profile: {
      location: Location.memberCare,
      salesMin: 900,
      salesMax: 1800,
      requestWeight: 0.75,
    },
  },
  {
    id: 8,
    name: "Sunny Acres",
    profile: {
      location: Location.sunnyAcres,
      salesMin: 800,
      salesMax: 1600,
      requestWeight: 0.7,
    },
  },
  {
    id: 9,
    name: "Soufriere",
    profile: {
      location: Location.soufriere,
      salesMin: 650,
      salesMax: 1400,
      requestWeight: 0.6,
    },
  },
];

const imageLibrary = [
  {
    name: "Vacutainer Needle 23G (Butterfly).jpg",
    url: "https://7gmc7e6b15.ufs.sh/f/dKBd9somZU3oNjsPLmyUV7To9FbKirpux85yL3Ca4v0MdBfZ",
  },
  {
    name: "Alcohol Swab 70% IPA.jpg",
    url: "https://7gmc7e6b15.ufs.sh/f/dKBd9somZU3oGRePMiSFN9VJ3pZmXnAMchOwfILgiq5tDS4z",
  },
  {
    name: "Cotton Balls (Bag x 200).jpg",
    url: "https://7gmc7e6b15.ufs.sh/f/dKBd9somZU3oLUZxSRiOlZR8WVb3pv7KgJxSF1hHIuEPDenB",
  },
  {
    name: "Nitrile Gloves (Medium) Box.jpg",
    url: "https://7gmc7e6b15.ufs.sh/f/dKBd9somZU3odAOkBiomZU3ocK8qzf1Pj2FVuW0SDTxOhA4N",
  },
  {
    name: "Rapid HIV Test (20 Tests).jpg",
    url: "https://7gmc7e6b15.ufs.sh/f/dKBd9somZU3ofmkWKChE1Ng72tH8KsUIkL40hABwjPyqJmir",
  },
  {
    name: "Serum Control Level 1 medical lab testing.jpg",
    url: "https://7gmc7e6b15.ufs.sh/f/dKBd9somZU3os507LUODBcN3mnz4Hp7vtkI6sgV5CZfuyM9P",
  },
  {
    name: "Serum Separator Tube (SST) 5 mL.jpg",
    url: "https://7gmc7e6b15.ufs.sh/f/dKBd9somZU3oSJrMQmXJFaYyDpluimA5eLxXBP4jUNzTwQfE",
  },
  {
    name: "EDTA Vacutainer Tube 4 mL.jpg",
    url: "https://7gmc7e6b15.ufs.sh/f/dKBd9somZU3oF1S2ABPjhVT24Ks3Y7dmqEAvFMCw5yHlXZLz",
  },
  {
    name: "Pipette Tips 1000 µL (Rack 96).jpg",
    url: "https://7gmc7e6b15.ufs.sh/f/dKBd9somZU3oyvlG7Q9skU0MpvHtlbX87xYqhjwfBEGrua6A",
  },
  {
    name: "Blood Agar Plates.jpg",
    url: "https://7gmc7e6b15.ufs.sh/f/dKBd9somZU3opHCik1Q5IMxmQntyiSz87K9D1GUWOV30ZjqP",
  },
  {
    name: "Vacutainer Needle 21G.jpg",
    url: "https://7gmc7e6b15.ufs.sh/f/dKBd9somZU3oQ9YDLugEuCBLZ4kxlI96FOmytiR0a2Up7cGb",
  },
  {
    name: "Sodium Fluoride 4 mL.jpg",
    url: "https://7gmc7e6b15.ufs.sh/f/dKBd9somZU3oxWu9xQdTSciQneF9kJOYoNfght1Mb5LUAGr0",
  },
  {
    name: "Lithium Heparin Tube 5 mL.jpg",
    url: "https://7gmc7e6b15.ufs.sh/f/dKBd9somZU3oPGS54WJptd3kMwv6exjgl7XJ40BsRTFGi5mO",
  },
  {
    name: "Sodium Citrate Tube 2.7 mL.jpg",
    url: "https://7gmc7e6b15.ufs.sh/f/dKBd9somZU3oGTKPFDcSFN9VJ3pZmXnAMchOwfILgiq5tDS4",
  },
  {
    name: "alcohol 70% 1 Galon.jpg",
    url: "https://7gmc7e6b15.ufs.sh/f/dKBd9somZU3oe1fSF36p5GEkBiwDajClObSLAuVW17XYsTxU",
  },
  {
    name: "spot plasters.jpg",
    url: "https://7gmc7e6b15.ufs.sh/f/dKBd9somZU3o1D5auv4EiMrmd70VwhIebRSg68CNJL1vFnD3",
  },
  {
    name: "cbc tubes.jpg",
    url: "https://7gmc7e6b15.ufs.sh/f/dKBd9somZU3ofAaoGfE1Ng72tH8KsUIkL40hABwjPyqJmiru",
  },
];

function getBranchById(locationId: number) {
  const branch = BRANCHES.find((b) => b.id === locationId);
  if (!branch) throw new Error(`Unknown branch id: ${locationId}`);
  return branch;
}

function splitTender(total: number) {
  const cashW = 0.45 + Math.random() * 0.22;
  const creditW = 0.12 + Math.random() * 0.16;
  const debitW = 0.1 + Math.random() * 0.14;
  const chequeW = 0.01 + Math.random() * 0.05;

  const sum = cashW + creditW + debitW + chequeW;

  const cash = Number(((total * cashW) / sum).toFixed(2));
  const credit = Number(((total * creditW) / sum).toFixed(2));
  const debit = Number(((total * debitW) / sum).toFixed(2));
  const cheque = Number((total - cash - credit - debit).toFixed(2));

  return { cash, credit, debit, cheque };
}

function salesTotalForBranch(branch: { id: number; name: string; profile: BranchProfile }) {
  const { salesMin, salesMax } = branch.profile;

  let total = int(salesMin, salesMax);

  if (branch.name === "Tapion" && Math.random() < 0.04) {
    total = int(salesMax + 300, salesMax + 1400);
  }

  if (branch.name === "Vieux Fort" && Math.random() < 0.05) {
    total = int(salesMax + 200, salesMax + 1000);
  }

  if (branch.name === "Rodney Bay" && Math.random() < 0.05) {
    total = int(salesMax + 150, salesMax + 850);
  }

  if (
    !["Tapion", "Vieux Fort", "Rodney Bay", "Blue Coral"].includes(branch.name) &&
    Math.random() < 0.025
  ) {
    total = int(Math.floor(salesMax * 1.05), Math.floor(salesMax * 1.35));
  }

  return total;
}

function receivedFromOrdered(qty: number) {
  const roll = Math.random();

  if (roll < 0.7) return qty;
  if (roll < 0.9) return Math.max(1, qty - int(1, Math.min(3, qty)));
  return Math.max(1, Math.floor(qty * (0.6 + Math.random() * 0.2)));
}

function splitIntoInvoiceBatches<T>(items: T[]): T[][] {
  if (items.length <= 2) return [items];

  const roll = Math.random();

  if (roll < 0.55) return [items];

  if (roll < 0.9) {
    const cut = int(1, items.length - 1);
    return [items.slice(0, cut), items.slice(cut)];
  }

  if (items.length >= 4) {
    const cut1 = int(1, items.length - 2);
    const cut2 = int(cut1 + 1, items.length - 1);
    return [items.slice(0, cut1), items.slice(cut1, cut2), items.slice(cut2)];
  }

  return [items];
}

function weightedRequester<T extends { location: Location }>(options: T[]) {
  const weighted: T[] = [];

  for (const option of options) {
    const branch = BRANCHES.find((b) => b.profile.location === option.location);
    const weight = Math.max(1, Math.round((branch?.profile.requestWeight ?? 1) * 10));

    for (let i = 0; i < weight; i++) weighted.push(option);
  }

  return pick(weighted);
}

function getImageUrl(productName: string): string | undefined {
  const n = productName.toLowerCase();

  if (/21g/.test(n) && /needle/.test(n)) {
    return imageLibrary.find((x) => x.name === "Vacutainer Needle 21G.jpg")?.url;
  }

  if (/23g/.test(n) && /needle|butterfly/.test(n)) {
    return imageLibrary.find((x) => x.name === "Vacutainer Needle 23G (Butterfly).jpg")?.url;
  }

  if (/alcohol prep pads|alcohol swab/i.test(productName)) {
    return imageLibrary.find((x) => x.name === "Alcohol Swab 70% IPA.jpg")?.url;
  }

  if (/nitrile.*medium/i.test(productName)) {
    return imageLibrary.find((x) => x.name === "Nitrile Gloves (Medium) Box.jpg")?.url;
  }

  if (/edta|k3edta|cbc/i.test(productName)) {
    return (
      imageLibrary.find((x) => x.name === "EDTA Vacutainer Tube 4 mL.jpg")?.url ??
      imageLibrary.find((x) => x.name === "cbc tubes.jpg")?.url
    );
  }

  if (/sodium fluoride|fluoride/i.test(productName)) {
    return imageLibrary.find((x) => x.name === "Sodium Fluoride 4 mL.jpg")?.url;
  }

  if (/sodium citrate|coagulation/i.test(productName)) {
    return imageLibrary.find((x) => x.name === "Sodium Citrate Tube 2.7 mL.jpg")?.url;
  }

  if (/spot adhesive bandages|spot plasters|bandages/i.test(productName)) {
    return imageLibrary.find((x) => x.name === "spot plasters.jpg")?.url;
  }

  if (/hiv/i.test(productName)) {
    return imageLibrary.find((x) => x.name === "Rapid HIV Test (20 Tests).jpg")?.url;
  }

  if (/microscope slides/i.test(productName)) {
    return imageLibrary.find((x) => x.name === "Blood Agar Plates.jpg")?.url;
  }

  return undefined;
}

const supplierSeed = [
  { name: "Greiner Bio-One", email: "orders@greinerbioone.example", phone: "758-450-1101", address: "Castries, Saint Lucia" },
  { name: "Dynarex", email: "sales@dynarex.example", phone: "758-450-1102", address: "Gros Islet, Saint Lucia" },
  { name: "Novaplus", email: "supply@novaplus.example", phone: "758-450-1103", address: "Vieux Fort, Saint Lucia" },
  { name: "BD", email: "orders@bd.example", phone: "758-450-1104", address: "Rodney Bay, Saint Lucia" },
  { name: "BOENMED", email: "contact@boenmed.example", phone: "758-450-1105", address: "Castries, Saint Lucia" },
  { name: "Globe Scientific Inc.", email: "info@globescientific.example", phone: "758-450-1106", address: "Tapion, Saint Lucia" },
  { name: "Quidel", email: "orders@quidel.example", phone: "758-450-1107", address: "Castries, Saint Lucia" },
  { name: "R&D Systems", email: "lab@rdsystems.example", phone: "758-450-1108", address: "Castries, Saint Lucia" },
  { name: "Mindray", email: "service@mindray.example", phone: "758-450-1109", address: "Castries, Saint Lucia" },
  { name: "Trinity Biotech", email: "support@trinitybiotech.example", phone: "758-450-1110", address: "Castries, Saint Lucia" },
  { name: "Horiba", email: "orders@horiba.example", phone: "758-450-1111", address: "Castries, Saint Lucia" },
  { name: "Teco Diagnostics", email: "orders@tecodiagnostics.example", phone: "758-450-1112", address: "Castries, Saint Lucia" },
  { name: "Vital Scientific", email: "orders@vitalscientific.example", phone: "758-450-1113", address: "Castries, Saint Lucia" },
  { name: "ElitechGroup Solutions", email: "orders@elitech.example", phone: "758-450-1114", address: "Castries, Saint Lucia" },
  { name: "Elitech", email: "orders@elitechlegacy.example", phone: "758-450-1115", address: "Castries, Saint Lucia" },
  { name: "Oxoid", email: "sales@oxoid.example", phone: "758-450-1116", address: "Castries, Saint Lucia" },
  { name: "Alfa Scientific Designs Inc.", email: "orders@alfascientific.example", phone: "758-450-1117", address: "Castries, Saint Lucia" },
  { name: "BTNX Inc.", email: "orders@btnx.example", phone: "758-450-1118", address: "Castries, Saint Lucia" },
  { name: "CTK Biotech, Inc.", email: "orders@ctkbiotech.example", phone: "758-450-1119", address: "Castries, Saint Lucia" },
  { name: "SD Biosensor", email: "orders@sdbiosensor.example", phone: "758-450-1120", address: "Castries, Saint Lucia" },
  { name: "Abbott", email: "orders@abbott.example", phone: "758-450-1121", address: "Castries, Saint Lucia" },
  { name: "DIESSE Diagnostica Senese SpA", email: "orders@diesse.example", phone: "758-450-1122", address: "Castries, Saint Lucia" },
  { name: "Siemens", email: "orders@siemens.example", phone: "758-450-1123", address: "Castries, Saint Lucia" },
  { name: "Cepheid", email: "orders@cepheid.example", phone: "758-450-1124", address: "Castries, Saint Lucia" },
  { name: "Bio-Rad", email: "orders@biorad.example", phone: "758-450-1125", address: "Castries, Saint Lucia" },
  { name: "Thermo Scientific", email: "orders@thermoscientific.example", phone: "758-450-1126", address: "Castries, Saint Lucia" },
  { name: "General Lab Supply", email: "orders@generallab.example", phone: "758-450-1127", address: "Castries, Saint Lucia" },
];

const catalog: CatalogItem[] = [
  { supplierName: "Greiner Bio-One", name: "VACUETTE Multiple Use Drawing Needle 21G", unit: "pcs", pack: "100 pcs", lotNumber: "22K05B", expiryDate: "2027-11-04", defaultPrice: 1.95, category: "Collection", department: "SpecimenCollection", reorderPoint: 8, minQuantity: 4 },
  { supplierName: "Greiner Bio-One", name: "VACUETTE Multiple Use Drawing Needle 20G", unit: "pcs", pack: "100 pcs", defaultPrice: 1.95, category: "Collection", department: "SpecimenCollection", reorderPoint: 8, minQuantity: 4 },
  { supplierName: "Greiner Bio-One", name: "VACUETTE Multiple Use Drawing Needle 22G", unit: "pcs", pack: "100 pcs", defaultPrice: 1.95, category: "Collection", department: "SpecimenCollection", reorderPoint: 8, minQuantity: 4 },

  { supplierName: "Dynarex", name: "Sterile Alcohol Prep Pads", unit: "pads", pack: "200", defaultPrice: 18.5, category: "Collection", department: "SpecimenCollection" },
  { supplierName: "Novaplus", name: "Tourniquet", unit: "box", pack: "250 per box", defaultPrice: 34.0, category: "Collection", department: "SpecimenCollection" },
  { supplierName: "BD", name: "PrecisionGlide Vacutainer Needle", unit: "box", pack: "100", defaultPrice: 42.0, category: "Collection", department: "SpecimenCollection" },
  { supplierName: "Dynarex", name: "Hypodermic Needles 20G", unit: "box", pack: "100", defaultPrice: 26.0, category: "Collection", department: "SpecimenCollection" },
  { supplierName: "Dynarex", name: "Hypodermic Needles 21G", unit: "box", pack: "100", defaultPrice: 26.0, category: "Collection", department: "SpecimenCollection" },
  { supplierName: "Dynarex", name: "Hypodermic Needles 22G", unit: "box", pack: "100", defaultPrice: 26.0, category: "Collection", department: "SpecimenCollection" },
  { supplierName: "BOENMED", name: "AID FIRST Waterproof Bandages", unit: "pcs", pack: "100 pcs", defaultPrice: 12.75, category: "Safety", department: "SpecimenCollection" },
  { supplierName: "Dynarex", name: "Sheer Plastic Spot Adhesive Bandages", unit: "box", pack: "100", defaultPrice: 10.5, category: "Safety", department: "SpecimenCollection" },

  { supplierName: "Greiner Bio-One", name: "VACUETTE 3.5 ml 9NC Coagulation sodium citrate 3.2%", unit: "pcs", pack: "50 pcs", lotNumber: "B2507339", expiryDate: "2026-07-01", defaultPrice: 1.75, category: "Collection", department: "heamatology" },
  { supplierName: "Greiner Bio-One", name: "VACUETTE 4 ml K3E K3EDTA", unit: "pcs", pack: "50 pcs", lotNumber: "B250333W", expiryDate: "2026-07-01", defaultPrice: 1.62, category: "Collection", department: "heamatology" },
  { supplierName: "Greiner Bio-One", name: "VACUETTE 4 ml FX Sodium Fluoride / Potassium Oxalate", unit: "pcs", pack: "50 pcs", lotNumber: "A250435H", expiryDate: "2026-08-01", defaultPrice: 1.68, category: "Collection", department: "Chemistry" },
  { supplierName: "Greiner Bio-One", name: "VACUETTE 8 ml CAT Serum Sep Clot Activator", unit: "pcs", pack: "50 pcs", lotNumber: "B2507347", expiryDate: "2026-12-31", defaultPrice: 1.89, category: "Collection", department: "Chemistry" },

  { supplierName: "Globe Scientific Inc.", name: "3 mL Transfer Pipet", unit: "each", pack: "500 each", defaultPrice: 0.38, category: "Collection", department: "Chemistry" },
  { supplierName: "Globe Scientific Inc.", name: "Microscope Slides", unit: "box", pack: "1/2 gross (72 slides)", defaultPrice: 22.5, category: "Collection", department: "Cytology" },

  { supplierName: "Dynarex", name: "Safe-Touch Blue Nitrile Examination Gloves, Powder-Free, Small", unit: "box", pack: "100", defaultPrice: 22.0, category: "Safety", department: "SpecimenCollection" },
  { supplierName: "Dynarex", name: "Safe-Touch Blue Nitrile Examination Gloves, Powder-Free, Medium", unit: "box", pack: "100", defaultPrice: 22.0, category: "Safety", department: "SpecimenCollection" },
  { supplierName: "Dynarex", name: "Safe-Touch Blue Nitrile Examination Gloves, Powder-Free, Large", unit: "box", pack: "100", defaultPrice: 22.0, category: "Safety", department: "SpecimenCollection" },
  { supplierName: "Dynarex", name: "Safe-Touch Latex Examination Gloves, Powder-Free, Small", unit: "box", pack: "100", defaultPrice: 17.5, category: "Safety", department: "SpecimenCollection" },
  { supplierName: "Dynarex", name: "Safe-Touch Latex Examination Gloves, Powder-Free, Medium", unit: "box", pack: "100", defaultPrice: 17.5, category: "Safety", department: "SpecimenCollection" },
  { supplierName: "Dynarex", name: "Safe-Touch Latex Examination Gloves, Powder-Free, Large", unit: "box", pack: "100", defaultPrice: 17.5, category: "Safety", department: "SpecimenCollection" },

  { supplierName: "Quidel", name: "Triage Cardiac Panel", unit: "kit", pack: "10", lotNumber: "T16230RN", expiryDate: "2026-07-12", defaultPrice: 265.0, category: "Reagent", department: "Chemistry" },
  { supplierName: "R&D Systems", name: "CBC-5DMR TRI PACK Hematology Control", unit: "pack", pack: "3 levels × 2 × 3.0 mL", lotNumber: "BC2511B", expiryDate: "2026-01-10", defaultPrice: 410.0, category: "Reagent", department: "heamatology" },
  { supplierName: "Quidel", name: "Triage NT-proBNP Test", unit: "kit", pack: "1", lotNumber: "T16085N", expiryDate: "2026-07-19", defaultPrice: 210.0, category: "Reagent", department: "Chemistry" },
  { supplierName: "Quidel", name: "Triage D-Dimer Test", unit: "kit", pack: "10", lotNumber: "T16120RBN", expiryDate: "2026-07-04", defaultPrice: 225.0, category: "Reagent", department: "Chemistry" },

  { supplierName: "Mindray", name: "Lipoprotein (a) Calibrator", unit: "box", pack: "1", lotNumber: "161024007", expiryDate: "2026-03-31", defaultPrice: 185.0, category: "Reagent", department: "Chemistry" },
  { supplierName: "Trinity Biotech", name: "G-6-PDH Deficiency", unit: "kit", pack: "1 × 12 mL buffer, 5 × 2 mL substrate", defaultPrice: 195.0, category: "Reagent", department: "Chemistry" },

  { supplierName: "Horiba", name: "Amylase (CNPG3) Reagent Set", unit: "set", pack: "3 × 40 mL", lotNumber: "400401-320", expiryDate: "2026-01-31", defaultPrice: 144.0, category: "Reagent", department: "Chemistry" },
  { supplierName: "Horiba", name: "LDH Reagent", unit: "reagent", pack: "2 × 40 mL R1, 2 × 10 mL R2", lotNumber: "528603-014", expiryDate: "2027-04-30", defaultPrice: 130.0, category: "Reagent", department: "Chemistry" },
  { supplierName: "Horiba", name: "Triglyceride Reagent", unit: "reagent", pack: "4 × 40 mL", lotNumber: "517501-287", expiryDate: "2026-12-31", defaultPrice: 105.0, category: "Reagent", department: "Chemistry" },
  { supplierName: "Horiba", name: "Microprotein Reagent Set", unit: "set", pack: "2 × 120 mL reagent, 1 × 15 mL standard", lotNumber: "526501-316", expiryDate: "2027-03-31", defaultPrice: 176.0, category: "Reagent", department: "Chemistry" },
  { supplierName: "Horiba", name: "autoHDL Cholesterol Reagent", unit: "reagent", pack: "3 × 40 mL R1, 3 × 14 mL R2", lotNumber: "417601-209", expiryDate: "2026-06-30", defaultPrice: 160.0, category: "Reagent", department: "Chemistry" },
  { supplierName: "Horiba", name: "Alkaline Phosphatase Reagent", unit: "reagent", pack: "2 × 40 mL R1, 2 × 10 mL R2", lotNumber: "511201-036", expiryDate: "2026-10-31", defaultPrice: 122.0, category: "Reagent", department: "Chemistry" },
  { supplierName: "Teco Diagnostics", name: "Gamma-GT (Soluble) Reagent Set", unit: "set", pack: "10 × 15 mL", lotNumber: "104003", expiryDate: "2027-05-08", defaultPrice: 118.0, category: "Reagent", department: "Chemistry" },
  { supplierName: "Horiba", name: "ALT Reagent", unit: "reagent", pack: "2 × 40 mL R1, 2 × 10 mL R2", lotNumber: "523001-351", expiryDate: "2027-02-28", defaultPrice: 124.0, category: "Reagent", department: "Chemistry" },
  { supplierName: "Teco Diagnostics", name: "AST (SGOT) Reagent Set", unit: "set", pack: "8 × 50 mL", lotNumber: "97762", expiryDate: "2026-03-28", defaultPrice: 114.0, category: "Reagent", department: "Chemistry" },
  { supplierName: "Horiba", name: "Glucose Oxidase Reagent Set", unit: "set", pack: "1 × 120 mL", lotNumber: "518801-230", expiryDate: "2027-07-31", defaultPrice: 96.0, category: "Reagent", department: "Chemistry" },
  { supplierName: "Horiba", name: "Glucose (Oxidase) Reagent", unit: "reagent", pack: "1 × 500 mL", lotNumber: "518801-023", expiryDate: "2027-07-31", defaultPrice: 140.0, category: "Reagent", department: "Chemistry" },
  { supplierName: "Horiba", name: "Uric Acid Reagent Set", unit: "set", pack: "3 × 40 mL", lotNumber: "426301-170", expiryDate: "2026-03-31", defaultPrice: 119.0, category: "Reagent", department: "Chemistry" },
  { supplierName: "Horiba", name: "Creatine Kinase Reagent", unit: "reagent", pack: "2 × 40 mL R1, 2 × 10 mL R2", lotNumber: "507801-318", expiryDate: "2027-01-31", defaultPrice: 168.0, category: "Reagent", department: "Chemistry" },

  { supplierName: "Vital Scientific", name: "Envoy 500 Magnesium Reagent Kit", unit: "kit", pack: "8 × 33.2 mL", lotNumber: "1515", expiryDate: "2026-11-30", defaultPrice: 205.0, category: "Reagent", department: "Chemistry" },
  { supplierName: "Elitech", name: "Envoy500 LDH Reagent Kit", unit: "kit", pack: "8 × 42.8 mL R1, 8 × 13.2 mL R2", lotNumber: "1477", expiryDate: "2025-12-31", defaultPrice: 199.0, category: "Reagent", department: "Chemistry" },
  { supplierName: "ElitechGroup Solutions", name: "Envoy500 Amylase Reagent Kit", unit: "kit", pack: "4 × 13.1 mL reagent, 1 × empty boat", lotNumber: "1602", expiryDate: "2026-12-31", defaultPrice: 126.0, category: "Reagent", department: "Chemistry" },
  { supplierName: "ElitechGroup Solutions", name: "Envoy500 Direct Bilirubin Reagent Kit", unit: "kit", pack: "8 × 31.5 mL R1, 8 × 9.6 mL R2", lotNumber: "1471", expiryDate: "2025-07-30", defaultPrice: 190.0, category: "Reagent", department: "Chemistry" },
  { supplierName: "ElitechGroup Solutions", name: "Envoy500 Creatinine Reagent Kit", unit: "kit", pack: "8 × 34.9 mL R1, 8 × 13.7 mL R2", lotNumber: "1470", expiryDate: "2026-01-31", defaultPrice: 188.0, category: "Reagent", department: "Chemistry" },

  { supplierName: "Oxoid", name: "SIGNAL Blood Culture System", unit: "system", pack: "1", defaultPrice: 320.0, category: "Equipment", department: "Bacteriology" },

  { supplierName: "General Lab Supply", name: "Glucose Tolerance Beverage 50g", unit: "bottles", pack: "24 × 10 fl oz", lotNumber: "183963-50", expiryDate: "2026-12-31", defaultPrice: 7.0, category: "Collection", department: "Chemistry" },
  { supplierName: "General Lab Supply", name: "Glucose Tolerance Beverage 75g", unit: "bottles", pack: "24 × 10 fl oz", lotNumber: "183963", expiryDate: "2026-12-31", defaultPrice: 7.5, category: "Collection", department: "Chemistry" },
  { supplierName: "General Lab Supply", name: "Glucose Tolerance Beverage 100g", unit: "bottles", pack: "24 × 10 fl oz", lotNumber: "183963-100", expiryDate: "2026-12-31", defaultPrice: 8.0, category: "Collection", department: "Chemistry" },

  { supplierName: "Alfa Scientific Designs Inc.", name: "Instant-View Marijuana (THC) Urine Cassette Test", unit: "devices", pack: "25 individually pouched devices", lotNumber: "090351", expiryDate: "2027-02-28", defaultPrice: 145.0, category: "Reagent", department: "Chemistry" },
  { supplierName: "BTNX Inc.", name: "Rapid Response FIT - Fecal Immunochemical Test", unit: "kit", pack: "1", lotNumber: "2503323", expiryDate: "2027-02-28", defaultPrice: 98.0, category: "Reagent", department: "Chemistry" },
  { supplierName: "Vital Scientific", name: "Envoy Rinse Solution Concentrate", unit: "concentrate", pack: "10 × 45 mL", lotNumber: "236196", expiryDate: "2026-05-31", defaultPrice: 82.0, category: "Reagent", department: "Chemistry" },
  { supplierName: "Globe Scientific Inc.", name: "SEDI-RATE Autozero Westergren ESR System", unit: "pipettes and vials", pack: "100 disposable pipettes, 100 vials", defaultPrice: 255.0, category: "Equipment", department: "heamatology" },
  { supplierName: "CTK Biotech, Inc.", name: "OnSite hCG Combo Rapid Test", unit: "cassette devices", pack: "30 individually packed cassette devices", lotNumber: "F0212W8E00", expiryDate: "2027-02-13", defaultPrice: 76.0, category: "Reagent", department: "Chemistry" },
  { supplierName: "Trinity Biotech", name: "Uni-Gold HIV", unit: "kit", pack: "1", lotNumber: "4050000000", expiryDate: "2026-12-14", defaultPrice: 125.0, category: "Reagent", department: "Chemistry" },
  { supplierName: "SD Biosensor", name: "STANDARD Q Dengue Duo Test", unit: "kit", pack: "10 tests", lotNumber: "5035B11AC1", expiryDate: "2026-10-31", defaultPrice: 115.0, category: "Reagent", department: "Chemistry" },
  { supplierName: "Abbott", name: "Bioline H. pylori", unit: "kit", pack: "1", lotNumber: "04ADJ001A", expiryDate: "2026-09-08", defaultPrice: 88.0, category: "Reagent", department: "Chemistry" },
  { supplierName: "Abbott", name: "Bioline H. pylori Ag", unit: "kit", pack: "1", lotNumber: "04BDK001D", expiryDate: "2027-05-18", defaultPrice: 92.0, category: "Reagent", department: "Chemistry" },
  { supplierName: "CTK Biotech, Inc.", name: "OnSite Leptospira IgG/IgM Combo Rapid Test", unit: "cassette devices", pack: "30 individually packed cassette devices", lotNumber: "F1121V3F00", expiryDate: "2026-11-21", defaultPrice: 89.0, category: "Reagent", department: "Chemistry" },
  { supplierName: "Abbott", name: "Bioline HAV IgG/IgM", unit: "kit", pack: "1", lotNumber: "13ADJ011A", defaultPrice: 93.0, category: "Reagent", department: "Chemistry" },
  { supplierName: "Abbott", name: "Bioline HCV", unit: "kit", pack: "30", defaultPrice: 96.0, category: "Reagent", department: "Chemistry" },
  { supplierName: "DIESSE Diagnostica Senese SpA", name: "ENZY-WELL/CHORUS Washing Buffer", unit: "buffer", pack: "4 × 100 mL", defaultPrice: 67.0, category: "Reagent", department: "Chemistry" },
  { supplierName: "Siemens", name: "Multistix 10 SG Reagent Strips for Urinalysis", unit: "bottle", pack: "100 strips", defaultPrice: 65.0, category: "Reagent", department: "Chemistry" },
  { supplierName: "Mindray", name: "EU-50 Automatic Urinalysis System Reagent (EU-50)", unit: "5 L", pack: "1", lotNumber: "2024120507", expiryDate: "2026-12-04", defaultPrice: 110.0, category: "Reagent", department: "Chemistry" },
  { supplierName: "Cepheid", name: "Xpert MTB/RIF Ultra", unit: "kit", pack: "10", lotNumber: "100144445", expiryDate: "2026-02-15", defaultPrice: 480.0, category: "Reagent", department: "Chemistry" },
  { supplierName: "Cepheid", name: "Xpert HPV", unit: "kit", pack: "10", lotNumber: "1001501612", expiryDate: "2027-03-14", defaultPrice: 520.0, category: "Reagent", department: "Cytology" },
  { supplierName: "Cepheid", name: "Xpert Xpress CoV-2 plus", unit: "kit", pack: "10", lotNumber: "1001447594", expiryDate: "2025-09-07", defaultPrice: 355.0, category: "Reagent", department: "Chemistry" },
  { supplierName: "Cepheid", name: "Xpert HPV 6 x 10", unit: "kit", pack: "6 × 10", lotNumber: "1001517616", expiryDate: "2027-07-11", defaultPrice: 2990.0, category: "Reagent", department: "Cytology" },

  { supplierName: "Mindray", name: "M-52DIFF LYSE", unit: "pack", pack: "500 mL × 4", lotNumber: "2024102851", expiryDate: "2026-10-27", defaultPrice: 290.0, category: "Reagent", department: "heamatology" },
  { supplierName: "Mindray", name: "M-52LH LYSE", unit: "pack", pack: "100 mL × 4", lotNumber: "2024102251", expiryDate: "2026-10-21", defaultPrice: 155.0, category: "Reagent", department: "heamatology" },
  { supplierName: "Mindray", name: "M-58LEO(II) LYSE", unit: "pack", pack: "500 mL × 4", lotNumber: "2024060651", expiryDate: "2026-06-05", defaultPrice: 315.0, category: "Reagent", department: "heamatology" },
  { supplierName: "Mindray", name: "M-58LEO(I) LYSE", unit: "pack", pack: "1 L × 4", lotNumber: "2024090651", expiryDate: "2026-09-05", defaultPrice: 345.0, category: "Reagent", department: "heamatology" },
  { supplierName: "Mindray", name: "M-58D DILUENT", unit: "pack", pack: "20 L × 1", lotNumber: "2025033154", expiryDate: "2027-03-30", defaultPrice: 275.0, category: "Reagent", department: "heamatology" },
  { supplierName: "Mindray", name: "DS DILUENT", unit: "pack", pack: "20 L × 1", lotNumber: "2025040252", expiryDate: "2027-04-01", defaultPrice: 248.0, category: "Reagent", department: "heamatology" },
  { supplierName: "Mindray", name: "M-6LN LYSE", unit: "Bottle", pack: "1", lotNumber: "2023113051", expiryDate: "2025-11-29", defaultPrice: 98.0, category: "Reagent", department: "heamatology" },
  { supplierName: "Mindray", name: "ESR Solution Reagent", unit: "Bottle", pack: "1", lotNumber: "2024102251", expiryDate: "2026-10-21", defaultPrice: 88.0, category: "Reagent", department: "heamatology" },

  { supplierName: "Bio-Rad", name: "Bio-Rad DiaClon ABO/Rh + reverse group for Patients", unit: "ID-Cards", pack: "4 x 12", defaultPrice: 220.0, category: "Reagent", department: "heamatology" },
  { supplierName: "Bio-Rad", name: "Bio-Rad DiaClon ABO/Rh for Newborns", unit: "ID-Cards", pack: "4 x 12", defaultPrice: 225.0, category: "Reagent", department: "heamatology" },
  { supplierName: "Bio-Rad", name: "Bio-Rad DiaClon Rh + K Pheno II", unit: "ID-Cards", pack: "4 x 12", lotNumber: "005652 72 09", expiryDate: "2026-03-31", defaultPrice: 235.0, category: "Reagent", department: "heamatology" },
  { supplierName: "Bio-Rad", name: "Bio-Rad Coombs Anti - IgG", unit: "ID-Cards", pack: "4 x 12", defaultPrice: 205.0, category: "Reagent", department: "heamatology" },
  { supplierName: "General Lab Supply", name: "Capiject Safety Lancet Blade", unit: "Box", pack: "200", defaultPrice: 42.0, category: "Collection", department: "SpecimenCollection" },
  { supplierName: "Thermo Scientific", name: "TRUTOL 50 Glucose Tolerance Beverage", unit: "Bottle", pack: "1", defaultPrice: 8.0, category: "Collection", department: "Chemistry" },
];

const userSeed = [
  { name: "Hunter Admin", email: "hunter.admin@example.com", role: Role.admin, location: Location.Tapion },
  { name: "Alana Clerk", email: "alana.clerk@example.com", role: Role.inventoryClerk, location: Location.Tapion },
  { name: "Keri Joseph", email: "keri.joseph@example.com", role: Role.labStaff, location: Location.vieuxFort },
  { name: "Mika Charles", email: "mika.charles@example.com", role: Role.labStaff, location: Location.rodneyBay },
  { name: "Shan Wells", email: "shan.wells@example.com", role: Role.orderAgent, location: Location.Tapion },
  { name: "Anya Samuel", email: "anya.samuel@example.com", role: Role.viewer, location: Location.blueCoral },
  { name: "Jared Tobierre", email: "jared.tobierre@example.com", role: Role.labStaff, location: Location.sunnyAcres },
  { name: "Nadia Felix", email: "nadia.felix@example.com", role: Role.labStaff, location: Location.manoelStreet },
  { name: "Rina Francis", email: "rina.francis@example.com", role: Role.labStaff, location: Location.memberCare },
  { name: "Joel Edward", email: "joel.edward@example.com", role: Role.labStaff, location: Location.emCare },
];

type ProductContext = {
  item: CatalogItem;
  supplierId: string;
  draftId: string;
  promotedProductId: string;
};

async function resetDb() {
  await prisma.salesAuditLog.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.stockLedgerAllocation.deleteMany();
  await prisma.stockLedger.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.matchLine.deleteMany();
  await prisma.threeWayMatch.deleteMany();
  await prisma.invoicePayment.deleteMany();
  await prisma.goodsReceiptItem.deleteMany();
  await prisma.goodsReceipt.deleteMany();
  await prisma.supplierInvoiceItem.deleteMany();
  await prisma.supplierInvoice.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.stockRequestLine.deleteMany();
  await prisma.stockRequest.deleteMany();
  await prisma.sessions.deleteMany();
  await prisma.products.deleteMany();
  await prisma.draftProduct.deleteMany();
  await prisma.expenses.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.users.deleteMany();
  await prisma.grnCounter.deleteMany();
}

async function seedUsers() {
  const users: Record<
    string,
    { id: string; name: string | null; email: string; role: Role; location: Location }
  > = {};

  for (const u of userSeed) {
    const created = await prisma.users.create({
      data: {
        id: createId(),
        name: u.name,
        email: u.email,
        clerkId: `clerk_${slugify(u.email)}_${createId()}`,
        role: u.role,
        location: u.location,
        createdAt: dateBetween(new Date("2025-01-05T10:00:00.000Z"), new Date("2025-07-20T15:00:00.000Z")),
        onboardedAt: dateBetween(new Date("2025-01-06T10:00:00.000Z"), new Date("2025-07-25T15:00:00.000Z")),
        lastLogin: dateBetween(new Date("2025-12-20T08:00:00.000Z"), new Date("2025-12-31T18:00:00.000Z")),
      },
    });

    await prisma.sessions.create({
      data: {
        id: createId(),
        userId: created.id,
        userAgent: pick([
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
          "Mozilla/5.0 (X11; Linux x86_64)",
        ]),
        ipAddress: `192.168.1.${int(10, 250)}`,
        sessionId: `sess_${createId()}`,
        createdAt: dateBetween(new Date("2025-10-01T08:00:00.000Z"), new Date("2025-12-31T17:00:00.000Z")),
      },
    });

    users[u.email] = created;
  }

  return users;
}

async function seedSuppliers() {
  const suppliers: Record<string, { supplierId: string; name: string }> = {};

  for (const s of supplierSeed) {
    const created = await prisma.supplier.create({
      data: {
        supplierId: createId(),
        name: s.name,
        email: s.email,
        phone: s.phone,
        address: s.address,
      },
    });

    suppliers[s.name] = created;
  }

  return suppliers;
}

async function seedDraftProductsAndPromotedProducts(
  suppliers: Record<string, { supplierId: string }>
) {
  const map = new Map<string, ProductContext>();

  for (const item of catalog) {
    const draft = await prisma.draftProduct.create({
      data: {
        id: createId(),
        name: item.name,
        unit: item.unit,
      },
    });

    const productId = `prod_${slugify(item.name)}_${createId().slice(0, 8)}`;

    await prisma.products.create({
      data: {
        productId,
        name: item.name,
        rating: Number((Math.random() * 1.2 + 3.8).toFixed(1)),
        stockQuantity: 0,
        minQuantity: item.minQuantity ?? int(2, 10),
        reorderPoint: item.reorderPoint ?? int(8, 20),
        category: item.category ?? pick(["Collection", "Reagent", "Safety", "Equipment"]),
        unit: item.unit,
        supplier: item.supplierName,
        expiryDate: item.expiryDate
          ? new Date(item.expiryDate)
          : maybe(dateBetween(new Date("2026-03-01"), new Date("2027-12-31")), 0.45),
        imageUrl: getImageUrl(item.name),
        Department: item.department ?? pick(["SpecimenCollection", "Chemistry", "heamatology", "Cytology"]),
        sku: `SKU-${slugify(item.name).slice(0, 14).toUpperCase()}-${int(1000, 9999)}`,
        createdAt: dateBetween(new Date("2025-10-01"), new Date("2025-10-10")),
      },
    });

    map.set(item.name, {
      item,
      supplierId: suppliers[item.supplierName].supplierId,
      draftId: draft.id,
      promotedProductId: productId,
    });
  }

  return map;
}

function groupedBySupplier() {
  const grouped = new Map<string, CatalogItem[]>();

  for (const item of catalog) {
    const arr = grouped.get(item.supplierName) ?? [];
    arr.push(item);
    grouped.set(item.supplierName, arr);
  }

  return grouped;
}

async function seedQuarterProcurement(
  users: Record<string, { id: string }>,
  productMap: Map<string, ProductContext>
) {
  const grouped = groupedBySupplier();
  const mainUserId = users["hunter.admin@example.com"].id;
  const clerkId = users["alana.clerk@example.com"].id;

  const createdPOs: string[] = [];
  const createdInvoices: string[] = [];
  const createdGRNs: string[] = [];

  let poCounter = 1000;
  let invCounter = 4000;
  let grnCounter = 7000;

  for (const [supplierName, items] of grouped.entries()) {
    const chunks: CatalogItem[][] = [];
    const itemsCopy = [...items];

    if (items.length >= 6) {
      chunks.push(itemsCopy.splice(0, Math.ceil(items.length * 0.45)));
      chunks.push(itemsCopy.splice(0, Math.ceil(items.length * 0.35)));
      if (itemsCopy.length) chunks.push(itemsCopy);
    } else if (items.length >= 3) {
      chunks.push(itemsCopy.splice(0, Math.ceil(items.length / 2)));
      if (itemsCopy.length) chunks.push(itemsCopy);
    } else {
      chunks.push(itemsCopy);
    }

    const baseDate = dateBetween(
      new Date("2025-10-02T08:00:00.000Z"),
      new Date("2025-10-18T17:00:00.000Z")
    );

    for (let i = 0; i < chunks.length; i++) {
      const poDate = daysAfter(baseDate, i * int(18, 30), 10);
      const dueDate = daysAfter(poDate, int(7, 20), 12);
      const poId = createId();
      const poNumber = `PO-2025-${poCounter++}`;

      let poSubtotal = 0;

      const poItemsData: {
        poItemId: string;
        ctx: ProductContext;
        qty: number;
        unitPrice: number;
      }[] = [];

      for (const rawItem of chunks[i]) {
        const ctx = productMap.get(rawItem.name)!;
        const qty = rawItem.category === "Reagent" ? int(2, 12) : int(10, 80);
        const unitPrice = Number(
          ((rawItem.defaultPrice ?? int(10, 200)) * (1 + Math.random() * 0.08)).toFixed(2)
        );

        poSubtotal += qty * unitPrice;

        poItemsData.push({
          poItemId: createId(),
          ctx,
          qty,
          unitPrice,
        });
      }

      const poTax = poSubtotal * 0.125;
      const poTotal = poSubtotal + poTax;

      await prisma.purchaseOrder.create({
        data: {
          id: poId,
          poNumber,
          supplierId: poItemsData[0].ctx.supplierId,
          status: pick([
            POStatus.APPROVED,
            POStatus.SENT,
            POStatus.PARTIALLY_RECEIVED,
            POStatus.RECEIVED,
          ]),
          orderDate: poDate,
          dueDate,
          notes: i === 0 ? "Primary quarter replenishment order" : "Follow-up replenishment order",
          subtotal: money(poSubtotal),
          tax: money(poTax),
          total: money(poTotal),
          createdAt: poDate,
          updatedAt: dueDate,
          createdById: pick([mainUserId, clerkId]),
          items: {
            create: poItemsData.map((x) => ({
              id: x.poItemId,
              productId: x.ctx.draftId,
              promotedProductId: x.ctx.promotedProductId,
              description: `${x.ctx.item.pack} • supplier ${supplierName}`,
              unit: x.ctx.item.unit,
              quantity: x.qty,
              unitPrice: money(x.unitPrice),
              lineTotal: money(x.qty * x.unitPrice),
            })),
          },
        },
      });

      createdPOs.push(poId);

      const invoiceBatches = splitIntoInvoiceBatches(poItemsData);

      for (let batchIndex = 0; batchIndex < invoiceBatches.length; batchIndex++) {
        const invoiceLines = invoiceBatches[batchIndex];
        const invDate = daysAfter(poDate, int(5, 16) + batchIndex * int(6, 14), 11);

        const invSubtotal = Number(
          invoiceLines.reduce((sum, x) => sum + x.qty * x.unitPrice, 0).toFixed(2)
        );

        const invoiceId = createId();
        const invoiceNumber = `INV-2025-${invCounter++}`;

        const fullPay = Math.random() < 0.45;
        const partialPay = !fullPay && Math.random() < 0.45;

        let actualPaidAmount = 0;

        if (fullPay) {
          actualPaidAmount = invSubtotal;
        } else if (partialPay) {
          actualPaidAmount = Number(
            (invSubtotal * (0.35 + Math.random() * 0.4)).toFixed(2)
          );
        } else {
          actualPaidAmount = 0;
        }

        const balanceRemaining = Number((invSubtotal - actualPaidAmount).toFixed(2));

        const paymentSlices: number[] = [];
        if (actualPaidAmount > 0) {
          if (Math.random() < 0.55 || actualPaidAmount === invSubtotal) {
            paymentSlices.push(actualPaidAmount);
          } else {
            const first = Number(
              (actualPaidAmount * (0.4 + Math.random() * 0.3)).toFixed(2)
            );
            const second = Number((actualPaidAmount - first).toFixed(2));
            paymentSlices.push(first);
            if (second > 0.01) paymentSlices.push(second);
          }
        }

        const finalStatus =
          actualPaidAmount === 0
            ? pick([InvoiceStatus.PENDING, InvoiceStatus.READY_TO_PAY])
            : balanceRemaining <= 0
            ? InvoiceStatus.PAID
            : InvoiceStatus.PARTIALLY_PAID;

        const invoiceItemIds = invoiceLines.map(() => createId());

        const grnId = createId();
        const grnNumber = `GRN-2025-${grnCounter++}`;
        const grnDate = daysAfter(invDate, int(1, 7), 14);

        await prisma.supplierInvoice.create({
          data: {
            id: invoiceId,
            invoiceNumber,
            supplierId: invoiceLines[0].ctx.supplierId,
            poId,
            status: finalStatus,
            date: invDate,
            dueDate: daysAfter(invDate, int(14, 30), 12),
            amount: money(invSubtotal),
            balanceRemaining: money(balanceRemaining),
            createdAt: invDate,
            updatedAt: actualPaidAmount > 0 ? daysAfter(invDate, int(3, 28), 15) : grnDate,
            items: {
              create: invoiceLines.map((x, idx) => ({
                id: invoiceItemIds[idx],
                draftProductId: x.ctx.draftId,
                poItemId: x.poItemId,
                productId: x.ctx.promotedProductId,
                description: `${x.ctx.item.name} • ${x.ctx.item.pack}`,
                uom: x.ctx.item.unit,
                quantity: x.qty,
                unitPrice: money(x.unitPrice),
                lineTotal: money(x.qty * x.unitPrice),
              })),
            },
          },
        });

        createdInvoices.push(invoiceId);

        await prisma.goodsReceipt.create({
          data: {
            id: grnId,
            grnNumber,
            poId,
            invoiceId,
            date: grnDate,
            status: GRNStatus.POSTED,
            createdAt: grnDate,
            updatedAt: daysAfter(grnDate, 0, 15),
          },
        });

        createdGRNs.push(grnId);

        for (let idx = 0; idx < invoiceLines.length; idx++) {
          const x = invoiceLines[idx];
          const receivedQty = receivedFromOrdered(x.qty);
          const grnItemId = createId();
          const lotNo =
            x.ctx.item.lotNumber ??
            `${slugify(x.ctx.item.name).slice(0, 6).toUpperCase()}-${int(10000, 99999)}`;
          const expiryDate = x.ctx.item.expiryDate
            ? new Date(x.ctx.item.expiryDate)
            : maybe(
                dateBetween(
                  new Date("2026-03-01T10:00:00.000Z"),
                  new Date("2027-11-30T10:00:00.000Z")
                ),
                0.65
              );

          await prisma.goodsReceiptItem.create({
            data: {
              id: grnItemId,
              grnId,
              invoiceItemId: invoiceItemIds[idx],
              poItemId: x.poItemId,
              productDraftId: x.ctx.draftId,
              productId: x.ctx.promotedProductId,
              unit: x.ctx.item.unit,
              receivedQty,
              unitPrice: money(x.unitPrice),
              lotNumber: lotNo,
              expiryDate,
            },
          });

          const inventoryId = createId();

          await prisma.inventory.create({
            data: {
              id: inventoryId,
              productId: x.ctx.promotedProductId,
              supplierId: x.ctx.supplierId,
              grnItemId,
              stockQuantity: receivedQty,
              minQuantity: x.ctx.item.minQuantity ?? int(2, 8),
              reorderPoint: x.ctx.item.reorderPoint ?? int(8, 20),
              lastCountedAt: maybe(daysAfter(grnDate, int(5, 30), 13), 0.55),
              lotNumber: lotNo,
              expiryDate,
              createdAt: grnDate,
              updatedAt: grnDate,
            },
          });

          const ledgerId = createId();

          await prisma.stockLedger.create({
            data: {
              id: ledgerId,
              productId: x.ctx.promotedProductId,
              sourceType: "GRN",
              SourceId: grnId,
              qtyChange: receivedQty,
              memo: `Inventory added from ${grnNumber}`,
              createdAt: grnDate,
              userId: pick([mainUserId, clerkId]),
            },
          });

          await prisma.stockLedgerAllocation.create({
            data: {
              id: createId(),
              ledgerId,
              inventoryId,
              qtyAllocated: receivedQty,
              createdAt: grnDate,
            },
          });

          const current = await prisma.products.findUnique({
            where: { productId: x.ctx.promotedProductId },
            select: { stockQuantity: true },
          });

          await prisma.products.update({
            where: { productId: x.ctx.promotedProductId },
            data: {
              stockQuantity: (current?.stockQuantity ?? 0) + receivedQty,
              supplier: x.ctx.item.supplierName,
              updatedAt: grnDate,
            },
          });
        }

        await prisma.threeWayMatch.create({
          data: {
            id: createId(),
            poId,
            invoiceId,
            grnId,
            status: balanceRemaining === 0 ? MatchStatus.PAID : MatchStatus.READY_TO_PAY,
            payableTotal: money(invSubtotal),
            currency: "XCD",
            createdAt: grnDate,
            updatedAt: grnDate,
            lines: {
              create: invoiceLines.map((x, idx) => ({
                id: createId(),
                poItemId: x.poItemId,
                invoiceItemId: invoiceItemIds[idx],
                grnLineId: undefined,
                name: x.ctx.item.name,
                unit: x.ctx.item.unit,
                poQty: x.qty,
                grnQty: x.qty,
                invUnitPrice: money(x.unitPrice),
                payableQty: x.qty,
                payableAmount: money(x.qty * x.unitPrice),
                notes: "Matched against posted GRN",
              })),
            },
          },
        });

        if (paymentSlices.length > 0) {
          for (let p = 0; p < paymentSlices.length; p++) {
            const isOnlyPayment = paymentSlices.length === 1;
            const isFinalPayment = p === paymentSlices.length - 1;

            await prisma.invoicePayment.create({
              data: {
                id: createId(),
                invoiceId,
                poId,
                amount: money(paymentSlices[p]),
                currency: "XCD",
                paidAt: daysAfter(invDate, int(3 + p * 7, 12 + p * 10), 15),
                method: pick(["wire", "cheque", "bank transfer"]),
                reference: `PAY-${createId().slice(0, 8).toUpperCase()}`,
                status:
                  balanceRemaining > 0 && !isFinalPayment && !isOnlyPayment
                    ? PaymentStatus.PARTIALLY_PAID
                    : balanceRemaining > 0 && isOnlyPayment
                    ? PaymentStatus.PARTIALLY_PAID
                    : PaymentStatus.POSTED,
                createdAt: daysAfter(invDate, int(3 + p * 7, 12 + p * 10), 15),
                updatedAt: daysAfter(invDate, int(3 + p * 7, 12 + p * 10), 15),
              },
            });
          }
        }
      }
    }
  }

  return { createdPOs, createdInvoices, createdGRNs };
}

async function seedExpenses() {
  const categories = [
    "Utilities",
    "Supplies",
    "Repairs",
    "Transport",
    "Internet",
    "Rent",
    "Maintenance",
    "Payroll Support",
    "Equipment Service",
    "Cleaning",
  ];

  const groups = ["Operations", "Admin", "Branch Support", "Facility"];
  const descriptions = [
    "Courier and branch transfer support",
    "Generator service and inspection",
    "Monthly internet and systems cost",
    "Minor building maintenance",
    "Cleaning and sanitation supplies",
    "Power and utilities charge",
    "Equipment servicing and calibration",
    "Branch support operating cost",
    "Rent and facility support",
  ];

  const dates: Date[] = [];
  for (let month = 9; month <= 11; month++) {
    for (let i = 0; i < 14; i++) {
      dates.push(
        dateBetween(
          new Date(Date.UTC(2025, month, 1)),
          new Date(Date.UTC(2025, month + 1, 0, 23, 59, 59))
        )
      );
    }
  }

  for (const d of dates) {
    const status = pick([
      ExpenseStatus.PAID,
      ExpenseStatus.PAID,
      ExpenseStatus.PAID,
      ExpenseStatus.APPROVED,
      ExpenseStatus.PENDING,
    ]);

    await prisma.expenses.create({
      data: {
        expenseId: crypto.randomUUID(),
        category: pick(categories),
        amount: Number((Math.random() * 6500 + 350).toFixed(2)),
        date: d,
        group: pick(groups),
        description: pick(descriptions),
        status,
        notes:
          status === ExpenseStatus.PAID
            ? "Processed in quarter close"
            : "Awaiting final approval",
        createdAt: d,
        updatedAt: daysAfter(d, int(0, 4)),
      },
    });
  }
}

async function seedSalesAndAudit(users: Record<string, { id: string }>) {
  const start = new Date("2025-10-01T00:00:00.000Z");
  const end = new Date("2025-12-31T00:00:00.000Z");

  const enteredByIds = Object.values(users).map((u) => u.id);

  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    for (const branch of BRANCHES) {
      const total = salesTotalForBranch(branch);
      const { cash, credit, debit, cheque } = splitTender(total);

      const hundredsCount = Math.floor((cash / 100) * 0.26);
      const fiftiesCount = Math.floor((cash / 50) * 0.2);
      const twentiesCount = Math.floor((cash / 20) * 0.23);
      const tensCount = Math.floor((cash / 10) * 0.17);
      const fivesCount = Math.floor((cash / 5) * 0.14);

      const salesDate = new Date(
        Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0)
      );

      const sale = await prisma.sale.create({
        data: {
          locationId: branch.id,
          salesDate,
          hundredsCount,
          fiftiesCount,
          twentiesCount,
          tensCount,
          fivesCount,
          cashTotal: money(cash),
          grandTotal: money(total),
          creditCardTotal: money(credit),
          debitCardTotal: money(debit),
          chequeTotal: money(cheque),
          notes: Math.random() < 0.08 ? "Adjusted after reconciliation" : "Daily close completed",
          enteredBy: pick(enteredByIds),
          createdAt: salesDate,
          updatedAt: daysAfter(salesDate, 0, 18),
        },
      });

      const changedBy = pick(enteredByIds);

      await prisma.salesAuditLog.create({
        data: {
          salesId: sale.id,
          action: "Created",
          columnName: "grandTotal",
          oldValue: "0.00",
          changedBy,
          changedAt: salesDate,
        },
      });

      if (Math.random() < 0.14) {
        await prisma.salesAuditLog.create({
          data: {
            salesId: sale.id,
            action: "Updated",
            columnName: pick(["cashTotal", "debitCardTotal", "creditCardTotal", "notes"]),
            oldValue: "Initial entry adjusted during reconciliation",
            changedBy,
            changedAt: daysAfter(salesDate, 0, 17),
          },
        });
      }
    }
  }
}

async function seedStockRequests(users: Record<string, { id: string }>) {
  const products = await prisma.products.findMany({
    select: { productId: true, name: true, stockQuantity: true },
    orderBy: { updatedAt: "desc" },
  });

  const tapionUserId = users["alana.clerk@example.com"].id;
  const reviewers = [users["hunter.admin@example.com"].id, users["shan.wells@example.com"].id];

  const requesterOptions = [
    {
      userId: users["alana.clerk@example.com"].id,
      name: "Alana Clerk",
      email: "alana.clerk@example.com",
      location: Location.Tapion,
    },
    {
      userId: users["keri.joseph@example.com"].id,
      name: "Keri Joseph",
      email: "keri.joseph@example.com",
      location: Location.vieuxFort,
    },
    {
      userId: users["mika.charles@example.com"].id,
      name: "Mika Charles",
      email: "mika.charles@example.com",
      location: Location.rodneyBay,
    },
    {
      userId: users["anya.samuel@example.com"].id,
      name: "Anya Samuel",
      email: "anya.samuel@example.com",
      location: Location.blueCoral,
    },
    {
      userId: users["jared.tobierre@example.com"].id,
      name: "Jared Tobierre",
      email: "jared.tobierre@example.com",
      location: Location.sunnyAcres,
    },
    {
      userId: users["nadia.felix@example.com"].id,
      name: "Nadia Felix",
      email: "nadia.felix@example.com",
      location: Location.manoelStreet,
    },
    {
      userId: users["rina.francis@example.com"].id,
      name: "Rina Francis",
      email: "rina.francis@example.com",
      location: Location.memberCare,
    },
    {
      userId: users["joel.edward@example.com"].id,
      name: "Joel Edward",
      email: "joel.edward@example.com",
      location: Location.emCare,
    },
    {
      userId: users["hunter.admin@example.com"].id,
      name: "Hunter Admin",
      email: "hunter.admin@example.com",
      location: Location.soufriere,
    },
  ];

  const likelyBranchItems = products.filter((p) =>
    /gloves|needle|bandage|tourniquet|alcohol|vacuette|lancet/i.test(p.name)
  );

  for (let i = 0; i < 48; i++) {
    const requester = weightedRequester(requesterOptions);
    const submittedAt = dateBetween(
      new Date("2025-10-05T10:00:00.000Z"),
      new Date("2025-12-28T16:00:00.000Z")
    );

    const status = pick([
      StockRequestStatus.FULFILLED,
      StockRequestStatus.FULFILLED,
      StockRequestStatus.FULFILLED,
      StockRequestStatus.IN_REVIEW,
      StockRequestStatus.SUBMITTED,
    ]);

    const lineCount = int(2, 6);
    const lines = Array.from({ length: lineCount }, () => pick(likelyBranchItems));

    const request = await prisma.stockRequest.create({
      data: {
        id: createId(),
        status,
        requestedByName: requester.name,
        requestedByEmail: requester.email,
        requestedByLocation: requester.location,
        requestedByUserId: requester.userId,
        reviewedByUserId:
          status === StockRequestStatus.SUBMITTED ? undefined : pick(reviewers),
        expectedDeliveryAt:
          status === StockRequestStatus.FULFILLED
            ? daysAfter(submittedAt, int(1, 4), 14)
            : maybe(daysAfter(submittedAt, int(3, 7), 14), 0.55),
        messageToRequester:
          status === StockRequestStatus.FULFILLED
            ? "Prepared by Tapion stock room"
            : "Pending branch confirmation",
        submittedAt,
        updatedAt: daysAfter(submittedAt, int(0, 4), 15),
        lines: {
          create: lines.map((p) => {
            const requestedQty = int(2, 12);
            let grantedQty: number | undefined = undefined;

            if (status === StockRequestStatus.FULFILLED) {
              grantedQty = Math.max(1, requestedQty - int(0, 3));
            }

            return {
              id: createId(),
              productId: p.productId,
              qtyOnHandAtRequest: p.stockQuantity,
              requestedQty,
              grantedQty,
              outcome:
                status === StockRequestStatus.FULFILLED
                  ? grantedQty && grantedQty < requestedQty
                    ? StockLineOutcome.ADJUSTED
                    : StockLineOutcome.GRANTED
                  : StockLineOutcome.PENDING,
              notes:
                status === StockRequestStatus.FULFILLED
                  ? "Released from Tapion store"
                  : "Awaiting issue",
            };
          }),
        },
      },
    });

    if (request.status === StockRequestStatus.FULFILLED) {
      const requestLines = await prisma.stockRequestLine.findMany({
        where: { stockRequestId: request.id },
      });

      for (const line of requestLines) {
        if (!line.grantedQty || line.grantedQty <= 0) continue;

        await prisma.stockLedger.create({
          data: {
            id: createId(),
            productId: line.productId,
            sourceType: "ADJUSTMENT",
            SourceId: request.id,
            qtyChange: -line.grantedQty,
            memo: `Stock transfer to ${request.requestedByLocation}`,
            createdAt: request.updatedAt,
            userId: tapionUserId,
          },
        });

        const current = await prisma.products.findUnique({
          where: { productId: line.productId },
          select: { stockQuantity: true },
        });

        await prisma.products.update({
          where: { productId: line.productId },
          data: {
            stockQuantity: Math.max(0, (current?.stockQuantity ?? 0) - line.grantedQty),
          },
        });
      }
    }
  }
}

async function main() {
  console.log("Resetting database...");
  await resetDb();

  console.log("Seeding users...");
  const users = await seedUsers();

  console.log("Seeding suppliers...");
  const suppliers = await seedSuppliers();

  console.log("Seeding draft + promoted products...");
  const productMap = await seedDraftProductsAndPromotedProducts(suppliers);

  console.log("Seeding quarter procurement flow...");
  await seedQuarterProcurement(users, productMap);

  console.log("Seeding expenses...");
  await seedExpenses();

  console.log("Seeding daily sales + audit...");
  await seedSalesAndAudit(users);

  console.log("Seeding stock requests...");
  await seedStockRequests(users);

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });