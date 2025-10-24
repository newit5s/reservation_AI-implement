import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-slate-200 bg-slate-100 py-6">
      <div className="container flex flex-col items-center gap-2 text-sm text-slate-500 md:flex-row md:justify-between">
        <span>© {new Date().getFullYear()} {t('common.title')}</span>
        <span>{t('common.welcome')}!</span>
      </div>
    </footer>
  );
};

export default Footer;
