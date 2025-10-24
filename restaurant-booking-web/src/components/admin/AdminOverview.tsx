import { useUpcomingBookings } from '../../hooks/useBooking';
import Loading from '../common/Loading';

const AdminOverview = () => {
  const { data, isLoading } = useUpcomingBookings();

  if (isLoading) {
    return <Loading />;
  }

  return (
    <section className="grid gap-4">
      <h3 className="text-lg font-semibold text-slate-900">Upcoming Bookings</h3>
      <div className="grid gap-3">
        {data?.map((booking) => (
          <article key={booking.id} className="rounded border border-slate-200 p-4 shadow-sm">
            <p className="text-sm text-slate-500">Code: {booking.bookingCode}</p>
            <p className="text-slate-700">
              {booking.bookingDate} · {booking.timeSlot} · {booking.partySize} guests
            </p>
            <p className="text-sm text-slate-500">Status: {booking.status}</p>
          </article>
        )) ?? <p className="text-sm text-slate-500">No upcoming bookings.</p>}
      </div>
    </section>
  );
};

export default AdminOverview;
