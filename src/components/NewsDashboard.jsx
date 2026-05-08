import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Newspaper, Search, RefreshCw, ExternalLink } from 'lucide-react';
import NewsDistributionChart from './NewsDistributionChart';

export default function NewsDashboard({ onArticlesUpdate }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');

  const fetchNews = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      // Check localStorage first
      const cached = localStorage.getItem('news_cache');
      const cacheTime = localStorage.getItem('news_cache_time');
      
      if (!force && cached && cacheTime) {
        const now = new Date().getTime();
        // Valid for 15 minutes
        if (now - parseInt(cacheTime) < 15 * 60 * 1000) {
          const parsed = JSON.parse(cached);
          setArticles(parsed);
          if (onArticlesUpdate) onArticlesUpdate(parsed);
          setLoading(false);
          return;
        }
      }

      // Fetch from API
      const apiKey = import.meta.env.VITE_NEWS_API_KEY;
      
      let fetchedArticles = [];
      
      if (apiKey) {
        try {
          // Attempt using NewsAPI or EventRegistry based on key format
          // Here we use a general fallback if one fails
          const res = await axios.get(`https://newsapi.org/v2/top-headlines?country=us&apiKey=${apiKey}`);
          fetchedArticles = res.data.articles || [];
        } catch (apiErr) {
          console.warn("NewsAPI failed, trying EventRegistry", apiErr);
          try {
            const res = await axios.get(`https://eventregistry.org/api/v1/event/getBreakingEvents?breakingEventsMinBreakingScore=0.2&apiKey=${apiKey}`);
            // Map EventRegistry response to common format
            if (res.data && res.data.breakingEvents) {
               fetchedArticles = res.data.breakingEvents.map(event => ({
                 title: event.title.eng || event.title,
                 source: { name: 'Event Registry' },
                 author: 'Unknown',
                 publishedAt: event.eventDate,
                 urlToImage: event.images ? event.images[0] : null,
                 description: event.summary.eng || '',
                 url: event.articleUrls ? event.articleUrls[0] : '#'
               }));
            }
          } catch (e2) {
             throw new Error("Both APIs failed or Invalid Key");
          }
        }
      } else {
        // Fallback dummy data if no key is provided
        console.warn("No VITE_NEWS_API_KEY provided. Using sample data.");
        fetchedArticles = [
          {
            title: "NASA's Artemis Program Hits New Milestone",
            source: { name: "Space.com" },
            author: "Jane Doe",
            publishedAt: new Date().toISOString(),
            urlToImage: "https://images.unsplash.com/photo-1517976487492-5750f3195933?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
            description: "NASA has completed the latest engine test for the upcoming Artemis II mission...",
            url: "#",
            category: "Space"
          },
          {
            title: "Tech Giants Announce New AI Guidelines",
            source: { name: "TechCrunch" },
            author: "John Smith",
            publishedAt: new Date(Date.now() - 3600000).toISOString(),
            urlToImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
            description: "Leading technology companies have agreed on a new set of ethical guidelines for AI development.",
            url: "#",
            category: "Technology"
          },
          {
            title: "Global Markets Rally on Positive Economic Data",
            source: { name: "Bloomberg" },
            author: "Alice Johnson",
            publishedAt: new Date(Date.now() - 7200000).toISOString(),
            urlToImage: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
            description: "Stock markets around the world saw significant gains today following better-than-expected jobs reports.",
            url: "#",
            category: "Finance"
          },
          {
            title: "New Mars Rover Discovers Ancient Riverbed",
            source: { name: "Science Daily" },
            author: "Dr. Robert Chen",
            publishedAt: new Date(Date.now() - 86400000).toISOString(),
            urlToImage: "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
            description: "The perseverance rover has sent back images showing clear signs of ancient water flow on Mars.",
            url: "#",
            category: "Science"
          },
          {
            title: "Electric Vehicle Sales Surge in Europe",
            source: { name: "Reuters" },
            author: "Emma Wilson",
            publishedAt: new Date(Date.now() - 172800000).toISOString(),
            urlToImage: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
            description: "European auto markets report a record-breaking quarter for electric vehicle adoption.",
            url: "#",
            category: "Automotive"
          }
        ];
      }

      // Filter out articles without titles
      fetchedArticles = fetchedArticles.filter(a => a.title && a.title !== "[Removed]");
      
      // Add pseudo-categories if they don't exist for the pie chart
      const categories = ['Technology', 'Science', 'Business', 'Health', 'General'];
      fetchedArticles = fetchedArticles.map((a, i) => ({
        ...a,
        category: a.category || categories[i % categories.length]
      }));

      // Take first 10
      const finalArticles = fetchedArticles.slice(0, 10);
      
      setArticles(finalArticles);
      if (onArticlesUpdate) onArticlesUpdate(finalArticles);
      
      localStorage.setItem('news_cache', JSON.stringify(finalArticles));
      localStorage.setItem('news_cache_time', new Date().getTime().toString());
      
    } catch (err) {
      console.error("Error fetching news:", err);
      setError("Failed to load news. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  // Filter and Sort
  const filteredArticles = articles
    .filter(a => a.title.toLowerCase().includes(search.toLowerCase()) || 
                 (a.source.name && a.source.name.toLowerCase().includes(search.toLowerCase())))
    .sort((a, b) => {
      if (sortOrder === 'newest') return new Date(b.publishedAt) - new Date(a.publishedAt);
      if (sortOrder === 'oldest') return new Date(a.publishedAt) - new Date(b.publishedAt);
      if (sortOrder === 'source') return a.source.name.localeCompare(b.source.name);
      return 0;
    });

  return (
    <>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title"><Newspaper size={24} /> Latest News</h2>
          <button className="btn btn-primary" onClick={() => fetchNews(true)} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spinner' : ''} style={{ animation: loading ? 'spin 1s linear infinite' : 'none', border: 'none' }} />
            Refresh
          </button>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <div className="input-group" style={{ flex: 1, minWidth: '200px', marginBottom: 0 }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input 
                type="text" 
                className="input" 
                placeholder="Search articles or sources..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '2.5rem', width: '100%' }}
              />
            </div>
          </div>
          <select 
            className="select" 
            value={sortOrder} 
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="source">Sort by Source</option>
          </select>
        </div>

        {error && (
          <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '0.5rem', marginBottom: '1rem' }}>
            {error}
            <button className="btn btn-secondary" style={{ marginLeft: '1rem' }} onClick={() => fetchNews(true)}>Retry</button>
          </div>
        )}

        {loading && !articles.length ? (
          <div className="loader-container"><div className="spinner"></div></div>
        ) : (
          <div className="news-grid">
            {filteredArticles.slice(0, 5).map((article, idx) => (
              <div className="news-card" key={idx}>
                <img 
                  src={article.urlToImage || 'https://via.placeholder.com/400x200?text=No+Image'} 
                  alt={article.title} 
                  className="news-img"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/400x200?text=No+Image'; }}
                />
                <div className="news-content">
                  <div className="news-meta">
                    <span>{article.source.name}</span>
                    <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="news-title" title={article.title}>{article.title}</h3>
                  <p className="news-desc">{article.description || 'No description available for this article. Click read more to view the full content on the source website.'}</p>
                  <a href={article.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ marginTop: 'auto' }}>
                    Read More <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            ))}
            {filteredArticles.length === 0 && !loading && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)' }}>
                No articles found matching your criteria.
              </div>
            )}
          </div>
        )}
      </div>

      <NewsDistributionChart articles={articles} />
    </>
  );
}
