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
      padding: '12px 10px',
      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      maxWidth: '800px',
      margin: '10px auto'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-evenly',
        width: '100%'
      }}>
        {/* Avatar + Name */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flex: '0 0 auto'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            overflow: 'hidden',
            border: '1px solid #646cff'
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
          <h2 style={{ margin: 0, color: '#333', fontSize: '0.9em', whiteSpace: 'nowrap' }}>{safePlayer.name}</h2>
        </div>

        {/* Points */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: '0 0 auto' }}>
          <span style={{ color: '#666', fontSize: '0.7em' }}>Points:</span>
          <span style={{ fontSize: '0.9em', fontWeight: 'bold' }}>{safePlayer.points.toLocaleString()}</span>
        </div>

        {/* Credits */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: '0 0 auto' }}>
          <span style={{ color: '#666', fontSize: '0.7em' }}>Credits:</span>
          <span style={{ fontSize: '0.9em', fontWeight: 'bold' }}>{safePlayer.credits.toLocaleString()}</span>
        </div>

        {/* Level */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: '0 0 auto' }}>
          <span style={{ color: '#666', fontSize: '0.7em' }}>Level:</span>
          <span style={{ fontSize: '0.9em', fontWeight: 'bold' }}>{safePlayer.level}</span>
        </div>

        {/* Team */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: '0 0 auto' }}>
          <span style={{ color: '#666', fontSize: '0.7em' }}>Team:</span>
          <span style={{ fontSize: '0.9em', fontWeight: 'bold' }}>{safePlayer.team}</span>
        </div>
      </div>
    </div>
  );
};

export default PlayerProfile; 