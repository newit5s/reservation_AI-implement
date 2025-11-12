import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '../../utils/constants';
import { useAuth } from '../../hooks/useAuth';

const Header = () => {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, logout } = useAuth();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="container flex items-center justify-between py-4">
        <Link to="/" className="text-xl font-semibold text-primary">
          {t('common.title')}
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          <NavLink to="/" className={({ isActive }) => (isActive ? 'text-primary' : 'text-slate-600')}>
            {t('navigation.home')}
          </NavLink>
          <NavLink
            to="/booking"
            className={({ isActive }) => (isActive ? 'text-primary' : 'text-slate-600')}
          >
            {t('navigation.booking')}
          </NavLink>
          <NavLink
            to="/phases"
            className={({ isActive }) => (isActive ? 'text-primary' : 'text-slate-600')}
          >
            {t('navigation.phases')}
          </NavLink>
          <NavLink
            to="/admin"
            className={({ isActive }) => (isActive ? 'text-primary' : 'text-slate-600')}
          >
            {t('navigation.admin')}
          </NavLink>
          {isAuthenticated ? (
            <button onClick={logout} className="rounded bg-primary px-3 py-1 text-white">
              {t('common.logout')}
            </button>
          ) : (
            <NavLink to="/login" className="text-slate-600">
              {t('navigation.login')}
            </NavLink>
          )}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">{t('common.language')}:</span>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => void i18n.changeLanguage(lang.code)}
                className={`rounded px-2 py-1 text-sm ${
                  i18n.resolvedLanguage === lang.code
                    ? 'bg-primary text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
