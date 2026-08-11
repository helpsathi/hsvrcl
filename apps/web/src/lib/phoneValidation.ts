/**
 * Strict Phone Number Validator for HelpSathi
 * Enforces valid 10-digit Indian mobile numbers and prevents fake/dummy sequential or repeating numbers.
 */

export interface PhoneValidationResult {
  isValid: boolean;
  error?: string;
  cleanPhone?: string;
}

const DUMMY_SEQUENCES = new Set([
  "0123456789",
  "1234567890",
  "2345678901",
  "3456789012",
  "4567890123",
  "5678901234",
  "6789012345",
  "7890123456",
  "8901234567",
  "9876543210",
  "8765432109",
  "7654321098",
  "6543210987",
  "5432109876",
  "4321098765",
  "3210987654",
  "2109876543",
  "1098765432",
  "0987654321",
  "9787654321",
  "9878765432",
  "9876543211",
  "9876543222",
  "9988776655",
  "9898989898",
  "9797979797",
  "9696969696",
  "9595959595",
  "9191919191",
  "9090909090",
  "8989898989",
  "7878787878",
  "6767676767",
  "1212121212",
  "1010101010",
]);

export function validatePhoneNumber(input: string | null | undefined): PhoneValidationResult {
  if (!input || typeof input !== "string") {
    return { isValid: false, error: "Phone number is required." };
  }

  // Remove common formatting characters (+, -, spaces, parentheses, dots)
  let clean = input.replace(/[\s\-\(\)\+\.]/g, "").trim();

  // Strip international country code prefix "+91" or "91" if total length is 12
  if (clean.length === 12 && clean.startsWith("91")) {
    clean = clean.substring(2);
  } else if (clean.length === 11 && clean.startsWith("0")) {
    // Strip leading trunk zero
    clean = clean.substring(1);
  }

  // Must contain only numeric digits
  if (!/^\d+$/.test(clean)) {
    return { isValid: false, error: "Phone number must contain only numeric digits." };
  }

  // Must be exactly 10 digits
  if (clean.length !== 10) {
    return { 
      isValid: false, 
      error: `Phone number must be exactly 10 digits (entered ${clean.length} digits).` 
    };
  }

  // Must start with 6, 7, 8, or 9 (standard Indian mobile allocation)
  if (!/^[6-9]/.test(clean)) {
    return { 
      isValid: false, 
      error: "Please enter a valid Indian mobile number starting with 6, 7, 8, or 9." 
    };
  }

  // Check for all identical digits (e.g., 9999999999, 8888888888, 7777777777, 1111111111)
  if (/^(\d)\1{9}$/.test(clean)) {
    return { 
      isValid: false, 
      error: "Invalid mobile number: Cannot be all identical repeating digits." 
    };
  }

  // Check for 6 or more consecutive identical repeating digits (e.g., 9888888812)
  if (/(\d)\1{5,}/.test(clean)) {
    return { 
      isValid: false, 
      error: "Invalid mobile number: Contains excessive repeating digits." 
    };
  }

  // Check for 2-digit alternating patterns (e.g., 9898989898, 9191919191, 7878787878)
  if ((clean[0] + clean[1]).repeat(5) === clean) {
    return {
      isValid: false,
      error: "Invalid mobile number: Cannot be a repetitive 2-digit pattern.",
    };
  }

  // Check for 3-digit repeating patterns (e.g., 9879879879)
  if (clean.slice(0, 3).repeat(3) + clean[0] === clean) {
    return {
      isValid: false,
      error: "Invalid mobile number: Cannot be a repetitive 3-digit pattern.",
    };
  }

  // Check for algorithmic ascending or descending sequential runs of 6+ digits
  let maxAscendingRun = 1;
  let maxDescendingRun = 1;
  let currentAscRun = 1;
  let currentDescRun = 1;
  for (let i = 1; i < clean.length; i++) {
    const prev = Number(clean[i - 1]);
    const curr = Number(clean[i]);
    if (curr === prev + 1) {
      currentAscRun++;
      maxAscendingRun = Math.max(maxAscendingRun, currentAscRun);
    } else {
      currentAscRun = 1;
    }
    if (curr === prev - 1) {
      currentDescRun++;
      maxDescendingRun = Math.max(maxDescendingRun, currentDescRun);
    } else {
      currentDescRun = 1;
    }
  }

  if (maxAscendingRun >= 7 || maxDescendingRun >= 7) {
    return {
      isValid: false,
      error: "Invalid mobile number: Dummy sequential numbers like 9876543210 or 1234567890 are not allowed.",
    };
  }

  // Check against known dummy sequence blacklist
  if (DUMMY_SEQUENCES.has(clean)) {
    return { 
      isValid: false, 
      error: "Please enter a valid, active mobile number (dummy sequences are not allowed)." 
    };
  }

  return { isValid: true, cleanPhone: clean };
}
