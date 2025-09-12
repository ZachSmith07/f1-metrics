// formats lap time to either M:SS.msmsms or SS.msmsms
export const formatLapTime = (seconds: number, under60Format: boolean = false): string => {
  if (under60Format && seconds < 60) {
    return seconds.toFixed(3);
  }
  else {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const formattedSeconds = remainingSeconds.toFixed(3).padStart(6, '0'); // Ensures 2 digits + 3 decimals
    return `${minutes}:${formattedSeconds}`;
  }
};