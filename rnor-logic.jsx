// ---------- RNOR Calculation Engine ----------
const MS_PER_DAY = 86400000;

function parseDate(s) {
  if (!s) return null;
  const parts = s.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  const [y, m, d] = parts;
  return new Date(y, m - 1, d);
}

function fyEndingYear(dateObj) {
  const m = dateObj.getMonth() + 1;
  const y = dateObj.getFullYear();
  return m < 4 ? y : y + 1;
}

function daysInIndiaForTrip(tripIn, tripOut, fyStart, fyEnd) {
  const start = tripIn > fyStart ? tripIn : fyStart;
  const end = tripOut < fyEnd ? tripOut : fyEnd;
  if (end < start) return 0;
  return Math.round((end - start) / MS_PER_DAY) + 1;
}

// departureDate: the date the person LEFT India to live abroad (Date object or null)
// Pre-departure FYs are treated as 365 days (person was living in India).
// The departure FY itself counts days from Apr 1 of that FY to the departure date.
// Post-departure, pre-return FYs use avgDays / customDays / trip-derived days.
function buildTimeline(returnDate, yearOfReturn, avgDays, ctc, passive, advancedMode, customDays, departureDate) {
  const depFyEndYear = departureDate ? fyEndingYear(departureDate) : null;

  const fys = [];
  for (let i = 0; i < 15; i++) {
    const endYear = yearOfReturn - 7 + i;
    const startYear = endYear - 1;
    const fyEndDate = new Date(endYear, 2, 31);
    const fyStartDate = new Date(startYear, 3, 1);
    const label = `FY ${String(startYear).slice(-2)}-${String(endYear).slice(-2)}`;

    let days;
    if (endYear < yearOfReturn) {
      if (departureDate && depFyEndYear !== null) {
        if (endYear < depFyEndYear) {
          // Fully pre-departure: person was living in India all year
          days = 365;
        } else if (endYear === depFyEndYear) {
          // Departure FY: days from FY start (Apr 1) to departure date
          days = Math.round((departureDate - fyStartDate) / MS_PER_DAY);
          days = Math.max(0, Math.min(365, days));
        } else {
          // Post-departure, pre-return: visit days
          if (customDays && customDays[label] != null) {
            days = customDays[label];
          } else {
            days = avgDays;
          }
        }
      } else {
        // No departure date: backward-compatible avg/custom for all pre-return years
        if (customDays && customDays[label] != null) {
          days = customDays[label];
        } else {
          days = avgDays;
        }
      }
    } else if (endYear === yearOfReturn) {
      // Return FY: days from return date to Mar 31
      days = Math.round((fyEndDate - returnDate) / MS_PER_DAY);
      if (days < 0) days = 0;
    } else {
      // Post-return: living in India full time
      days = 365;
    }

    fys.push({
      idx: i, endYear, startYear, fyEndDate, fyStartDate, label,
      yearsFromReturn: endYear - yearOfReturn,
      isReturnYear: endYear === yearOfReturn,
      isPreReturn: endYear < yearOfReturn,
      daysInIndia: days,
    });
  }

  // Cumulative India days over the preceding 7 FYs (for the 729-day RNOR test)
  fys.forEach((fy, i) => {
    if (i >= 7) fy.past7Days = fys.slice(i - 7, i).reduce((a, b) => a + b.daysInIndia, 0);
    else if (i === 0) fy.past7Days = 0;
    else fy.past7Days = fys[i - 1].past7Days + fys[i - 1].daysInIndia;
  });

  // Cumulative India days over the preceding 4 FYs (for 60-day Resident test)
  fys.forEach((fy, i) => {
    if (i >= 4) fy.past4Days = fys.slice(i - 4, i).reduce((a, b) => a + b.daysInIndia, 0);
    else fy.past4Days = fys.slice(0, i).reduce((a, b) => a + b.daysInIndia, 0);
  });

  const divFactor = 0.7 / 365;
  fys.forEach(fy => {
    fy.activeIncome = yearOfReturn < fy.endYear ? 0 : ctc * fy.daysInIndia * divFactor;
    fy.passiveIncome = passive;
  });

  // Resident / NR per FY
  // Primary rule for NRIs: 182+ days in the FY = Resident.
  // 120-day rule applies if India-sourced income >= 15L.
  // 60-day rule (advanced mode) if past 4 years total >= 365 days.
  fys.forEach(fy => {
    const d = fy.daysInIndia;
    const totalIncome = fy.activeIncome + fy.passiveIncome;
    let isResident = false;
    if (d >= 182) isResident = true;
    else if (d >= 120 && totalIncome >= 15) isResident = true;
    else if (advancedMode && d >= 60 && fy.past4Days >= 365) isResident = true;
    fy.residentStatus = isResident ? 'R' : 'NR';
  });

  // Count R years in the preceding 10 FYs (for the "NR in 9 of 10" RNOR test)
  fys.forEach((fy, i) => {
    const slice = fys.slice(Math.max(0, i - 10), i);
    fy.prev10RCount = slice.filter(f => f.residentStatus === 'R').length;
  });

  // Final status: NR / RNOR / ROR
  // A Resident is RNOR if EITHER:
  //   (a) They were NR in 9+ of the 10 preceding FYs (prev10RCount < 2), OR
  //   (b) They spent <= 729 days in India across the 7 preceding FYs
  fys.forEach(fy => {
    if (fy.residentStatus === 'NR') fy.status = 'NR';
    else if (fy.prev10RCount < 2) fy.status = 'RNOR';
    else if (fy.past7Days < 729) fy.status = 'RNOR';
    else fy.status = 'ROR';
  });

  return fys;
}

function calculate(returnDateStr, avgDays, ctc, passive, advancedMode, customDays, departureDateStr) {
  const date = parseDate(returnDateStr);
  if (!date) return null;
  const departureDate = departureDateStr ? parseDate(departureDateStr) : null;
  const yearOfReturn = fyEndingYear(date);
  const fys = buildTimeline(date, yearOfReturn, avgDays, ctc, passive, advancedMode, customDays, departureDate);
  return { fys, yearOfReturn, returnDate: date };
}

function findProposedDate(currentReturnDate, avgDays, ctc, passive, advancedMode, customDays, departureDateStr) {
  const baseFys = calculate(
    currentReturnDate.toISOString().split('T')[0], avgDays, ctc, passive, advancedMode, customDays, departureDateStr
  );
  if (!baseFys) return null;
  const currentYoR = baseFys.yearOfReturn;
  const currentRnorCount = baseFys.fys.filter(f => f.status === 'RNOR' && f.endYear >= currentYoR).length;

  for (let shift = 1; shift <= 365; shift++) {
    const newDate = new Date(currentReturnDate);
    newDate.setDate(newDate.getDate() + shift);
    const newYor = fyEndingYear(newDate);
    const depDate = departureDateStr ? parseDate(departureDateStr) : null;
    const newFys = buildTimeline(newDate, newYor, avgDays, ctc, passive, advancedMode, customDays, depDate);
    const newRnorCount = newFys.filter(f => f.status === 'RNOR' && f.endYear >= newYor).length;
    if (newRnorCount > currentRnorCount) {
      return { date: newDate, additionalRnorCount: newRnorCount - currentRnorCount };
    }
  }
  return null;
}

function formatDateReadable(d) {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

// Export to window
Object.assign(window, {
  parseDate, fyEndingYear, daysInIndiaForTrip, buildTimeline,
  calculate, findProposedDate, formatDateReadable, MS_PER_DAY
});
