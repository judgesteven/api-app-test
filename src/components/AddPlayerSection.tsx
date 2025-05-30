import React, { useState } from 'react';

interface AddPlayerSectionProps {
  onAddPlayer: (playerData: { name: string; avatar: string }) => void;
  isLoading: boolean;
  account: string;
  apiKey: string;
}

// Array of 25 avatar URLs - using placeholder images for now
const AVATAR_OPTIONS = Array.from({ length: 25 }, (_, i) => 
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 1}`
);

const AddPlayerSection: React.FC<AddPlayerSectionProps> = ({ 
  onAddPlayer, 
  isLoading, 
  account,
  apiKey 
}) => {
  const [playerName, setPlayerName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [showAvatarGrid, setShowAvatarGrid] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName && selectedAvatar) {
      onAddPlayer({
        name: playerName,
        avatar: selectedAvatar
      });
      setPlayerName('');
      setSelectedAvatar(null);
    }
  };

  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#f8f9fa',
      borderRadius: '12px',
      marginBottom: '20px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      <form onSubmit={handleSubmit} style={{
        display: 'flex',
        gap: '15px',
        alignItems: 'flex-start',
        flexWrap: 'wrap'
      }}>
        {/* Player Name Input */}
        <div style={{ flex: '1 1 200px' }}>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter player name"
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              fontSize: '1em'
            }}
            disabled={isLoading || !account || !apiKey}
          />
        </div>

        {/* Avatar Selection Button */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setShowAvatarGrid(!showAvatarGrid)}
            style={{
              padding: '10px 20px',
              backgroundColor: selectedAvatar ? '#646cff' : '#f0f0f0',
              color: selectedAvatar ? 'white' : '#666',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '1em'
            }}
            disabled={isLoading || !account || !apiKey}
          >
            {selectedAvatar ? (
              <>
                <img 
                  src={selectedAvatar} 
                  alt="Selected avatar" 
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%'
                  }}
                />
                Change Avatar
              </>
            ) : (
              'Select Avatar'
            )}
          </button>

          {/* Avatar Grid */}
          {showAvatarGrid && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: '0',
              marginTop: '10px',
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '15px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              zIndex: 1000,
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '10px',
              maxWidth: '400px'
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
                    width: '50px',
                    height: '50px',
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

        {/* Add Player Button */}
        <button
          type="submit"
          disabled={!playerName || !selectedAvatar || isLoading || !account || !apiKey}
          style={{
            padding: '10px 24px',
            backgroundColor: (!playerName || !selectedAvatar || isLoading || !account || !apiKey) 
              ? '#ccc' 
              : '#646cff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: (!playerName || !selectedAvatar || isLoading || !account || !apiKey) 
              ? 'not-allowed' 
              : 'pointer',
            fontSize: '1em',
            fontWeight: 'bold',
            transition: 'all 0.2s ease',
            opacity: (!playerName || !selectedAvatar || isLoading || !account || !apiKey) ? 0.7 : 1
          }}
        >
          {isLoading ? 'Adding...' : 'Add Player'}
        </button>
      </form>
    </div>
  );
};

export default AddPlayerSection; 