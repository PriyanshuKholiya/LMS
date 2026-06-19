import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Users, BookOpen, GraduationCap, Server } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();

  const stats = [
    { label: 'Active Students', value: '1,420', change: '+12% this month', icon: <GraduationCap size={24} color="#6366f1" /> },
    { label: 'Instructors', value: '84', change: '+4% this term', icon: <Users size={24} color="#f59e0b" /> },
    { label: 'Published Courses', value: '312', change: '+8 new drafts', icon: <BookOpen size={24} color="#10b981" /> },
    { label: 'API Server Load', value: '28%', change: 'All systems operational', icon: <Server size={24} color="#38bdf8" /> }
  ];

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>System Control Center</h1>
        <p style={{ color: 'var(--text-muted)' }}>Welcome back, {user?.name}. Overseeing platform health and records.</p>
      </div>

      <div style={styles.grid}>
        {stats.map((stat, i) => (
          <div key={i} className="glass-panel hover-scale" style={styles.card}>
            <div style={styles.cardTop}>
              <div style={styles.cardLabel}>{stat.label}</div>
              <div style={styles.cardIcon}>{stat.icon}</div>
            </div>
            <div style={styles.cardValue}>{stat.value}</div>
            <div style={styles.cardSubtext}>{stat.change}</div>
          </div>
        ))}
      </div>

      <div className="glass-panel" style={styles.systemStatus}>
        <h3 style={{ marginBottom: '16px', fontWeight: 600 }}>Active Background Tasks (BullMQ)</h3>
        <div style={styles.taskList}>
          <div style={styles.taskItem}>
            <span>AI Tutor Knowledgebase Indexer</span>
            <span style={{ ...styles.statusBadge, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>Idle</span>
          </div>
          <div style={styles.taskItem}>
            <span>Course Statistics Aggregator</span>
            <span style={{ ...styles.statusBadge, background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1' }}>Running</span>
          </div>
          <div style={styles.taskItem}>
            <span>Weekly Quiz Report Dispatcher</span>
            <span style={{ ...styles.statusBadge, background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>Scheduled</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  header: {
    marginBottom: '32px'
  },
  title: {
    fontSize: '2rem',
    fontWeight: 700,
    color: '#ffffff'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '24px',
    marginBottom: '40px'
  },
  card: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  cardLabel: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: 'var(--text-muted)'
  },
  cardIcon: {
    background: 'rgba(255, 255, 255, 0.03)',
    padding: '8px',
    borderRadius: '8px',
    display: 'flex'
  },
  cardValue: {
    fontSize: '2rem',
    fontWeight: 700,
    color: '#ffffff'
  },
  cardSubtext: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)'
  },
  systemStatus: {
    padding: '32px'
  },
  taskList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  taskItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.01)'
  },
  statusBadge: {
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: 600
  }
};
