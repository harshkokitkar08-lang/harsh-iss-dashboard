import React, { useState } from 'react';
import { useTheme } from './hooks/useTheme';
import { Moon, Sun, LayoutDashboard } from 'lucide-react';

import ISSMap from './components/ISSMap';
import ISSSpeedChart from './components/ISSSpeedChart';
import PeopleInSpace from './components/PeopleInSpace';
import NewsDashboard from './components/NewsDashboard';
import Chatbot from './components/Chatbot';

function App() {
  const { theme, toggleTheme } = useTheme();
  const [issSpeedData, setIssSpeedData] = useState([]);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [newsData, setNewsData] = useState([]);

  const handleSpeedUpdate = (data) => {
    setCurrentSpeed(data.speed);
    setIssSpeedData(prev => {
      const newData = [...prev, data];
      return newData.slice(-30); // Keep last 30 as required
    });
  };

  const handleArticlesUpdate = (articles) => {
    setNewsData(articles);
  };

  // Prepare data for chatbot
  const dashboardDataForBot = {
    issSpeed: currentSpeed,
    newsCount: newsData.length,
    newsTitles: newsData.slice(0, 5).map(a => a.title)
  };

  return (
    <div className="app-container">
      <header className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <LayoutDashboard size={28} color="var(--accent-primary)" />
          <h1>Nexus Dashboard</h1>
        </div>
        <button className="btn-icon" onClick={toggleTheme} title="Toggle Theme" style={{ width: '40px', height: '40px' }}>
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>

      <main className="main-content">
        <div className="dashboard-grid">
          {/* Left Column: ISS Stuff */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <ISSMap onSpeedUpdate={handleSpeedUpdate} />
            <ISSSpeedChart data={issSpeedData} />
            <PeopleInSpace />
          </div>

          {/* Right Column: News Stuff */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <NewsDashboard onArticlesUpdate={handleArticlesUpdate} />
          </div>
        </div>
      </main>

      <Chatbot dashboardData={dashboardDataForBot} />
      
      <footer style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
        &copy; {new Date().getFullYear()} Nexus Dashboard • Built for Web App Challenge
      </footer>
    </div>
  );
}

export default App;
