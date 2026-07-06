import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import Editor from './Editor';
import Sidebar from './Sidebar';
import { useCollabAwareness } from '../hooks/useCollab';
import './EditorPage.css';

function EditorPage({ user }) {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [peers, setPeers] = useState([]);
  const { getAwareness } = useCollabAwareness(roomId, user);

  useEffect(() => {
    if (getAwareness) {
      const awareness = getAwareness();
      if (awareness) {
        const updatePeers = () => {
          const states = Array.from(awareness.getStates().values());
          const peerList = states
            .filter(state => state.user)
            .map(state => ({
              name: state.user.name,
              color: state.user.color,
              avatar: state.user.avatar
            }));
          setPeers(peerList);
        };

        updatePeers();
        awareness.on('change', updatePeers);
        return () => awareness.off('change', updatePeers);
      }
    }
  }, [getAwareness]);

  // User is passed as prop from App.js - no need to check location.state
  if (!user) {
    console.error('No user found. Redirecting to login.');
    return <Navigate to="/" />;
  }

  const handleCopyRoomCode = () => {
    navigator.clipboard.writeText(roomId);
    alert('Room code copied to clipboard!');
  };

  const handleLeaveRoom = () => {
    if (window.confirm('Leave this room?')) {
      navigate('/home');
    }
  };

  return (
    <div className="editor-page">
      {/* Header */}
      <div className="editor-header">
        <div className="header-left">
          <h1 className="header-title">
            <span className="title-icon">💻</span>
            CollabCode
          </h1>
          <div className="room-info">
            <span className="room-label">Room Code:</span>
            <code className="room-code">{roomId}</code>
            <button 
              onClick={handleCopyRoomCode}
              className="copy-btn"
              title="Copy room code"
            >
              📋
            </button>
          </div>
        </div>
        <div className="header-right">
          <div className="user-display">
            {user?.photoURL && (
              <img 
                src={user.photoURL} 
                alt={user.displayName}
                className="header-avatar"
              />
            )}
            <span className="header-username">{user?.displayName}</span>
          </div>
          <button 
            onClick={handleLeaveRoom}
            className="leave-btn"
            title="Leave room"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Main Content - ✅ Sidebar FIRST (left), Editor SECOND (right) */}
      <div className="editor-content">
        <Sidebar peers={peers} roomId={roomId} currentUser={user} />
        <Editor roomId={roomId} user={user} />
      </div>
    </div>
  );
}

export default EditorPage;