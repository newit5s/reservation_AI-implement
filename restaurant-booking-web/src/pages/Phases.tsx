import { useTranslation } from 'react-i18next';
import { projectPhases, completedPhases, totalPhases } from '../data/projectPhases';
import type { PhaseStatus } from '../types';

const statusColors: Record<PhaseStatus, string> = {
  complete: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  in_progress: 'bg-amber-100 text-amber-700 border-amber-200',
  pending: 'bg-slate-100 text-slate-600 border-slate-200',
};

const statusLabels = (t: ReturnType<typeof useTranslation>['t']): Record<PhaseStatus, string> => ({
  complete: t('phases.status.complete'),
  in_progress: t('phases.status.inProgress'),
  pending: t('phases.status.pending'),
});

const PhasesPage = () => {
  const { t } = useTranslation();
  const labels = statusLabels(t);

  return (
    <section className="space-y-8">
      <header className="space-y-3">
        <h2 className="text-2xl font-semibold text-slate-900">{t('phases.title')}</h2>
        <p className="text-slate-600">{t('phases.subtitle')}</p>
        <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          {t('phases.progressSummary', { completed: completedPhases, total: totalPhases })}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {projectPhases.map((phase) => (
          <article key={phase.id} className="space-y-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold text-slate-900">{phase.title}</h3>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase ${statusColors[phase.status]}`}>
                {labels[phase.status]}
              </span>
            </div>
            <p className="text-sm text-slate-600">{phase.description}</p>
            <ul className="space-y-2 text-sm text-slate-600">
              {phase.highlights.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span aria-hidden className="mt-1 inline-flex h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
};

export default PhasesPage;
