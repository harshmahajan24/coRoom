// src/App.js
import React, { useState, useEffect } from 'react';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, provider } from './firebaseConfig';
import Editor from './components/Editor';
import { CollabProvider, useCollab, normalizeRoomId } from './hooks/useCollab';
import './App.css';

function WorkspaceHeader({ roomId, user, onLeave }) {
  const { status, synced, peers } = useCollab();

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    alert('Room ID copied!');
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(link);
    alert('Invite link copied! Share it with collaborators.');
  };

  const statusLabel = status === 'connected' && synced
    ? 'Live'
    : status === 'connected'
      ? 'Syncing'
      : status === 'connecting'
        ? 'Connecting'
        : 'Offline';

  const statusClass = status === 'connected' && synced
    ? 'live'
    : status === 'connected' || status === 'connecting'
      ? 'syncing'
      : 'offline';

  return (
    <header className="workspace-header">
      <div className="brand">
        <div className="room-logo-container">
          <img src="/logo.png" alt="CollabCode Logo" className="logo" />
          <span className="version">v1.0</span>
        </div>
      </div>

      <div className="header-center">
        <div className="session-badge">
          <span className="label">ROOM ID:</span>
          <span className="value" onClick={copyRoomId} title="Click to copy room ID">{roomId}</span>
        </div>
        <button type="button" onClick={copyInviteLink} className="invite-btn" title="Copy invite link">
          Invite
        </button>
        <div className={`connection-status ${statusClass}`} title={`Collaboration ${statusLabel.toLowerCase()}`}>
          <span className="status-dot"></span>
          <span className="status-text">{statusLabel}</span>
        </div>
        <div className="peer-count" title="Users in this room">
          <span className="peer-icon">👥</span>
          <span>{peers.length}</span>
        </div>
      </div>

      <div className="user-profile">
        <img src={user.photoURL} alt={user.displayName} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
        <span className="user-name">{user.displayName}</span>
        <button type="button" onClick={onLeave} className="header-logout-btn" title="Leave session">
          Leave
        </button>
      </div>
    </header>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [roomId, setRoomId] = useState('');


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      // Check if the browser URL already contains an explicit room path on launch
      const pathSegments = window.location.pathname.split('/');
      if (pathSegments[1] === 'room' && pathSegments[2]) {
        setRoomId(normalizeRoomId(pathSegments[2]));
        setJoined(true);
      }

      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Login failed:", err);
      alert("Failed to authenticate with Google.");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setJoined(false);
    window.history.pushState({}, '', '/');
  };

  const handleLeaveRoom = () => {
    setJoined(false);
    window.history.pushState({}, '', '/');
  };

  const generateRandomRoom = () => {
    const randomId = 'room-' + Math.random().toString(36).substring(2, 11);
    setRoomId(randomId);
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (!roomId.trim()) {
      alert('Please enter or generate a Room ID.');
      return;
    }

    const optimizedId = normalizeRoomId(roomId);
    if (!optimizedId) {
      alert('Please enter a valid Room ID.');
      return;
    }
    setRoomId(optimizedId);

    window.history.pushState({}, '', `/room/${optimizedId}`);
    setJoined(true);
  };

  if (authLoading) {
    return (
      <div className="editor-loading" style={{ height: '100vh', background: '#050811', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff' }}>
        <p>Securing authentication gates...</p>
      </div>
    );
  }

  // Phase 1: Not Logged In -> Show Google Sign-In Screen
  if (!user) {
    return (
      <div className="auth-outer-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="logo-icon">
              <img src="/logo.png" alt="coroom Logo" />
            </div>
            <p>Sign in with your Google account to access your development terminal</p>
          </div>
          <button onClick={handleGoogleLogin} className="primary-submit-btn">
            Sign In with Google ID
          </button>
        </div>
      </div>
    );
  }

  // Phase 2: Logged In but hasn't entered a room -> Show Room Form
  if (!joined) {
    return (
      <div className="auth-outer-container">
        <div className="auth-card">
          <div className="auth-header">
            <img src={user.photoURL} alt={user.displayName} style={{ width: '60px', height: '60px', borderRadius: '50%', marginBottom: '10px' }} />
            <h1>Welcome, {user.displayName}</h1>
            <p>Create a secure workstation or join an active session</p>
          </div>
          <form onSubmit={handleJoin} className="auth-form">
            <div className="input-group">
              <label>Secure Room ID</label>
              <div className="room-input-wrapper">
                <input
                  type="text"
                  placeholder="Enter existing ID or generate"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toLowerCase().trim())}
                  required
                />
                <button type="button" onClick={generateRandomRoom} className="primary-submit-btn">Auto-Gen</button>
              </div>
            </div>
            <button type="submit" className="primary-submit-btn">Initialize Workspace</button>
            <button type="button" onClick={handleLogout} className="secondary-btn" style={{ marginTop: '0.5rem', width: '100%' }}>Disconnect Account</button>
          </form>
        </div>
      </div>
    );
  }

  const collabUser = { name: user.displayName, avatar: user.photoURL, email: user.email };

  return (
    <CollabProvider roomId={roomId} user={collabUser}>
      <div className="app-workspace">
        <WorkspaceHeader
          roomId={roomId}
          user={user}
          onLeave={handleLeaveRoom}
        />
        <Editor user={collabUser} />
      </div>
    </CollabProvider>
  );
}

export default App;