export const STATE_MAP: Record<string, string> = {
  acre: 'AC',
  alagoas: 'AL',
  amapá: 'AP',
  amazonas: 'AM',
  bahia: 'BA',
  ceará: 'CE',
  'distrito federal': 'DF',
  'espírito santo': 'ES',
  goiás: 'GO',
  maranhão: 'MA',
  'mato grosso': 'MT',
  'mato grosso do sul': 'MS',
  'minas gerais': 'MG',
  pará: 'PA',
  paraíba: 'PB',
  paraná: 'PR',
  pernambuco: 'PE',
  piauí: 'PI',
  'rio de janeiro': 'RJ',
  'rio grande do norte': 'RN',
  'rio grande do sul': 'RS',
  rondônia: 'RO',
  oraima: 'RR',
  'santa catarina': 'SC',
  'são paulo': 'SP',
  sergipe: 'SE',
  tocantins: 'TO',
};

export interface ParsedLocation {
  city: string;
  state: string | null;
}

export function parseLocation(raw: string): ParsedLocation {
  if (!raw) return { city: '', state: null };

  const cleanRaw = raw.trim();

  // Pattern: "City - UF" or "City/UF" (e.g., "João Pessoa - PB", "Recife/PE")
  // UF is 2 uppercase letters
  const ufRegex = /^(.*?)\s*[-/]\s*([A-Z]{2})$/;
  const match = cleanRaw.match(ufRegex);

  if (match) {
    return {
      city: match[1].trim(),
      state: match[2].toUpperCase(),
    };
  }

  // Pattern: "City - State Name" (e.g., "Natal - Rio Grande do Norte")
  const stateNameRegex = /^(.*?)\s*[-/]\s*(.+)$/;
  const nameMatch = cleanRaw.match(stateNameRegex);

  if (nameMatch) {
    const potentialState = nameMatch[2].trim().toLowerCase();
    const uf = STATE_MAP[potentialState];
    if (uf) {
      return {
        city: nameMatch[1].trim(),
        state: uf,
      };
    }
  }

  // Fallback: return raw as city, null state
  return {
    city: cleanRaw,
    state: null,
  };
}
