import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { useUpcomingBookings } from '../../hooks/useBooking';
import Loading from '../common/Loading';
import { DEFAULT_BRANCH_ID } from '../../utils/constants';
import { useBranchSummary, useBranchTrends } from '../../hooks/useAnalytics';

const StatCard = ({ title, value, subtitle }: { title: string; value: string; subtitle?: string }) => (
  <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
    <p className="text-sm font-medium text-slate-500">{title}</p>
    <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
  </article>
);

const TrendsTable = ({
  rows,
  labels,
}: {
  rows: { date: string; totalBookings: number; completed: number; cancelled: number; noShow: number }[];
  labels: {
    date: string;
    total: string;
    completed: string;
    cancelled: string;
    noShow: string;
    empty: string;
  };
}) => {
  if (!rows.length) {
    return <p className="text-sm text-slate-500">{labels.empty}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead>
          <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <th className="px-4 py-2 font-medium">{labels.date}</th>
            <th className="px-4 py-2 font-medium">{labels.total}</th>
            <th className="px-4 py-2 font-medium">{labels.completed}</th>
            <th className="px-4 py-2 font-medium">{labels.cancelled}</th>
            <th className="px-4 py-2 font-medium">{labels.noShow}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.date} className="bg-white">
              <td className="px-4 py-2 text-slate-700">{format(parseISO(row.date), 'MMM d')}</td>
              <td className="px-4 py-2 text-slate-700">{row.totalBookings}</td>
              <td className="px-4 py-2 text-emerald-600">{row.completed}</td>
              <td className="px-4 py-2 text-amber-600">{row.cancelled}</td>
              <td className="px-4 py-2 text-rose-600">{row.noShow}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const AdminOverview = () => {
  const { t } = useTranslation();
  const branchId = DEFAULT_BRANCH_ID;
  const { data: summary, isLoading: summaryLoading, isError: summaryError } = useBranchSummary(branchId);
  const { data: trends, isLoading: trendsLoading } = useBranchTrends(branchId);
  const {
    data: upcoming,
    isLoading: upcomingLoading,
    isError: upcomingError,
  } = useUpcomingBookings(branchId);

  if (!branchId) {
    return (
      <section className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
        {t('admin.configureBranch')}
      </section>
    );
  }

  if (summaryLoading && upcomingLoading) {
    return <Loading />;
  }

  return (
    <section className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-slate-900">{t('admin.quickStatsTitle')}</h3>
          {summaryError ? (
            <p className="rounded border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
              {t('admin.summaryError')}
            </p>
          ) : summary ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <StatCard title={t('admin.stats.totalBookings')} value={String(summary.totalBookings)} />
              <StatCard title={t('admin.stats.completedBookings')} value={String(summary.completedBookings)} />
              <StatCard title={t('admin.stats.cancelledBookings')} value={String(summary.cancelledBookings)} />
              <StatCard
                title={t('admin.stats.noShowRate')}
                value={`${Math.round(summary.noShowRate * 100)}%`}
              />
              <StatCard
                title={t('admin.stats.upcomingArrivals')}
                value={String(summary.upcomingArrivals)}
              />
              <StatCard
                title={t('admin.stats.occupancy')}
                value={`${Math.round(summary.occupancyRate * 100)}%`}
                subtitle={t('admin.stats.capacityLabel', {
                  checkedIn: summary.checkedInGuests,
                  capacity: summary.totalCapacity,
                })}
              />
            </div>
          ) : (
            <p className="text-sm text-slate-500">{t('admin.summaryEmpty')}</p>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-slate-900">{t('admin.trendsTitle')}</h3>
          {trendsLoading ? (
            <Loading />
          ) : trends ? (
            <TrendsTable
              rows={trends}
              labels={{
                date: t('admin.trends.date'),
                total: t('admin.trends.total'),
                completed: t('admin.trends.completed'),
                cancelled: t('admin.trends.cancelled'),
                noShow: t('admin.trends.noShow'),
                empty: t('admin.trendsEmpty'),
              }}
            />
          ) : (
            <p className="text-sm text-slate-500">{t('admin.trendsEmpty')}</p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-900">{t('admin.upcomingTitle')}</h3>
        {upcomingError ? (
          <p className="rounded border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
            {t('admin.upcomingError')}
          </p>
        ) : upcomingLoading ? (
          <Loading />
        ) : upcoming && upcoming.length ? (
          <div className="space-y-3">
            {upcoming.map((booking) => (
              <article key={booking.id} className="rounded border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-slate-700">{booking.bookingCode}</p>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs uppercase text-slate-600">
                    {booking.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {booking.bookingDate} · {booking.timeSlot}
                </p>
                <p className="text-sm text-slate-500">{t('admin.guestsLabel', { count: booking.partySize })}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">{t('admin.upcomingEmpty')}</p>
        )}
      </div>
    </section>
  );
};

export default AdminOverview;
