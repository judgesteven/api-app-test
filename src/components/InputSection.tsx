import React from 'react';

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
}

const InputSection: React.FC<InputSectionProps> = ({ 
  onInputChange, 
  onSubmit, 
  players, 
  isLoading,
  account,
  apiKey,
  onStore,
  isStored,
  selectedPlayerId
}) => {
  return (
    <div style={{
      height: '10vh',
      padding: '10px 20px',
      backgroundColor: '#f5f5f5',
      display: 'flex',
      alignItems: 'center',
      borderBottom: '2px solid #646cff'
    }}>
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
            style={{
              width: '100%',
              padding: '6px',
              borderRadius: '4px',
              border: '1px solid #ccc'
            }}
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
              style={{
                width: '100%',
                padding: '6px',
                borderRadius: '4px',
                border: '1px solid #ccc'
              }}
            />
            <button
              onClick={onStore}
              style={{
                padding: '6px 12px',
                backgroundColor: isStored ? '#4CAF50' : '#646cff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9em',
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              {isStored ? 'Stored ✓' : 'Store'}
            </button>
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select
            id="player"
            onChange={(e) => onInputChange('player', e.target.value)}
            style={{
              width: '100%',
              padding: '6px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              backgroundColor: 'white',
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
          onClick={onSubmit}
          style={{
            padding: '8px 24px',
            backgroundColor: '#646cff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1em',
            fontWeight: 'bold',
            height: '32px',
            whiteSpace: 'nowrap'
          }}
          disabled={isLoading || !account}
        >
          {isLoading ? 'Loading...' : 'Go!'}
        </button>
      </div>
    </div>
  );
};

export default InputSection; 