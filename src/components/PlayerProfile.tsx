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

interface StreakData {
  id: string;
  name: string;
  countLimit: number;
  count?: number;  // Add count for active streak
  period?: string;
  reward?: {
    points: number;
    credits: number;
    achievements: any[];
  };
  active?: {
    from: string;
    to: string;
  };
  isAvailable?: boolean;
  limitCount?: boolean;
  category?: string;
  description?: string;
  imgUrl?: string;
  priority?: number;
  tags?: string[];
  account?: string;
}

interface StreakResponse {
  completed: PlayerStreak[];
  started: PlayerStreak[];
}

interface PlayerStreak {
  id: string;
  name: string;
  count: number;
  status: string;
  countLimit: number;
  limitCount: boolean;
  objectives: any[];
  account: string;
  actions?: {
    count: number;
    startedOn?: string;
    lastStreakOn?: string;
  };
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
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [playerStreak, setPlayerStreak] = useState<PlayerStreak | null>(null);
  const [isLoadingStreak, setIsLoadingStreak] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState(player);

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

  const fetchStreak = async () => {
    const apiKey = localStorage.getItem('apiKey');
    const account = localStorage.getItem('account');
    const playerId = player?.player_id || player?.id;
    const streakId = 'streak-test';
    
    if (!apiKey || !account || !playerId) {
      console.error('Missing required data:', { hasApiKey: !!apiKey, hasAccount: !!account, playerId });
      return;
    }

    setIsLoadingStreak(true);
    try {
      // Fetch the streak definition for 'streak-test'
      const streakResponse = await fetch(`https://api.gamelayer.co/api/v0/streaks/${streakId}?account=${encodeURIComponent(account)}`, {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "api-key": apiKey
        }
      });

      if (!streakResponse.ok) {
        const errorText = await streakResponse.text();
        console.error('Streak definition fetch failed:', {
          status: streakResponse.status,
          statusText: streakResponse.statusText,
          error: errorText
        });
        throw new Error(`Failed to fetch streak definition: ${streakResponse.status} ${streakResponse.statusText}`);
      }

      const streakData = await streakResponse.json();
      setStreakData(streakData);

      // Fetch the player's streaks and find progress for 'streak-test'
      const playerStreakResponse = await fetch(`https://api.gamelayer.co/api/v0/players/${playerId}/streaks?account=${encodeURIComponent(account)}`, {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "api-key": apiKey
        }
      });

      if (!playerStreakResponse.ok) {
        const errorText = await playerStreakResponse.text();
        console.error('Player streak fetch failed:', {
          status: playerStreakResponse.status,
          statusText: playerStreakResponse.statusText,
          error: errorText
        });
        throw new Error(`Failed to fetch player streak: ${playerStreakResponse.status} ${playerStreakResponse.statusText}`);
      }

      const playerStreaks = await playerStreakResponse.json();
      // Find 'streak-test' in started or completed
      let activeStreak = null;
      if (playerStreaks.started && Array.isArray(playerStreaks.started)) {
        activeStreak = playerStreaks.started.find((s: any) => s.id === streakId);
      }
      if (!activeStreak && playerStreaks.completed && Array.isArray(playerStreaks.completed)) {
        activeStreak = playerStreaks.completed.find((s: any) => s.id === streakId);
      }
      if (activeStreak) {
        setPlayerStreak({
          ...activeStreak,
          count: activeStreak.actions?.count || 0
        });
      } else {
        // If not found, initialize with default values from streakData
        setPlayerStreak({
          id: streakData.id,
          name: streakData.name,
          count: 0,
          status: 'started',
          countLimit: streakData.countLimit || 1,
          limitCount: streakData.limitCount || false,
          objectives: streakData.objectives || [],
          account: account,
          actions: { count: 0 }
        });
      }
    } catch (error) {
      console.error('Error fetching streak data:', error);
      setStreakData(null);
      setPlayerStreak(null);
    } finally {
      setIsLoadingStreak(false);
    }
  };

  // Add effect to log state changes
  useEffect(() => {
    console.log('Streak state updated:', {
      streakData,
      playerStreak,
      isLoadingStreak
    });
  }, [streakData, playerStreak, isLoadingStreak]);

  useEffect(() => {
    if (player) {
      fetchStreak();
    }
  }, [player]);

  // Add polling effect to fetch latest player data
  useEffect(() => {
    const fetchLatestPlayerData = async () => {
      const playerId = player?.player_id || player?.id;
      const account = localStorage.getItem('account');
      const apiKey = localStorage.getItem('apiKey');
      
      if (!playerId || !account || !apiKey) {
        console.log('Missing required data for player polling:', { playerId, account, hasApiKey: !!apiKey });
        return;
      }

      try {
        const response = await fetch(`https://api.gamelayer.co/api/v0/players/${playerId}?account=${encodeURIComponent(account)}`, {
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "api-key": apiKey
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch latest player data: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Latest player data from polling:', data);
        
        setCurrentPlayer({
          ...player,
          level: data.level || { name: 'Unknown Level' },
          points: data.points || 0,
          credits: data.credits || 0
        });
      } catch (error) {
        console.error('Error fetching latest player data:', error);
      }
    };

    // Initial fetch
    fetchLatestPlayerData();

    // Set up polling interval (every 10 seconds)
    const intervalId = setInterval(fetchLatestPlayerData, 10000);

    // Cleanup interval on unmount or when player changes
    return () => clearInterval(intervalId);
  }, [player]);

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

  // Update safePlayer to use currentPlayer instead of player prop
  const safePlayer = {
    name: String(currentPlayer?.name || ''),
    avatar: String(currentPlayer?.avatar || currentPlayer?.imgUrl || ''),
    level: String(currentPlayer?.level?.name || 'Unknown Level'),
    team: teams[currentPlayer?.team || ''] || String(currentPlayer?.team || ''),
    points: Number(currentPlayer?.points || 0),
    credits: Number(currentPlayer?.credits || 0),
    description: String(currentPlayer?.description || '')
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
        alignItems: 'stretch'
      }}>
        {/* Left Column: Avatar + Name + Stats */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          flex: '1',
          height: '100%'
        }}>
          {/* Avatar + Name + Stats Card */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '20px',
            borderRadius: '8px',
            backdropFilter: 'blur(4px)',
            width: '100%',
            height: '100%',
            boxSizing: 'border-box'
          }}>
            {/* Avatar + Name */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              flex: '1'
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
              gap: '8px',
              width: '100%',
              marginTop: 'auto'
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
            gap: '4px',
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
            }}>{streakData?.name || 'Loading streak...'}</span>
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '8px',
              borderRadius: '8px',
              backdropFilter: 'blur(4px)',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              {streakData ? (
                <>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '4px',
                    width: '100%',
                    marginBottom: '4px'
                  }}>
                    {Array.from({ length: streakData.countLimit }, (_, i) => {
                      const currentCount = playerStreak?.count || 0;
                      const isCompleted = i < currentCount;
                      return (
                        <div
                          key={i}
                          style={{
                            width: '36px',
                            height: '36px',
                            backgroundColor: isCompleted ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.15)',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.3em',
                            color: 'rgba(255,255,255,0.9)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            transition: 'background-color 0.2s ease',
                            margin: '0 2px'
                          }}
                        >
                          {i + 1}
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', width: '100%', padding: '10px', color: 'rgba(255,255,255,0.9)' }}>
                  No streak data available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerProfile; 