import React, { useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarX, Clock, Loader2, MapPin, Phone, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { initializeCheckout } from '@/api/EcommerceApi';
import { useBookingAvailability } from '@/hooks/useBookingAvailability';
import { useToast } from '@/hooks/use-toast';

const SLOT_TAKEN_MESSAGE = 'Booking time slot not available';

const LOCATION_ICONS = {
  physical: MapPin,
  online: Video,
  online_auto_generated: Video,
  phone: Phone,
};

const formatDateLabel = (dateKey) => {
  const [year, month, day] = dateKey.split('-').map(Number);

  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

const formatSlotLabel = (slot) => {
  const [datePart, timePart] = slot.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);

  return new Date(year, month - 1, day, hours, minutes).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDuration = (lengthInMs) => {
  // booking_event.length is stored in milliseconds; length_unit is display-only.
  const minutes = Math.round((lengthInMs || 0) / 60000);

  if (minutes <= 0) {
    return null;
  }

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  return remainder === 0 ? `${hours} h` : `${hours} h ${remainder} min`;
};

const getLocationLabel = (bookingEvent) => {
  if (bookingEvent.location_type === 'phone') {
    return bookingEvent.phone_number ? `Phone call · ${bookingEvent.phone_number}` : 'Phone call';
  }

  if (bookingEvent.location_type === 'online' || bookingEvent.location_type === 'online_auto_generated') {
    return 'Online meeting';
  }

  return bookingEvent.location || 'In person';
};

/**
 * Slot picker for a booking (appointment) product.
 *
 * A booking never enters the shopping cart: picking a slot goes straight to hosted
 * checkout with a single item of quantity 1, plus `time_slot` and `time_zone`.
 */
const BookingSlotPicker = ({ product, variant }) => {
  const { toast } = useToast();
  const [customFieldValues, setCustomFieldValues] = useState({});
  const [isRedirecting, setIsRedirecting] = useState(false);

  const bookingEvent = variant?.booking_event;

  const {
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
  } = useBookingAvailability({ bookingEventId: bookingEvent?.id });

  const customFields = useMemo(() => product?.custom_fields || [], [product]);
  const duration = useMemo(() => formatDuration(bookingEvent?.length), [bookingEvent?.length]);

  const missingRequiredField = useMemo(
    () => customFields.some(field => field.is_required && !customFieldValues[field.id]?.trim()),
    [customFields, customFieldValues],
  );

  const handleCustomFieldChange = useCallback((fieldId, value) => {
    setCustomFieldValues(prev => ({ ...prev, [fieldId]: value }));
  }, []);

  const handleBook = useCallback(async () => {
    if (!selectedSlot || !variant) {
      return;
    }

    setIsRedirecting(true);

    try {
      const filledCustomFields = customFields
        .filter(field => customFieldValues[field.id]?.trim())
        .map(field => ({ custom_field_id: field.id, value: customFieldValues[field.id].trim() }));

      const successUrl = `${window.location.origin}/success?checkout=success`;
      const cancelUrl = `${window.location.href}${window.location.search ? '&' : '?'}checkout=cancel`;

      const { url } = await initializeCheckout({
        items: [{
          variant_id: variant.id,
          quantity: 1,
          time_slot: selectedSlot,
          time_zone: timeZone,
          ...(filledCustomFields.length > 0 ? { custom_field_values: filledCustomFields } : {}),
        }],
        successUrl,
        cancelUrl,
      });

      window.location.href = url;
    } catch (err) {
      setIsRedirecting(false);

      if (err.response?.message === SLOT_TAKEN_MESSAGE) {
        await refreshSlots();
        toast({
          title: 'That time was just booked',
          description: 'Please pick another available time.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Booking Error',
        description: 'There was a problem starting checkout. Please try again.',
        variant: 'destructive',
      });
    }
  }, [selectedSlot, variant, customFields, customFieldValues, timeZone, refreshSlots, toast]);

  if (!bookingEvent) {
    return (
      <p className="text-sm text-muted-foreground">This appointment is not available for booking.</p>
    );
  }

  const LocationIcon = LOCATION_ICONS[bookingEvent.location_type] || MapPin;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        {duration && (
          <span className="inline-flex items-center gap-2">
            <Clock size={16} /> {duration}
          </span>
        )}
        <span className="inline-flex items-center gap-2">
          <LocationIcon size={16} /> {getLocationLabel(bookingEvent)}
        </span>
      </div>

      {isLoadingDates ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading availability…
        </div>
      ) : availableDates.length === 0 ? (
        <div className="flex items-center gap-3 rounded-lg border border-border p-4 text-muted-foreground">
          <CalendarX size={20} />
          <p>No times available right now. Please check back later.</p>
        </div>
      ) : (
        <>
          <div>
            <h3 className="mb-2 text-sm font-medium">Pick a day</h3>
            <div className="flex flex-wrap gap-2">
              {availableDates.map(dateKey => (
                <Button
                  key={dateKey}
                  onClick={() => selectDate(dateKey)}
                  variant={selectedDate === dateKey ? 'default' : 'outline'}
                  size="sm"
                >
                  {formatDateLabel(dateKey)}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-medium">Pick a time</h3>
            {isLoadingSlots ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" /> Loading times…
              </div>
            ) : slots.length === 0 ? (
              <p className="text-sm text-muted-foreground">No times left on this day.</p>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap gap-2">
                {slots.map(slot => (
                  <Button
                    key={slot}
                    onClick={() => setSelectedSlot(slot)}
                    variant={selectedSlot === slot ? 'default' : 'outline'}
                    size="sm"
                  >
                    {formatSlotLabel(slot)}
                  </Button>
                ))}
              </motion.div>
            )}
            <p className="mt-2 text-xs text-muted-foreground">Times shown in {timeZone}</p>
          </div>

          {customFields.length > 0 && (
            <div className="space-y-3">
              {customFields.map(field => (
                <div key={field.id}>
                  <label htmlFor={`booking-field-${field.id}`} className="mb-1 block text-sm font-medium">
                    {field.title}
                    {field.is_required && <span className="text-destructive"> *</span>}
                  </label>
                  <input
                    id={`booking-field-${field.id}`}
                    type="text"
                    value={customFieldValues[field.id] || ''}
                    onChange={(event) => handleCustomFieldChange(field.id, event.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
              ))}
            </div>
          )}

          <Button
            onClick={handleBook}
            size="lg"
            className="w-full"
            disabled={!selectedSlot || missingRequiredField || isRedirecting || !product?.purchasable}
          >
            {isRedirecting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
            {isRedirecting ? 'Redirecting…' : 'Book now'}
          </Button>
        </>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
};

export default BookingSlotPicker;
