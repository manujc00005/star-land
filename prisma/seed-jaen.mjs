/**
 * Seed de datos de prueba — Provincia de Jaén
 * Organización: JOU SL  (cmnujsguw0000tqpcz7lmm0py)
 * Usuario:      mrjou@gmail.com
 *
 * Ejecutar con:  node prisma/seed-jaen.mjs
 *
 * Qué crea:
 *  - Limpia el proyecto de prueba previo
 *  - 5 proyectos de energía renovable en Jaén con polígono GeoJSON
 *  - 14 propietarios con NIFs reales y dirección en municipios de Jaén
 *  - 30 parcelas catastrales (ref. provincia 23) con polígono GeoJSON
 *  - 18 contactos de parcela (API, agricultor, gestor…)
 *  - 22 contratos (mezcla RENTAL/PURCHASE, DRAFT/ACTIVE/EXPIRED)
 *  - 42 relaciones Proyecto↔Parcela con todos los estados de negociación
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();

const ORG        = process.env.SEED_ORG_ID    || "cmmvuvo3e0000wkhoir7u52ab";
const USER_EMAIL = process.env.SEED_USER_EMAIL || "mrjou@gmail.com";
const USER_NAME  = process.env.SEED_USER_NAME  || "Manuel Jou";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Crea un polígono GeoJSON rectangular dado centro (lng, lat) y deltas */
function rect(cLng, cLat, dLng, dLat) {
  const w = cLng - dLng / 2;
  const e = cLng + dLng / 2;
  const s = cLat - dLat / 2;
  const n = cLat + dLat / 2;
  return {
    type: "Polygon",
    coordinates: [[[w, s], [e, s], [e, n], [w, n], [w, s]]],
  };
}

/** Superficie aproximada en ha de un rectángulo en grados (latitud ~38°) */
function surfaceHa(dLng, dLat) {
  // 1° lat ≈ 111km, 1° lng a lat 38° ≈ 87.5km
  return +(dLng * 87500 * dLat * 111000 / 10000).toFixed(2);
}

// ─── PROYECTOS ────────────────────────────────────────────────────────────────
const PROJECTS = [
  {
    name: "PS Andújar Norte",
    technologies: [{ type: "Fotovoltaica", powerMW: 75 }],
    powerMW: 75,
    status: "IN_DEVELOPMENT",
    connectionPoints: ["SET Andújar 220 kV"],
    cluster: "Guadalquivir Norte",
    developer: "Solaria Energía",
    spv: "Andújar Solar Norte SL",
    // ~12 km² al norte de Andújar, junto al Guadalquivir
    geometry: rect(-4.062, 38.085, 0.07, 0.055),
  },
  {
    name: "PE Sierra Morena I",
    technologies: [{ type: "Eólico", powerMW: 50 }],
    powerMW: 50,
    status: "OPPORTUNITY",
    connectionPoints: ["SET La Carolina 132 kV"],
    cluster: "Sierra Morena",
    developer: "Iberdrola Renovables",
    spv: null,
    // Loma de los Escalones, La Carolina
    geometry: rect(-3.622, 38.295, 0.06, 0.05),
  },
  {
    name: "PS Baeza Solar",
    technologies: [
      { type: "Fotovoltaica", powerMW: 100 },
      { type: "Almacenamiento (BESS)", powerMW: 50 },
    ],
    powerMW: 150,
    status: "RTB",
    connectionPoints: ["SET Baeza 220 kV", "SET Úbeda 132 kV"],
    cluster: "Campiña Este",
    developer: "X-Elio",
    spv: "Baeza Renovables SPV SL",
    // Llanura al oeste de Baeza
    geometry: rect(-3.505, 37.975, 0.065, 0.05),
  },
  {
    name: "PS Martos I",
    technologies: [{ type: "Fotovoltaica", powerMW: 40 }],
    powerMW: 40,
    status: "IN_CONSTRUCTION",
    connectionPoints: ["SET Martos 66 kV"],
    cluster: "Campiña Oeste",
    developer: "Endesa Green",
    spv: "Martos Solar SL",
    // Llano entre Martos y Torredonjimeno
    geometry: rect(-3.978, 37.715, 0.055, 0.04),
  },
  {
    name: "PS Úbeda Este",
    technologies: [{ type: "Fotovoltaica", powerMW: 60 }],
    powerMW: 60,
    status: "OPPORTUNITY",
    connectionPoints: ["SET Úbeda 132 kV"],
    cluster: "Campiña Este",
    developer: "Acciona Energía",
    spv: null,
    // Olivar reconvertido al este de Úbeda
    geometry: rect(-3.345, 38.010, 0.06, 0.045),
  },
];

// ─── PROPIETARIOS ─────────────────────────────────────────────────────────────
const OWNERS = [
  {
    name: "Francisco Ruiz Fernández",
    nif: "26054321T",
    address: "C/ Real 14, 23740 Andújar (Jaén)",
    phone: "953501234",
    email: "fruiz@gmail.com",
  },
  {
    name: "María Dolores López Jiménez",
    nif: "26123456W",
    address: "Av. Padre Velázquez 8, 23440 Baeza (Jaén)",
    phone: "953741122",
    email: "mdlopez@hotmail.com",
  },
  {
    name: "Antonio Moreno García",
    nif: "75432198S",
    address: "C/ Bernabé Soriano 3, 23003 Jaén",
    phone: "953220055",
    email: null,
  },
  {
    name: "Carmen Ibáñez Molina",
    nif: "26876543P",
    address: "C/ Nueva 21, 23600 Martos (Jaén)",
    phone: "953551001",
    email: "c.ibanez@yahoo.es",
  },
  {
    name: "José Manuel Torres Ortega",
    nif: "75987654L",
    address: "Pl. Vázquez Molina 2, 23400 Úbeda (Jaén)",
    phone: "953750200",
    email: "jmtorres@empresa.com",
  },
  {
    name: "Comunidad de Bienes Hermanos Palomares",
    nif: "E23456789",
    address: "C/ Cervantes 44, 23200 La Carolina (Jaén)",
    phone: "953660347",
    email: "palomares.cb@gmail.com",
  },
  {
    name: "Rosa María Valenzuela Ramos",
    nif: "26432187G",
    address: "Ctra. Córdoba km 2, 23740 Andújar (Jaén)",
    phone: "953502218",
    email: null,
  },
  {
    name: "Pedro Castillo Aguilera",
    nif: "75321654N",
    address: "Av. de Madrid 55, 23700 Linares (Jaén)",
    phone: "953696040",
    email: "p.castillo.aguilera@gmail.com",
  },
  {
    name: "Agropecuaria del Guadalquivir SL",
    nif: "B23123456",
    address: "Polígono Industrial La Vega, 23740 Andújar (Jaén)",
    phone: "953509900",
    email: "administracion@agrogdalquivir.es",
  },
  {
    name: "Juan Carlos Medina Espinosa",
    nif: "26987123D",
    address: "C/ Portería 9, 23440 Baeza (Jaén)",
    phone: "953748812",
    email: "jcmedina@outlook.com",
  },
  {
    name: "Herminia Cañete Villena",
    nif: "75654321K",
    address: "Camino Los Llanos s/n, 23600 Martos (Jaén)",
    phone: null,
    email: null,
  },
  {
    name: "Inversiones Rurales Jaén SA",
    nif: "A23789012",
    address: "C/ Roldán y Marín 7, 23003 Jaén",
    phone: "953240088",
    email: "irj@inversionesrurales.com",
  },
  {
    name: "Sebastián Quesada Navas",
    nif: "26543219R",
    address: "C/ Río Guadalquivir 12, 23740 Andújar (Jaén)",
    phone: "953507761",
    email: "s.quesada@gmail.com",
  },
  {
    name: "Francisca Aranda Collado",
    nif: "75891234M",
    address: "C/ Espíritu Santo 3, 23400 Úbeda (Jaén)",
    phone: "953752345",
    email: "faranda@hotmail.es",
  },
];

// ─── PARCELAS ─────────────────────────────────────────────────────────────────
// Ref. catastral rústica: PP + MMM + A + PPP + NNNNN  (14 chars)
//  PP  = 23 (Jaén)
//  MMM = código municipio
//  A   = siempre "A" para rústico
//  PPP = polígono (001-999)
//  NNNNN = parcela dentro del polígono
//
// Municipios usados:
//   004 = Andújar    009 = Baeza   020 = La Carolina
//   055 = Linares    063 = Martos  087 = Úbeda

const PARCELS = [
  // ── Andújar (23004) ── proyecto 0 (PS Andújar Norte)
  {
    cadastralRef: "23004A00900015",
    polygon: "Polígono 9 parcela 15",
    parcelNumber: "15",
    surface: surfaceHa(0.009, 0.007),
    municipality: "Andújar",
    landUse: "Labor Secano",
    geometry: rect(-4.035, 38.072, 0.009, 0.007),
  },
  {
    cadastralRef: "23004A00900027",
    polygon: "Polígono 9 parcela 27",
    parcelNumber: "27",
    surface: surfaceHa(0.011, 0.008),
    municipality: "Andújar",
    landUse: "Olivar",
    geometry: rect(-4.048, 38.078, 0.011, 0.008),
  },
  {
    cadastralRef: "23004A00900043",
    polygon: "Polígono 9 parcela 43",
    parcelNumber: "43",
    surface: surfaceHa(0.013, 0.009),
    municipality: "Andújar",
    landUse: "Olivar",
    geometry: rect(-4.058, 38.083, 0.013, 0.009),
  },
  {
    cadastralRef: "23004A01000008",
    polygon: "Polígono 10 parcela 8",
    parcelNumber: "8",
    surface: surfaceHa(0.007, 0.006),
    municipality: "Andújar",
    landUse: "Pastizal",
    geometry: rect(-4.068, 38.088, 0.007, 0.006),
  },
  {
    cadastralRef: "23004A01000019",
    polygon: "Polígono 10 parcela 19",
    parcelNumber: "19",
    surface: surfaceHa(0.015, 0.01),
    municipality: "Andújar",
    landUse: "Labor Secano",
    geometry: rect(-4.075, 38.093, 0.015, 0.010),
  },
  {
    cadastralRef: "23004A01000034",
    polygon: "Polígono 10 parcela 34",
    parcelNumber: "34",
    surface: surfaceHa(0.012, 0.009),
    municipality: "Andújar",
    landUse: "Monte Bajo",
    geometry: rect(-4.055, 38.091, 0.012, 0.009),
  },
  {
    cadastralRef: "23004A01100002",
    polygon: "Polígono 11 parcela 2",
    parcelNumber: "2",
    surface: surfaceHa(0.009, 0.007),
    municipality: "Andújar",
    landUse: "Labor Secano",
    geometry: rect(-4.043, 38.097, 0.009, 0.007),
  },
  {
    cadastralRef: "23004A01100056",
    polygon: "Polígono 11 parcela 56",
    parcelNumber: "56",
    surface: surfaceHa(0.018, 0.012),
    municipality: "Andújar",
    landUse: "Olivar",
    geometry: rect(-4.072, 38.079, 0.018, 0.012),
  },
  // ── La Carolina (23020) ── proyecto 1 (PE Sierra Morena I)
  {
    cadastralRef: "23020A00500011",
    polygon: "Polígono 5 parcela 11",
    parcelNumber: "11",
    surface: surfaceHa(0.01, 0.008),
    municipality: "La Carolina",
    landUse: "Monte Bajo",
    geometry: rect(-3.608, 38.285, 0.010, 0.008),
  },
  {
    cadastralRef: "23020A00500033",
    polygon: "Polígono 5 parcela 33",
    parcelNumber: "33",
    surface: surfaceHa(0.012, 0.009),
    municipality: "La Carolina",
    landUse: "Monte Bajo",
    geometry: rect(-3.622, 38.298, 0.012, 0.009),
  },
  {
    cadastralRef: "23020A00600007",
    polygon: "Polígono 6 parcela 7",
    parcelNumber: "7",
    surface: surfaceHa(0.008, 0.007),
    municipality: "La Carolina",
    landUse: "Pastizal",
    geometry: rect(-3.635, 38.305, 0.008, 0.007),
  },
  {
    cadastralRef: "23020A00600021",
    polygon: "Polígono 6 parcela 21",
    parcelNumber: "21",
    surface: surfaceHa(0.014, 0.011),
    municipality: "La Carolina",
    landUse: "Monte Bajo",
    geometry: rect(-3.618, 38.292, 0.014, 0.011),
  },
  {
    cadastralRef: "23020A00700048",
    polygon: "Polígono 7 parcela 48",
    parcelNumber: "48",
    surface: surfaceHa(0.011, 0.009),
    municipality: "La Carolina",
    landUse: "Labor Secano",
    geometry: rect(-3.628, 38.280, 0.011, 0.009),
  },
  {
    cadastralRef: "23020A00700063",
    polygon: "Polígono 7 parcela 63",
    parcelNumber: "63",
    surface: surfaceHa(0.009, 0.008),
    municipality: "La Carolina",
    landUse: "Olivar",
    geometry: rect(-3.640, 38.275, 0.009, 0.008),
  },
  // ── Baeza (23009) ── proyecto 2 (PS Baeza Solar)
  {
    cadastralRef: "23009A01400005",
    polygon: "Polígono 14 parcela 5",
    parcelNumber: "5",
    surface: surfaceHa(0.016, 0.012),
    municipality: "Baeza",
    landUse: "Labor Secano",
    geometry: rect(-3.495, 37.968, 0.016, 0.012),
  },
  {
    cadastralRef: "23009A01400018",
    polygon: "Polígono 14 parcela 18",
    parcelNumber: "18",
    surface: surfaceHa(0.014, 0.01),
    municipality: "Baeza",
    landUse: "Olivar",
    geometry: rect(-3.510, 37.975, 0.014, 0.010),
  },
  {
    cadastralRef: "23009A01500009",
    polygon: "Polígono 15 parcela 9",
    parcelNumber: "9",
    surface: surfaceHa(0.012, 0.009),
    municipality: "Baeza",
    landUse: "Labor Secano",
    geometry: rect(-3.520, 37.982, 0.012, 0.009),
  },
  {
    cadastralRef: "23009A01500031",
    polygon: "Polígono 15 parcela 31",
    parcelNumber: "31",
    surface: surfaceHa(0.013, 0.01),
    municipality: "Baeza",
    landUse: "Olivar",
    geometry: rect(-3.505, 37.990, 0.013, 0.010),
  },
  {
    cadastralRef: "23009A01600002",
    polygon: "Polígono 16 parcela 2",
    parcelNumber: "2",
    surface: surfaceHa(0.018, 0.013),
    municipality: "Baeza",
    landUse: "Labor Regadío",
    geometry: rect(-3.483, 37.978, 0.018, 0.013),
  },
  // ── Martos (23063) ── proyecto 3 (PS Martos I)
  {
    cadastralRef: "23063A00800014",
    polygon: "Polígono 8 parcela 14",
    parcelNumber: "14",
    surface: surfaceHa(0.013, 0.009),
    municipality: "Martos",
    landUse: "Olivar",
    geometry: rect(-3.972, 37.710, 0.013, 0.009),
  },
  {
    cadastralRef: "23063A00800029",
    polygon: "Polígono 8 parcela 29",
    parcelNumber: "29",
    surface: surfaceHa(0.011, 0.008),
    municipality: "Martos",
    landUse: "Labor Secano",
    geometry: rect(-3.985, 37.718, 0.011, 0.008),
  },
  {
    cadastralRef: "23063A00900003",
    polygon: "Polígono 9 parcela 3",
    parcelNumber: "3",
    surface: surfaceHa(0.01, 0.008),
    municipality: "Martos",
    landUse: "Olivar",
    geometry: rect(-3.978, 37.724, 0.010, 0.008),
  },
  {
    cadastralRef: "23063A00900037",
    polygon: "Polígono 9 parcela 37",
    parcelNumber: "37",
    surface: surfaceHa(0.015, 0.011),
    municipality: "Martos",
    landUse: "Labor Secano",
    geometry: rect(-3.965, 37.705, 0.015, 0.011),
  },
  // ── Úbeda (23087) ── proyecto 4 (PS Úbeda Este)
  {
    cadastralRef: "23087A01200006",
    polygon: "Polígono 12 parcela 6",
    parcelNumber: "6",
    surface: surfaceHa(0.014, 0.011),
    municipality: "Úbeda",
    landUse: "Olivar",
    geometry: rect(-3.338, 38.005, 0.014, 0.011),
  },
  {
    cadastralRef: "23087A01200022",
    polygon: "Polígono 12 parcela 22",
    parcelNumber: "22",
    surface: surfaceHa(0.012, 0.009),
    municipality: "Úbeda",
    landUse: "Labor Secano",
    geometry: rect(-3.352, 38.012, 0.012, 0.009),
  },
  {
    cadastralRef: "23087A01300004",
    polygon: "Polígono 13 parcela 4",
    parcelNumber: "4",
    surface: surfaceHa(0.016, 0.012),
    municipality: "Úbeda",
    landUse: "Olivar",
    geometry: rect(-3.360, 38.020, 0.016, 0.012),
  },
  {
    cadastralRef: "23087A01300018",
    polygon: "Polígono 13 parcela 18",
    parcelNumber: "18",
    surface: surfaceHa(0.01, 0.008),
    municipality: "Úbeda",
    landUse: "Frutales Secano",
    geometry: rect(-3.345, 38.018, 0.010, 0.008),
  },
  // ── Linares (23055) — sin proyecto asignado aún ──
  {
    cadastralRef: "23055A00300041",
    polygon: "Polígono 3 parcela 41",
    parcelNumber: "41",
    surface: surfaceHa(0.013, 0.01),
    municipality: "Linares",
    landUse: "Labor Secano",
    geometry: rect(-3.640, 38.092, 0.013, 0.010),
  },
  {
    cadastralRef: "23055A00300059",
    polygon: "Polígono 3 parcela 59",
    parcelNumber: "59",
    surface: surfaceHa(0.009, 0.007),
    municipality: "Linares",
    landUse: "Olivar",
    geometry: rect(-3.652, 38.100, 0.009, 0.007),
  },
  {
    cadastralRef: "23055A00400012",
    polygon: "Polígono 4 parcela 12",
    parcelNumber: "12",
    surface: surfaceHa(0.011, 0.009),
    municipality: "Linares",
    landUse: "Labor Secano",
    geometry: rect(-3.628, 38.085, 0.011, 0.009),
  },
];

// ─── MAIN ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱  Iniciando seed Jaén para JOU SL…\n");

  // 0. Organización y usuario (upsert — idempotente)
  console.log("🏢  Asegurando organización y usuario…");
  await prisma.organization.upsert({
    where: { id: ORG },
    update: { name: "JOU SL" },
    create: { id: ORG, name: "JOU SL" },
  });
  const passwordHash = await bcrypt.hash("test1234", 10);
  await prisma.user.upsert({
    where: { email: USER_EMAIL },
    update: {},
    create: {
      email: USER_EMAIL,
      passwordHash,
      name: USER_NAME,
      organizationId: ORG,
    },
  });
  console.log(`   ✓ Organización: JOU SL  |  Usuario: ${USER_EMAIL}  (pass: test1234)\n`);

  // 1. Limpiar datos existentes (excepto usuario y organización)
  console.log("🗑   Limpiando datos previos…");
  await prisma.parcelContact.deleteMany({ where: { organizationId: ORG } });
  await prisma.contractParcel.deleteMany({ where: { organizationId: ORG } });
  await prisma.contract.deleteMany({ where: { organizationId: ORG } });
  await prisma.projectParcel.deleteMany({ where: { organizationId: ORG } });
  await prisma.parcel.deleteMany({ where: { organizationId: ORG } });
  await prisma.owner.deleteMany({ where: { organizationId: ORG } });
  await prisma.project.deleteMany({ where: { organizationId: ORG } });
  console.log("   ✓ Datos anteriores eliminados\n");

  // 2. Proyectos
  console.log("📂  Creando proyectos…");
  const createdProjects = [];
  for (const p of PROJECTS) {
    const proj = await prisma.project.create({
      data: { ...p, organizationId: ORG },
    });
    createdProjects.push(proj);
    console.log(`   ✓ ${proj.name}  (${proj.status}  ${proj.powerMW ?? "?"}MW)`);
  }

  // 3. Propietarios
  console.log("\n👥  Creando propietarios…");
  const createdOwners = [];
  for (const o of OWNERS) {
    const owner = await prisma.owner.create({
      data: { ...o, organizationId: ORG },
    });
    createdOwners.push(owner);
    console.log(`   ✓ ${owner.name}  NIF: ${owner.nif}`);
  }

  // 4. Parcelas
  console.log("\n🗺   Creando parcelas…");
  const createdParcels = [];
  for (const p of PARCELS) {
    const parcel = await prisma.parcel.create({
      data: { ...p, organizationId: ORG },
    });
    createdParcels.push(parcel);
    console.log(`   ✓ ${parcel.cadastralRef}  ${parcel.municipality}  ${parcel.surface}ha`);
  }

  // Índices de acceso rápido por municipio
  const byMuni = (muni) => createdParcels.filter((p) => p.municipality === muni);
  const andujar   = byMuni("Andújar");     // 8
  const carolina  = byMuni("La Carolina"); // 6
  const baeza     = byMuni("Baeza");       // 5
  const martos    = byMuni("Martos");      // 4
  const ubeda     = byMuni("Úbeda");       // 4
  const linares   = byMuni("Linares");     // 3

  const [p0, p1, p2, p3, p4] = createdProjects; // PS Andújar Norte, PE Sierra Morena I, PS Baeza Solar, PS Martos I, PS Úbeda Este

  // 5. Contactos de parcela
  console.log("\n📞  Creando contactos de parcela…");
  const contactsData = [
    { parcel: andujar[0], name: "Francisco Ruiz Fernández",    role: "Propietario",        phone: "953501234", email: "fruiz@gmail.com",   notes: "Propietario directo, trato fácil" },
    { parcel: andujar[0], name: "Marta Ruiz López",            role: "Interlocutor familiar", phone: "629112233", email: null,             notes: "Hija del propietario, gestiona tema legal" },
    { parcel: andujar[2], name: "Agropecuaria del Guadalquivir SL", role: "Agricultor",     phone: "953509900", email: "administracion@agrogdalquivir.es", notes: "Arrendatario actual, contrato vence 2026" },
    { parcel: andujar[4], name: "Rosa Valenzuela Ramos",       role: "Propietario",         phone: "953502218", email: null,               notes: null },
    { parcel: andujar[6], name: "Sebastián Quesada Navas",     role: "Propietario",         phone: "953507761", email: "s.quesada@gmail.com", notes: "Muy interesado en arrendamiento largo plazo" },
    { parcel: carolina[0], name: "C.B. Hermanos Palomares",   role: "Propietario",          phone: "953660347", email: "palomares.cb@gmail.com", notes: "Comunidad de bienes, necesita acuerdo de todos los socios" },
    { parcel: carolina[1], name: "Pedro Castillo Aguilera",    role: "Propietario",          phone: "953696040", email: "p.castillo.aguilera@gmail.com", notes: null },
    { parcel: carolina[2], name: "Lucía Palomares García",     role: "Interlocutor familiar", phone: "657223344", email: null,             notes: "Socia minoritaria del CB" },
    { parcel: baeza[0], name: "María Dolores López Jiménez",   role: "Propietario",          phone: "953741122", email: "mdlopez@hotmail.com", notes: "Quiere cláusula de revisión cada 5 años" },
    { parcel: baeza[1], name: "Juan Carlos Medina Espinosa",   role: "Propietario",          phone: "953748812", email: "jcmedina@outlook.com", notes: null },
    { parcel: baeza[2], name: "Gestión Agrícola Bailén SL",    role: "Gestor/API",           phone: "953675500", email: "gestion@bailenagricola.es", notes: "Lleva la gestión de varias fincas en la zona" },
    { parcel: martos[0], name: "Carmen Ibáñez Molina",         role: "Propietario",          phone: "953551001", email: "c.ibanez@yahoo.es", notes: "Pendiente de herencia parcial" },
    { parcel: martos[2], name: "Herminia Cañete Villena",      role: "Propietario",          phone: null,         email: null,              notes: "Solo acepta contacto presencial" },
    { parcel: ubeda[0], name: "José Manuel Torres Ortega",     role: "Propietario",          phone: "953750200", email: "jmtorres@empresa.com", notes: null },
    { parcel: ubeda[1], name: "Francisca Aranda Collado",      role: "Propietario",          phone: "953752345", email: "faranda@hotmail.es", notes: "Precio mínimo: 250 €/ha/año" },
    { parcel: ubeda[2], name: "Inversiones Rurales Jaén SA",   role: "Propietario",          phone: "953240088", email: "irj@inversionesrurales.com", notes: "Empresa holding, trámite lento" },
    { parcel: linares[0], name: "Antonio Moreno García",       role: "Propietario",          phone: "953220055", email: null,               notes: "Interesado en venta (no arrendamiento)" },
    { parcel: linares[1], name: "Pedro Castillo Aguilera",     role: "Propietario",          phone: "953696040", email: "p.castillo.aguilera@gmail.com", notes: "Misma persona que CB Carolina" },
  ];

  for (const c of contactsData) {
    await prisma.parcelContact.create({
      data: {
        name: c.name,
        role: c.role,
        phone: c.phone ?? null,
        email: c.email ?? null,
        notes: c.notes ?? null,
        parcelId: c.parcel.id,
        organizationId: ORG,
      },
    });
    console.log(`   ✓ ${c.name}  (${c.role})  → ${c.parcel.cadastralRef}`);
  }

  // 6. Contratos
  console.log("\n📄  Creando contratos…");

  const contractsData = [
    // ── Andújar: mix de estados                                                       nextStep / nextStepDate solo en DRAFT
    { type: "RENTAL",   status: "ACTIVE",         price: 220,   signedAt: new Date("2023-06-15"), notes: "Arrendamiento 25 años con revisión IPC anual",                                  parcel: andujar[0],  owner: createdOwners[0]  }, // Francisco Ruiz      [0]
    { type: "RENTAL",   status: "DRAFT",           price: 195,   signedAt: null,                   nextStep: "Enviar borrador de contrato",                nextStepDate: new Date("2026-04-20"), parcel: andujar[1],  owner: createdOwners[6]  }, // Rosa Valenzuela     [1]
    { type: "RENTAL",   status: "SIGNED_ADDENDUM", price: 210,   signedAt: new Date("2024-02-01"), notes: "Adenda abr-2025: amplía a parcelas 010/008 y 011/002 contiguas",                parcel: andujar[2],  owner: createdOwners[8]  }, // Agropecuaria        [2]
    { type: "RENTAL",   status: "DRAFT",           price: 180,   signedAt: null,                   nextStep: "Primera visita a la parcela",                nextStepDate: new Date("2026-04-17"), parcel: andujar[3],  owner: createdOwners[12] }, // Sebastián Quesada   [3]
    { type: "PURCHASE", status: "DRAFT",           price: 28000, signedAt: null,                   nextStep: "Solicitar valoración notarial",               nextStepDate: new Date("2026-04-25"), parcel: andujar[7],  owner: createdOwners[11] }, // Inv. Rurales Jaén   [4]
    // ── La Carolina
    { type: "RENTAL",   status: "ACTIVE",          price: 150,   signedAt: new Date("2024-09-10"), notes: "CB — firmado por todos los socios. Adenda parcela 006/007 en tramitación",     parcel: carolina[0], owner: createdOwners[5]  }, // CB Palomares        [5]
    { type: "RENTAL",   status: "DRAFT",           price: 140,   signedAt: null,                   nextStep: "Segunda ronda de negociación de precio",     nextStepDate: new Date("2026-04-22"), parcel: carolina[1], owner: createdOwners[7]  }, // Pedro Castillo      [6]
    { type: "RENTAL",   status: "EXPIRED",         price: 130,   signedAt: new Date("2021-03-20"), notes: "Vencido mar-2024. Propietario contactado para renovación sin acuerdo",         parcel: carolina[3], owner: createdOwners[5]  }, // CB Palomares venció [7]
    // ── Baeza
    { type: "RENTAL",   status: "ACTIVE",          price: 240,   signedAt: new Date("2024-01-20"), notes: "Incluye cláusula de revisión cada 5 años solicitada por la propietaria",      parcel: baeza[0],    owner: createdOwners[1]  }, // Mª Dolores López    [8]
    { type: "RENTAL",   status: "ACTIVE",          price: 255,   signedAt: new Date("2023-11-05"), notes: "Parcela 015/031 incluida como contigua en adenda nov-2023",                   parcel: baeza[1],    owner: createdOwners[9]  }, // Juan Carlos Medina  [9]
    { type: "RENTAL",   status: "DRAFT",           price: 230,   signedAt: null,                   nextStep: "Reunión con gestora Bailén Agrícola",        nextStepDate: new Date("2026-04-18"), parcel: baeza[2],    owner: createdOwners[1]  },                       // [10]
    { type: "PURCHASE", status: "ACTIVE",          price: 42000, signedAt: new Date("2024-05-30"), notes: "Escriturado en notaría de Baeza. Inscrito en RPP.",                            parcel: baeza[4],    owner: createdOwners[9]  },                       // [11]
    // ── Martos
    { type: "RENTAL",   status: "ACTIVE",          price: 200,   signedAt: new Date("2024-03-15"), notes: "Pendiente resolución herencia parcial — titularidad compartida",               parcel: martos[0],   owner: createdOwners[3]  }, // Carmen Ibáñez       [12]
    { type: "RENTAL",   status: "DRAFT",           price: 185,   signedAt: null,                   nextStep: "Contactar propietaria para reunión presencial", nextStepDate: new Date("2026-04-21"), parcel: martos[1],   owner: createdOwners[10] }, // Herminia Cañete     [13]
    { type: "RENTAL",   status: "EXPIRED",         price: 170,   signedAt: new Date("2020-07-01"), notes: "Vencido jul-2024. Propietaria rechazó renovación.",                            parcel: martos[2],   owner: createdOwners[3]  },                       // [14]
    // ── Úbeda
    { type: "RENTAL",   status: "DRAFT",           price: 270,   signedAt: null,                   nextStep: "Enviar primera oferta formal por email",     nextStepDate: new Date("2026-04-16"), parcel: ubeda[0],    owner: createdOwners[4]  }, // José Manuel Torres  [15]
    { type: "RENTAL",   status: "DRAFT",           price: 265,   signedAt: null,                   nextStep: "Negociar precio (propietaria pide mín. 265 €/ha/año)", nextStepDate: new Date("2026-04-19"), parcel: ubeda[1],    owner: createdOwners[13] }, // Francisca Aranda    [16]
    { type: "PURCHASE", status: "DRAFT",           price: 55000, signedAt: null,                   nextStep: "Obtener valoración pericial independiente",  nextStepDate: new Date("2026-04-30"), parcel: ubeda[2],    owner: createdOwners[11] },                       // [17]
    // ── Linares (sin proyecto asignado)
    { type: "PURCHASE", status: "DRAFT",           price: 32000, signedAt: null,                   nextStep: "Preparar oferta de compra (propietario solo acepta venta)", nextStepDate: new Date("2026-04-23"), parcel: linares[0],  owner: createdOwners[2]  }, // Antonio Moreno      [18]
    { type: "RENTAL",   status: "DRAFT",           price: 160,   signedAt: null,                   nextStep: "Localizar contacto directo del propietario", nextStepDate: new Date("2026-04-28"), parcel: linares[1],  owner: createdOwners[7]  },                       // [19]
    { type: "RENTAL",   status: "ACTIVE",          price: 155,   signedAt: new Date("2023-08-01"), parcel: linares[2],  owner: createdOwners[2]  },                       // [20]
    { type: "RENTAL",   status: "EXPIRED",         price: 145,   signedAt: new Date("2019-04-12"), notes: "Expirado. Suplantado por contrato ACTIVE de ago-2023.",                       parcel: linares[2],  owner: createdOwners[7]  },                       // [21]
  ];

  const createdContracts = [];
  for (const c of contractsData) {
    const contract = await prisma.contract.create({
      data: {
        type: c.type,
        status: c.status,
        price: c.price,
        signedAt: c.signedAt,
        nextStep: c.nextStep ?? null,
        nextStepDate: c.nextStepDate ?? null,
        notes: c.notes ?? null,
        parcelId: c.parcel.id,
        ownerId: c.owner.id,
        organizationId: ORG,
      },
    });
    createdContracts.push(contract);
    const priceFmt = c.type === "PURCHASE"
      ? `${c.price.toLocaleString()}€`
      : `${c.price}€/ha/año`;
    console.log(`   ✓ [${c.type.padEnd(8)} / ${c.status.padEnd(15)}]  ${c.parcel.cadastralRef}  ${priceFmt}`);
  }

  // 7. ContractParcels — parcelas adicionales vinculadas a un contrato (M:N)
  console.log("\n📎  Vinculando parcelas adicionales a contratos…");
  // [2]  SIGNED_ADDENDUM Agropecuaria (andujar[2])  → también cubre andujar[3]
  // [5]  ACTIVE CB Palomares (carolina[0])           → también cubre carolina[2]
  // [11] PURCHASE ACTIVE Baeza (baeza[4])            → también cubre baeza[3]
  const cpData = [
    { contract: createdContracts[2],  parcel: andujar[3],  desc: "Adenda Agropecuaria (+010/008)"    },
    { contract: createdContracts[5],  parcel: carolina[2], desc: "CB Palomares (+006/007 contigua)"  },
    { contract: createdContracts[11], parcel: baeza[3],    desc: "Compraventa Baeza (+015/031)"      },
  ];
  for (const cp of cpData) {
    await prisma.contractParcel.create({
      data: {
        contractId: cp.contract.id,
        parcelId: cp.parcel.id,
        organizationId: ORG,
      },
    });
    console.log(`   ✓ [${cp.desc}]  ${cp.parcel.cadastralRef}`);
  }

  // 8. Relaciones Proyecto ↔ Parcela (ProjectParcel)
  console.log("\n🔗  Asignando parcelas a proyectos…");

  const ppData = [
    // ── PS Andújar Norte (p0) — 8 parcelas de Andújar
    { project: p0, parcel: andujar[0], negotiationStatus: "SIGNED",        affectation: "Plena", notes: "Contrato ACTIVE firmado jun 2023" },
    { project: p0, parcel: andujar[1], negotiationStatus: "NEGOTIATING",   affectation: "Plena", notes: "Oferta enviada el 10/03/2026" },
    { project: p0, parcel: andujar[2], negotiationStatus: "SIGNED",        affectation: "Plena", notes: "Contrato ACTIVE firmado feb 2024" },
    { project: p0, parcel: andujar[3], negotiationStatus: "SEARCHING",     affectation: "Parcial", notes: "Sin contacto aún" },
    { project: p0, parcel: andujar[4], negotiationStatus: "NEGOTIATING",   affectation: "Plena", notes: "Reunión pendiente semana del 14/04" },
    { project: p0, parcel: andujar[5], negotiationStatus: "NOT_NEGOTIATING", affectation: "Plena", notes: "Propietario no interesado (uso agrícola preferente)" },
    { project: p0, parcel: andujar[6], negotiationStatus: "ACCEPTED",      affectation: "Plena", notes: "Acuerdo verbal. Pendiente firma" },
    { project: p0, parcel: andujar[7], negotiationStatus: "COMPETITION",   affectation: "Plena", notes: "Acciona también ha contactado al propietario" },

    // ── PE Sierra Morena I (p1) — 6 parcelas de La Carolina
    { project: p1, parcel: carolina[0], negotiationStatus: "SIGNED",       affectation: "Plena", notes: "Contrato ACTIVE firmado sep 2024" },
    { project: p1, parcel: carolina[1], negotiationStatus: "NEGOTIATING",  affectation: "Plena", notes: "Segunda ronda de negociación" },
    { project: p1, parcel: carolina[2], negotiationStatus: "SEARCHING",    affectation: "Parcial", notes: null },
    { project: p1, parcel: carolina[3], negotiationStatus: "TERMINATED",   affectation: "Plena", notes: "Propietario vendió la finca a tercero" },
    { project: p1, parcel: carolina[4], negotiationStatus: "NEGOTIATING",  affectation: "Plena", notes: "Oferta enviada, esperando respuesta" },
    { project: p1, parcel: carolina[5], negotiationStatus: "DUPLICATE",    affectation: "Parcial", notes: "Cubierta ya por parcela 23020A00500011" },

    // ── PS Baeza Solar (p2) — 5 parcelas de Baeza
    { project: p2, parcel: baeza[0], negotiationStatus: "SIGNED",          affectation: "Plena", notes: "Contrato arrendamiento ACTIVE" },
    { project: p2, parcel: baeza[1], negotiationStatus: "SIGNED",          affectation: "Plena", notes: "Contrato arrendamiento ACTIVE" },
    { project: p2, parcel: baeza[2], negotiationStatus: "ACCEPTED",        affectation: "Plena", notes: "Pendiente notaría" },
    { project: p2, parcel: baeza[3], negotiationStatus: "NEGOTIATING",     affectation: "Parcial", notes: "Propietario quiere condición suspensiva AAP" },
    { project: p2, parcel: baeza[4], negotiationStatus: "SIGNED",          affectation: "Plena", notes: "Compraventa ACTIVE firmada mayo 2024" },

    // ── PS Martos I (p3) — 4 parcelas Martos
    { project: p3, parcel: martos[0], negotiationStatus: "SIGNED",         affectation: "Plena", notes: "Contrato ACTIVE firmado mar 2024" },
    { project: p3, parcel: martos[1], negotiationStatus: "NEGOTIATING",    affectation: "Plena", notes: "Propietaria pide revisión cada 3 años" },
    { project: p3, parcel: martos[2], negotiationStatus: "NOT_NEGOTIATING", affectation: "Plena", notes: "Contrato expirado, rehúsa renovar" },
    { project: p3, parcel: martos[3], negotiationStatus: "SEARCHING",      affectation: "Parcial", notes: null },

    // ── PS Úbeda Este (p4) — 4 parcelas Úbeda
    { project: p4, parcel: ubeda[0], negotiationStatus: "NEGOTIATING",     affectation: "Plena", notes: "Primera oferta enviada 01/04/2026" },
    { project: p4, parcel: ubeda[1], negotiationStatus: "NEGOTIATING",     affectation: "Plena", notes: "Precio: propietaria pide 265 €/ha/año" },
    { project: p4, parcel: ubeda[2], negotiationStatus: "SEARCHING",       affectation: "Plena", notes: "Sociedad holding, trámites lentos" },
    { project: p4, parcel: ubeda[3], negotiationStatus: "SEARCHING",       affectation: "Parcial", notes: null },

    // ── Parcelas de Linares también en PS Andújar Norte (expansión futura)
    { project: p0, parcel: linares[0], negotiationStatus: "NEGOTIATING",   affectation: "Parcial", notes: "Propietario interesado solo en venta" },
    { project: p0, parcel: linares[1], negotiationStatus: "SEARCHING",     affectation: "Parcial", notes: null },
  ];

  for (const pp of ppData) {
    await prisma.projectParcel.create({
      data: {
        projectId: pp.project.id,
        parcelId: pp.parcel.id,
        affectation: pp.affectation,
        notes: pp.notes ?? null,
        negotiationStatus: pp.negotiationStatus,
        organizationId: ORG,
      },
    });
    console.log(`   ✓ [${pp.negotiationStatus.padEnd(15)}]  ${pp.project.name.padEnd(22)}  ←→  ${pp.parcel.cadastralRef}`);
  }

  // ── Resumen final
  console.log("\n✅  Seed completado:\n");
  const counts = await Promise.all([
    prisma.project.count({ where: { organizationId: ORG } }),
    prisma.parcel.count({ where: { organizationId: ORG } }),
    prisma.owner.count({ where: { organizationId: ORG } }),
    prisma.contract.count({ where: { organizationId: ORG } }),
    prisma.projectParcel.count({ where: { organizationId: ORG } }),
    prisma.parcelContact.count({ where: { organizationId: ORG } }),
    prisma.contractParcel.count({ where: { organizationId: ORG } }),
  ]);
  console.log(`   Proyectos:         ${counts[0]}`);
  console.log(`   Parcelas:          ${counts[1]}`);
  console.log(`   Propietarios:      ${counts[2]}`);
  console.log(`   Contratos:         ${counts[3]}`);
  console.log(`   Parcelas/Proyecto: ${counts[4]}`);
  console.log(`   Contactos:         ${counts[5]}`);
  console.log(`   ContractParcels:   ${counts[6]}`);
  console.log("");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
