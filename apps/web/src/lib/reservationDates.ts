export type ReservationDates = { startDate: string; endDate: string };
export type BookingRange = { startDate: string; endDate: string };

export function fechaDisponible(fecha: string, bookings: BookingRange[], hoy: string) {
  const dia = new Date(fecha + 'T12:00:00');
  return /^\d{4}-\d{2}-\d{2}$/.test(fecha) && fecha >= hoy &&
    !isNaN(dia.getTime()) && dia.getFullYear() === Number(fecha.slice(0, 4)) &&
    dia.getMonth() + 1 === Number(fecha.slice(5, 7)) && dia.getDate() === Number(fecha.slice(8)) &&
    !bookings.some(b => fecha >= b.startDate && fecha < b.endDate);
}

export function rangoDisponible(dates: ReservationDates, bookings: BookingRange[], hoy: string) {
  const { startDate, endDate } = dates;
  return fechaDisponible(startDate, bookings, hoy) &&
    fechaDisponible(endDate, bookings, hoy) && endDate > startDate &&
    !bookings.some(b => startDate < b.endDate && endDate > b.startDate);
}

// Un rango que cruza una reserva se rechaza: se conserva la llegada sin salida.
export function seleccionarFecha(dates: ReservationDates, fecha: string, bookings: BookingRange[], hoy: string): ReservationDates {
  if (!fechaDisponible(fecha, bookings, hoy)) return dates;
  if (!dates.startDate || dates.endDate || fecha <= dates.startDate ||
      !fechaDisponible(dates.startDate, bookings, hoy)) {
    return { startDate: fecha, endDate: '' };
  }
  const rango = { startDate: dates.startDate, endDate: fecha };
  return rangoDisponible(rango, bookings, hoy) ? rango : dates;
}
