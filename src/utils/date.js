
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getDateParts(date){
  return {
    month: months[date.getMonth()],
    day: date.getDate(),
    year: date.getFullYear()
  }
}

function getTimeParts(date){
    let hours = date.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const minutes = date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes();
    hours = hours % 12;
    hours = hours ? hours : 12;
    return { hours, minutes, ampm }
}

    // // Extracting hours and minutes for the time
    // let hours = date.getHours();
    // const minutes = date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes();

    // // Formatting hours for 12-hour clock format and determining AM/PM
    // const ampm = hours >= 12 ? 'PM' : 'AM';
    // hours = hours % 12;
    // hours = hours ? hours : 12; // the hour '0' should be '12'

    // Assembling the formatted date string

export default {
  getDateParts,
  getTimeParts,
  print(_date, includeTime){
    const date = _date instanceof Date ? _date : new Date(_date);
    const {month, day, year} = getDateParts(date)
    const formatted = `${month} ${day}, ${year}`;
    if (includeTime) {
      const { hours, minutes, ampm } = getTimeParts(date);
      return `${hours}:${minutes} ${ampm} • ${formatted}`;
    }
    return formatted;
  }
}