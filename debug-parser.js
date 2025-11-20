function parseTimeStringToSeconds(timeString) {
    // Supports HH:MM:SS or MM:SS
    const parts = timeString.split(':').map(Number);
    if (parts.some(isNaN)) return null;

    if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
    }
    return null;
}

console.log("05:00 ->", parseTimeStringToSeconds("05:00"));
console.log("5:00 ->", parseTimeStringToSeconds("5:00"));
console.log(" ->", parseTimeStringToSeconds(""));
console.log("00:50:00 ->", parseTimeStringToSeconds("00:50:00"));
