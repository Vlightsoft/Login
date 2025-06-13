const { utcToZonedTime } = require('date-fns-tz');

const date = new Date();
const timeZone = 'Asia/Kolkata';
const zoned = utcToZonedTime(date, timeZone);
console.log(zoned.toISOString());
