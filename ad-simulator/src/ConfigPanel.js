import React from 'react';
import './ConfigPanel.css';

function ConfigPanel({ config, onConfigChange, onStart, onStop, isRunning, isUsingSharedConfig, onRefreshSharedConfig, onSaveSharedConfig }) {
  const updateConfig = (path, value) => {
    const newConfig = { ...config };
    const keys = path.split('.');
    let current = newConfig;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    onConfigChange(newConfig);
  };

  const updateParameterWeight = (param, key, value) => {
    const newWeights = { ...config.parameters[param] };
    newWeights[key] = parseInt(value) || 0;
    updateConfig(`parameters.${param}`, newWeights);
  };

  return (
    <div className="config-panel">
      <div className="config-header">
        <h2>Configuration</h2>
        {isUsingSharedConfig && (
          <div className="config-actions">
            <button 
              className="refresh-button"
              onClick={onRefreshSharedConfig}
              disabled={isRunning}
              title="Refresh shared config"
            >
              🔄 Refresh
            </button>
            <button 
              className="save-button"
              onClick={onSaveSharedConfig}
              disabled={isRunning}
              title="Save changes to shared config"
            >
              💾 Save
            </button>
          </div>
        )}
      </div>
      
      {isUsingSharedConfig && (
        <div className="config-notice">
          <p>ℹ️ Using shared campaign configuration. Changes can be saved back to the shared file using the Save button.</p>
        </div>
      )}
      
      <div className="config-group">
        <h3>General Settings</h3>
        
        <div className="form-group">
          <label>Campaign Name:</label>
          <input
            type="text"
            value={config.campaignName || ''}
            onChange={(e) => updateConfig('campaignName', e.target.value)}
            disabled={isRunning}
            placeholder="Enter campaign name"
          />
          {isUsingSharedConfig && (
            <span className="config-shared">🔗 Shared config</span>
          )}
        </div>
        
        <div className="form-group">
          <label>Impressions per Second:</label>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={config.impressionsPerSecond}
            onChange={(e) => updateConfig('impressionsPerSecond', parseFloat(e.target.value) || 1)}
            disabled={isRunning}
          />
          {isUsingSharedConfig && (
            <span className="config-shared">🔗 Shared config</span>
          )}
        </div>
        
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={config.testMode}
              onChange={(e) => updateConfig('testMode', e.target.checked)}
              disabled={isRunning}
            />
            Test Mode (log only, don't send to Kafka)
            {isUsingSharedConfig && (
              <span className="config-shared">🔗 Shared config</span>
            )}
          </label>
        </div>
      </div>
      
      <div className="config-group">
        <h3>Parameter Weights (%)</h3>
        
        <div className="parameter-group">
          <h4>Device Type</h4>
          {Object.entries(config.parameters.deviceType).map(([key, value]) => (
            <div key={key} className="form-group inline">
              <label>{key}:</label>
              <input
                type="number"
                min="0"
                max="100"
                value={value}
                onChange={(e) => updateParameterWeight('deviceType', key, e.target.value)}
                disabled={isRunning}
              />
            </div>
          ))}
        </div>
        
        <div className="parameter-group">
          <h4>Gender</h4>
          {Object.entries(config.parameters.gender).map(([key, value]) => (
            <div key={key} className="form-group inline">
              <label>{key}:</label>
              <input
                type="number"
                min="0"
                max="100"
                value={value}
                onChange={(e) => updateParameterWeight('gender', key, e.target.value)}
                disabled={isRunning}
              />
            </div>
          ))}
        </div>
        
        <div className="parameter-group">
          <h4>Browser</h4>
          {Object.entries(config.parameters.browser).map(([key, value]) => (
            <div key={key} className="form-group inline">
              <label>{key}:</label>
              <input
                type="number"
                min="0"
                max="100"
                value={value}
                onChange={(e) => updateParameterWeight('browser', key, e.target.value)}
                disabled={isRunning}
              />
            </div>
          ))}
        </div>
        
        <div className="parameter-group">
          <h4>Age Range</h4>
          <div className="form-group inline">
            <label>Min:</label>
            <input
              type="number"
              min="18"
              max="100"
              value={config.parameters.age.min}
              onChange={(e) => updateConfig('parameters.age.min', parseInt(e.target.value) || 18)}
              disabled={isRunning}
            />
          </div>
          <div className="form-group inline">
            <label>Max:</label>
            <input
              type="number"
              min="18"
              max="100"
              value={config.parameters.age.max}
              onChange={(e) => updateConfig('parameters.age.max', parseInt(e.target.value) || 65)}
              disabled={isRunning}
            />
          </div>
        </div>

        {config.parameters.creatives && (
          <div className="parameter-group">
            <h4>Creatives</h4>
            {Object.entries(config.parameters.creatives).map(([filename, probability]) => (
              <div key={filename} className="form-group inline">
                <label>{filename}:</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={probability}
                  onChange={(e) => updateParameterWeight('creatives', filename, e.target.value)}
                  disabled={isRunning}
                />
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="control-buttons">
        {!isRunning ? (
          <button className="start-button" onClick={onStart}>
            Start Simulation
          </button>
        ) : (
          <button className="stop-button" onClick={onStop}>
            Stop Simulation
          </button>
        )}
      </div>
    </div>
  );
}

export default ConfigPanel;