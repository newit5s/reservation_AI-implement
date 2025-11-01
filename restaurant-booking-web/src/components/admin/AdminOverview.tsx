import { useTranslation } from 'react-i18next';
import { useUpcomingBookings } from '../../hooks/useBooking';
import Loading from '../common/Loading';

const AdminOverview = () => {
  const { t } = useTranslation();
  const { data, isLoading } = useUpcomingBookings();

  const hasBookings = Array.isArray(data) && data.length > 0;

  if (isLoading) {
    return <Loading />;
  }

  return (
    <section className="grid gap-4">
      <h3 className="text-lg font-semibold text-slate-900">{t('admin.upcomingTitle')}</h3>
      {hasBookings ? (
        <div className="grid gap-3">
          {data?.map((booking) => (
            <article key={booking.id} className="rounded border border-slate-200 p-4 shadow-sm">
              <p className="text-sm text-slate-500">
                {t('admin.bookingCode', { code: booking.bookingCode })}
              </p>
              <p className="text-slate-700">
                {t('admin.bookingSummary', {
                  date: booking.bookingDate,
                  time: booking.timeSlot,
                  guests: booking.partySize
                })}
              </p>
              <p className="text-sm text-slate-500">
                {t('admin.bookingStatus', { status: booking.status })}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500">{t('admin.noUpcoming')}</p>
      )}
    </section>
  );
};

export default AdminOverview;
