import React, { useEffect, useState } from 'react';
import './Sidebar.css';

function Sidebar({ peers, roomId, currentUser }) {
  const [onlinePeers, setOnlinePeers] = useState([]);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    // Include current user in the list
    if (currentUser) {
      const currentUserPeer = {
        name: currentUser.displayName,
        avatar: currentUser.photoURL,
        color: '#00ff41',
        isCurrentUser: true
      };
      
      // Combine current user with other peers
      const allPeers = [
        currentUserPeer,
        ...peers.filter(p => p.name !== currentUser.displayName)
      ];
      
      setOnlinePeers(allPeers);
    }
  }, [peers, currentUser]);

  return (
    <div className={`sidebar ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="sidebar-header">
        <div className="header-content">
          <h3>👥 Members</h3>
          <span className="member-count">{onlinePeers.length}</span>
        </div>
        <button 
          className="toggle-btn"
          onClick={() => setIsExpanded(!isExpanded)}
          title={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? '→' : '←'}
        </button>
      </div>

      {isExpanded && (
        <div className="sidebar-content">
          <div className="members-list">
            {onlinePeers.length === 0 ? (
              <div className="no-members">
                <p>No members online</p>
              </div>
            ) : (
              onlinePeers.map((peer, idx) => (
                <div 
                  key={idx}
                  className={`member-item ${peer.isCurrentUser ? 'current-user' : ''}`}
                  style={{
                    borderLeftColor: peer.color || '#00ff41'
                  }}
                >
                  <div className="member-avatar">
                    {peer.avatar ? (
                      <img 
                        src={peer.avatar}
                        alt={peer.name}
                        className="avatar-image"
                      />
                    ) : (
                      <div 
                        className="avatar-placeholder"
                        style={{ backgroundColor: peer.color || '#00ff41' }}
                      >
                        {peer.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="online-indicator"></div>
                  </div>
                  <div className="member-info">
                    <div className="member-name">
                      {peer.name}
                      {peer.isCurrentUser && <span className="you-badge">(You)</span>}
                    </div>
                    <div className="member-status">
                      <span className="status-dot" style={{ backgroundColor: peer.color || '#00ff41' }}></span>
                      <span>Editing</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="sidebar-section">
            <h4>Room Details</h4>
            <div className="room-details">
              <div className="detail-item">
                <span className="detail-label">Code:</span>
                <code className="detail-value">{roomId}</code>
              </div>
              <div className="detail-item">
                <span className="detail-label">Active:</span>
                <span className="detail-value">{onlinePeers.length}</span>
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <h4>Shortcuts</h4>
            <div className="shortcuts-list">
              <div className="shortcut-item">
                <kbd>Ctrl+Enter</kbd>
                <span>Run Code</span>
              </div>
              <div className="shortcut-item">
                <kbd>Ctrl+/</kbd>
                <span>Comment Line</span>
              </div>
              <div className="shortcut-item">
                <kbd>Tab</kbd>
                <span>Indent</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sidebar;