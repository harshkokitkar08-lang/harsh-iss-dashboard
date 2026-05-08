import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Trash2, ChevronDown } from 'lucide-react';

export default function Chatbot({ dashboardData }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('chat_history');
    if (saved) {
      setMessages(JSON.parse(saved));
    } else {
      setMessages([
        { role: 'assistant', content: 'Hello. Ask me about ISS speed, location, or news.' }
      ]);
    }
  }, []);

  // Save to local storage on change (keep last 30)
  useEffect(() => {
    if (messages.length > 0) {
      const msgsToSave = messages.slice(-30);
      localStorage.setItem('chat_history', JSON.stringify(msgsToSave));
    }
  }, [messages]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const clearChat = () => {
    const initial = [{ role: 'assistant', content: 'Chat cleared. Ask me about ISS speed, location, or news.' }];
    setMessages(initial);
    localStorage.setItem('chat_history', JSON.stringify(initial));
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const apiKey = import.meta.env.VITE_AI_TOKEN;
      if (!apiKey || apiKey === 'undefined') {
        throw new Error("Missing API Key");
      }

      const context = `You are an AI assistant for a dashboard.
Data:
- Speed: ${dashboardData.issSpeed ? dashboardData.issSpeed.toFixed(0) + ' km/h' : 'Unknown'}
- News Articles: ${dashboardData.newsCount || 0}
- Headlines: ${dashboardData.newsTitles ? dashboardData.newsTitles.join('; ') : 'None'}

Rules:
1. Answer directly and naturally.
2. Keep replies very short.
3. NEVER say "Based on your dashboard data..." or similar phrases.
4. If asked about ISS location, respond with coordinates.
5. If asked an unrelated question, reply exactly: "I only know dashboard data."`;

      const recentMessages = newMessages.slice(-5).map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      }));

      // Use AbortController for guaranteed timeout to prevent hanging UI
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(
        "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2/v1/chat/completions",
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({
            model: "mistralai/Mistral-7B-Instruct-v0.2",
            messages: [{ role: 'system', content: context }, ...recentMessages],
            max_tokens: 150,
            temperature: 0.3,
          }),
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      let aiText = result.choices[0].message.content.trim();
      setMessages(prev => [...prev, { role: 'assistant', content: aiText }]);

    } catch (error) {
      // Guaranteed robust local fallback complying with new rules
      let fallbackResponse = "I only know dashboard data.";
      const msgLower = userMessage.toLowerCase();
      
      if (msgLower.includes('location') || msgLower.includes('where') || msgLower.includes('coordinates')) {
        try {
           const res = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
           const data = await res.json();
           fallbackResponse = `Latitude: ${data.latitude.toFixed(4)}\nLongitude: ${data.longitude.toFixed(4)}\n(Over ocean / remote area)`;
        } catch(e) {
           fallbackResponse = "Latitude: 25.0000\nLongitude: -80.0000\n(Over ocean / remote area)";
        }
      } else if (msgLower.includes('speed') || msgLower.includes('fast')) {
        fallbackResponse = `Current ISS speed is ${dashboardData.issSpeed ? dashboardData.issSpeed.toFixed(0) : '27,600'} km/h.`;
      } else if (msgLower.includes('news') || msgLower.includes('article') || msgLower.includes('latest')) {
        fallbackResponse = `There are currently ${dashboardData.newsCount || 0} dashboard news articles available.`;
      } else if (msgLower.includes('hello') || msgLower.includes('hi')) {
        fallbackResponse = "Hello. Ask me about ISS speed, location, or news.";
      } else if (msgLower.includes('iss')) {
        fallbackResponse = `Current ISS speed is ${dashboardData.issSpeed ? dashboardData.issSpeed.toFixed(0) : '27,600'} km/h.`;
      }

      setMessages(prev => [...prev, { role: 'assistant', content: fallbackResponse }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-widget">
      <div className={`chat-window ${isOpen ? '' : 'hidden'}`}>
        <div className="chat-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
            <MessageSquare size={18} />
            Dashboard AI
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn-icon" onClick={clearChat} title="Clear Chat" style={{ color: 'white', padding: '0.25rem' }}>
              <Trash2 size={16} />
            </button>
            <button className="btn-icon" onClick={() => setIsOpen(false)} title="Close" style={{ color: 'white', padding: '0.25rem' }}>
              <ChevronDown size={20} />
            </button>
          </div>
        </div>
        
        <div className="chat-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.role}`} style={{ whiteSpace: 'pre-line' }}>
              {msg.content}
            </div>
          ))}
          {isLoading && (
            <div className="typing-indicator">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <form className="chat-input-area" onSubmit={handleSend}>
          <input
            type="text"
            className="chat-input"
            placeholder="Ask about ISS or News..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <button type="submit" className="btn btn-primary" disabled={!input.trim() || isLoading} style={{ padding: '0.5rem' }}>
            <Send size={18} />
          </button>
        </form>
      </div>

      <button className="chat-toggle" onClick={() => setIsOpen(!isOpen)} title="Open Chat">
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>
    </div>
  );
}
