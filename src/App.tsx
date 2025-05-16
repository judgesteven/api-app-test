import { useState, useEffect } from 'react'
import InputSection from './components/InputSection'
import PlayerProfile from './components/PlayerProfile'
import Missions from './components/Missions'
import './App.css'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

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

  const [formData, setFormData] = useState({
    account: savedAccount,
    apiKey: savedApiKey,
    player: '',
    event: ''
  });

  const [players, setPlayers] = useState<Player[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [teams, setTeams] = useState<Record<string, string>>({});
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStored, setIsStored] = useState(!!(savedAccount && savedApiKey));
  const [playerProfile, setPlayerProfile] = useState<any>(null);

  const fetchData = async () => {
    if (!formData.account || !formData.apiKey) {
      setPlayers([]);
      setEvents([]);
      return;
    }

    setIsLoading(true);

    try {
      // Fetch players
      const playersResponse = await fetch(`https://api.gamelayer.co/api/v0/players?account=${encodeURIComponent(formData.account)}`, {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "api-key": formData.apiKey
        }
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
        level: data.level?.name || 'Unknown Level',
        levelDescription: data.level?.description || '',
        levelImage: data.level?.imgUrl || '',
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      
      if (field === 'account' || field === 'apiKey') {
        setIsStored(false);
      }
      
      return newData;
    });
  };

  const handleStore = () => {
    if (formData.account && formData.apiKey) {
      localStorage.setItem('account', formData.account);
      localStorage.setItem('apiKey', formData.apiKey);
      setIsStored(true);
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

  return (
    <div className="App">
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
      />
      {playerProfile && <PlayerProfile player={playerProfile} isLoading={false} teams={teams} />}
      <Missions 
        missions={missions} 
        events={events}
        isLoading={isLoading} 
        playerProfile={playerProfile}
        onRefresh={refreshData}
      />
      <ToastContainer />
    </div>
  );
}

export default App;
