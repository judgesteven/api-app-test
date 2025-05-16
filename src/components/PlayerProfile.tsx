import React from 'react';

interface PlayerProfileProps {
  player: {
    name: string;
    avatar: string;
    level: {
      name: string;
      description?: string;
      imgUrl?: string;
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
    levelDescription: String(player.level?.description || ''),
    levelImage: String(player.level?.imgUrl || ''),
    team: teams[player.team] || String(player.team || ''),
    points: Number(player.points || 0),
    credits: Number(player.credits || 0),
    description: String(player.description || '')
  };

  return (
    <div style={{
      padding: '20px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      maxWidth: '600px',
      margin: '20px auto'
    }}>
      <div style={{
        display: 'flex',
        gap: '20px',
        alignItems: 'center'
      }}>
        <div style={{
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          overflow: 'hidden',
          border: '2px solid #646cff'
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
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: '0 0 10px 0', color: '#333' }}>{safePlayer.name}</h2>
          {safePlayer.description && (
            <p style={{ color: '#666', marginBottom: '15px' }}>{safePlayer.description}</p>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            <div>
              <div style={{ color: '#666', fontSize: '0.9em' }}>Level</div>
              <div style={{ fontSize: '1.2em', fontWeight: 'bold' }}>{safePlayer.level}</div>
            </div>
            <div>
              <div style={{ color: '#666', fontSize: '0.9em' }}>Team</div>
              <div style={{ fontSize: '1.2em', fontWeight: 'bold' }}>{safePlayer.team}</div>
            </div>
            <div>
              <div style={{ color: '#666', fontSize: '0.9em' }}>Points</div>
              <div style={{ fontSize: '1.2em', fontWeight: 'bold' }}>{safePlayer.points.toLocaleString()}</div>
            </div>
            <div>
              <div style={{ color: '#666', fontSize: '0.9em' }}>Credits</div>
              <div style={{ fontSize: '1.2em', fontWeight: 'bold' }}>{safePlayer.credits.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerProfile; 