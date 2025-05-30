import React, { useState } from 'react';
import { toast } from 'react-toastify';

interface Mission {
  id: string;
  name: string;
  description?: string;
  points?: number;
  credits?: number;
  status?: string;
  imgUrl?: string;
  priority?: number;
  reward?: {
    points?: number;
    credits?: number;
  };
  active?: {
    from: string;
    to: string;
  };
}

interface Achievement {
  id: string;
  name: string;
  description?: string;
  imgUrl?: string;
  status?: string;
  progress?: number;
  total?: number;
  reward?: {
    points?: number;
    credits?: number;
  };
  unlocked_at?: string;
}

interface Event {
  id: string;
  name: string;
  description?: string;
  status?: string;
}

interface Prize {
  id: string;
  name: string;
  description?: string;
  points?: number;
  credits?: number;
  imgUrl?: string;
  stock?: {
    redeemed: number;
    available: number;
    count: number;
  };
  expires_at?: string;
  end_date?: string;
  active?: {
    from: string;
    to: string;
  };
}

interface MissionsProps {
  missions: Mission[];
  events: Event[];
  isLoading: boolean;
  playerProfile?: any;
  onRefresh: () => Promise<void>;
  apiKey?: string;
}

interface CompletedMission {
  id: string;
  name: string;
  completed_at: string;
  completion_count: number;
  first_completed_at: string;
}

interface GrantedAchievement {
  id: string;
  name: string;
  granted_at: string;
}

interface RedeemedPrize {
  id: string;
  name: string;
  redeemed_at: string;
  credits_spent: number;
}

const Missions: React.FC<MissionsProps> = ({ missions, events, isLoading, playerProfile, onRefresh, apiKey }) => {
  const [activeTab, setActiveTab] = useState<'missions' | 'prizes' | 'leaderboard' | 'awards' | 'player'>('missions');
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: 'placeholder1',
      name: 'First Steps',
      description: 'Complete your first mission',
      imgUrl: 'https://placehold.co/80x80?text=First',
      progress: 75,
      total: 100,
      status: 'In Progress'
    },
    {
      id: 'placeholder2',
      name: 'Prize Hunter',
      description: 'Claim your first prize',
      imgUrl: 'https://placehold.co/80x80?text=Prize',
      progress: 50,
      total: 100,
      status: 'In Progress'
    }
  ]);
  const [isLoadingPrizes, setIsLoadingPrizes] = useState(false);
  const [isLoadingAchievements, setIsLoadingAchievements] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [hoveredBadge, setHoveredBadge] = useState<string | null>(null);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [hoveredAvatar, setHoveredAvatar] = useState(false);
  const [hoveredProfile, setHoveredProfile] = useState(false);
  const [completedMissions, setCompletedMissions] = useState<CompletedMission[]>([]);
  const [grantedAchievements, setGrantedAchievements] = useState<GrantedAchievement[]>([]);
  const [redeemedPrizes, setRedeemedPrizes] = useState<RedeemedPrize[]>([]);
  const [isLoadingPlayerHistory, setIsLoadingPlayerHistory] = useState(false);

  // Add a helper function to safely get string values
  const getStringValue = (value: any): string => {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') {
      if (value.name) return value.name;
      if (value.id) return value.id;
      return '';
    }
    return '';
  };

  const handleEventComplete = async (eventId: string) => {
    try {
      const account = localStorage.getItem('account');
      const playerId = playerProfile?.player_id || playerProfile?.id;

      console.log('Event completion attempt:', {
        eventId,
        account,
        playerId,
        playerProfile
      });

      if (!account || !playerId) {
        console.error('Missing required data:', {
          hasAccount: !!account,
          hasPlayerId: !!playerId,
          playerProfile
        });
        toast.error('Missing account or player information');
        return;
      }

      const response = await fetch(`https://api.gamelayer.co/api/v0/events/${eventId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'api-key': localStorage.getItem('apiKey') || ''
        },
        body: JSON.stringify({
          player: playerId,
          account: account
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(errorData?.message || 'Failed to complete event');
      }

      // Just consume the response without assigning it to a variable
      await response.json();
      toast.success('Success!');
      setSelectedEvent('');
      // Refresh player profile and missions data
      await onRefresh();
    } catch (error) {
      console.error('Error completing event:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to complete event');
    }
  };

  const getTimeRemaining = (endDate: string) => {
    console.log('Calculating time remaining for date:', endDate);
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) {
      return 'Expired';
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);

    return parts.join(' ') || 'Less than a minute';
  };

  const fetchPrizes = async () => {
    if (!playerProfile?.player_id) {
      console.log('No player ID available for fetching prizes');
      return;
    }

    const apiKey = localStorage.getItem('apiKey');
    const account = localStorage.getItem('account');
    
    if (!apiKey || !account) {
      console.error('Missing required data:', { hasApiKey: !!apiKey, hasAccount: !!account });
      toast.error('API key or account is missing');
      return;
    }

    setIsLoadingPrizes(true);
    try {
      const response = await fetch(`https://api.gamelayer.co/api/v0/prizes?account=${encodeURIComponent(account)}&player=${encodeURIComponent(playerProfile.player_id)}`, {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "api-key": apiKey
        }
      });

      if (response.status === 401) {
        throw new Error('Unauthorized: Please check your API key');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Failed to fetch prizes: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Prizes data from API:', data);
      // Log each prize's expiration data
      if (Array.isArray(data)) {
        data.forEach(prize => {
          console.log('Prize expiration data:', {
            name: prize.name,
            expires_at: prize.expires_at,
            active: prize.active,
            end_date: prize.end_date
          });
        });
      }
      setPrizes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching prizes:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch prizes');
    } finally {
      setIsLoadingPrizes(false);
    }
  };

  const fetchAchievements = async () => {
    const apiKey = localStorage.getItem('apiKey');
    const account = localStorage.getItem('account');
    
    if (!apiKey || !account) {
      console.error('Missing required data:', { hasApiKey: !!apiKey, hasAccount: !!account });
      toast.error('API key or account is missing');
      return;
    }

    setIsLoadingAchievements(true);
    try {
      const response = await fetch(`https://api.gamelayer.co/api/v0/achievements?account=${encodeURIComponent(account)}`, {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "api-key": apiKey
        }
      });

      if (response.status === 401) {
        throw new Error('Unauthorized: Please check your API key');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Failed to fetch achievements: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Achievements data from API:', data);
      setAchievements(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch achievements');
    } finally {
      setIsLoadingAchievements(false);
    }
  };

  const fetchLeaderboard = async () => {
    const account = localStorage.getItem('account');
    if (!apiKey || !account) {
      console.error('Missing required data:', { hasApiKey: !!apiKey, hasAccount: !!account });
      toast.error('API key or account is missing');
      return;
    }
    setIsLoadingLeaderboard(true);
    try {
      // Use the correct leaderboard endpoint and id
      const response = await fetch(`https://api.gamelayer.co/api/v0/leaderboards/1-test-leaderboard?account=${encodeURIComponent(account)}`, {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "api-key": apiKey
        }
      });
      if (response.status === 401) {
        throw new Error('Unauthorized: Please check your API key');
      }
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Failed to fetch leaderboard: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      console.log('Leaderboard data from API:', data);
      // Defensive: always set leaderboard to an array
      const entries = Array.isArray(data)
        ? data
        : Array.isArray(data.leaderboard)
          ? data.leaderboard
          : [];
      setLeaderboard(entries);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch leaderboard');
    } finally {
      setIsLoadingLeaderboard(false);
    }
  };

  const fetchPlayerHistory = async () => {
    const playerId = playerProfile?.player_id || playerProfile?.id;
    const account = localStorage.getItem('account');
    
    if (!apiKey || !playerId || !account) {
      console.error('Missing required data:', { 
        hasApiKey: !!apiKey, 
        hasPlayerId: !!playerId,
        hasAccount: !!account,
        playerProfile 
      });
      toast.error('API key, player ID, or account is missing');
      return;
    }

    console.log('Starting player history fetch with:', { 
      playerId, 
      account, 
      apiKey: apiKey.substring(0, 5) + '...',
      playerProfile 
    });

    setIsLoadingPlayerHistory(true);
    try {
      // Fetch player missions
      const missionsUrl = `https://api.gamelayer.co/api/v0/players/${playerId}/missions?account=${encodeURIComponent(account)}`;
      console.log('Fetching missions from:', missionsUrl);
      
      const missionsResponse = await fetch(missionsUrl, {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "api-key": apiKey
        }
      });

      console.log('Missions response:', {
        status: missionsResponse.status,
        statusText: missionsResponse.statusText,
        headers: Object.fromEntries(missionsResponse.headers.entries())
      });

      if (!missionsResponse.ok) {
        const errorText = await missionsResponse.text();
        console.error('Missions error response:', errorText);
        throw new Error(`Failed to fetch missions: ${missionsResponse.status} ${missionsResponse.statusText}`);
      }

      const missionsData = await missionsResponse.json();
      console.log('Raw missions data:', missionsData);
      
      // Handle the nested missions structure
      const completedMissionsData = missionsData?.missions?.completed?.map((mission: any) => {
        const completedAt = mission.actions?.completedOn || mission.actions?.firstCompletedOn;
        const firstCompletedAt = mission.actions?.firstCompletedOn || mission.actions?.completedOn;
        
        console.log('Mission date processing:', {
          name: mission.name,
          completedAt,
          firstCompletedAt,
          actions: mission.actions
        });
        
        return {
          id: mission.id,
          name: mission.name,
          completed_at: completedAt,
          completion_count: mission.actions?.count || 1,
          first_completed_at: firstCompletedAt
        };
      }) || [];
      
      console.log('Processed completed missions:', completedMissionsData);
      setCompletedMissions(completedMissionsData);

      // Fetch player achievements
      const achievementsUrl = `https://api.gamelayer.co/api/v0/players/${playerId}/achievements?account=${encodeURIComponent(account)}`;
      console.log('Fetching achievements from:', achievementsUrl);
      
      const achievementsResponse = await fetch(achievementsUrl, {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "api-key": apiKey
        }
      });

      console.log('Achievements response:', {
        status: achievementsResponse.status,
        statusText: achievementsResponse.statusText,
        headers: Object.fromEntries(achievementsResponse.headers.entries())
      });

      if (!achievementsResponse.ok) {
        const errorText = await achievementsResponse.text();
        console.error('Achievements error response:', errorText);
        throw new Error(`Failed to fetch achievements: ${achievementsResponse.status} ${achievementsResponse.statusText}`);
      }

      const achievementsData = await achievementsResponse.json();
      console.log('Raw achievements data:', achievementsData);
      const grantedAchievementsData = Array.isArray(achievementsData)
        ? achievementsData.filter((achievement: any) => achievement.status === 'granted')
        : [];
      console.log('Filtered granted achievements:', grantedAchievementsData);
      setGrantedAchievements(grantedAchievementsData);

      // Fetch player prizes
      const prizesUrl = `https://api.gamelayer.co/api/v0/players/${playerId}/prizes/redeemed?account=${encodeURIComponent(account)}`;
      console.log('Fetching redeemed prizes from:', prizesUrl);
      
      const prizesResponse = await fetch(prizesUrl, {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "api-key": apiKey
        }
      });

      console.log('Prizes response:', {
        status: prizesResponse.status,
        statusText: prizesResponse.statusText,
        headers: Object.fromEntries(prizesResponse.headers.entries())
      });

      if (!prizesResponse.ok) {
        const errorText = await prizesResponse.text();
        console.error('Prizes error response:', errorText);
        throw new Error(`Failed to fetch prizes: ${prizesResponse.status} ${prizesResponse.statusText}`);
      }

      const prizesData = await prizesResponse.json();
      console.log('Raw redeemed prizes data:', prizesData);
      
      let redeemedPrizesData = [];
      
      // Process redeemed prizes
      if (Array.isArray(prizesData)) {
        redeemedPrizesData = prizesData.map((prize: any) => ({
          id: prize.id,
          name: prize.name,
          redeemed_at: prize.redeemed_at,
          credits_spent: prize.credits_spent
        }));
      } else if (prizesData?.prizes && Array.isArray(prizesData.prizes)) {
        redeemedPrizesData = prizesData.prizes.map((prize: any) => ({
          id: prize.id,
          name: prize.name,
          redeemed_at: prize.redeemed_at,
          credits_spent: prize.credits_spent
        }));
      }
      
      console.log('Processed redeemed prizes:', redeemedPrizesData);
      setRedeemedPrizes(redeemedPrizesData);

      // Log final state
      console.log('Final state after fetching:', {
        completedMissions: completedMissionsData,
        grantedAchievements: grantedAchievementsData,
        redeemedPrizes: redeemedPrizesData
      });

    } catch (error) {
      console.error('Error fetching player history:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch player history');
    } finally {
      setIsLoadingPlayerHistory(false);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'prizes' && playerProfile?.player_id) {
      fetchPrizes();
    } else if (activeTab === 'awards' && playerProfile?.player_id) {
      fetchAchievements();
    } else if (activeTab === 'leaderboard') {
      fetchLeaderboard();
    } else if (activeTab === 'player' && playerProfile?.player_id) {
      fetchPlayerHistory();
    }
  }, [activeTab, playerProfile?.player_id]);

  if (isLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ 
        display: 'flex', 
        gap: '20px', 
        marginBottom: '20px',
        borderBottom: '1px solid #e0e0e0',
        padding: '0 20px',
        position: 'relative'
      }}>
        <button
          onClick={() => setActiveTab('missions')}
          style={{
            padding: '12px 24px',
            backgroundColor: activeTab === 'missions' ? '#646cff' : 'transparent',
            color: activeTab === 'missions' ? 'white' : '#666',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.1em',
            fontWeight: 'bold',
            borderRadius: '8px 8px 0 0',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            marginBottom: '-1px',
            borderBottom: activeTab === 'missions' ? '3px solid #646cff' : 'none',
            boxShadow: activeTab === 'missions' ? '0 -2px 4px rgba(0,0,0,0.1)' : 'none',
            transform: activeTab === 'missions' ? 'scale(1.05)' : 'scale(1)'
          }}
        >
          Missions
        </button>
        <button
          onClick={() => setActiveTab('prizes')}
          style={{
            padding: '12px 24px',
            backgroundColor: activeTab === 'prizes' ? '#646cff' : 'transparent',
            color: activeTab === 'prizes' ? 'white' : '#666',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.1em',
            fontWeight: 'bold',
            borderRadius: '8px 8px 0 0',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            marginBottom: '-1px',
            borderBottom: activeTab === 'prizes' ? '3px solid #646cff' : 'none',
            boxShadow: activeTab === 'prizes' ? '0 -2px 4px rgba(0,0,0,0.1)' : 'none',
            transform: activeTab === 'prizes' ? 'scale(1.05)' : 'scale(1)'
          }}
        >
          Prizes
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          style={{
            padding: '12px 24px',
            backgroundColor: activeTab === 'leaderboard' ? '#646cff' : 'transparent',
            color: activeTab === 'leaderboard' ? 'white' : '#666',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.1em',
            fontWeight: 'bold',
            borderRadius: '8px 8px 0 0',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            marginBottom: '-1px',
            borderBottom: activeTab === 'leaderboard' ? '3px solid #646cff' : 'none',
            boxShadow: activeTab === 'leaderboard' ? '0 -2px 4px rgba(0,0,0,0.1)' : 'none',
            transform: activeTab === 'leaderboard' ? 'scale(1.05)' : 'scale(1)'
          }}
        >
          Leaderboard
        </button>
        <button
          onClick={() => setActiveTab('awards')}
          style={{
            padding: '12px 24px',
            backgroundColor: activeTab === 'awards' ? '#646cff' : 'transparent',
            color: activeTab === 'awards' ? 'white' : '#666',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.1em',
            fontWeight: 'bold',
            borderRadius: '8px 8px 0 0',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            marginBottom: '-1px',
            borderBottom: activeTab === 'awards' ? '3px solid #646cff' : 'none',
            boxShadow: activeTab === 'awards' ? '0 -2px 4px rgba(0,0,0,0.1)' : 'none',
            transform: activeTab === 'awards' ? 'scale(1.05)' : 'scale(1)'
          }}
        >
          Awards
        </button>
        <button
          onClick={() => setActiveTab('player')}
          style={{
            padding: '12px 24px',
            backgroundColor: activeTab === 'player' ? '#646cff' : 'transparent',
            color: activeTab === 'player' ? 'white' : '#666',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.1em',
            fontWeight: 'bold',
            borderRadius: '8px 8px 0 0',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            marginBottom: '-1px',
            borderBottom: activeTab === 'player' ? '3px solid #646cff' : 'none',
            boxShadow: activeTab === 'player' ? '0 -2px 4px rgba(0,0,0,0.1)' : 'none',
            transform: activeTab === 'player' ? 'scale(1.05)' : 'scale(1)',
            marginLeft: 'auto'
          }}
        >
          Player
        </button>
      </div>

      <div style={{ 
        minHeight: '400px', 
        position: 'relative'
      }}>
        <div style={{
          width: '100%',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: activeTab === 'missions' ? 1 : 0,
          transform: activeTab === 'missions' ? 'translateX(0)' : 'translateX(-20px)',
          pointerEvents: activeTab === 'missions' ? 'auto' : 'none',
          visibility: activeTab === 'missions' ? 'visible' : 'hidden',
          position: activeTab === 'missions' ? 'relative' : 'absolute'
        }}>
          <div style={{
            padding: '20px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            maxWidth: '800px',
            margin: '20px auto',
            opacity: isLoading ? 0.5 : 1,
            transition: 'all 0.3s ease',
            transform: isLoading ? 'scale(0.98)' : 'scale(1)'
          }}>
            {playerProfile && events && events.length > 0 && (
              <div style={{
                marginBottom: '20px',
                display: 'flex',
                gap: '10px',
                alignItems: 'center',
                transition: 'all 0.3s ease'
              }}>
                <select
                  value={selectedEvent}
                  onChange={(e) => setSelectedEvent(e.target.value)}
                  style={{
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    flex: 1,
                    transition: 'all 0.3s ease',
                    transform: selectedEvent ? 'scale(1.02)' : 'scale(1)',
                    boxShadow: selectedEvent ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  <option value="">Complete an Event</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => selectedEvent && handleEventComplete(selectedEvent)}
                  disabled={!selectedEvent}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: selectedEvent ? '#646cff' : '#ccc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: selectedEvent ? 'pointer' : 'not-allowed',
                    transition: 'all 0.3s ease',
                    transform: selectedEvent ? 'scale(1.05)' : 'scale(1)',
                    boxShadow: selectedEvent ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  Go!
                </button>
              </div>
            )}
            <div style={{ 
              display: 'grid', 
              gap: '20px',
              gridTemplateColumns: 'repeat(auto-fit, minmax(45%, 1fr))'
            }}>
              {missions.map((mission) => {
                const isHovered = hoveredCard === mission.id;
                const points = mission.points || mission.reward?.points;
                const credits = mission.credits || mission.reward?.credits;
                
                console.log('Mission data:', {
                  name: mission.name,
                  points,
                  credits,
                  reward: mission.reward,
                  active: mission.active,
                  priority: mission.priority
                });

                return (
                  <div
                    key={mission.id || `mission-${Math.random()}`}
                    style={{
                      padding: '20px',
                      border: `1px solid ${isHovered ? '#646cff' : '#e0e0e0'}`,
                      borderRadius: '12px',
                      backgroundColor: '#f8f8f8',
                      display: 'flex',
                      gap: '20px',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      width: '100%',
                      gridColumn: mission.priority === 2 ? 'auto' : '1 / -1',
                      transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                      boxShadow: isHovered ? '0 4px 8px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.05)'
                    }}
                    onMouseEnter={() => setHoveredCard(mission.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    {/* Mission Image */}
                    <div style={{
                      width: mission.priority === 2 ? '90px' : '120px',
                      height: '100%',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      flexShrink: 0,
                      backgroundColor: '#e0e0e0',
                      alignSelf: 'stretch',
                      transition: 'all 0.3s ease',
                      transform: isHovered ? 'scale(1.05)' : 'scale(1)'
                    }}>
                      <img 
                        src={mission.imgUrl || 'https://placehold.co/120x400?text=Mission'} 
                        alt={mission.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'all 0.3s ease',
                          transform: isHovered ? 'scale(1.1)' : 'scale(1)'
                        }}
                      />
                    </div>

                    {/* Mission Content */}
                    <div style={{ flex: 1, padding: '0 8px' }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '10px'
                      }}>
                        <h3 style={{ 
                          margin: 0,
                          color: isHovered ? '#646cff' : '#333',
                          fontSize: mission.priority === 2 ? '1em' : '1.2em',
                          fontWeight: 'bold',
                          transition: 'all 0.3s ease'
                        }}>
                          {mission.name || 'Unnamed Mission'}
                        </h3>
                      </div>
                      
                      {mission.description && (
                        <p style={{ 
                          color: isHovered ? '#646cff' : '#666', 
                          marginBottom: '15px',
                          fontSize: mission.priority === 2 ? '0.85em' : '0.95em',
                          lineHeight: '1.4',
                          textAlign: 'left',
                          cursor: mission.priority === 2 ? 'help' : 'default',
                          transition: 'all 0.3s ease'
                        }}
                        title={mission.priority === 2 ? mission.description : undefined}
                        >
                          {mission.priority === 2 
                            ? mission.description.length > 100 
                              ? `${mission.description.substring(0, 100)}...`
                              : mission.description
                            : mission.description}
                        </p>
                      )}

                      {/* Mission Stats */}
                      <div style={{ 
                        display: 'flex', 
                        gap: '20px',
                        marginTop: 'auto',
                        flexWrap: mission.priority === 2 ? 'nowrap' : 'wrap',
                        justifyContent: mission.priority === 2 ? 'flex-start' : 'space-between',
                        alignItems: 'center',
                        width: '100%'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          gap: mission.priority === 2 ? '10px' : '20px', 
                          flexWrap: mission.priority === 2 ? 'nowrap' : 'wrap',
                          alignItems: 'center',
                          flex: mission.priority === 2 ? 'none' : 'auto'
                        }}>
                          {points !== undefined && (
                            <div style={{
                              backgroundColor: '#646cff',
                              color: 'white',
                              padding: mission.priority === 2 ? '4px 8px' : '6px 12px',
                              borderRadius: '6px',
                              fontSize: mission.priority === 2 ? '0.75em' : '0.9em',
                              display: 'flex',
                              alignItems: 'center',
                              gap: mission.priority === 2 ? '4px' : '6px',
                              whiteSpace: 'nowrap',
                              transition: 'all 0.3s ease',
                              transform: hoveredBadge === `points-${mission.id}` ? 'scale(1.05)' : 'scale(1)',
                              boxShadow: hoveredBadge === `points-${mission.id}` ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                              height: mission.priority === 2 ? '28px' : 'auto',
                              flexShrink: 0
                            }}
                            onMouseEnter={() => setHoveredBadge(`points-${mission.id}`)}
                            onMouseLeave={() => setHoveredBadge(null)}
                            >
                              <span style={{ fontWeight: 'bold' }}>Points:</span>
                              <span>{points.toLocaleString()}</span>
                            </div>
                          )}
                          {credits !== undefined && (
                            <div style={{
                              backgroundColor: '#4CAF50',
                              color: 'white',
                              padding: mission.priority === 2 ? '4px 8px' : '6px 12px',
                              borderRadius: '6px',
                              fontSize: mission.priority === 2 ? '0.75em' : '0.9em',
                              display: 'flex',
                              alignItems: 'center',
                              gap: mission.priority === 2 ? '4px' : '6px',
                              whiteSpace: 'nowrap',
                              transition: 'all 0.3s ease',
                              transform: hoveredBadge === `credits-${mission.id}` ? 'scale(1.05)' : 'scale(1)',
                              boxShadow: hoveredBadge === `credits-${mission.id}` ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                              height: mission.priority === 2 ? '28px' : 'auto',
                              flexShrink: 0
                            }}
                            onMouseEnter={() => setHoveredBadge(`credits-${mission.id}`)}
                            onMouseLeave={() => setHoveredBadge(null)}
                            >
                              <span style={{ fontWeight: 'bold' }}>Credits:</span>
                              <span>{credits.toLocaleString()}</span>
                            </div>
                          )}
                          {mission.status && (
                            <div style={{
                              backgroundColor: '#ff9800',
                              color: 'white',
                              padding: mission.priority === 2 ? '4px 8px' : '6px 12px',
                              borderRadius: '6px',
                              fontSize: mission.priority === 2 ? '0.75em' : '0.9em',
                              display: 'flex',
                              alignItems: 'center',
                              gap: mission.priority === 2 ? '4px' : '6px',
                              whiteSpace: 'nowrap',
                              transition: 'all 0.3s ease',
                              transform: hoveredBadge === `status-${mission.id}` ? 'scale(1.05)' : 'scale(1)',
                              boxShadow: hoveredBadge === `status-${mission.id}` ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                              height: mission.priority === 2 ? '28px' : 'auto',
                              flexShrink: 0
                            }}
                            onMouseEnter={() => setHoveredBadge(`status-${mission.id}`)}
                            onMouseLeave={() => setHoveredBadge(null)}
                            >
                              <span style={{ fontWeight: 'bold' }}>Status:</span>
                              <span>{mission.status}</span>
                            </div>
                          )}
                          {mission.active?.to && (
                            <div style={{
                              color: '#666',
                              fontSize: mission.priority === 2 ? '0.75em' : '0.9em',
                              display: 'flex',
                              alignItems: 'center',
                              position: 'relative',
                              cursor: 'help',
                              padding: mission.priority === 2 ? '4px' : '6px',
                              backgroundColor: isHovered ? '#e0e0e0' : '#f0f0f0',
                              borderRadius: '6px',
                              flexShrink: 0,
                              transition: 'all 0.3s ease',
                              transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                              height: mission.priority === 2 ? '28px' : 'auto'
                            }}
                            title={`Expires in: ${getTimeRemaining(mission.active.to)}`}
                            >
                              <svg 
                                width={mission.priority === 2 ? '16' : '20'} 
                                height={mission.priority === 2 ? '16' : '20'} 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke={isHovered ? '#646cff' : '#666'} 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                              >
                                <circle cx="12" cy="12" r="10"/>
                                <polyline points="12 6 12 12 16 14"/>
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{
          width: '100%',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: activeTab === 'prizes' ? 1 : 0,
          transform: activeTab === 'prizes' ? 'translateX(0)' : 'translateX(20px)',
          pointerEvents: activeTab === 'prizes' ? 'auto' : 'none',
          visibility: activeTab === 'prizes' ? 'visible' : 'hidden',
          position: activeTab === 'prizes' ? 'relative' : 'absolute'
        }}>
          <div style={{ 
            opacity: isLoadingPrizes ? 0.5 : 1,
            transition: 'all 0.3s ease',
            transform: isLoadingPrizes ? 'scale(0.98)' : 'scale(1)'
          }}>
            {isLoadingPrizes ? (
              <div style={{ 
                textAlign: 'center', 
                color: '#666',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
              }}>
                Loading prizes...
              </div>
            ) : prizes.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                color: '#666',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
              }}>
                No prizes available
              </div>
            ) : (
              <div style={{
                padding: '20px',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                maxWidth: '800px',
                margin: '20px auto'
              }}>
                <div style={{ 
                  display: 'grid', 
                  gap: '20px',
                  gridTemplateColumns: '1fr'
                }}>
                  {prizes.map((prize) => {
                    const isHovered = hoveredCard === prize.id;
                    return (
                      <div
                        key={prize.id}
                        style={{
                          padding: '20px',
                          border: `1px solid ${isHovered ? '#646cff' : '#e0e0e0'}`,
                          borderRadius: '12px',
                          backgroundColor: '#f8f8f8',
                          display: 'flex',
                          gap: '20px',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer',
                          width: '100%',
                          transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                          boxShadow: isHovered ? '0 4px 8px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.05)'
                        }}
                        onMouseEnter={() => setHoveredCard(prize.id)}
                        onMouseLeave={() => setHoveredCard(null)}
                      >
                        {/* Prize Image */}
                        <div style={{
                          width: '120px',
                          height: '100%',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          flexShrink: 0,
                          backgroundColor: '#e0e0e0',
                          alignSelf: 'stretch',
                          transition: 'all 0.3s ease',
                          transform: isHovered ? 'scale(1.05)' : 'scale(1)'
                        }}>
                          <img 
                            src={prize.imgUrl || 'https://placehold.co/120x400?text=Prize'} 
                            alt={prize.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              transition: 'all 0.3s ease',
                              transform: isHovered ? 'scale(1.1)' : 'scale(1)'
                            }}
                          />
                        </div>

                        {/* Prize Content */}
                        <div style={{ flex: 1, padding: '0 8px' }}>
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: '10px'
                          }}>
                            <h3 style={{ 
                              margin: 0,
                              color: isHovered ? '#646cff' : '#333',
                              fontSize: '1.2em',
                              fontWeight: 'bold',
                              transition: 'all 0.3s ease'
                            }}>
                              {prize.name}
                            </h3>
                          </div>
                          
                          {prize.description && (
                            <p style={{ 
                              color: isHovered ? '#646cff' : '#666', 
                              marginBottom: '15px',
                              fontSize: '0.95em',
                              lineHeight: '1.4',
                              textAlign: 'left',
                              transition: 'all 0.3s ease'
                            }}>
                              {prize.description}
                            </p>
                          )}

                          {/* Prize Stats */}
                          <div style={{ 
                            display: 'flex', 
                            gap: '20px',
                            marginTop: 'auto',
                            flexWrap: 'wrap',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            width: '100%'
                          }}>
                            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                              {prize.points !== undefined && (
                                <div style={{
                                  backgroundColor: '#646cff',
                                  color: 'white',
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  fontSize: '0.9em',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  transition: 'all 0.3s ease',
                                  transform: hoveredBadge === `points-${prize.id}` ? 'scale(1.05)' : 'scale(1)',
                                  boxShadow: hoveredBadge === `points-${prize.id}` ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                                }}
                                onMouseEnter={() => setHoveredBadge(`points-${prize.id}`)}
                                onMouseLeave={() => setHoveredBadge(null)}
                                >
                                  <span style={{ fontWeight: 'bold' }}>Points:</span>
                                  <span>{prize.points.toLocaleString()}</span>
                                </div>
                              )}
                              {prize.credits !== undefined && (
                                <div style={{
                                  backgroundColor: '#4CAF50',
                                  color: 'white',
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  fontSize: '0.9em',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  transition: 'all 0.3s ease',
                                  transform: hoveredBadge === `credits-${prize.id}` ? 'scale(1.05)' : 'scale(1)',
                                  boxShadow: hoveredBadge === `credits-${prize.id}` ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                                }}
                                onMouseEnter={() => setHoveredBadge(`credits-${prize.id}`)}
                                onMouseLeave={() => setHoveredBadge(null)}
                                >
                                  <span style={{ fontWeight: 'bold' }}>Credits:</span>
                                  <span>{prize.credits.toLocaleString()}</span>
                                </div>
                              )}
                              <div style={{
                                backgroundColor: '#ff9800',
                                color: 'white',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '0.9em',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.3s ease',
                                transform: hoveredBadge === `available-${prize.id}` ? 'scale(1.05)' : 'scale(1)',
                                boxShadow: hoveredBadge === `available-${prize.id}` ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                              }}
                              onMouseEnter={() => setHoveredBadge(`available-${prize.id}`)}
                              onMouseLeave={() => setHoveredBadge(null)}
                              >
                                <span style={{ fontWeight: 'bold' }}>Available:</span>
                                <span>{prize.stock?.available?.toLocaleString() || '0'}</span>
                              </div>
                              <div style={{
                                backgroundColor: '#646cff',
                                color: 'white',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '0.9em',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                transform: hoveredButton === `claim-${prize.id}` ? 'scale(1.05)' : 'scale(1)',
                                boxShadow: hoveredButton === `claim-${prize.id}` ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                              }}
                              onMouseEnter={() => setHoveredButton(`claim-${prize.id}`)}
                              onMouseLeave={() => setHoveredButton(null)}
                              onClick={async () => {
                                try {
                                  const account = localStorage.getItem('account');
                                  const apiKey = localStorage.getItem('apiKey');
                                  
                                  if (!account || !apiKey) {
                                    toast.error('Missing account or API key');
                                    return;
                                  }

                                  const response = await fetch(`https://api.gamelayer.co/api/v0/prizes/${prize.id}/claim`, {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      'Accept': 'application/json',
                                      'api-key': apiKey
                                    },
                                    body: JSON.stringify({
                                      player: playerProfile.player_id,
                                      account: account
                                    })
                                  });

                                  if (!response.ok) {
                                    const errorData = await response.json();
                                    throw new Error(errorData?.message || `Failed to claim prize: ${response.status} ${response.statusText}`);
                                  }

                                  toast.success('Prize claimed successfully!');
                                  // Refresh both the prizes list and player profile
                                  await Promise.all([
                                    fetchPrizes(),
                                    onRefresh()
                                  ]);
                                } catch (error) {
                                  console.error('Error claiming prize:', error);
                                  toast.error(error instanceof Error ? error.message : 'Failed to claim prize');
                                }
                              }}>
                                <span style={{ fontWeight: 'bold' }}>Claim</span>
                              </div>
                            </div>
                            {(prize.expires_at || prize.active?.to || prize.end_date) && (
                              <div style={{
                                color: '#666',
                                fontSize: '0.9em',
                                display: 'flex',
                                alignItems: 'center',
                                position: 'relative',
                                cursor: 'help',
                                padding: '6px',
                                backgroundColor: isHovered ? '#e0e0e0' : '#f0f0f0',
                                borderRadius: '6px',
                                marginLeft: 'auto',
                                transition: 'all 0.3s ease',
                                transform: isHovered ? 'scale(1.05)' : 'scale(1)'
                              }}
                              title={`Expires in: ${getTimeRemaining(prize.expires_at || prize.active?.to || prize.end_date || '')}`}
                              >
                                <svg 
                                  width="20" 
                                  height="20" 
                                  viewBox="0 0 24 24" 
                                  fill="none" 
                                  stroke={isHovered ? '#646cff' : '#666'} 
                                  strokeWidth="2" 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round"
                                >
                                  <circle cx="12" cy="12" r="10"/>
                                  <polyline points="12 6 12 12 16 14"/>
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{
          width: '100%',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: activeTab === 'leaderboard' ? 1 : 0,
          transform: activeTab === 'leaderboard' ? 'translateX(0)' : 'translateX(20px)',
          pointerEvents: activeTab === 'leaderboard' ? 'auto' : 'none',
          visibility: activeTab === 'leaderboard' ? 'visible' : 'hidden',
          position: activeTab === 'leaderboard' ? 'relative' : 'absolute'
        }}>
          <div style={{ 
            opacity: isLoadingLeaderboard ? 0.5 : 1,
            transition: 'all 0.3s ease',
            transform: isLoadingLeaderboard ? 'scale(0.98)' : 'scale(1)'
          }}>
            {isLoadingLeaderboard ? (
              <div style={{ 
                textAlign: 'center', 
                color: '#666',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
              }}>
                Loading leaderboard...
              </div>
            ) : (
              <div style={{
                padding: '20px',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                maxWidth: '800px',
                margin: '20px auto'
              }}>
                <div style={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  {leaderboard.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      color: '#888',
                      padding: '40px 0',
                      fontSize: '1.1em',
                      fontWeight: 500
                    }}>
                      No players on the leaderboard yet.<br />
                      <span style={{ fontSize: '0.9em', color: '#aaa' }}>
                        Players will appear here as soon as they earn points.
                      </span>
                    </div>
                  ) : (
                    leaderboard.map((entry, index) => {
                      const isCurrentPlayer = entry.player_id === playerProfile?.player_id;
                      return (
                        <div
                          key={entry.player_id}
                          style={{
                            padding: '15px',
                            border: `1px solid ${isCurrentPlayer ? '#646cff' : '#e0e0e0'}`,
                            borderRadius: '12px',
                            backgroundColor: isCurrentPlayer ? '#f0f0ff' : '#f8f8f8',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '15px',
                            transition: 'all 0.3s ease',
                            transform: hoveredCard === entry.player_id ? 'translateY(-2px)' : 'translateY(0)',
                            boxShadow: hoveredCard === entry.player_id ? '0 4px 8px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.05)'
                          }}
                          onMouseEnter={() => setHoveredCard(entry.player_id)}
                          onMouseLeave={() => setHoveredCard(null)}
                        >
                          {/* Rank */}
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: index < 3 ? ['#FFD700', '#C0C0C0', '#CD7F32'][index] : '#e0e0e0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: index < 3 ? 'white' : '#666',
                            fontWeight: 'bold',
                            fontSize: '1.2em'
                          }}>
                            {index + 1}
                          </div>

                          {/* Player Avatar */}
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            border: '2px solid #646cff'
                          }}>
                            <img 
                              src={entry.avatar || 'https://placehold.co/40x40?text=Player'} 
                              alt={`${entry.name}'s avatar`}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                            />
                          </div>

                          {/* Player Info */}
                          <div style={{ flex: 1 }}>
                            <h3 style={{ 
                              margin: 0,
                              color: isCurrentPlayer ? '#646cff' : '#333',
                              fontSize: '1.1em',
                              fontWeight: 'bold'
                            }}>
                              {entry.name}
                            </h3>
                            <p style={{ 
                              margin: '4px 0 0 0',
                              color: '#666',
                              fontSize: '0.9em'
                            }}>
                              {entry.team || 'No Team'}
                            </p>
                          </div>

                          {/* Points */}
                          <div style={{
                            backgroundColor: '#646cff',
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            fontSize: '1.1em',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <span>Points:</span>
                            <span>{entry.points?.toLocaleString() || 0}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{
          width: '100%',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: activeTab === 'awards' ? 1 : 0,
          transform: activeTab === 'awards' ? 'translateX(0)' : 'translateX(20px)',
          pointerEvents: activeTab === 'awards' ? 'auto' : 'none',
          visibility: activeTab === 'awards' ? 'visible' : 'hidden',
          position: activeTab === 'awards' ? 'relative' : 'absolute'
        }}>
          <div style={{ 
            opacity: isLoadingAchievements ? 0.5 : 1,
            transition: 'all 0.3s ease',
            transform: isLoadingAchievements ? 'scale(0.98)' : 'scale(1)'
          }}>
            {isLoadingAchievements ? (
              <div style={{ 
                textAlign: 'center', 
                color: '#666',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
              }}>
                Loading awards...
              </div>
            ) : (
              <div style={{
                padding: '20px',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                maxWidth: '800px',
                margin: '20px auto'
              }}>
                <div style={{ 
                  display: 'grid', 
                  gap: '20px',
                  gridTemplateColumns: 'repeat(3, 1fr)'
                }}>
                  {achievements.map((achievement) => {
                    const isHovered = hoveredCard === achievement.id;
                    return (
                      <div
                        key={achievement.id}
                        style={{
                          padding: '15px',
                          border: `1px solid ${isHovered ? '#646cff' : '#e0e0e0'}`,
                          borderRadius: '12px',
                          backgroundColor: '#f8f8f8',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer',
                          width: '100%',
                          transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                          boxShadow: isHovered ? '0 4px 8px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.05)'
                        }}
                        onMouseEnter={() => setHoveredCard(achievement.id)}
                        onMouseLeave={() => setHoveredCard(null)}
                      >
                        {/* Achievement Image */}
                        <div style={{
                          width: '100%',
                          height: '120px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          backgroundColor: '#e0e0e0',
                          transition: 'all 0.3s ease',
                          transform: isHovered ? 'scale(1.05)' : 'scale(1)'
                        }}>
                          <img 
                            src={achievement.imgUrl || 'https://placehold.co/400x120?text=Award'} 
                            alt={achievement.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              transition: 'all 0.3s ease',
                              transform: isHovered ? 'scale(1.1)' : 'scale(1)'
                            }}
                          />
                        </div>

                        {/* Achievement Content */}
                        <div style={{ flex: 1, padding: '0 8px' }}>
                          <h3 style={{ 
                            margin: '0 0 8px 0',
                            color: isHovered ? '#646cff' : '#333',
                            fontSize: '1em',
                            fontWeight: 'bold',
                            transition: 'all 0.3s ease',
                            textAlign: 'center'
                          }}>
                            {achievement.name}
                          </h3>
                          
                          {achievement.description && (
                            <p style={{ 
                              color: isHovered ? '#646cff' : '#666', 
                              marginBottom: '12px',
                              fontSize: '0.85em',
                              lineHeight: '1.4',
                              textAlign: 'center',
                              transition: 'all 0.3s ease',
                              cursor: 'help'
                            }}
                            title={achievement.description}
                            >
                              {achievement.description.length > 100 
                                ? `${achievement.description.substring(0, 100)}...`
                                : achievement.description}
                            </p>
                          )}

                          {/* Achievement Stats */}
                          <div style={{ 
                            display: 'flex', 
                            gap: '10px',
                            marginTop: 'auto',
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                            alignItems: 'center'
                          }}>
                            {achievement.progress !== undefined && (
                              <div style={{
                                backgroundColor: '#646cff',
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '0.8em',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.3s ease',
                                transform: hoveredBadge === `progress-${achievement.id}` ? 'scale(1.05)' : 'scale(1)',
                                boxShadow: hoveredBadge === `progress-${achievement.id}` ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                              }}
                              onMouseEnter={() => setHoveredBadge(`progress-${achievement.id}`)}
                              onMouseLeave={() => setHoveredBadge(null)}
                              >
                                <span style={{ fontWeight: 'bold' }}>Progress:</span>
                                <span>{achievement.progress.toLocaleString()}%</span>
                              </div>
                            )}
                            {achievement.total !== undefined && (
                              <div style={{
                                backgroundColor: '#4CAF50',
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '0.8em',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.3s ease',
                                transform: hoveredBadge === `total-${achievement.id}` ? 'scale(1.05)' : 'scale(1)',
                                boxShadow: hoveredBadge === `total-${achievement.id}` ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                              }}
                              onMouseEnter={() => setHoveredBadge(`total-${achievement.id}`)}
                              onMouseLeave={() => setHoveredBadge(null)}
                              >
                                <span style={{ fontWeight: 'bold' }}>Total:</span>
                                <span>{achievement.total.toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{
          width: '100%',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: activeTab === 'player' ? 1 : 0,
          transform: activeTab === 'player' ? 'translateX(0)' : 'translateX(20px)',
          pointerEvents: activeTab === 'player' ? 'auto' : 'none',
          visibility: activeTab === 'player' ? 'visible' : 'hidden',
          position: activeTab === 'player' ? 'relative' : 'absolute'
        }}>
          <div style={{ 
            opacity: isLoadingPlayerHistory ? 0.5 : 1,
            transition: 'all 0.3s ease',
            transform: isLoadingPlayerHistory ? 'scale(0.98)' : 'scale(1)'
          }}>
            {isLoadingPlayerHistory ? (
              <div style={{ 
                textAlign: 'center', 
                color: '#666',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
              }}>
                Loading player history...
              </div>
            ) : (
              <div style={{
                padding: '20px',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                maxWidth: '800px',
                margin: '20px auto'
              }}>
                {/* Completed Missions Section */}
                <div style={{ marginBottom: '30px' }}>
                  <h2 style={{ color: '#333', marginBottom: '15px' }}>Completed Missions</h2>
                  <table style={{ 
                    width: '100%',
                    borderCollapse: 'collapse',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e0e0e0' }}>Name</th>
                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e0e0e0' }}>Completions</th>
                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e0e0e0' }}>First</th>
                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e0e0e0' }}>Last</th>
                      </tr>
                    </thead>
                    <tbody>
                      {completedMissions.map((mission) => (
                        <tr key={mission.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                          <td style={{ padding: '12px', textAlign: 'left' }}>{mission.name}</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>{mission.completion_count}</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            {mission.first_completed_at ? new Date(mission.first_completed_at).toLocaleDateString() : '-'}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            {mission.completed_at ? new Date(mission.completed_at).toLocaleDateString() : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Granted Achievements Section */}
                <div style={{ marginBottom: '30px' }}>
                  <h2 style={{ color: '#333', marginBottom: '15px' }}>Awards Unlocked</h2>
                  <div style={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    {grantedAchievements.map((achievement) => (
                      <div
                        key={achievement.id}
                        style={{
                          padding: '15px',
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px',
                          backgroundColor: '#f8f8f8',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <span style={{ fontWeight: 'bold' }}>{achievement.name}</span>
                        <span style={{ color: '#666' }}>
                          {new Date(achievement.granted_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Redeemed Prizes Section */}
                <div>
                  <h2 style={{ color: '#333', marginBottom: '15px' }}>Redeemed Prizes</h2>
                  <table style={{ 
                    width: '100%',
                    borderCollapse: 'collapse',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e0e0e0' }}>Name</th>
                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e0e0e0' }}>Credits</th>
                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e0e0e0' }}>Redeemed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {redeemedPrizes.map((prize) => (
                        <tr key={prize.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                          <td style={{ padding: '12px', textAlign: 'left' }}>{prize.name}</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>{prize.credits_spent}</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            {prize.redeemed_at ? new Date(prize.redeemed_at).toLocaleDateString() : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Missions; 