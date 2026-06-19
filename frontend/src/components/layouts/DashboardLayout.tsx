import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const DashboardLayout: React.FC = () => {
  return (
    <div style={styles.container}>
      <Sidebar />
      <Header />
      <main style={styles.main}>
        <div style={styles.innerContent}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: 'var(--bg-main)',
    position: 'relative'
  },
  main: {
    marginLeft: '260px',
    paddingTop: '70px',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column'
  },
  innerContent: {
    flex: 1,
    padding: '32px',
    maxWidth: '1400px',
    width: '100%',
    margin: '0 auto'
  }
};
