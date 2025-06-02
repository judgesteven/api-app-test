import React, { useEffect, useState } from 'react';

interface Achievement {
  id: string;
  name: string;
  description?: string;
  imgUrl: string;
  granted_at?: string;
  actions?: {
    completedOn?: string;
  };
  status?: string;
}

interface PlayerProfileProps {
  player: {
    id: string;
    player_id?: string;  // Added player_id as it's used in the API
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
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoadingAchievements, setIsLoadingAchievements] = useState(false);

  useEffect(() => {
    const fetchAchievements = async () => {
      const playerId = player?.player_id || player?.id;
      const account = localStorage.getItem('account');
      const apiKey = localStorage.getItem('apiKey');
      
      if (!playerId || !account || !apiKey) {
        console.log('Missing required data:', { playerId, account, hasApiKey: !!apiKey });
        return;
      }

      try {
        const response = await fetch(`https://api.gamelayer.co/api/v0/players/${playerId}/achievements?account=${encodeURIComponent(account)}`, {
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "api-key": apiKey
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch achievements: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Achievements data:', data);
        
        let grantedAchievements: Achievement[] = [];
        if (data && data.achievements && Array.isArray(data.achievements.completed)) {
          grantedAchievements = data.achievements.completed;
        } else if (Array.isArray(data)) {
          grantedAchievements = data.filter((achievement: Achievement) => achievement.status === 'granted');
        }

        // Sort by granted date and take most recent 4
        const recentAchievements = grantedAchievements
          .sort((a, b) => {
            const dateA = a.granted_at || a.actions?.completedOn;
            const dateB = b.granted_at || b.actions?.completedOn;
            return new Date(dateB || 0).getTime() - new Date(dateA || 0).getTime();
          })
          .slice(0, 4);

        setAchievements(recentAchievements);
      } catch (error) {
        console.error('Error fetching achievements:', error);
      }
    };

    fetchAchievements();
  }, [player]);

  // Add logging for achievements state
  useEffect(() => {
    console.log('Current achievements state:', achievements);
  }, [achievements]);

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
      padding: '16px',
      background: 'linear-gradient(135deg, #646cff 0%, #535bf2 100%)',
      borderRadius: '12px',
      boxShadow: '0 4px 16px rgba(100, 108, 255, 0.2)',
      maxWidth: '800px',
      margin: '16px auto',
      color: 'white',
      width: '100%',
      boxSizing: 'border-box',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      {/* Main Content Row */}
      <div style={{
        display: 'flex',
        gap: '16px',
        alignItems: 'flex-start'
      }}>
        {/* Left Column: Avatar + Name + Stats */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          flex: '1'
        }}>
          {/* Avatar + Name */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '16px',
            borderRadius: '8px',
            backdropFilter: 'blur(4px)',
            width: '100%'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '3px solid rgba(255, 255, 255, 0.8)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
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
              fontSize: '1.1em', 
              textAlign: 'center',
              textShadow: '0 1px 2px rgba(0,0,0,0.2)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontWeight: '600',
              width: '100%'
            }}>{safePlayer.name}</h2>
          </div>

          {/* Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '8px'
          }}>
            {/* Points */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              background: 'rgba(255, 255, 255, 0.1)', 
              padding: '6px 10px', 
              borderRadius: '6px',
              backdropFilter: 'blur(4px)'
            }}>
              <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.75em', fontWeight: '500' }}>Points</span>
              <span style={{ fontSize: '0.9em', fontWeight: 'bold', color: '#fff' }}>{safePlayer.points.toLocaleString()}</span>
            </div>

            {/* Credits */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              background: 'rgba(255, 255, 255, 0.1)', 
              padding: '6px 10px', 
              borderRadius: '6px',
              backdropFilter: 'blur(4px)'
            }}>
              <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.75em', fontWeight: '500' }}>Credits</span>
              <span style={{ fontSize: '0.9em', fontWeight: 'bold', color: '#fff' }}>{safePlayer.credits.toLocaleString()}</span>
            </div>

            {/* Level */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              background: 'rgba(255, 255, 255, 0.1)', 
              padding: '6px 10px', 
              borderRadius: '6px',
              backdropFilter: 'blur(4px)'
            }}>
              <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.75em', fontWeight: '500' }}>Level</span>
              <span style={{ fontSize: '0.9em', fontWeight: 'bold', color: '#fff' }}>{safePlayer.level}</span>
            </div>

            {/* Team */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              background: 'rgba(255, 255, 255, 0.1)', 
              padding: '6px 10px', 
              borderRadius: '6px',
              backdropFilter: 'blur(4px)'
            }}>
              <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.75em', fontWeight: '500' }}>Team</span>
              <span style={{ fontSize: '0.9em', fontWeight: 'bold', color: '#fff' }}>{safePlayer.team}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Badges + Streak */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          flex: '1',
          minWidth: '280px',
          justifyContent: 'space-between'
        }}>
          {/* Most Recent Badges */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            alignItems: 'flex-start'
          }}>
            <span style={{ 
              color: 'rgba(255,255,255,0.9)', 
              fontSize: '0.8em',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              textAlign: 'left',
              width: '100%'
            }}>Recent Badges</span>
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '16px',
              borderRadius: '8px',
              backdropFilter: 'blur(4px)',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                width: '100%',
                gap: '16px'
              }}>
                {[...Array(4)].map((_, index) => {
                  const achievement = achievements[index];
                  return (
                    <div
                      key={achievement?.id || `empty-${index}`}
                      style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '50%',
                        background: achievement ? 'transparent' : 'rgba(255, 255, 255, 0.15)',
                        border: '2px solid rgba(255, 255, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(4px)',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                        flexShrink: 0,
                        aspectRatio: '1',
                        overflow: 'hidden'
                      }}
                    >
                      {achievement?.imgUrl && (
                        <img
                          src={achievement.imgUrl}
                          alt={achievement.name || 'Badge'}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Current Streak */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            alignItems: 'flex-start',
            marginTop: 'auto'
          }}>
            <span style={{ 
              color: 'rgba(255,255,255,0.9)', 
              fontSize: '0.8em',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              textAlign: 'left',
              width: '100%'
            }}>Current Streak</span>
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '16px',
              borderRadius: '8px',
              backdropFilter: 'blur(4px)',
              width: '100%'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                width: '100%',
                gap: '6px'
              }}>
                {[...Array(10)].map((_, index) => (
                  <div
                    key={index}
                    style={{
                      flex: '1',
                      aspectRatio: '1',
                      background: 'rgba(255, 255, 255, 0.15)',
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backdropFilter: 'blur(4px)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      minWidth: '0'
                    }}
                  >
                    {index < 3 && (
                      <span style={{
                        color: 'rgba(255,255,255,0.9)',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                      }}>✓</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerProfile; 