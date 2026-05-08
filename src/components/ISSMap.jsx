import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip } from 'react-leaflet';
import axios from 'axios';
import { calculateDistance } from '../utils/haversine';
import { RefreshCw, MapPin, Navigation } from 'lucide-react';
import L from 'leaflet';

// Fix for default marker icon in leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const customMarker = new L.Icon({
  iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/International_Space_Station.svg',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

export default function ISSMap({ onSpeedUpdate }) {
  const [position, setPosition] = useState(null);
  const [path, setPath] = useState([]);
  const [speed, setSpeed] = useState(0);
  const [locationName, setLocationName] = useState('Loading...');
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);

  // Fallback variables in case API fails
  const fallbackLat = useRef(20.0);
  const fallbackLon = useRef(0.0);

  const processLocation = (lat, lon, now, name) => {
    setPosition([lat, lon]);
    
    setPath(prevPath => {
      const newPath = [...prevPath, { lat, lon, timestamp: now }];
      
      // Calculate speed if we have previous points
      if (newPath.length > 1) {
        const prev = newPath[newPath.length - 2];
        const distKm = calculateDistance(prev.lat, prev.lon, lat, lon);
        const timeDiffHours = (now - prev.timestamp) / (1000 * 60 * 60); // hours
        const currentSpeed = timeDiffHours > 0 ? (distKm / timeDiffHours) : 27600; // default realistic speed
        
        setSpeed(currentSpeed);
        if (onSpeedUpdate && currentSpeed > 0) {
           onSpeedUpdate({ speed: currentSpeed, timestamp: now.toLocaleTimeString() });
        }
      } else {
        // Mock initial speed so UI isn't empty
        const initialSpeed = 27600 + (Math.random() * 500);
        setSpeed(initialSpeed);
        if (onSpeedUpdate) {
           onSpeedUpdate({ speed: initialSpeed, timestamp: now.toLocaleTimeString() });
        }
      }
      
      return newPath.slice(-15); // Keep last 15
    });

    setLocationName(name);
    setLoading(false);
  };

  const fetchISSLocation = async () => {
    try {
      const res = await axios.get('https://api.wheretheiss.at/v1/satellites/25544', { timeout: 5000 });
      const lat = parseFloat(res.data.latitude);
      const lon = parseFloat(res.data.longitude);
      
      fallbackLat.current = lat;
      fallbackLon.current = lon;

      // Reverse geocoding (Nominatim)
      let name = 'Over Ocean';
      try {
        const geoRes = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`, { timeout: 3000 });
        if (geoRes.data && geoRes.data.display_name) {
          name = geoRes.data.address.city || geoRes.data.address.country || 'Over Ocean';
        }
      } catch (err) {
        // ignore geo error, keep 'Over Ocean'
      }

      processLocation(lat, lon, new Date(), name);
    } catch (err) {
      console.warn("API Failed, using fallback simulated ISS data");
      // Simulate ISS movement (approx 0.05 degrees per 15 sec)
      fallbackLon.current += 0.05;
      if (fallbackLon.current > 180) fallbackLon.current -= 360;
      
      fallbackLat.current += (Math.random() * 0.02 - 0.01); 
      
      processLocation(fallbackLat.current, fallbackLon.current, new Date(), 'Simulated Orbit (Fallback)');
    }
  };

  useEffect(() => {
    fetchISSLocation();
    const interval = setInterval(fetchISSLocation, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (position && mapRef.current) {
      mapRef.current.setView(position, mapRef.current.getZoom());
    }
  }, [position]);

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title"><MapPin size={24} /> ISS Live Tracker</h2>
        <button className="btn btn-primary" onClick={fetchISSLocation} title="Refresh Position">
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="stats-grid" style={{ marginBottom: '1rem' }}>
        <div className="stat-box">
          <div className="stat-value">{position ? position[0].toFixed(2) : '--'}°</div>
          <div className="stat-label">Latitude</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{position ? position[1].toFixed(2) : '--'}°</div>
          <div className="stat-label">Longitude</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{speed.toFixed(0)}</div>
          <div className="stat-label">Speed (km/h)</div>
        </div>
        <div className="stat-box" style={{ gridColumn: 'span 2' }}>
          <div className="stat-value" style={{ fontSize: '1.25rem' }}>{locationName}</div>
          <div className="stat-label">Nearest Location</div>
        </div>
      </div>

      <div className="map-container">
        {loading && !position ? (
          <div className="loader-container"><div className="spinner"></div></div>
        ) : (
          <MapContainer center={position || [0, 0]} zoom={3} style={{ height: '100%', width: '100%' }} ref={mapRef}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            {position && (
              <Marker position={position} icon={customMarker}>
                <Tooltip permanent direction="top" offset={[0, -20]}>
                  ISS Here
                </Tooltip>
              </Marker>
            )}
            {path.length > 1 && (
              <Polyline positions={path.map(p => [p.lat, p.lon])} color="var(--accent-primary)" weight={3} />
            )}
          </MapContainer>
        )}
      </div>
      <div className="stat-label" style={{ textAlign: 'center', marginTop: '0.5rem' }}>
        Tracking last {path.length} positions
      </div>
    </div>
  );
}
