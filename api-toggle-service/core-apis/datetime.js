const express = require('express');
const router = express.Router();
const apiKeyAuthAndLogger = require('../middleware/apiKeyAuthAndLogger');
router.use(apiKeyAuthAndLogger); // ✅ apply globally

const { utcToZonedTime, zonedTimeToUtc, format } = require('date-fns-tz');
const timezones = Intl.supportedValuesOf('timeZone');

const {
  parseISO,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
  addDays,
  addWeeks,
  addMonths,
  isWeekend,
  getWeek,
  isSameDay,
  startOfMonth,
  endOfMonth
} = require('date-fns');

// POST /convert
router.post('/convert', (req, res) => {
  const { fromTime, fromZone, toZone } = req.body;
  if (!fromTime || !fromZone || !toZone) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const utcDate = zonedTimeToUtc(fromTime, fromZone);
    const converted = utcToZonedTime(utcDate, toZone);
    res.json({ converted: converted.toISOString() });
  } catch (err) {
    res.status(500).json({ message: 'Conversion failed', error: err.message });
  }
});

// GET /current/:zone
router.get('/current/:zone', (req, res) => {
  try {
    const zone = decodeURIComponent(req.params.zone);
    const zoned = utcToZonedTime(new Date(), zone);
    res.json({ zone, currentTime: zoned.toISOString() });
  } catch (err) {
    res.status(400).json({ message: 'Invalid timezone', error: err.message });
  }
});

// POST /format
router.post('/format', (req, res) => {
  const { datetime, formatStr, zone } = req.body;
  if (!datetime || !formatStr) {
    return res.status(400).json({ message: 'Missing datetime or formatStr' });
  }

  try {
    const date = zone ? utcToZonedTime(datetime, zone) : new Date(datetime);
    const formatted = format(date, formatStr, { timeZone: zone || 'UTC' });
    res.json({ formatted });
  } catch (err) {
    res.status(400).json({ message: 'Formatting failed', error: err.message });
  }
});

// POST /difference
router.post('/difference', (req, res) => {
  const { from, to, unit = 'minutes' } = req.body;
  if (!from || !to) {
    return res.status(400).json({ message: 'Missing "from" or "to"' });
  }

  try {
    const start = parseISO(from);
    const end = parseISO(to);
    let diff;

    switch (unit) {
      case 'days': diff = differenceInDays(end, start); break;
      case 'hours': diff = differenceInHours(end, start); break;
      default: diff = differenceInMinutes(end, start);
    }

    res.json({ difference: diff, unit });
  } catch (err) {
    res.status(500).json({ message: 'Error calculating difference', error: err.message });
  }
});

// GET /list-timezones
router.get('/list-timezones', (req, res) => {
  res.json({ zones: timezones });
});

// GET /utc-offset/:zone
router.get('/utc-offset/:zone', (req, res) => {
  try {
    const now = new Date();
    const zoned = utcToZonedTime(now, req.params.zone);
    const offsetMinutes = zoned.getTimezoneOffset() * -1;
    res.json({ zone: req.params.zone, offsetMinutes });
  } catch (err) {
    res.status(400).json({ message: 'Invalid timezone' });
  }
});

// GET /dayinfo/:zone
router.get('/dayinfo/:zone', (req, res) => {
  try {
    const now = utcToZonedTime(new Date(), req.params.zone);
    const weekday = format(now, 'EEEE', { timeZone: req.params.zone });
    const weekend = ['Saturday', 'Sunday'].includes(weekday);

    res.json({
      zone: req.params.zone,
      date: format(now, 'yyyy-MM-dd', { timeZone: req.params.zone }),
      time: format(now, 'HH:mm:ss', { timeZone: req.params.zone }),
      weekday,
      isWeekend: weekend
    });
  } catch (err) {
    res.status(400).json({ message: 'Invalid timezone' });
  }
});

// GET /year-calendar/:year
router.get('/year-calendar/:year', (req, res) => {
  try {
    const { year } = req.params;
    const startDate = new Date(year, 0, 1); // Start from January 1st of the given year
    const endDate = new Date(year, 11, 31); // End at December 31st of the given year

    // Helper function to get all days in the year
    const getDaysInMonth = (year, month) => {
      const daysInMonth = [];
      const date = new Date(year, month, 1);
      while (date.getMonth() === month) {
        daysInMonth.push(new Date(date));
        date.setDate(date.getDate() + 1);
      }
      return daysInMonth;
    };

    // Generate calendar for each month
    const calendar = [];
    for (let month = 0; month < 12; month++) {
      const days = getDaysInMonth(year, month);
      const monthData = days.map(day => {
        const weekday = format(day, 'EEEE', { timeZone: 'UTC' });
        const isWeekend = ['Saturday', 'Sunday'].includes(weekday);
        return {
          date: format(day, 'yyyy-MM-dd'),
          weekday,
          isWeekend
        };
      });
      calendar.push({ month: format(new Date(year, month), 'MMMM'), days: monthData });
    }

    res.json({ year, calendar });
  } catch (err) {
    res.status(400).json({ message: 'Invalid year format', error: err.message });
  }
});

router.get('/is-leap-year/:year', (req, res) => {
  const { year } = req.params;
  const isLeapYear = new Date(year, 1, 29).getDate() === 29;
  res.json({ year, isLeapYear });
});

// POST /add
router.post('/add', (req, res) => {
  const { datetime, amount, unit } = req.body;

  if (!datetime || !amount || !unit) {
    return res.status(400).json({ message: 'Missing datetime, amount or unit' });
  }

  try {
    const baseDate = new Date(datetime);
    let result;

    switch (unit) {
      case 'days': result = addDays(baseDate, Number(amount)); break;
      case 'weeks': result = addWeeks(baseDate, Number(amount)); break;
      case 'months': result = addMonths(baseDate, Number(amount)); break;
      default: return res.status(400).json({ message: 'Invalid unit. Use days, weeks or months.' });
    }

    res.json({ original: baseDate.toISOString(), result: result.toISOString() });
  } catch (err) {
    res.status(500).json({ message: 'Error adding time', error: err.message });
  }
});

// POST /is-weekend
router.post('/is-weekend', (req, res) => {
  const { datetime } = req.body;
  if (!datetime) return res.status(400).json({ message: 'Missing datetime' });

  try {
    res.json({ isWeekend: isWeekend(parseISO(datetime)) });
  } catch (err) {
    res.status(500).json({ message: 'Invalid date format', error: err.message });
  }
});

// GET /week-number/:date
router.get('/week-number/:date', (req, res) => {
  try {
    const date = parseISO(req.params.date);
    res.json({ date: req.params.date, weekNumber: getWeek(date) });
  } catch (err) {
    res.status(400).json({ message: 'Invalid date format' });
  }
});

// POST /is-same-day
router.post('/is-same-day', (req, res) => {
  const { date1, date2 } = req.body;
  if (!date1 || !date2) {
    return res.status(400).json({ message: 'Both date1 and date2 are required' });
  }

  try {
    res.json({ isSameDay: isSameDay(parseISO(date1), parseISO(date2)) });
  } catch (err) {
    res.status(500).json({ message: 'Error comparing dates', error: err.message });
  }
});

// GET /month-range/:date
router.get('/month-range/:date', (req, res) => {
  try {
    const baseDate = parseISO(req.params.date);
    res.json({
      startOfMonth: startOfMonth(baseDate).toISOString(),
      endOfMonth: endOfMonth(baseDate).toISOString()
    });
  } catch (err) {
    res.status(400).json({ message: 'Invalid date format' });
  }
});

module.exports = router;
