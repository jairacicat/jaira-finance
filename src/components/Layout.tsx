import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { Home, Plus, Wallet, Tag, BarChart3, Settings as Cog, RefreshCw } from './icons';

type Props = { children: React.ReactNode };

export default function Layout({ children }: Props) {
  const { settings, status, lastSyncAt, refresh, year, setYear } = useStore();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="safe-top sticky top-0 z-30 backdrop-blur bg-slate-950/80 border-b border-slate-900">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <button
            onClick={() => navigate('/')}
            className="text-left"
            aria-label="Home"
          >
            <div className="text-base font-semibold leading-tight">
              {settings.userName ? `Hi, ${settings.userName}` : 'Jaira Finance'}
            </div>
            <div className="text-xs text-slate-400">{settings.currency} · {settings.locale}</div>
          </button>

          <div className="flex items-center gap-2">
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="bg-slate-900 border border-slate-800 rounded-lg text-sm px-2 py-1"
              aria-label="Year"
            >
              {yearOptions().map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button
              className="btn-ghost px-2 py-2"
              onClick={() => refresh()}
              disabled={status === 'syncing'}
              aria-label="Refresh"
              title="Refresh from Google Sheet"
            >
              <RefreshCw className={`w-4 h-4 ${status === 'syncing' ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        {status === 'error' && (
          <div className="bg-rose-900/40 text-rose-200 text-sm px-4 py-2 text-center">
            {useStore.getState().error}
          </div>
        )}
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-4 pb-28">
        {children}
        {lastSyncAt && (
          <div className="text-center text-xs text-slate-500 mt-6">
            Last synced {new Date(lastSyncAt).toLocaleTimeString()}
          </div>
        )}
      </main>

      {/* Floating Add Button (mobile) */}
      {location.pathname !== '/add' && (
        <button
          onClick={() => navigate('/add')}
          className="fixed bottom-20 right-4 sm:bottom-24 sm:right-6 z-40 rounded-full w-14 h-14 bg-brand-600 hover:bg-brand-500 shadow-lg shadow-brand-900/40 flex items-center justify-center"
          aria-label="Add transaction"
        >
          <Plus className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Bottom nav */}
      <nav className="safe-bottom fixed bottom-0 inset-x-0 z-30 bg-slate-950/95 backdrop-blur border-t border-slate-900">
        <div className="max-w-3xl mx-auto grid grid-cols-5 text-xs">
          <NavTab to="/" icon={<Home className="w-5 h-5" />} label="Home" />
          <NavTab to="/charts" icon={<BarChart3 className="w-5 h-5" />} label="Charts" />
          <NavTab to="/accounts" icon={<Wallet className="w-5 h-5" />} label="Accounts" />
          <NavTab to="/categories" icon={<Tag className="w-5 h-5" />} label="Tags" />
          <NavTab to="/settings" icon={<Cog className="w-5 h-5" />} label="More" />
        </div>
      </nav>
    </div>
  );
}

function NavTab({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center py-2.5 ${isActive ? 'text-brand-500' : 'text-slate-400 hover:text-slate-200'}`
      }
    >
      {icon}
      <span className="mt-0.5">{label}</span>
    </NavLink>
  );
}

function yearOptions(): number[] {
  const now = new Date().getFullYear();
  const out: number[] = [];
  for (let y = now - 4; y <= now + 1; y++) out.push(y);
  return out.reverse();
}
