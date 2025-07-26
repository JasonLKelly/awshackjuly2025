import React from 'react';

function ImpressionLogger({ impressions, sessionCount, isRunning }) {
  const formatImpression = (impression) => {
    return `${impression.timestamp} - Ad: ${impression.adId.slice(0, 8)}... | Campaign: ${impression.campaignId.slice(0, 8)}... | ${impression.deviceType} | ${impression.gender} | Age: ${impression.age} | ${impression.browser} | ${impression.location}`;
  };

  const getCreativeImagePath = (creativeName) => {
    return `/shared/${creativeName}`;
  };

  return (
    <div className="impression-logger">
      <div className="logger-header">
        <h2>Impression Log</h2>
        <div className="status-info">
          <span className={`status ${isRunning ? 'running' : 'stopped'}`}>
            {isRunning ? 'Running' : 'Stopped'}
          </span>
          <span className="count">
            Session Count: {sessionCount}
          </span>
        </div>
      </div>
      
      <div className="log-container">
        {impressions.length === 0 ? (
          <div className="no-impressions">
            {isRunning ? 'Generating impressions...' : 'No impressions yet. Click "Start Simulation" to begin.'}
          </div>
        ) : (
          <div className="impression-list">
            {impressions.map((impression, index) => (
              <div key={`${impression.timestamp}-${index}`} className="impression-item">
                <div className="impression-row">
                  <div className="creative-thumbnail">
                    <img 
                      src={getCreativeImagePath(impression.creativeName)} 
                      alt={impression.creativeName}
                      className="thumbnail-image"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'inline';
                      }}
                    />
                    <span className="thumbnail-fallback" style={{display: 'none'}}>
                      {impression.creativeName}
                    </span>
                  </div>
                  <div className="impression-summary">
                    {formatImpression(impression)}
                  </div>
                </div>
                <details className="impression-details">
                  <summary>View Full Details</summary>
                  <pre>{JSON.stringify(impression, null, 2)}</pre>
                </details>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {impressions.length > 0 && (
        <div className="log-footer">
          <small>Showing last {Math.min(impressions.length, 100)} impressions</small>
        </div>
      )}
    </div>
  );
}

export default ImpressionLogger;