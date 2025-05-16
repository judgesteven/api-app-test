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
}

const Missions: React.FC<MissionsProps> = ({ missions, events, isLoading, playerProfile, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'missions' | 'prizes'>('missions');
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [isLoadingPrizes, setIsLoadingPrizes] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string>('');

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

  React.useEffect(() => {
    if (activeTab === 'prizes' && playerProfile?.player_id) {
      fetchPrizes();
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
        padding: '0 20px'
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
            transition: 'all 0.2s ease',
            position: 'relative',
            marginBottom: '-1px',
            borderBottom: activeTab === 'missions' ? '3px solid #646cff' : 'none',
            boxShadow: activeTab === 'missions' ? '0 -2px 4px rgba(0,0,0,0.1)' : 'none'
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
            transition: 'all 0.2s ease',
            position: 'relative',
            marginBottom: '-1px',
            borderBottom: activeTab === 'prizes' ? '3px solid #646cff' : 'none',
            boxShadow: activeTab === 'prizes' ? '0 -2px 4px rgba(0,0,0,0.1)' : 'none'
          }}
        >
          Prizes
        </button>
      </div>

      {activeTab === 'missions' ? (
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          maxWidth: '800px',
          margin: '20px auto'
        }}>
          {playerProfile && events && events.length > 0 && (
            <div style={{
              marginBottom: '20px',
              display: 'flex',
              gap: '10px',
              alignItems: 'center'
            }}>
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                style={{
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  flex: 1
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
                  cursor: selectedEvent ? 'pointer' : 'not-allowed'
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
              // Get points and credits from either direct properties or reward object
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
                    border: '1px solid #e0e0e0',
                    borderRadius: '12px',
                    backgroundColor: '#f8f8f8',
                    display: 'flex',
                    gap: '20px',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: 'pointer',
                    width: '100%',
                    gridColumn: mission.priority === 2 ? 'auto' : '1 / -1'
                  }}
                >
                  {/* Mission Image */}
                  <div style={{
                    width: mission.priority === 2 ? '90px' : '120px',
                    height: mission.priority === 2 ? '90px' : '120px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    backgroundColor: '#e0e0e0',
                    alignSelf: 'center'
                  }}>
                    <img 
                      src={mission.imgUrl || 'https://via.placeholder.com/120x120?text=Mission'} 
                      alt={mission.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  </div>

                  {/* Mission Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '10px'
                    }}>
                      <h3 style={{ 
                        margin: 0,
                        color: '#333',
                        fontSize: mission.priority === 2 ? '1em' : '1.2em',
                        fontWeight: 'bold'
                      }}>
                        {mission.name || 'Unnamed Mission'}
                      </h3>
                    </div>
                    
                    {mission.description && (
                      <p style={{ 
                        color: '#666', 
                        marginBottom: '15px',
                        fontSize: mission.priority === 2 ? '0.85em' : '0.95em',
                        lineHeight: '1.4',
                        textAlign: 'left',
                        cursor: mission.priority === 2 ? 'help' : 'default'
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
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      width: '100%'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        gap: '20px', 
                        flexWrap: mission.priority === 2 ? 'nowrap' : 'wrap',
                        alignItems: 'center',
                        flex: mission.priority === 2 ? 1 : 'auto'
                      }}>
                        {points !== undefined && (
                          <div style={{
                            backgroundColor: '#646cff',
                            color: 'white',
                            padding: mission.priority === 2 ? '2px 6px' : '6px 12px',
                            borderRadius: '6px',
                            fontSize: mission.priority === 2 ? '0.75em' : '0.9em',
                            display: 'flex',
                            alignItems: 'center',
                            gap: mission.priority === 2 ? '4px' : '6px',
                            whiteSpace: 'nowrap'
                          }}>
                            <span style={{ fontWeight: 'bold' }}>Points:</span>
                            <span>{points.toLocaleString()}</span>
                          </div>
                        )}
                        {credits !== undefined && (
                          <div style={{
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            padding: mission.priority === 2 ? '2px 6px' : '6px 12px',
                            borderRadius: '6px',
                            fontSize: mission.priority === 2 ? '0.75em' : '0.9em',
                            display: 'flex',
                            alignItems: 'center',
                            gap: mission.priority === 2 ? '4px' : '6px',
                            whiteSpace: 'nowrap'
                          }}>
                            <span style={{ fontWeight: 'bold' }}>Credits:</span>
                            <span>{credits.toLocaleString()}</span>
                          </div>
                        )}
                        {mission.status && (
                          <div style={{
                            backgroundColor: '#ff9800',
                            color: 'white',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '0.9em',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            whiteSpace: 'nowrap'
                          }}>
                            <span style={{ fontWeight: 'bold' }}>Status:</span>
                            <span>{mission.status}</span>
                          </div>
                        )}
                      </div>
                      {mission.active?.to && (
                        <div style={{
                          color: '#666',
                          fontSize: '0.9em',
                          display: 'flex',
                          alignItems: 'center',
                          position: 'relative',
                          cursor: 'help',
                          padding: '6px',
                          backgroundColor: '#f0f0f0',
                          borderRadius: '6px',
                          flexShrink: 0
                        }}
                        title={`Expires in: ${getTimeRemaining(mission.active.to)}`}
                        >
                          <svg 
                            width="20" 
                            height="20" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="#666" 
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
      ) : (
        <div>
          {isLoadingPrizes ? (
            <div style={{ textAlign: 'center', color: '#666' }}>
              Loading prizes...
            </div>
          ) : prizes.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#666' }}>
              No prizes available
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gap: '20px',
              gridTemplateColumns: 'repeat(auto-fit, minmax(800px, 1fr))'
            }}>
              {prizes.map((prize) => (
                <div
                  key={prize.id}
                  style={{
                    padding: '20px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '12px',
                    backgroundColor: '#f8f8f8',
                    display: 'flex',
                    gap: '20px',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: 'pointer',
                    width: '100%',
                    maxWidth: '800px',
                    margin: '0 auto'
                  }}
                >
                  {/* Prize Image */}
                  <div style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    backgroundColor: '#e0e0e0',
                    alignSelf: 'center'
                  }}>
                    <img 
                      src={prize.imgUrl || 'https://via.placeholder.com/120x120?text=Prize'} 
                      alt={prize.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  </div>

                  {/* Prize Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '10px'
                    }}>
                      <h3 style={{ 
                        margin: 0,
                        color: '#333',
                        fontSize: '1.2em',
                        fontWeight: 'bold'
                      }}>
                        {prize.name}
                      </h3>
                    </div>
                    
                    {prize.description && (
                      <p style={{ 
                        color: '#666', 
                        marginBottom: '15px',
                        fontSize: '0.95em',
                        lineHeight: '1.4',
                        textAlign: 'left'
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
                            gap: '6px'
                          }}>
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
                            gap: '6px'
                          }}>
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
                          gap: '6px'
                        }}>
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
                          cursor: 'pointer'
                        }}
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
                          backgroundColor: '#f0f0f0',
                          borderRadius: '6px',
                          marginLeft: 'auto'
                        }}
                        title={`Expires in: ${getTimeRemaining(prize.expires_at || prize.active?.to || prize.end_date || '')}`}
                        >
                          <svg 
                            width="20" 
                            height="20" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="#666" 
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
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Missions; 