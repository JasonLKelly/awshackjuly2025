import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, User, BarChart3, Clock } from 'lucide-react';
import './App.css';

// Component for showing delayed prompt countdown
function DelayedPromptTimer({ delayedPrompt }) {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    const elapsed = delayedPrompt.delaySeconds - delayedPrompt.timeRemaining;
    return (elapsed / delayedPrompt.delaySeconds) * 100;
  };

  return (
    <div className="delayed-prompt-timer">
      <div className="timer-header">
        <Clock size={16} />
        <span>Monitoring Results</span>
      </div>
      <div className="timer-description">
        {delayedPrompt.description}
      </div>
      <div className="timer-progress">
        <div 
          className="timer-progress-bar" 
          style={{ width: `${getProgressPercentage()}%` }}
        />
      </div>
      <div className="timer-countdown">
        {delayedPrompt.active ? (
          <span>Reporting back in: <strong>{formatTime(delayedPrompt.timeRemaining)}</strong></span>
        ) : (
          <span className="timer-completed">✅ Completed</span>
        )}
      </div>
    </div>
  );
}

function App() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [campaignData, setCampaignData] = useState(null);
  const [campaignConfig, setCampaignConfig] = useState(null);
  const [conversationId] = useState(() => Math.random().toString(36).substring(7));
  const [delayedPrompts, setDelayedPrompts] = useState(new Map());
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scheduleDelayedPrompt = (promptId, delaySeconds, prompt, description) => {
    const startTime = Date.now();
    const endTime = startTime + (delaySeconds * 1000);
    
    const delayedPrompt = {
      id: promptId,
      prompt,
      description,
      startTime,
      endTime,
      delaySeconds,
      timeRemaining: delaySeconds,
      active: true
    };
    
    setDelayedPrompts(prev => new Map(prev.set(promptId, delayedPrompt)));
    
    // Set up interval to update countdown
    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));
      
      setDelayedPrompts(prev => {
        const updated = new Map(prev);
        const prompt = updated.get(promptId);
        if (prompt) {
          prompt.timeRemaining = remaining;
          updated.set(promptId, prompt);
        }
        return updated;
      });
      
      if (remaining <= 0) {
        clearInterval(interval);
        executeDelayedPrompt(promptId);
      }
    }, 1000);
    
    return interval;
  };
  
  const executeDelayedPrompt = async (promptId) => {
    const delayedPrompt = delayedPrompts.get(promptId);
    if (!delayedPrompt) return;
    
    // Mark as completed
    setDelayedPrompts(prev => {
      const updated = new Map(prev);
      const prompt = updated.get(promptId);
      if (prompt) {
        prompt.active = false;
        prompt.timeRemaining = 0;
        updated.set(promptId, prompt);
      }
      return updated;
    });
    
    // Send the delayed prompt to the agent
    setIsLoading(true);
    
    try {
      const response = await axios.post('/api/chat', {
        message: delayedPrompt.prompt,
        conversationId: conversationId,
        messageHistory: messages,
        isDelayedPrompt: true
      });

      const agentMessage = {
        type: 'agent',
        content: response.data.message,
        timestamp: new Date(),
        fromDelayedPrompt: true
      };

      setMessages(prev => [...prev, agentMessage]);

      // Update campaign data if received
      if (response.data.campaignData) {
        setCampaignData(response.data.campaignData);
      }
      
      // Update campaign config if received
      if (response.data.configUpdate) {
        setCampaignConfig(response.data.configUpdate);
      }
      
      // Handle new delayed prompts from response
      if (response.data.delayedPrompt) {
        const { id, delaySeconds, prompt, description } = response.data.delayedPrompt;
        scheduleDelayedPrompt(id, delaySeconds, prompt, description);
      }
      
    } catch (error) {
      console.error('Error executing delayed prompt:', error);
      const errorMessage = {
        type: 'agent',
        content: 'Sorry, I encountered an error while checking the results.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initialize conversation and load campaign config
    const initializeChat = async () => {
      setMessages([{
        type: 'agent',
        content: "Hi, I'm Rokko! I can help you optimize your ad campaign. Can you tell me a bit about your campaign? First, what's the campaign name?",
        timestamp: new Date()
      }]);
      
      // Load current campaign config
      try {
        const configResponse = await axios.get('/api/campaign-config');
        setCampaignConfig(configResponse.data);
      } catch (error) {
        console.warn('Could not load campaign config:', error);
      }
    };
    initializeChat();
  }, []);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await axios.post('/api/chat', {
        message: inputValue,
        conversationId: conversationId,
        messageHistory: messages
      });

      const agentMessage = {
        type: 'agent',
        content: response.data.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, agentMessage]);

      // Update campaign data if received
      if (response.data.campaignData) {
        setCampaignData(response.data.campaignData);
      }
      
      // Update campaign config if received
      if (response.data.configUpdate) {
        setCampaignConfig(response.data.configUpdate);
      }
      
      // Handle delayed prompts from response
      if (response.data.delayedPrompt) {
        const { id, delaySeconds, prompt, description } = response.data.delayedPrompt;
        scheduleDelayedPrompt(id, delaySeconds, prompt, description);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        type: 'agent',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="app">
      <div className="header">
        <div className="header-content">
          <Bot size={24} />
          <h1>Rokko</h1>
          <span className="subtitle">Ad Campaign Optimization Agent</span>
        </div>
      </div>

      <div className="main-container">
        <div className="chat-container">
          <div className="messages">
            {messages.map((message, index) => (
              <div key={index} className={`message ${message.type}`}>
                <div className="message-icon">
                  {message.type === 'agent' ? <Bot size={20} /> : <User size={20} />}
                </div>
                <div className="message-content">
                  <div className="message-text">
                    {message.type === 'agent' ? (
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    ) : (
                      message.content
                    )}
                  </div>
                  <div className="message-time">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message agent loading">
                <div className="message-icon">
                  <Bot size={20} />
                </div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="input-container">
            <div className="input-wrapper">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your response..."
                rows={1}
                disabled={isLoading}
              />
              <button 
                onClick={sendMessage} 
                disabled={!inputValue.trim() || isLoading}
                className="send-button"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="sidebar">
          {/* Show active delayed prompt timers */}
          {Array.from(delayedPrompts.values()).map(delayedPrompt => 
            delayedPrompt.active ? (
              <div key={delayedPrompt.id} className="sidebar-section timer-section">
                <DelayedPromptTimer delayedPrompt={delayedPrompt} />
              </div>
            ) : null
          )}
          
          <div className="sidebar-section">
            <div className="sidebar-header">
              <BarChart3 size={20} />
              <h3>Campaign Data</h3>
            </div>
            <div className="campaign-data">
              {campaignData ? (
                <pre>{JSON.stringify(campaignData, null, 2)}</pre>
              ) : (
                <p className="placeholder">Campaign details will appear here as we collect them...</p>
              )}
            </div>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-header">
              <h3>Campaign Config</h3>
            </div>
            <div className="campaign-data">
              {campaignConfig ? (
                <div>
                  <div className="config-summary">
                    <p><strong>Campaign:</strong> {campaignConfig.campaignName || 'Not set'}</p>
                    <p><strong>Target:</strong> {campaignConfig.targetAudience || 'Not set'}</p>
                    <p><strong>Version:</strong> {campaignConfig.version}</p>
                    <p><strong>Updated:</strong> {new Date(campaignConfig.lastUpdated).toLocaleTimeString()}</p>
                  </div>
                  <pre>{JSON.stringify(campaignConfig.parameters, null, 2)}</pre>
                </div>
              ) : (
                <p className="placeholder">Campaign configuration will appear here...</p>
              )}
            </div>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-header">
              <h3>Artifacts</h3>
            </div>
            <div className="artifacts">
              <p className="placeholder">Charts and visualizations will appear here...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;