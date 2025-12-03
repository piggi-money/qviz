import { DashboardLayout } from './layout/DashboardLayout';
import { Sidebar } from './layout/Sidebar';
import { MainContent } from './layout/MainContent';
import { ConnectionModal } from './ConnectionModal';
import { useApp } from '../context/AppContext';

export function Dashboard() {
  const { state } = useApp();

  return (
    <>
      <DashboardLayout>
        <Sidebar />
        <MainContent />
      </DashboardLayout>
      
      {state.modalOpen && <ConnectionModal />}
    </>
  );
}

