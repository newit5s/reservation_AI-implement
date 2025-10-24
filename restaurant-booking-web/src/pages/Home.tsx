import { useTranslation } from 'react-i18next';
import CustomerHighlights from '../components/customer/CustomerHighlights';

const Home = () => {
  const { t } = useTranslation();
  return (
    <div className="space-y-8">
      <section className="rounded-xl bg-gradient-to-br from-primary to-primary-light px-6 py-12 text-white shadow-lg">
        <h1 className="text-3xl font-bold md:text-4xl">{t('home.heroTitle')}</h1>
        <p className="mt-3 max-w-2xl text-lg text-primary-100 md:text-xl">{t('home.heroSubtitle')}</p>
      </section>
      <CustomerHighlights />
    </div>
  );
};

export default Home;
