import { useTranslation } from 'react-i18next';
import AdminOverview from '../components/admin/AdminOverview';

const AdminPage = () => {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-slate-900">{t('admin.title')}</h2>
        <p className="text-slate-500">{t('admin.subtitle')}</p>
      </header>
      <AdminOverview />
    </div>
  );
};

export default AdminPage;
