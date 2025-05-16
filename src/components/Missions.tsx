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

interface MissionsProps {
  missions: Mission[];
  events: Event[];
  isLoading: boolean;
  playerProfile?: any;
  onRefresh: () => Promise<void>;
}

const Missions: React.FC<MissionsProps> = ({ missions, events, isLoading, playerProfile, onRefresh }) => {
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

  if (isLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        Loading missions...
      </div>
    );
  }

  // Ensure missions is an array and has items
  if (!Array.isArray(missions) || missions.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
        No missions available
      </div>
    );
  }

  return (
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
                  flexWrap: 'wrap',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    {points !== undefined && (
                      <div style={{
                        backgroundColor: '#646cff',
                        color: 'white',
                        padding: mission.priority === 2 ? '2px 6px' : '6px 12px',
                        borderRadius: '6px',
                        fontSize: mission.priority === 2 ? '0.75em' : '0.9em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: mission.priority === 2 ? '4px' : '6px'
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
                        gap: mission.priority === 2 ? '4px' : '6px'
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
                        gap: '6px'
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
                      cursor: 'help'
                    }}
                    title={`Expires in: ${getTimeRemaining(mission.active.to)}`}
                    >
                      <svg 
                        width="20" 
                        height="20" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
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
  );
};

export default Missions; 