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

function buildTimeline(returnDate, yearOfReturn, avgDays, ctc, passive, advancedMode, customDays) {
  const fys = [];
  for (let i = 0; i < 15; i++) {
    const endYear = yearOfReturn - 7 + i;
    const startYear = endYear - 1;
    const fyEndDate = new Date(endYear, 2, 31);
    const fyStartDate = new Date(startYear, 3, 1);
    const label = `FY ${String(startYear).slice(-2)}-${String(endYear).slice(-2)}`;

    let days;
    if (endYear < yearOfReturn) {
      if (customDays && customDays[label] != null) {
        days = customDays[label];
      } else {
        days = avgDays;
      }
    } else if (endYear === yearOfReturn) {
      days = Math.round((fyEndDate - returnDate) / MS_PER_DAY);
      if (days < 0) days = 0;
    } else {
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

  fys.forEach((fy, i) => {
    if (i >= 7) fy.past7Days = fys.slice(i - 7, i).reduce((a, b) => a + b.daysInIndia, 0);
    else if (i === 0) fy.past7Days = 0;
    else fy.past7Days = fys[i - 1].past7Days + fys[i - 1].daysInIndia;
  });

  fys.forEach((fy, i) => {
    if (i >= 4) fy.past4Days = fys.slice(i - 4, i).reduce((a, b) => a + b.daysInIndia, 0);
    else fy.past4Days = fys.slice(0, i).reduce((a, b) => a + b.daysInIndia, 0);
  });

  const divFactor = 0.7 / 365;
  fys.forEach(fy => {
    fy.activeIncome = yearOfReturn < fy.endYear ? 0 : ctc * fy.daysInIndia * divFactor;
    fy.passiveIncome = passive;
  });

  fys.forEach(fy => {
    const d = fy.daysInIndia;
    const totalIncome = fy.activeIncome + fy.passiveIncome;
    let isResident = false;
    if (d >= 182) isResident = true;
    else if (d >= 120 && totalIncome >= 15) isResident = true;
    else if (advancedMode && d >= 60 && fy.past4Days >= 365) isResident = true;
    fy.residentStatus = isResident ? 'R' : 'NR';
  });

  fys.forEach((fy, i) => {
    const slice = fys.slice(Math.max(0, i - 10), i);
    fy.prev10RCount = slice.filter(f => f.residentStatus === 'R').length;
  });

  fys.forEach(fy => {
    if (fy.residentStatus === 'NR') fy.status = 'NR';
    else if (fy.prev10RCount < 2) fy.status = 'RNOR';
    else if (fy.past7Days < 729) fy.status = 'RNOR';
    else fy.status = 'ROR';
  });

  return fys;
}

function calculate(returnDateStr, avgDays, ctc, passive, advancedMode, customDays) {
  const date = parseDate(returnDateStr);
  if (!date) return null;
  const yearOfReturn = fyEndingYear(date);
  const fys = buildTimeline(date, yearOfReturn, avgDays, ctc, passive, advancedMode, customDays);
  return { fys, yearOfReturn, returnDate: date };
}

function findProposedDate(currentReturnDate, avgDays, ctc, passive, advancedMode, customDays) {
  const baseFys = calculate(
    currentReturnDate.toISOString().split('T')[0], avgDays, ctc, passive, advancedMode, customDays
  );
  const currentYoR = baseFys.yearOfReturn;
  const currentRnorCount = baseFys.fys.filter(f => f.status === 'RNOR' && f.endYear >= currentYoR).length;

  for (let shift = 1; shift <= 365; shift++) {
    const newDate = new Date(currentReturnDate);
    newDate.setDate(newDate.getDate() + shift);
    const newYor = fyEndingYear(newDate);
    const newFys = buildTimeline(newDate, newYor, avgDays, ctc, passive, advancedMode, customDays);
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
