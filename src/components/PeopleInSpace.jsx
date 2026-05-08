import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users } from 'lucide-react';

export default function PeopleInSpace() {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPeople = async () => {
      try {
        // FIX: Added corsproxy to wrap the HTTP request in HTTPS for Vercel
        const res = await axios.get('https://api.allorigins.win/raw?url=http://api.open-notify.org/astros.json');
        setPeople(res.data.people);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching people in space", err);
        setLoading(false);
      }
    };
    fetchPeople();
  }, []);

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title"><Users size={24} /> People in Space</h2>
      </div>
      
      {loading ? (
        <div className="loader-container"><div className="spinner"></div></div>
      ) : (
        <>
          <div className="stat-box" style={{ marginBottom: '1rem' }}>
            <div className="stat-value">{people.length}</div>
            <div className="stat-label">Total Astronauts</div>
          </div>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {people.map((person, idx) => (
                <li key={idx} style={{ 
                  padding: '0.75rem', 
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span style={{ fontWeight: 500 }}>{person.name}</span>
                  <span style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>{person.craft}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
