import { useState, useEffect } from 'react'
import InputSection from './components/InputSection'
import PlayerProfile from './components/PlayerProfile'
import Missions from './components/Missions'
import './App.css'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Footer from './components/Footer'

interface Player {
  id: string;
  name: string;
  player: string;
}

interface Event {
  id: string;
  name: string;
}

interface Team {
  id: string;
  name: string;
}

interface Mission {
  id: string;
  name: string;
  description?: string;
  points?: number;
  credits?: number;
  status?: string;
}

function App() {
  // Initialize form data from localStorage
  const savedAccount = localStorage.getItem('account') || '';
  const savedApiKey = localStorage.getItem('apiKey') || '';
  const savedPlayer = localStorage.getItem('selectedPlayer') || '';

  const [formData, setFormData] = useState({
    account: savedAccount,
    apiKey: savedApiKey,
    player: savedPlayer,
    event: ''
  });

  const [players, setPlayers] = useState<Player[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [teams, setTeams] = useState<Record<string, string>>({});
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStored, setIsStored] = useState(!!(savedAccount && savedApiKey));
  const [playerProfile, setPlayerProfile] = useState<any>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);

  const fetchData = async () => {
    if (!formData.account || !formData.apiKey) {
      setPlayers([]);
      setEvents([]);
      return;
    }

    setIsLoading(true);

    try {
      // Log the request details for successful API call
      console.log('Fetching players with request:', {
        url: `https://api.gamelayer.co/api/v0/players?account=${encodeURIComponent(formData.account)}`,
        method: 'GET',
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "api-key": formData.apiKey.substring(0, 4) + '...'
        },
        account: formData.account,
        apiKeyLength: formData.apiKey.length
      });

      // Fetch players
      const playersResponse = await fetch(`https://api.gamelayer.co/api/v0/players?account=${encodeURIComponent(formData.account)}`, {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "api-key": formData.apiKey
        }
      });

      console.log('Players API Response:', {
        status: playersResponse.status,
        statusText: playersResponse.statusText,
        headers: Object.fromEntries(playersResponse.headers.entries())
      });

      if (!playersResponse.ok) {
        if (playersResponse.status === 401) {
          throw new Error('Invalid API key or unauthorized access');
        }
        throw new Error('Failed to fetch players');
      }

      const playersData = await playersResponse.json();
      setPlayers(playersData);

      // Fetch teams
      const teamsResponse = await fetch(`https://api.gamelayer.co/api/v0/teams?account=${encodeURIComponent(formData.account)}`, {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "api-key": formData.apiKey
        }
      });

      if (!teamsResponse.ok) {
        if (teamsResponse.status === 401) {
          throw new Error('Invalid API key or unauthorized access');
        }
        throw new Error('Failed to fetch teams');
      }

      const teamsData = await teamsResponse.json();
      const teamsMap = teamsData.reduce((acc: Record<string, string>, team: Team) => {
        acc[team.id] = team.name;
        return acc;
      }, {});
      setTeams(teamsMap);

    } catch (err) {
      console.error('Error fetching data:', err);
      setPlayers([]);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlayerMissions = async (playerId: string) => {
    if (!formData.account || !formData.apiKey || !playerId) {
      console.log('Missing required data for missions:', { account: formData.account, apiKey: !!formData.apiKey, playerId });
      return;
    }

    try {
      const url = `https://api.gamelayer.co/api/v0/missions?account=${encodeURIComponent(formData.account)}&player=${encodeURIComponent(playerId)}`;
      
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "api-key": formData.apiKey
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid API key or unauthorized access');
        } else if (response.status === 404) {
          throw new Error('Player missions not found');
        }
        throw new Error('Failed to fetch player missions');
      }

      const data = await response.json();
      
      // Ensure we have an array of missions
      const missionsArray = Array.isArray(data) ? data : 
                          (data.missions && Array.isArray(data.missions)) ? data.missions :
                          (data.data && Array.isArray(data.data)) ? data.data :
                          [];
      
      setMissions(missionsArray);
    } catch (err) {
      console.error('Error fetching player missions:', err);
      setMissions([]);
    }
  };

  const fetchPlayerDetails = async (playerId: string) => {
    if (!formData.account || !formData.apiKey || !playerId) {
      console.log('Missing required data:', { account: formData.account, apiKey: !!formData.apiKey, playerId });
      return;
    }

    try {
      const response = await fetch(`https://api.gamelayer.co/api/v0/players/${playerId}?account=${encodeURIComponent(formData.account)}`, {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "api-key": formData.apiKey
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid API key or unauthorized access');
        } else if (response.status === 404) {
          throw new Error('Player not found');
        }
        throw new Error('Failed to fetch player details');
      }

      const data = await response.json();
      
      console.log('Player data from API:', {
        level: data.level,
        levelName: data.level?.name,
        rawData: data
      });
      
      // Fetch team name if team ID exists
      if (data.team_id) {
        const teamResponse = await fetch(`https://api.gamelayer.co/api/v0/teams/${data.team_id}?account=${encodeURIComponent(formData.account)}`, {
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "api-key": formData.apiKey
          }
        });
        
        if (teamResponse.ok) {
          const teamData = await teamResponse.json();
          data.team = teamData.name || '';
        }
      }
      
      setPlayerProfile({
        name: data.name || '',
        avatar: data.avatar || data.imgUrl || '',
        level: data.level || { name: 'Unknown Level' },
        team: data.team || '',
        points: data.points || 0,
        credits: data.credits || 0,
        description: data.description || '',
        imgUrl: data.imgUrl || '',
        ordinal: data.ordinal,
        player_id: playerId
      });
    } catch (err) {
      console.error('Error fetching player details:', err);
      setPlayerProfile(null);
    }
  };

  const fetchEvents = async () => {
    if (!formData.account || !formData.apiKey) {
      setEvents([]);
      return;
    }

    try {
      const response = await fetch(`https://api.gamelayer.co/api/v0/events?account=${encodeURIComponent(formData.account)}`, {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "api-key": formData.apiKey
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid API key or unauthorized access');
        }
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();
      setEvents(data);
    } catch (err) {
      console.error('Error fetching events:', err);
      setEvents([]);
    }
  };

  useEffect(() => {
    if (formData.account && formData.apiKey) {
      fetchData();
      fetchEvents();
    } else {
      setPlayers([]);
      setEvents([]);
    }
  }, [formData.account, formData.apiKey]);

  // Persist selected player to localStorage whenever it changes
  useEffect(() => {
    if (formData.player) {
      localStorage.setItem('selectedPlayer', formData.player);
    }
  }, [formData.player]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      if (field === 'account' || field === 'apiKey') {
        setIsStored(false);
      }
      // Persist selected player immediately
      if (field === 'player') {
        localStorage.setItem('selectedPlayer', value);
      }
      return newData;
    });
  };

  const handleStore = () => {
    if (formData.account && formData.apiKey) {
      // Store in localStorage
      localStorage.setItem('account', formData.account);
      localStorage.setItem('apiKey', formData.apiKey);
      
      // Verify storage
      const storedApiKey = localStorage.getItem('apiKey');
      const storedAccount = localStorage.getItem('account');
      
      console.log('Storing credentials:', {
        account: formData.account,
        apiKeyLength: formData.apiKey.length,
        storedApiKeyLength: storedApiKey?.length,
        storedAccount,
        isStored: !!(storedApiKey && storedAccount)
      });
      
      if (storedApiKey === formData.apiKey && storedAccount === formData.account) {
        setIsStored(true);
        toast.success('Credentials stored successfully');
      } else {
        console.error('Storage verification failed:', {
          apiKeyMatch: storedApiKey === formData.apiKey,
          accountMatch: storedAccount === formData.account
        });
        toast.error('Failed to store credentials properly');
      }
    }
  };

  const handleSubmit = async () => {
    if (formData.player) {
      console.log('Using player ID:', formData.player);
      await Promise.all([
        fetchPlayerDetails(formData.player),
        fetchPlayerMissions(formData.player)
      ]);
    }
  };

  const refreshData = async () => {
    if (formData.player) {
      await Promise.all([
        fetchPlayerDetails(formData.player),
        fetchPlayerMissions(formData.player)
      ]);
    }
  };

  const handlePlayerSelect = (player: any) => {
    setSelectedPlayer(player);
  };

  const handleAddPlayer = async (playerData: { name: string; avatar: string; imgUrl: string; playerId: string }) => {
    // Log the current state of the API key
    console.log('Add Player - Current State:', {
      formDataApiKey: formData.apiKey ? 'Present' : 'Missing',
      formDataApiKeyLength: formData.apiKey?.length,
      localStorageApiKey: localStorage.getItem('apiKey') ? 'Present' : 'Missing',
      localStorageApiKeyLength: localStorage.getItem('apiKey')?.length,
      isStored,
      account: formData.account
    });

    if (!formData.account || !formData.apiKey) {
      toast.error('Please enter account details and API key first');
      return;
    }

    if (!isStored) {
      toast.error('Please store your API key first by clicking the Store button');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Check if player ID exists
      const checkUrl = `https://api.gamelayer.co/api/v0/players/${encodeURIComponent(playerData.playerId)}?account=${encodeURIComponent(formData.account)}`;
      const checkResponse = await fetch(checkUrl, {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "api-key": formData.apiKey
        }
      });
      if (checkResponse.ok) {
        // Player exists
        toast.error('Player ID already exists. Please choose a different ID.');
        setIsLoading(false);
        return;
      } else if (checkResponse.status !== 404) {
        // Some other error
        toast.error('Failed to check player ID. Please try again.');
        setIsLoading(false);
        return;
      }

      // 2. Create player if not found
      const requestBody = {
        account: formData.account,
        name: playerData.name,
        avatar: playerData.avatar,
        imgUrl: playerData.imgUrl,
        player: playerData.playerId
      };

      // Log the exact request being made
      console.log('Creating player with request:', {
        url: 'https://api.gamelayer.co/api/v0/players',
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "api-key": formData.apiKey.substring(0, 4) + '...'
        },
        body: requestBody,
        account: formData.account,
        apiKeyLength: formData.apiKey.length,
        isStored
      });

      const response = await fetch('https://api.gamelayer.co/api/v0/players', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "api-key": formData.apiKey
        },
        body: JSON.stringify(requestBody)
      });

      let responseData;
      try {
        responseData = await response.json();
      } catch (e) {
        responseData = null;
        console.error('Failed to parse response as JSON:', e);
      }

      console.log('Add Player API Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: responseData,
        requestUrl: response.url
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Log additional details for 401 error
          console.error('401 Unauthorized - Details:', {
            apiKeyLength: formData.apiKey.length,
            apiKeyPrefix: formData.apiKey.substring(0, 4),
            account: formData.account,
            isStored,
            localStorageApiKey: localStorage.getItem('apiKey')?.substring(0, 4) + '...'
          });
          throw new Error('Invalid API key. Please check your API key and try again.');
        }
        const errorMessage = responseData?.message || responseData?.error || `Failed to add player: ${response.status} ${response.statusText}`;
        throw new Error(errorMessage);
      }

      // Transform the response data to match our Player interface
      const newPlayer = {
        id: responseData?.player_id || playerData.playerId,
        name: responseData?.name || playerData.name,
        player: responseData?.player_id || playerData.playerId
      };

      setPlayers(prevPlayers => [...prevPlayers, newPlayer]);
      toast.success('Player added successfully!');
      
      // Refresh the players list
      await fetchData();
    } catch (err) {
      console.error('Error adding player:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to add player');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ flex: '1 0 auto' }}>
        <div style={{ 
          padding: '20px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <InputSection 
            onInputChange={handleInputChange} 
            onSubmit={handleSubmit}
            players={players}
            isLoading={isLoading} 
            account={formData.account}
            apiKey={formData.apiKey}
            onStore={handleStore}
            isStored={isStored}
            selectedPlayerId={formData.player}
            onAddPlayer={handleAddPlayer}
          />
          {playerProfile && <PlayerProfile player={playerProfile} isLoading={false} teams={teams} />}
          <Missions 
            missions={missions} 
            events={events}
            isLoading={isLoading}
            playerProfile={playerProfile}
            onRefresh={refreshData}
            apiKey={formData.apiKey}
          />
          <ToastContainer />
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default App;
