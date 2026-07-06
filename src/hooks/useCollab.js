import { createContext, useContext, useState, useEffect } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

const CollabContext = createContext(null);

const CURSOR_COLORS = [
  '#ff8b06', '#4ade80', '#60a5fa', '#f472b6',
  '#a78bfa', '#fbbf24', '#34d399', '#fb7185'
];

export function normalizeRoomId(roomId) {
  if (!roomId) return '';
  return roomId.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
}

function getUserColor(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
}

function getWsUrl() {
  if (process.env.REACT_APP_WS_URL) {
    return process.env.REACT_APP_WS_URL;
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.hostname}:5000`;
}

function useCollabSetup(roomId, user) {
  const [ytext, setYtext] = useState(null);
  const [provider, setProvider] = useState(null);
  const [status, setStatus] = useState('connecting');
  const [synced, setSynced] = useState(false);
  const [peers, setPeers] = useState([]);

  useEffect(() => {
    const cleanRoomId = normalizeRoomId(roomId);
    if (!cleanRoomId) return;

    const ydoc = new Y.Doc();
    const wsProvider = new WebsocketProvider(getWsUrl(), cleanRoomId, ydoc, {
      connect: true,
      maxBackoffTime: 5000
    });

    const textInstance = ydoc.getText('codemirror');

    const optimizedAvatar = user?.avatar && user.avatar.includes('googleusercontent.com')
      ? user.avatar.split('=')[0] + '=s40-c'
      : user?.avatar || '';

    const userColor = getUserColor(user?.name || user?.email || 'anonymous');

    wsProvider.awareness.setLocalStateField('user', {
      name: user?.name || 'Anonymous User',
      color: userColor,
      avatar: optimizedAvatar
    });

    const updatePeers = () => {
      const states = Array.from(wsProvider.awareness.getStates().values());
      setPeers(
        states
          .filter(state => state.user)
          .map(state => ({
            name: state.user.name,
            color: state.user.color,
            avatar: state.user.avatar
          }))
      );
    };

    const onStatus = ({ status: connectionStatus }) => {
      setStatus(connectionStatus);
    };

    const onSync = (isSynced) => {
      setSynced(isSynced);
    };

    wsProvider.on('status', onStatus);
    wsProvider.on('sync', onSync);
    wsProvider.awareness.on('change', updatePeers);

    setYtext(textInstance);
    setProvider(wsProvider);
    updatePeers();

    return () => {
      wsProvider.awareness.off('change', updatePeers);
      wsProvider.off('status', onStatus);
      wsProvider.off('sync', onSync);
      wsProvider.disconnect();
      wsProvider.destroy();
      ydoc.destroy();
      setYtext(null);
      setProvider(null);
      setStatus('disconnected');
      setSynced(false);
      setPeers([]);
    };
  }, [roomId, user?.name, user?.avatar, user?.email]);

  return { ytext, provider, status, synced, peers };
}

export function CollabProvider({ roomId, user, children }) {
  const value = useCollabSetup(roomId, user);
  return (
    <CollabContext.Provider value={value}>
      {children}
    </CollabContext.Provider>
  );
}

export function useCollab() {
  const context = useContext(CollabContext);
  if (!context) {
    throw new Error('useCollab must be used within a CollabProvider');
  }
  return context;
}
