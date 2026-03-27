export interface ParsedVoiceTransaction {
  partyName?: string;
  partyId?: string;
  serviceName?: string;
  serviceId?: string;
  hours?: number;
  minutes?: number;
  amount?: number;
  confidence: "high" | "low";
}

interface Party {
  id: bigint;
  name: string;
  phone?: string;
}

interface Service {
  name: string;
  perHour?: number;
  perMinute?: number;
}

const GUJARATI_NUMBERS: Record<string, number> = {
  ek: 1,
  be: 2,
  tran: 3,
  char: 4,
  panch: 5,
  cha: 6,
  saat: 7,
  aath: 8,
  nav: 9,
  das: 10,
  // Gujarati words
  એક: 1,
  બે: 2,
  ત્રણ: 3,
  ચાર: 4,
  પાંચ: 5,
  છ: 6,
  સાત: 7,
  આઠ: 8,
  નવ: 9,
  દસ: 10,
};

function parseNumber(word: string): number | null {
  const trimmed = word.trim().toLowerCase();
  // Direct numeric
  const num = Number(trimmed);
  if (!Number.isNaN(num) && num >= 0) return num;
  // Word-based
  return GUJARATI_NUMBERS[trimmed] ?? null;
}

function fuzzyMatch(input: string, candidates: string[]): string | null {
  const lower = input.toLowerCase();
  // Exact match
  const exact = candidates.find((c) => c.toLowerCase() === lower);
  if (exact) return exact;
  // Contains match
  const contains = candidates.find(
    (c) => c.toLowerCase().includes(lower) || lower.includes(c.toLowerCase()),
  );
  if (contains) return contains;
  // Partial word match
  const words = lower.split(/\s+/);
  const partial = candidates.find((c) => {
    const cl = c.toLowerCase();
    return words.some((w) => w.length >= 3 && cl.includes(w));
  });
  return partial ?? null;
}

export function parseVoiceTransaction(
  transcript: string,
  parties: Party[],
  services: Service[],
): ParsedVoiceTransaction {
  const result: ParsedVoiceTransaction = { confidence: "low" };
  let text = transcript.trim();

  // ---- Extract hours ----
  // Gujarati: N કલાક, N kalak
  // Hindi/mixed: N ghante, N ghanta
  // English: N hours, N hour
  const hoursPatterns = [
    /([\d]+|[a-zA-Z\u0A80-\u0AFF]+)\s*(?:કલાક|kalak|ghante|ghanta|hours?)/gi,
  ];
  for (const pat of hoursPatterns) {
    const match = pat.exec(text);
    if (match) {
      const parsed = parseNumber(match[1]);
      if (parsed !== null) {
        result.hours = parsed;
        text = text.replace(match[0], " ").trim();
      }
    }
  }

  // ---- Extract minutes ----
  // Gujarati: N મિનિટ, N minute
  // English: N minutes
  const minutesPatterns = [
    /([\d]+|[a-zA-Z\u0A80-\u0AFF]+)\s*(?:મિનિટ|minute|minutes)/gi,
  ];
  for (const pat of minutesPatterns) {
    const match = pat.exec(text);
    if (match) {
      const parsed = parseNumber(match[1]);
      if (parsed !== null) {
        result.minutes = parsed;
        text = text.replace(match[0], " ").trim();
      }
    }
  }

  // ---- Match service ----
  const serviceNames = services.map((s) => s.name);
  const matchedSvc = fuzzyMatch(text, serviceNames);
  if (matchedSvc) {
    result.serviceName = matchedSvc;
    const svcObj = services.find((s) => s.name === matchedSvc);
    if (svcObj) {
      // Remove matched service from text so party detection is cleaner
      const svcIdx = text.toLowerCase().indexOf(matchedSvc.toLowerCase());
      if (svcIdx !== -1) {
        text = text.slice(0, svcIdx) + text.slice(svcIdx + matchedSvc.length);
        text = text.trim();
      }
    }

    // Calculate amount if we have hours/minutes and rates
    const svcObj2 = services.find((s) => s.name === matchedSvc);
    if (svcObj2) {
      const hrs = result.hours ?? 0;
      const mins = result.minutes ?? 0;
      const perHour = svcObj2.perHour ?? 0;
      const perMinute = svcObj2.perMinute ?? 0;
      if (perHour > 0 || perMinute > 0) {
        result.amount = hrs * perHour + mins * perMinute;
      }
    }
  }

  // ---- Match party ----
  // Remove connectors: "ka", "na", "ना", "ના" etc.
  let cleanText = text
    .replace(/\b(ka|ki|ke|na|no|ni|ना|ની|નો|ના|का|की|के)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  const partyNames = parties.map((p) => p.name);
  const matchedParty = fuzzyMatch(cleanText, partyNames);
  if (matchedParty) {
    result.partyName = matchedParty;
    const partyObj = parties.find(
      (p) => p.name.toLowerCase() === matchedParty.toLowerCase(),
    );
    if (partyObj) {
      result.partyId = partyObj.id.toString();
    }
  } else {
    // Treat whatever is left as a party name hint
    const leftover = cleanText.replace(/\d+/g, "").trim();
    if (leftover.length >= 2) {
      result.partyName = leftover;
    }
  }

  // ---- Confidence ----
  let score = 0;
  if (result.partyName) score++;
  if (result.serviceName) score++;
  if (result.hours !== undefined || result.minutes !== undefined) score++;
  result.confidence = score >= 2 ? "high" : "low";

  return result;
}
