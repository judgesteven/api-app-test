import React, { useState } from 'react';

interface Player {
  id: string;
  name: string;
  player: string;
}

interface InputSectionProps {
  onInputChange: (field: string, value: string) => void;
  onSubmit: () => void;
  players: Player[];
  isLoading: boolean;
  account: string;
  apiKey: string;
  onStore: () => void;
  isStored: boolean;
  selectedPlayerId: string;
  onAddPlayer: (playerData: { name: string; avatar: string; imgUrl: string; playerId: string }) => void;
}

// Array of 25 avatar URLs - using placeholder images for now
const AVATAR_OPTIONS = Array.from({ length: 25 }, (_, i) => 
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 1}`
);

// Define a shared style for all input/select elements
const sharedInputStyle = {
  width: '100%',
  padding: '10px',
  borderRadius: '4px',
  border: '1px solid #ccc',
  fontSize: '1em',
  background: '#f8f9fa',
  transition: 'border 0.2s',
  boxSizing: 'border-box' as const
};

// Define a shared style for all buttons
const sharedButtonStyle = (active: boolean = false) => ({
  padding: '10px 18px',
  backgroundColor: active ? '#646cff' : '#f0f0f0',
  color: active ? 'white' : '#666',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '1em',
  fontWeight: 500,
  whiteSpace: 'nowrap' as const,
  boxShadow: '0 1px 2px rgba(100,108,255,0.08)',
  transition: 'background 0.2s, color 0.2s',
  minWidth: '100px',
  opacity: active ? 1 : 0.95
});

const InputSection: React.FC<InputSectionProps> = ({ 
  onInputChange, 
  onSubmit, 
  players, 
  isLoading,
  account,
  apiKey,
  onStore,
  isStored,
  selectedPlayerId,
  onAddPlayer
}) => {
  const [playerName, setPlayerName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState('');
  const [showAvatarGrid, setShowAvatarGrid] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);

  const handleAddPlayerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName && selectedAvatar && playerId) {
      onAddPlayer({
        name: playerName,
        avatar: selectedAvatar,
        imgUrl: selectedAvatar,
        playerId: playerId.trim()
      });
      setPlayerName('');
      setSelectedAvatar(null);
      setPlayerId('');
      setShowAddPlayer(false);
    }
  };

  return (
    <div style={{
      padding: '10px 20px',
      backgroundColor: '#f5f5f5',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      borderBottom: '2px solid #646cff'
    }}>
      {/* Account and API Key Section */}
      <div style={{ 
        display: 'flex', 
        gap: '20px', 
        alignItems: 'center',
        width: '100%'
      }}>
        <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label htmlFor="account" style={{ fontSize: '0.9em', whiteSpace: 'nowrap' }}>Account:</label>
          <input
            type="text"
            id="account"
            value={account}
            onChange={(e) => onInputChange('account', e.target.value)}
            style={{ ...sharedInputStyle, minWidth: '120px' }}
          />
        </div>
        <div style={{ flex: 3, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label htmlFor="apiKey" style={{ fontSize: '0.9em', whiteSpace: 'nowrap' }}>API Key:</label>
          <div style={{ flex: 1, display: 'flex', gap: '10px' }}>
            <input
              type={isStored ? "text" : "password"}
              id="apiKey"
              value={apiKey}
              onChange={(e) => onInputChange('apiKey', e.target.value)}
              style={{ ...sharedInputStyle, minWidth: '120px' }}
            />
            <button
              onClick={onStore}
              style={{ ...sharedButtonStyle(isStored), minWidth: '100px', flexShrink: 0 }}
            >
              {isStored ? 'Stored ✓' : 'Store'}
            </button>
          </div>
        </div>
      </div>

      {/* Player Selection and Add Player Section */}
      <div style={{ 
        display: 'flex', 
        gap: '20px', 
        alignItems: 'center',
        width: '100%'
      }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select
            id="player"
            onChange={(e) => onInputChange('player', e.target.value)}
            style={{
              ...sharedInputStyle,
              minWidth: '140px',
              background: '#f8f9fa',
              cursor: 'pointer'
            }}
            disabled={isLoading || !account}
            value={selectedPlayerId || ''}
          >
            <option key="player-default" value="">
              {!account ? 'Enter account details...' : 'Select a player...'}
            </option>
            {players.map((player, index) => (
              <option 
                key={`player-${player.player || `index-${index}`}`} 
                value={player.player}
              >
                {player.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setShowAddPlayer(!showAddPlayer)}
          style={sharedButtonStyle(showAddPlayer)}
          disabled={isLoading || !account || !apiKey}
        >
          {showAddPlayer ? 'Cancel' : '+ Add Player'}
        </button>

        <button
          onClick={onSubmit}
          style={sharedButtonStyle(true)}
          disabled={isLoading || !account}
        >
          {isLoading ? 'Loading...' : 'Go!'}
        </button>
      </div>

      {/* Add Player Form */}
      {showAddPlayer && (
        <form onSubmit={handleAddPlayerSubmit} style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '14px',
          background: '#fff',
          padding: '12px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(100,108,255,0.08)',
          marginTop: '10px',
          width: '100%',
          alignSelf: 'stretch',
          flexWrap: 'wrap'
        }}>
          <input
            type="text"
            id="playerId"
            value={playerId}
            onChange={e => setPlayerId(e.target.value)}
            placeholder="Player ID"
            style={{ ...sharedInputStyle, flex: 1, minWidth: '120px' }}
            required
          />
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Player Name"
            style={{ ...sharedInputStyle, flex: 2, minWidth: '140px' }}
            disabled={isLoading || !account || !apiKey}
          />
          <div style={{ position: 'relative', flex: 1, minWidth: '140px', display: 'flex', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setShowAvatarGrid(!showAvatarGrid)}
              style={{
                ...sharedButtonStyle(!!selectedAvatar),
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                minWidth: '110px',
                justifyContent: 'center'
              }}
              disabled={isLoading || !account || !apiKey}
            >
              {selectedAvatar ? (
                <>
                  <img 
                    src={selectedAvatar} 
                    alt="Selected avatar" 
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%'
                    }}
                  />
                  Change Avatar
                </>
              ) : (
                'Select Avatar'
              )}
            </button>
            {showAvatarGrid && (
              <div style={{
                position: 'absolute',
                top: '110%',
                left: 0,
                marginTop: '5px',
                backgroundColor: 'white',
                borderRadius: '6px',
                padding: '10px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                zIndex: 1000,
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '8px',
                maxWidth: '300px'
              }}>
                {AVATAR_OPTIONS.map((avatar, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      setSelectedAvatar(avatar);
                      setShowAvatarGrid(false);
                    }}
                    style={{
                      padding: '0',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      width: '40px',
                      height: '40px',
                      backgroundColor: selectedAvatar === avatar ? '#646cff' : 'transparent',
                      border: selectedAvatar === avatar ? '2px solid #646cff' : '2px solid transparent',
                      outline: 'none'
                    }}
                  >
                    <img 
                      src={avatar} 
                      alt={`Avatar option ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={!playerName || !selectedAvatar || isLoading || !account || !apiKey}
            style={{
              ...sharedButtonStyle(!!playerName && !!selectedAvatar && !isLoading && !!account && !!apiKey),
              flex: 1
            }}
          >
            {isLoading ? 'Adding...' : 'Add Player'}
          </button>
        </form>
      )}
    </div>
  );
};

export default InputSection; 