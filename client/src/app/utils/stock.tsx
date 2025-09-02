import { Chip } from '@mui/material'; 

export type Status = "in-stock" | "critical" | "low-stock"



// ---- helpers ----
export function daysUntil(dateISO: string) {
  const today = new Date(); // represent the date and time right now
  const d = new Date(dateISO); // it accepts the ISO string version of a date (YYYY-MM-DD) and converts it to a date object
  return Math.ceil((+d - +today) / (1000 * 60 * 60 * 24)); // method for finding the amount of days between a date you later specify and the date now
}


// calls the function daysUntil and gets a date you must specify and today's date and finds the difference
// if the difference (d) is less than 30 days (or thirty days from now is the expiry date) then display red, if it's less than 90 display yellow etc
export function expiryColor(dateISO: string) {
  const d = daysUntil(dateISO); 
  if (d < 30) return 'error';     // red
  if (d < 90) return 'warning';   // yellow
  return 'default';               // gray
}

// returns a chip component depending on the stock status
export function statusChip(status: Status) {
  switch (status) {
    case 'in-stock': 
      return (
        <Chip
          label="In stock"
          size="small"
          sx={{
            bgcolor: '#dcfce7',
            color: '#15803d',
            fontWeight: 600,
            px: 1.5,
            borderRadius: '10px',
            fontSize: '0.75rem',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          }}
        />
      );

    case 'low-stock': 
      return (
        <Chip
          label="Low stock"
          size="small"
          sx={{
            bgcolor: '#fef9c3',
            color: '#92400e',
            fontWeight: 600,
            px: 1.5,
            borderRadius: '10px',
            fontSize: '0.75rem',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          }}
        />
      );

    case 'critical': 
      return (
        <Chip
          label="Critical"
          size="small"
          sx={{
            bgcolor: '#fee2e2',
            color: '#991b1b',
            fontWeight: 600,
            px: 1.5,
            borderRadius: '10px',
            fontSize: '0.75rem',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          }}
        />
      );

    default:
      return (
        <Chip
          label="Unknown"
          variant="outlined"
          size="small"
          sx={{
            fontWeight: 600,
            fontSize: '0.75rem',
            borderRadius: '10px',
            px: 1.5,
            color: '#6b7280',
            borderColor: '#d1d5db',
          }}
        />
      );
  }
}

