import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getAvailability, getTimeSlots } from '@/api/EcommerceApi';

const AVAILABILITY_WINDOW_DAYS = 60;

const getBrowserTimeZone = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);

  return next;
};

/**
 * Loads bookable days and slots for one booking event.
 *
 * A slot string returned in `slots` must be passed verbatim as `items[0].time_slot`
 * at checkout, together with `timeZone` as `items[0].time_zone`.
 *
 * @param {Object} params
 * @param {string|null|undefined} params.bookingEventId - `variant.booking_event.id`
 * @param {number} [params.windowDays] - How many days ahead to look for availability
 */
export function useBookingAvailability({ bookingEventId, windowDays = AVAILABILITY_WINDOW_DAYS }) {
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isLoadingDates, setIsLoadingDates] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [error, setError] = useState(null);

  const timeZone = useMemo(() => getBrowserTimeZone(), []);
  const slotsRequestRef = useRef(0);

  const loadSlots = useCallback(async (dateKey) => {
    if (!bookingEventId || !dateKey) {
      setSlots([]);
      return [];
    }

    const requestId = ++slotsRequestRef.current;

    setIsLoadingSlots(true);
    setError(null);

    try {
      const { slots: daySlots } = await getTimeSlots({
        bookingEventId,
        date: dateKey,
        timeZone,
      });

      if (requestId !== slotsRequestRef.current) {
        return daySlots;
      }

      setSlots(daySlots);
      return daySlots;
    } catch (err) {
      if (requestId !== slotsRequestRef.current) {
        return [];
      }

      setSlots([]);
      setError(err.message || 'Could not load available times.');
      return [];
    } finally {
      if (requestId === slotsRequestRef.current) {
        setIsLoadingSlots(false);
      }
    }
  }, [bookingEventId, timeZone]);

  const selectDate = useCallback(async (dateKey) => {
    setSelectedDate(dateKey);
    setSelectedSlot(null);
    await loadSlots(dateKey);
  }, [loadSlots]);

  const refreshSlots = useCallback(async () => {
    setSelectedSlot(null);
    return loadSlots(selectedDate);
  }, [loadSlots, selectedDate]);

  useEffect(() => {
    let isCurrent = true;

    const loadDates = async () => {
      if (!bookingEventId) {
        setAvailableDates([]);
        return;
      }

      setIsLoadingDates(true);
      setError(null);

      try {
        const today = new Date();
        const { available_dates } = await getAvailability({
          bookingEventId,
          fromDate: toDateKey(today),
          toDate: toDateKey(addDays(today, windowDays)),
          timeZone,
        });

        if (!isCurrent) {
          return;
        }

        const sortedDates = [...available_dates].sort();
        setAvailableDates(sortedDates);

        if (sortedDates.length > 0) {
          setSelectedDate(sortedDates[0]);
          await loadSlots(sortedDates[0]);
        }
      } catch (err) {
        if (isCurrent) {
          setAvailableDates([]);
          setError(err.message || 'Could not load availability.');
        }
      } finally {
        if (isCurrent) {
          setIsLoadingDates(false);
        }
      }
    };

    loadDates();

    return () => {
      isCurrent = false;
    };
  }, [bookingEventId, windowDays, timeZone, loadSlots]);

  return {
    availableDates,
    selectedDate,
    selectDate,
    slots,
    selectedSlot,
    setSelectedSlot,
    refreshSlots,
    isLoadingDates,
    isLoadingSlots,
    error,
    timeZone,
  };
}
