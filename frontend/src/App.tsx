import { AppProvider } from './context/AppContext';
import { ToastProvider } from './context/ToastContext';
import { Dashboard } from './components/Dashboard';

function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <Dashboard />
      </ToastProvider>
    </AppProvider>
  );
}

export default App;
