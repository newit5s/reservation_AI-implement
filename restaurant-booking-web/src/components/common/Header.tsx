import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '../../utils/constants';
import { useAuth } from '../../hooks/useAuth';

const Header = () => {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navigationLinks = useMemo(
    () => [
      { to: '/', label: t('navigation.home') },
      { to: '/booking', label: t('navigation.booking') },
      { to: '/admin', label: t('navigation.admin') }
    ],
    [t]
  );

  const renderLanguageSwitch = (additionalClasses = '') => (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-slate-500">{t('common.language')}:</span>
      {SUPPORTED_LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          onClick={() => void i18n.changeLanguage(lang.code)}
          className={`${
            i18n.resolvedLanguage === lang.code
              ? 'bg-primary text-white'
              : 'bg-slate-100 text-slate-600'
          } rounded px-2 py-1 text-sm ${additionalClasses}`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="container flex items-center justify-between py-4">
        <Link to="/" className="text-xl font-semibold text-primary">
          {t('common.title')}
        </Link>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary md:hidden"
          onClick={() => setIsMobileMenuOpen((open) => !open)}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-navigation"
        >
          <span className="sr-only">{t(isMobileMenuOpen ? 'navigation.closeMenu' : 'navigation.openMenu')}</span>
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <nav className="hidden items-center gap-6 md:flex">
          {navigationLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? 'text-primary' : 'text-slate-600')}
            >
              {item.label}
            </NavLink>
          ))}
          {isAuthenticated ? (
            <button onClick={logout} className="rounded bg-primary px-3 py-1 text-white">
              {t('common.logout')}
            </button>
          ) : (
            <NavLink to="/login" className="text-slate-600">
              {t('navigation.login')}
            </NavLink>
          )}
          {renderLanguageSwitch()}
        </nav>
      </div>
      {isMobileMenuOpen && (
        <div id="mobile-navigation" className="border-t border-slate-200 bg-white md:hidden">
          <div className="container flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2 text-slate-600">
              {navigationLinks.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `rounded px-2 py-1 ${isActive ? 'bg-primary/10 text-primary' : ''}`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="rounded bg-primary px-3 py-2 text-left font-medium text-white"
                >
                  {t('common.logout')}
                </button>
              ) : (
                <NavLink to="/login" className="rounded px-2 py-1">
                  {t('navigation.login')}
                </NavLink>
              )}
            </div>
            {renderLanguageSwitch('w-full text-center')}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
