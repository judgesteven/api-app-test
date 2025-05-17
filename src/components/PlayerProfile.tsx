import React from 'react';

interface PlayerProfileProps {
  player: {
    name: string;
    avatar: string;
    level: {
      id: string;
      name: string;
      description?: string;
      imgUrl?: string;
      ordinal?: number;
    };
    team: string;
    points: number;
    credits: number;
    description?: string;
    imgUrl?: string;
    ordinal?: number;
  } | null;
  isLoading: boolean;
  teams: Record<string, string>;
}

const PlayerProfile: React.FC<PlayerProfileProps> = ({ player, isLoading, teams }) => {
  console.log('PlayerProfile received props:', { player, isLoading, teams });

  if (isLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        Loading player profile...
      </div>
    );
  }

  if (!player) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
        Select a player to view their profile
      </div>
    );
  }

  // Ensure all values are strings or numbers
  const safePlayer = {
    name: String(player.name || ''),
    avatar: String(player.avatar || player.imgUrl || ''),
    level: String(player.level?.name || 'Unknown Level'),
    team: teams[player.team] || String(player.team || ''),
    points: Number(player.points || 0),
    credits: Number(player.credits || 0),
    description: String(player.description || '')
  };

  console.log('PlayerProfile safePlayer:', {
    originalLevel: player.level,
    safeLevel: safePlayer.level,
    teams: teams
  });

  return (
    <div style={{
      padding: '16px 24px',
      background: 'linear-gradient(135deg, #646cff 0%, #535bf2 100%)',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(100, 108, 255, 0.2)',
      maxWidth: '800px',
      margin: '20px auto',
      color: 'white',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        gap: '8px',
        flexWrap: 'wrap'
      }}>
        {/* Avatar + Name */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flex: '0 0 auto',
          minWidth: '120px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            overflow: 'hidden',
            border: '2px solid white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            flexShrink: 0
          }}>
            <img 
              src={safePlayer.avatar} 
              alt={`${safePlayer.name}'s avatar`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          </div>
          <h2 style={{ 
            margin: 0, 
            color: 'white', 
            fontSize: '0.9em', 
            whiteSpace: 'nowrap', 
            textShadow: '0 1px 2px rgba(0,0,0,0.2)',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>{safePlayer.name}</h2>
        </div>

        {/* Stats Container */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flex: '1 1 auto',
          justifyContent: 'flex-end',
          flexWrap: 'wrap'
        }}>
          {/* Points */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px', 
            backgroundColor: 'rgba(255,255,255,0.1)', 
            padding: '6px 12px', 
            borderRadius: '6px',
            flexShrink: 0
          }}>
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75em' }}>Points:</span>
            <span style={{ fontSize: '0.9em', fontWeight: 'bold' }}>{safePlayer.points.toLocaleString()}</span>
          </div>

          {/* Credits */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px', 
            backgroundColor: 'rgba(255,255,255,0.1)', 
            padding: '6px 12px', 
            borderRadius: '6px',
            flexShrink: 0
          }}>
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75em' }}>Credits:</span>
            <span style={{ fontSize: '0.9em', fontWeight: 'bold' }}>{safePlayer.credits.toLocaleString()}</span>
          </div>

          {/* Level */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px', 
            backgroundColor: 'rgba(255,255,255,0.1)', 
            padding: '6px 12px', 
            borderRadius: '6px',
            flexShrink: 0
          }}>
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75em' }}>Level:</span>
            <span style={{ fontSize: '0.9em', fontWeight: 'bold' }}>{safePlayer.level}</span>
          </div>

          {/* Team */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px', 
            backgroundColor: 'rgba(255,255,255,0.1)', 
            padding: '6px 12px', 
            borderRadius: '6px',
            flexShrink: 0
          }}>
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75em' }}>Team:</span>
            <span style={{ fontSize: '0.9em', fontWeight: 'bold' }}>{safePlayer.team}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerProfile; 