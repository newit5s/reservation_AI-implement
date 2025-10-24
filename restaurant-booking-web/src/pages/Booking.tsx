import { useTranslation } from 'react-i18next';
import BookingForm from '../components/booking/BookingForm';

const BookingPage = () => {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-slate-900">{t('booking.title')}</h2>
        <p className="text-slate-500">{t('booking.subtitle')}</p>
      </header>
      <BookingForm />
    </div>
  );
};

export default BookingPage;
