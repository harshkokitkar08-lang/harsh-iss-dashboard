import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { PieChart } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function NewsDistributionChart({ articles }) {
  // Calculate distribution by category
  const distribution = articles.reduce((acc, article) => {
    const category = article.category || 'General';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  const data = {
    labels: Object.keys(distribution),
    datasets: [
      {
        data: Object.values(distribution),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',   // blue
          'rgba(16, 185, 129, 0.8)',   // green
          'rgba(245, 158, 11, 0.8)',   // amber
          'rgba(239, 68, 68, 0.8)',    // red
          'rgba(139, 92, 246, 0.8)',   // purple
          'rgba(14, 165, 233, 0.8)',   // sky
        ],
        borderColor: 'var(--bg-secondary)',
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: 'var(--text-primary)',
          padding: 20,
          font: {
            family: "'Inter', sans-serif",
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleFont: { size: 14, family: "'Inter', sans-serif" },
        bodyFont: { size: 13, family: "'Inter', sans-serif" },
        padding: 12,
        cornerRadius: 8,
        displayColors: true
      }
    },
    cutout: '65%'
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title"><PieChart size={24} /> News Distribution</h2>
      </div>
      <div className="chart-container" style={{ height: '300px' }}>
        {articles.length === 0 ? (
          <div className="loader-container">
            <div style={{ color: 'var(--text-tertiary)' }}>No data available</div>
          </div>
        ) : (
          <Doughnut data={data} options={options} />
        )}
      </div>
    </div>
  );
}
