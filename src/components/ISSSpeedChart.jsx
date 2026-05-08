import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Activity } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function ISSSpeedChart({ data }) {
  const chartData = {
    labels: data.map(d => d.timestamp),
    datasets: [
      {
        label: 'Speed (km/h)',
        data: data.map(d => d.speed),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
        },
        ticks: {
          color: 'var(--text-secondary)'
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'var(--text-secondary)'
        }
      }
    },
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title"><Activity size={24} /> ISS Speed Trend</h2>
      </div>
      <div className="chart-container">
        {data.length === 0 ? (
          <div className="loader-container" style={{ flexDirection: 'column', gap: '1rem' }}>
            <div className="spinner"></div>
            <div style={{ color: 'var(--text-tertiary)' }}>Waiting for speed data...</div>
          </div>
        ) : (
          <Line options={options} data={chartData} />
        )}
      </div>
    </div>
  );
}
