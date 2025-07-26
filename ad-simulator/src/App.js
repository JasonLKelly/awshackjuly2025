import React, { useState, useCallback, useEffect } from 'react';
import './App.css';
import ConfigPanel from './ConfigPanel';
import ImpressionLogger from './ImpressionLogger';
import { generateImpression } from './ImpressionGenerator';
import { publishToKafka } from './KafkaPublisher';

// Campaign config file path
const CAMPAIGN_CONFIG_PATH = '../shared/campaign-config.json';

function App() {
  const [config, setConfig] = useState({
    campaignName: 'Local Campaign',
    impressionsPerSecond: 1,
    testMode: true,
    parameters: {
      deviceType: { mobile: 40, desktop: 50, tablet: 10 },
      location: { 'New York': 25, 'Los Angeles': 20, 'Chicago': 15, 'Houston': 10, 'Other': 30 },
      browser: { Chrome: 60, Firefox: 20, Safari: 15, Edge: 5 },
      gender: { male: 50, female: 45, other: 5 },
      age: { min: 18, max: 65 }
    }
  });
  
  const [isUsingSharedConfig, setIsUsingSharedConfig] = useState(false);
  const [sharedConfigStatus, setSharedConfigStatus] = useState('Loading...');

  const [impressions, setImpressions] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [intervalId, setIntervalId] = useState(null);

  // Load shared campaign config
  const loadSharedConfig = useCallback(async () => {
    console.log('Attempting to load shared config...');
    try {
      const response = await fetch('http://localhost:3003/api/campaign-config');
      console.log('Config API response status:', response.status);
      if (response.ok) {
        const sharedConfig = await response.json();
        console.log('Raw shared config loaded:', sharedConfig);
        setConfig(prevConfig => ({
          ...prevConfig,
          campaignName: sharedConfig.campaignName || prevConfig.campaignName,
          impressionsPerSecond: sharedConfig.impressionsPerSecond || prevConfig.impressionsPerSecond,
          testMode: sharedConfig.testMode !== undefined ? sharedConfig.testMode : prevConfig.testMode,
          parameters: {
            ...prevConfig.parameters,
            ...sharedConfig.parameters
          }
        }));
        setIsUsingSharedConfig(true);
        setSharedConfigStatus(`Using shared config v${sharedConfig.version} (${sharedConfig.campaignName || 'Unnamed'})`);
        console.log('Successfully loaded shared campaign config');
      } else {
        console.log('Shared config not available, using local settings');
        setIsUsingSharedConfig(false);
        setSharedConfigStatus('Shared config not available - using local settings');
      }
    } catch (error) {
      console.error('Error loading shared config:', error);
      setIsUsingSharedConfig(false);
      setSharedConfigStatus('Error loading shared config - using local settings');
    }
  }, []);

  // Save config to shared file
  const saveSharedConfig = useCallback(async () => {
    if (!isUsingSharedConfig) {
      console.warn('Not connected to shared config - cannot save');
      return;
    }
    
    try {
      const response = await fetch('http://localhost:3003/api/campaign-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
      });
      
      if (response.ok) {
        const savedConfig = await response.json();
        setSharedConfigStatus(`Saved v${savedConfig.version} (${savedConfig.campaignName || 'Unnamed'})`);
        console.log('Config saved successfully:', savedConfig.version);
      } else {
        throw new Error('Failed to save config');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      setSharedConfigStatus('Error saving config');
    }
  }, [config, isUsingSharedConfig]);

  // Poll for config updates
  useEffect(() => {
    loadSharedConfig();
    
    // Poll every 2 seconds for config updates
    const configPollInterval = setInterval(() => {
      loadSharedConfig();
    }, 2000);

    return () => clearInterval(configPollInterval);
  }, [loadSharedConfig]);

  const addImpression = useCallback((impression) => {
    setImpressions(prev => [impression, ...prev].slice(0, 100));
    setSessionCount(prev => prev + 1);
    
    if (!config.testMode) {
      publishToKafka(impression).catch(error => {
        console.error('Failed to publish impression to Kafka:', error);
      });
    }
  }, [config.testMode]);

  const startSimulation = useCallback(() => {
    console.log('Start button clicked, isRunning:', isRunning);
    if (isRunning) return;
    
    console.log('Starting simulation with config:', config);
    setIsRunning(true);
    setImpressions([]);
    setSessionCount(0);
    
    const interval = setInterval(() => {
      console.log('Generating impression...');
      const impression = generateImpression(config.parameters);
      addImpression(impression);
    }, 1000 / config.impressionsPerSecond);
    
    setIntervalId(interval);
    console.log('Simulation started with interval:', interval);
  }, [isRunning, config, addImpression]);

  const stopSimulation = useCallback(() => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setIsRunning(false);
  }, [intervalId]);

  // Restart simulation when config changes while running
  useEffect(() => {
    if (isRunning && intervalId) {
      console.log('Config changed, restarting simulation with new rate:', config.impressionsPerSecond);
      // Clear existing interval
      clearInterval(intervalId);
      
      // Start new interval with updated config
      const newInterval = setInterval(() => {
        const impression = generateImpression(config.parameters);
        addImpression(impression);
      }, 1000 / config.impressionsPerSecond);
      
      setIntervalId(newInterval);
    }
  }, [config.impressionsPerSecond, config.parameters, isRunning, addImpression]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Ad Viewer Simulator</h1>
        <div className="config-status">
          <span className={`config-indicator ${isUsingSharedConfig ? 'shared' : 'local'}`}>
            {isUsingSharedConfig ? '🔗 ' : '📁 '}{sharedConfigStatus}
          </span>
        </div>
      </header>
      
      <main className="App-main">
        <div className="config-section">
          <ConfigPanel 
            config={config}
            onConfigChange={setConfig}
            onStart={startSimulation}
            onStop={stopSimulation}
            isRunning={isRunning}
            isUsingSharedConfig={isUsingSharedConfig}
            onRefreshSharedConfig={loadSharedConfig}
            onSaveSharedConfig={saveSharedConfig}
          />
        </div>
        
        <div className="logger-section">
          <ImpressionLogger 
            impressions={impressions}
            sessionCount={sessionCount}
            isRunning={isRunning}
          />
        </div>
      </main>
    </div>
  );
}

export default App;