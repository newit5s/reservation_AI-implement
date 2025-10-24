import { FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { useAuth } from '../hooks/useAuth';

const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const user = await authService.login({ email, password });
      login(user);
      navigate((location.state as { from?: Location })?.from?.pathname ?? '/', { replace: true });
    } catch (err) {
      setError('Unable to login. Please try again later.');
      console.error(err);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6 rounded-xl bg-white p-8 shadow-lg">
      <header className="space-y-2 text-center">
        <h2 className="text-2xl font-semibold text-slate-900">{t('auth.title')}</h2>
        <p className="text-slate-500">{t('auth.subtitle')}</p>
      </header>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Password</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
            required
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button type="submit" className="w-full rounded bg-primary px-4 py-2 font-medium text-white">
          {t('common.login')}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
