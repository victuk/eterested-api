function convertToStartOfDay(date: Date) {
    // Set the time to 23:59:59
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);

    return date;
}


function convertToEndOfDay(date: Date) {
    // Set the time to 23:59:59
    date.setHours(23);
    date.setMinutes(59);
    date.setSeconds(59);
    date.setMilliseconds(999);

    return date;
}

export {
    convertToStartOfDay,
    convertToEndOfDay
}
