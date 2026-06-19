import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Brain, Sparkles, BookOpen, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>Welcome Back, {user?.name.split(' ')[0]}!</h1>
        <p style={{ color: 'var(--text-muted)' }}>Ready to continue your learning journey? Your AI Tutor is active.</p>
      </div>

      <div style={styles.grid}>
        <div style={styles.mainCol}>
          <div className="glass-panel" style={styles.aiBanner}>
            <div style={styles.aiBannerIcon}>
              <Brain size={32} color="#818cf8" />
            </div>
            <div style={styles.aiBannerContent}>
              <h3 style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                AI Tutor Active <Sparkles size={18} color="#f59e0b" />
              </h3>
              <p style={{ color: '#c7d2fe', fontSize: '0.9rem', margin: '6px 0 16px 0', lineHeight: 1.5 }}>
                Have questions about your Deep Learning assignments or Database quiz topics? Ask your personalized RAG tutor for instant, context-aware assistance based on course slides!
              </p>
              <Link to="/student/ai-tutor" className="btn btn-primary" style={{ background: '#ffffff', color: '#1e1b4b' }}>
                Chat with AI Tutor
              </Link>
            </div>
          </div>

          <div className="glass-panel" style={styles.recentActivity}>
            <h3 style={{ marginBottom: '20px', fontWeight: 600 }}>Active Courses</h3>
            <div style={styles.courseMiniList}>
              <div style={styles.courseMiniItem}>
                <div style={styles.courseDetails}>
                  <h4 style={{ fontWeight: 600 }}>Intro to Deep Learning</h4>
                  <div style={styles.progressBarBg}>
                    <div style={{ ...styles.progressBarFill, width: '45%' }}></div>
                  </div>
                </div>
                <div style={styles.progressText}>45% Complete</div>
              </div>

              <div style={styles.courseMiniItem}>
                <div style={styles.courseDetails}>
                  <h4 style={{ fontWeight: 600 }}>Database Systems</h4>
                  <div style={styles.progressBarBg}>
                    <div style={{ ...styles.progressBarFill, width: '75%' }}></div>
                  </div>
                </div>
                <div style={styles.progressText}>75% Complete</div>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.sidebarCol}>
          <div className="glass-panel" style={styles.actionCard}>
            <h4 style={{ fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GraduationCap size={20} color="var(--primary)" />
              Next Assignment
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Deep Learning Assignment 2: Backprop is due in 2 days.
            </p>
            <Link to="/student/my-enrollments" className="btn btn-secondary" style={{ width: '100%', fontSize: '0.85rem' }}>
              View Homework
            </Link>
          </div>

          <div className="glass-panel" style={styles.actionCard}>
            <h4 style={{ fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={20} color="#10b981" />
              Explore Catalogue
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Browse and register for new courses in Web Development, Networking, or System Design.
            </p>
            <Link to="/student/courses" className="btn btn-primary" style={{ width: '100%', fontSize: '0.85rem' }}>
              View Catalog
            </Link>
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
    gridTemplateColumns: '2fr 1fr',
    gap: '24px'
  },
  mainCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  aiBanner: {
    background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.4) 0%, rgba(124, 58, 237, 0.3) 100%)',
    border: '1px solid rgba(129, 140, 248, 0.3)',
    padding: '32px',
    display: 'flex',
    gap: '20px',
    alignItems: 'flex-start'
  },
  aiBannerIcon: {
    background: 'rgba(255, 255, 255, 0.1)',
    padding: '12px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  aiBannerContent: {
    flex: 1
  },
  recentActivity: {
    padding: '32px'
  },
  courseMiniList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  courseMiniItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.01)'
  },
  courseDetails: {
    flex: 1,
    maxWidth: '70%',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  progressBarBg: {
    height: '6px',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: '3px',
    width: '100%',
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: 'var(--primary)',
    borderRadius: '3px'
  },
  progressText: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--text-muted)'
  },
  sidebarCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  actionCard: {
    padding: '24px'
  }
};
