import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useStore } from './store';
import Layout from './components/Layout';
import Login from './pages/Login';
import Home from './pages/Home';
import AddTransaction from './pages/AddTransaction';
import Accounts from './pages/Accounts';
import Categories from './pages/Categories';
import RecurringPage from './pages/Recurring';
import Budgets from './pages/Budgets';
import Charts from './pages/Charts';
import Settings from './pages/Settings';

export default function App() {
  const { signedIn, settings } = useStore();

  // Auto silent sign-in if we previously had a spreadsheet configured.
  useEffect(() => {
    if (!signedIn && settings.spreadsheetId) {
      useStore.getState().signIn().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!signedIn || !settings.spreadsheetId) {
    return <Login />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/add" element={<AddTransaction />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/recurring" element={<RecurringPage />} />
        <Route path="/budgets" element={<Budgets />} />
        <Route path="/charts" element={<Charts />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
