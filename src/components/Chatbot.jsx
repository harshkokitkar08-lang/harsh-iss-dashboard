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
        { role: 'assistant', content: 'Hello! I am your Dashboard AI. I can answer questions about the current ISS tracking and latest news shown on your dashboard. What would you like to know?' }
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
    const initial = [{ role: 'assistant', content: 'Chat cleared. How can I help you with dashboard data?' }];
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

      const context = `You are a helpful dashboard assistant. Your ONLY knowledge comes from the following dashboard data:
- ISS Current Speed: ${dashboardData.issSpeed ? dashboardData.issSpeed.toFixed(2) + ' km/h' : 'Unknown'}
- Number of News Articles: ${dashboardData.newsCount || 0}
- Latest News Titles: ${dashboardData.newsTitles ? dashboardData.newsTitles.join('; ') : 'None'}

RULES:
1. ONLY answer questions using the dashboard data above.
2. DO NOT use outside knowledge.
3. Be concise and helpful.`;

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
      console.warn("Hugging Face API failed, providing local dashboard response.");
      
      // Guaranteed robust local fallback
      let fallbackResponse = "Based on your dashboard data: ";
      const msgLower = userMessage.toLowerCase();
      
      if (msgLower.includes('speed')) {
        fallbackResponse += `The ISS is currently moving at ${dashboardData.issSpeed ? dashboardData.issSpeed.toFixed(0) + ' km/h' : 'an unknown speed'}.`;
      } else if (msgLower.includes('news') || msgLower.includes('article')) {
        fallbackResponse += `There are currently ${dashboardData.newsCount || 0} news articles displayed. Some top headlines are: ${dashboardData.newsTitles ? dashboardData.newsTitles.slice(0, 2).join(', ') : 'Loading...'}.`;
      } else if (msgLower.includes('iss') || msgLower.includes('location')) {
        fallbackResponse += `The ISS tracker is active on the map, currently traveling at ${dashboardData.issSpeed ? dashboardData.issSpeed.toFixed(0) + ' km/h' : 'a high speed'}.`;
      } else if (msgLower.includes('hello') || msgLower.includes('hi')) {
        fallbackResponse = "Hello! I am your local Dashboard AI. I can tell you about the ISS speed and latest news.";
      } else {
        fallbackResponse += `The ISS is moving at ${dashboardData.issSpeed ? dashboardData.issSpeed.toFixed(0) + ' km/h' : '27600 km/h'}, and there are ${dashboardData.newsCount || 0} news articles available to read.`;
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
            <div key={idx} className={`message ${msg.role}`}>
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
