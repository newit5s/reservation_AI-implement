import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { bookingSchema, BookingFormValues } from '../../utils/validators';
import { useBookings } from '../../hooks/useBooking';
import { useTranslation } from 'react-i18next';

const BookingForm = () => {
  const { t } = useTranslation();
  const { createBooking } = useBookings();
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { partySize: 2 }
  });

  const onSubmit = handleSubmit((values) => {
    createBooking.mutate(values);
  });

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-lg border border-slate-200 p-6 shadow-sm">
      <div>
        <label className="block text-sm font-medium text-slate-700">{t('booking.selectDate')}</label>
        <input type="date" {...register('date')} className="mt-1 w-full rounded border px-3 py-2" />
        {errors.date && <p className="mt-1 text-sm text-red-500">{errors.date.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">{t('booking.selectTime')}</label>
        <input type="time" {...register('time')} className="mt-1 w-full rounded border px-3 py-2" />
        {errors.time && <p className="mt-1 text-sm text-red-500">{errors.time.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">{t('booking.partySize')}</label>
        <input
          type="number"
          {...register('partySize', { valueAsNumber: true })}
          className="mt-1 w-full rounded border px-3 py-2"
          min={1}
          max={20}
        />
        {errors.partySize && <p className="mt-1 text-sm text-red-500">{errors.partySize.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">{t('booking.specialRequests')}</label>
        <textarea {...register('specialRequests')} className="mt-1 w-full rounded border px-3 py-2" rows={3} />
      </div>
      <button
        type="submit"
        className="rounded bg-primary px-4 py-2 font-medium text-white shadow hover:bg-primary-light"
        disabled={createBooking.isLoading}
      >
        {createBooking.isLoading ? '...' : t('booking.title')}
      </button>
    </form>
  );
};

export default BookingForm;
