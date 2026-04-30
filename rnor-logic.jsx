// ---------- RNOR ENGINE (DUAL MODE: APPROX + ACCURATE) ----------

const MS_PER_DAY = 86400000;

// ---------- DATE UTILS (UTC SAFE) ----------
function parseDate(s) {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(Date.UTC(y, m - 1, d));
}

function daysBetweenInclusive(start, end) {
  return Math.floor((end - start) / MS_PER_DAY) + 1;
}

function fyEndingYear(date) {
  const m = date.getUTCMonth() + 1;
  const y = date.getUTCFullYear();
  return m < 4 ? y : y + 1;
}

function fyBounds(endYear) {
  return {
    start: new Date(Date.UTC(endYear - 1, 3, 1)),
    end: new Date(Date.UTC(endYear, 2, 31))
  };
}

// ---------- CORE TIMELINE ----------
function buildTimeline({
  returnDate,
  departureDate,
  yearOfReturn,
  mode,        // "avg" | "custom" | "trips"
  avgDays,
  customDays,
  trips
}) {
  const fys = [];

  for (let i = 0; i < 20; i++) {
    const endYear = yearOfReturn - 10 + i;
    const { start, end } = fyBounds(endYear);

    let days = 0;

    // ---------- PRE-RETURN YEARS ----------
    if (endYear < yearOfReturn) {

      // Case 1: Fully before departure → lived in India
      if (departureDate && end < departureDate) {
        days = 365;
      }

      // Case 2: Departure year
      else if (departureDate && start <= departureDate && end >= departureDate) {
        days = Math.max(0, daysBetweenInclusive(start, departureDate));
      }

      // Case 3: Post-departure → use selected mode
      else {

        // -------- MODE: TRIPS --------
        if (mode === "trips") {
          days = (trips || []).reduce((sum, trip) => {
            const tripIn = parseDate(trip.in);
            const tripOut = parseDate(trip.out);

            if (!tripIn || !tripOut) return sum;

            const overlapStart = tripIn > start ? tripIn : start;
            const overlapEnd = tripOut < end ? tripOut : end;

            if (overlapEnd < overlapStart) return sum;

            return sum + daysBetweenInclusive(overlapStart, overlapEnd);
          }, 0);
        }

        // -------- MODE: CUSTOM FY --------
        else if (mode === "custom") {
          // STRICT: missing FY = 0
          days = customDays?.[endYear] ?? 0;
        }

        // -------- MODE: AVG --------
        else {
          days = avgDays ?? 0;
        }
      }
    }

    // ---------- RETURN YEAR ----------
    else if (endYear === yearOfReturn) {
      days = Math.max(0, daysBetweenInclusive(returnDate, end));
    }

    // ---------- POST-RETURN ----------
    else {
      days = 365;
    }

    fys.push({
      endYear,
      daysInIndia: Math.max(0, Math.min(366, days))
    });
  }

  return fys;
}

// ---------- HELPERS ----------
function computePastDays(fys, index, years) {
  return fys
    .slice(Math.max(0, index - years), index)
    .reduce((sum, fy) => sum + fy.daysInIndia, 0);
}

function computePrevResidents(fys, index, years) {
  return fys
    .slice(Math.max(0, index - years), index)
    .filter(f => f.residentStatus === 'R').length;
}

// ======================================================
// =============== APPROXIMATION MODEL ===================
// ======================================================

function calculateApproximation({
  returnDateStr,
  departureDateStr,
  mode, // "avg" | "custom" | "trips"
  avgDays,
  customDays,
  trips,
  incomeAbove15L
}) {
  const returnDate = parseDate(returnDateStr);
  const departureDate = parseDate(departureDateStr);

  const yearOfReturn = fyEndingYear(returnDate);

  const fys = buildTimeline({
    returnDate,
    departureDate,
    yearOfReturn,
    mode,
    avgDays,
    customDays,
    trips
  });

  fys.forEach((fy, i) => {
    const d = fy.daysInIndia;
    const past4 = computePastDays(fys, i, 4);

    let isResident = false;

    if (d >= 182) isResident = true;
    else if (d >= 120 && incomeAbove15L) isResident = true;
    else if (d >= 60 && past4 >= 365) isResident = true;

    fy.residentStatus = isResident ? 'R' : 'NR';
  });

  fys.forEach((fy, i) => {
    const past7 = computePastDays(fys, i, 7);
    const prev10R = computePrevResidents(fys, i, 10);

    if (fy.residentStatus === 'NR') fy.status = 'NR';
    else if (prev10R < 2) fy.status = 'RNOR';
    else if (past7 <= 729) fy.status = 'RNOR';
    else fy.status = 'ROR';
  });

  return fys;
}

// ======================================================
// =============== ACCURATE MODEL ========================
// ======================================================

function calculateAccurate({
  returnDateStr,
  departureDateStr,
  avgDays,
  customDays,

  isIndianCitizen,
  isPIO,
  leftForEmployment,
  isCrew,
  isVisitingIndia,
  incomeAbove15L,
  notTaxedAnywhere
}) {
  const returnDate = parseDate(returnDateStr);
  const departureDate = parseDate(departureDateStr);

  const yearOfReturn = fyEndingYear(returnDate);

  const fys = buildTimeline({
    returnDate,
    departureDate,
    yearOfReturn,
    avgDays,
    customDays
  });

  fys.forEach((fy, i) => {
    const d = fy.daysInIndia;
    const past4 = computePastDays(fys, i, 4);

    let isResident = false;

    // 182-day rule
    if (d >= 182) {
      isResident = true;
    }

    // 60-day rule (skip if left for employment or crew)
    else if (!leftForEmployment && !isCrew && d >= 60 && past4 >= 365) {
      isResident = true;
    }

    // 120-day rule (only for citizen/PIO visiting India)
    else if (
      (isIndianCitizen || isPIO) &&
      isVisitingIndia &&
      incomeAbove15L &&
      d >= 120 &&
      past4 >= 365
    ) {
      isResident = true;
    }

    // Deemed resident
    else if (
      isIndianCitizen &&
      incomeAbove15L &&
      notTaxedAnywhere
    ) {
      isResident = true;
      fy.deemedResident = true;
    }

    fy.residentStatus = isResident ? 'R' : 'NR';
  });

  fys.forEach((fy, i) => {
    const past7 = computePastDays(fys, i, 7);
    const prev10R = computePrevResidents(fys, i, 10);

    if (fy.residentStatus === 'NR') {
      fy.status = 'NR';
    } else if (fy.deemedResident) {
      fy.status = 'RNOR';
    } else if (prev10R < 2) {
      fy.status = 'RNOR';
    } else if (past7 <= 729) {
      fy.status = 'RNOR';
    } else {
      fy.status = 'ROR';
    }
  });

  return fys;
}

// ---------- EXPORT ----------
Object.assign(window, {
  calculateApproximation,
  calculateAccurate
});
