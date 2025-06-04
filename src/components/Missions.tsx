import React, { useState, useEffect } from 'react';
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
  category?: string;  // Added category field
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
  category?: string;  // Added category field
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
  credits?: number;
  redemptions?: Array<{
    credits_spent?: number;
    credits?: number;
    redeemed_at?: string;
  }>;
  count?: number;
  actions?: {
    count?: number;
    firstCompletedOn?: string;
    completedOn?: string;
  };
}

// Add new interface for wheel data
interface WheelPrize {
  id: string;
  name: string;
  probability: number;
}

interface WheelMetadata {
  id: string;
  name: string;
  description?: string;
  cost: number;
  end_date?: string;
  prizes: WheelPrize[];
}

const Missions: React.FC<MissionsProps> = ({ missions, events, isLoading, playerProfile, onRefresh, apiKey }) => {
  const [activeTab, setActiveTab] = useState<'missions' | 'quizzes' | 'prizes' | 'leaderboard' | 'player' | 'badges' | 'mystery'>('missions');
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
  const [playerAvatars, setPlayerAvatars] = useState<Record<string, string>>({});
  const [quiz, setQuiz] = useState<any>(null);
  const [activeQuiz, setActiveQuiz] = useState<any>(null); // <-- new state for modal
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [isStartingQuiz, setIsStartingQuiz] = useState(false);
  const [quizSlug, setQuizSlug] = useState<string>('');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [completedQuizzes, setCompletedQuizzes] = useState<any[]>([]);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  // Add new state for wheel
  const [wheelPrizes, setWheelPrizes] = useState<WheelPrize[]>([]);
  const [isLoadingWheel, setIsLoadingWheel] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState<WheelPrize | null>(null);
  // Update the state to include wheel metadata
  const [wheelMetadata, setWheelMetadata] = useState<WheelMetadata | null>(null);
  // Add at the top of the component, after other useState hooks
  const [wheelRotation, setWheelRotation] = useState(0);
  const [isWheelSpinning, setIsWheelSpinning] = useState(false);
  const [lastWinningSegment, setLastWinningSegment] = useState<number | null>(null);
  const [showWinIndicator, setShowWinIndicator] = useState<boolean | null>(null);

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
      console.log('Raw achievements data:', data);
      let grantedAchievementsData: any[] = [];
      if (data && data.achievements && Array.isArray(data.achievements.completed)) {
        grantedAchievementsData = data.achievements.completed;
      } else if (Array.isArray(data)) {
        grantedAchievementsData = data.filter((achievement: any) => achievement.status === 'granted');
      }
      console.log('Filtered granted achievements:', grantedAchievementsData);
      setGrantedAchievements(grantedAchievementsData);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch achievements');
    } finally {
      setIsLoadingAchievements(false);
    }
  };

  const fetchAllAchievements = async () => {
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
        throw new Error(errorData?.message || `Failed to fetch all achievements: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      console.log('[DEBUG] All account achievements:', data);
      setAchievements(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching all achievements:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch all achievements');
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
      const entries = Array.isArray(data?.scores?.data)
        ? data.scores.data
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
      let grantedAchievementsData: any[] = [];
      if (achievementsData && achievementsData.achievements && Array.isArray(achievementsData.achievements.completed)) {
        grantedAchievementsData = achievementsData.achievements.completed;
      } else if (Array.isArray(achievementsData)) {
        grantedAchievementsData = achievementsData.filter((achievement: any) => achievement.status === 'granted');
      }
      console.log('Filtered granted achievements:', grantedAchievementsData);
      setGrantedAchievements(grantedAchievementsData);

      // Fetch player redeemed prizes (per GameLayer docs)
      const prizesUrl = `https://api.gamelayer.co/api/v0/players/${playerId}/prizes?account=${encodeURIComponent(account)}`;
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
        throw new Error(`Failed to fetch redeemed prizes: ${prizesResponse.status} ${prizesResponse.statusText}`);
      }

      const data = await prizesResponse.json();
      console.log('[DEBUG] Redeemed prizes API response:', data);
      setRedeemedPrizes(Array.isArray(data.prizes) ? data.prizes : []);

      // Fetch player completed quizzes using /quizzes/{id}/result
      try {
        const quizzesListUrl = `https://api.gamelayer.co/api/v0/quizzes?account=${encodeURIComponent(account)}`;
        const quizzesListResponse = await fetch(quizzesListUrl, {
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "api-key": apiKey
          }
        });
        if (!quizzesListResponse.ok) {
          const errorText = await quizzesListResponse.text();
          console.error('Quizzes list error response:', errorText);
          throw new Error(`Failed to fetch quizzes list: ${quizzesListResponse.status} ${quizzesListResponse.statusText}`);
        }
        const quizzesListData = await quizzesListResponse.json();
        let allQuizzes = [];
        if (Array.isArray(quizzesListData)) {
          allQuizzes = quizzesListData;
        } else if (quizzesListData && Array.isArray(quizzesListData.data)) {
          allQuizzes = quizzesListData.data;
        } else if (quizzesListData && quizzesListData.quizzes && Array.isArray(quizzesListData.quizzes)) {
          allQuizzes = quizzesListData.quizzes;
        }
        // For each quiz, fetch the player's result
        const quizResults = await Promise.all(
          allQuizzes.map(async (quiz: any) => {
            try {
              const resultUrl = `https://api.gamelayer.co/api/v0/quizzes/${quiz.id}/result?account=${encodeURIComponent(account)}&player=${encodeURIComponent(playerId)}`;
              const resultResponse = await fetch(resultUrl, {
                headers: {
                  "Content-Type": "application/json",
                  "Accept": "application/json",
                  "api-key": apiKey
                }
              });
              if (!resultResponse.ok) return null;
              const resultData = await resultResponse.json();
              // Only show if actions.count > 0
              if (resultData.actions && resultData.actions.count > 0) {
                return {
                  name: resultData.quiz?.name || quiz.name,
                  status: resultData.actions.passed ? 'Passed' : 'Failed',
                  first: resultData.actions.startedOn,
                  last: resultData.actions.completedOn
                };
              }
              return null;
            } catch (e) {
              return null;
            }
          })
        );
        // Filter out nulls
        setCompletedQuizzes(quizResults.filter(Boolean));
      } catch (error) {
        console.error('Error fetching completed quizzes:', error);
        setCompletedQuizzes([]);
      }

      // Log final state
      console.log('Final state after fetching:', {
        completedMissions: completedMissionsData,
        grantedAchievements: grantedAchievementsData,
        redeemedPrizes: data.prizes
      });

    } catch (error) {
      console.error('Error fetching player history:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch player history');
    } finally {
      setIsLoadingPlayerHistory(false);
    }
  };

  // Fetch avatars for leaderboard players
  useEffect(() => {
    const fetchAvatars = async () => {
      const account = localStorage.getItem('account');
      const apiKey = localStorage.getItem('apiKey');
      if (!leaderboard.length || !account || !apiKey) return;
      const newAvatars: Record<string, string> = {};
      await Promise.all(
        leaderboard.map(async (entry: any) => {
          if (!entry.player) return;
          try {
            const res = await fetch(`https://api.gamelayer.co/api/v0/players/${encodeURIComponent(entry.player)}?account=${encodeURIComponent(account)}`, {
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'api-key': apiKey
              }
            });
            if (res.ok) {
              const data = await res.json();
              if (data.imgUrl) newAvatars[entry.player] = data.imgUrl;
            }
          } catch (e) {
            // Ignore errors, fallback to placeholder
          }
        })
      );
      setPlayerAvatars((prev) => ({ ...prev, ...newAvatars }));
    };
    fetchAvatars();
  }, [leaderboard]);

  // Fetch quiz data
  const fetchQuiz = async () => {
    const account = localStorage.getItem('account');
    const apiKey = localStorage.getItem('apiKey');
    if (!apiKey || !account) {
      toast.error('API key or account is missing');
      return;
    }
    setIsLoadingQuiz(true);
    try {
      const slug = '1-test-quiz';
      setQuizSlug(slug);
      const response = await fetch(`https://api.gamelayer.co/api/v0/quizzes/${encodeURIComponent(slug)}?account=${encodeURIComponent(account)}`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'api-key': apiKey
        }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Failed to fetch quiz: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      setQuiz(data);
    } catch (error) {
      console.error('Error fetching quiz:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch quiz');
    } finally {
      setIsLoadingQuiz(false);
    }
  };

  // Function to start the quiz and get questions
  const startQuiz = async (quizId: string) => {
    const account = localStorage.getItem('account');
    const apiKey = localStorage.getItem('apiKey');
    const playerId = playerProfile?.player_id || playerProfile?.id;
    if (!apiKey || !account) {
      toast.error('API key or account is missing');
      return;
    }
    if (!playerId) {
      toast.error('Player ID is missing');
      return;
    }
    setIsStartingQuiz(true);
    setQuizSlug(quizId); // Always set the slug when starting
    const url = `https://api.gamelayer.co/api/v0/quizzes/${encodeURIComponent(quizId)}/start`;
    const payload = { account, player: playerId };
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'api-key': apiKey
    };
    console.log('[QUIZ DEBUG] Starting quiz:', { quizId, url, payload, headers });
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      console.log('[QUIZ DEBUG] Response status:', response.status, response.statusText);
      if (!response.ok) {
        let errorData = null;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = await response.text();
        }
        console.error('[QUIZ DEBUG] Error response body:', errorData);
        throw new Error((errorData && errorData.message) || `Failed to start quiz: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      console.log('[QUIZ DEBUG] Quiz start success, data:', data);
      setActiveQuiz(data);
      setCurrentQuestion(0);
      setQuizAnswers({});
      setQuizModalOpen(true);
    } catch (error) {
      console.error('Error starting quiz:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start quiz');
    } finally {
      setIsStartingQuiz(false);
    }
  };

  // Add a function to submit quiz answers
  const submitQuizAnswers = async () => {
    console.log('[QUIZ SUBMIT] Called submitQuizAnswers');
    if (!activeQuiz || !activeQuiz.questions) {
      console.log('[QUIZ SUBMIT] Missing quiz data', { activeQuiz });
      return;
    }
    if (!quizSlug) {
      toast.error('Quiz slug is missing. Cannot submit quiz.');
      return;
    }
    const account = localStorage.getItem('account');
    const apiKey = localStorage.getItem('apiKey');
    const playerId = playerProfile?.player_id || playerProfile?.id;
    console.log('[QUIZ SUBMIT] account:', account, 'apiKey:', apiKey, 'playerId:', playerId);
    if (!apiKey || !account) {
      toast.error('API key or account is missing');
      return;
    }
    if (!playerId) {
      toast.error('Player ID is missing');
      return;
    }
    // Build answers array
    const answers = activeQuiz.questions.map((q: any, idx: number) => {
      const qid = q.id || idx;
      const answerId = quizAnswers[qid];
      return {
        questionId: q.id,
        answerIds: answerId ? [answerId] : []
      };
    });
    console.log('[QUIZ SUBMIT] answers:', answers);
    // Validation: require all questions to be answered
    const allAnswered = answers.every((a: any) => a.answerIds && a.answerIds.length > 0);
    if (!allAnswered) {
      toast.error('Please answer all questions before submitting.');
      return;
    }
    const url = `https://api.gamelayer.co/api/v0/quizzes/${encodeURIComponent(quizSlug || 'unknown')}/complete`;
    const payload = { account, player: playerId, answers };
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'api-key': apiKey
    };
    console.log('[QUIZ SUBMIT] POST', url, payload);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      console.log('[QUIZ SUBMIT] Response status:', response.status, response.statusText);
      if (!response.ok) {
        let errorData = null;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = await response.text();
        }
        console.error('[QUIZ SUBMIT] Error response body:', errorData);
        throw new Error((errorData && errorData.message) || `Failed to submit quiz: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      console.log('[QUIZ SUBMIT] API response:', data);
      // Simplified toast logic: failMessage (error) takes precedence, then passMessage (success), then fallback
      if (data && data.failMessage) {
        toast.error(data.failMessage);
      } else if (data && data.passMessage) {
        toast.success(data.passMessage);
      } else if (data && data.message) {
        toast.info(data.message);
      } else if (data && data.result) {
        toast.info(data.result);
      } else {
        toast.info('Quiz completed.');
      }
      await onRefresh();
      setQuizModalOpen(false);
      fetchQuiz(); // Refresh quiz data so user can try again
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit quiz');
    }
  };

  // Add new function to fetch wheel prizes
  const fetchWheelPrizes = async () => {
    const apiKey = localStorage.getItem('apiKey');
    const account = localStorage.getItem('account');
    
    if (!apiKey || !account) {
      console.error('Missing required data:', { hasApiKey: !!apiKey, hasAccount: !!account });
      toast.error('API key or account is missing');
      return;
    }

    setIsLoadingWheel(true);
    try {
      console.log('[WHEEL DEBUG] Starting wheel data fetch');
      const response = await fetch(`https://api.gamelayer.co/api/v0/mysteryboxes/1-test-wheel?account=${encodeURIComponent(account)}`, {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "api-key": apiKey
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Failed to fetch wheel data: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[WHEEL DEBUG] Raw wheel data:', data);

      // Create metadata with default prizes if none exist
      const metadata: WheelMetadata = {
        id: data.id || '1-test-wheel',
        name: data.name || 'Mystery Prize Wheel',
        description: data.description || 'Spin the wheel to win amazing prizes!',
        cost: data.cost || 100,
        end_date: data.end_date,
        prizes: Array.isArray(data.prizes) && data.prizes.length > 0 ? data.prizes : Array(16).fill(null).map((_, index) => ({
          id: `prize-${index}`,
          name: index % 2 === 0 ? 'Win' : 'No Win',
          probability: 1/16
        }))
      };

      console.log('[WHEEL DEBUG] Processed wheel metadata:', metadata);
      setWheelMetadata(metadata);
      setWheelPrizes(metadata.prizes);
    } catch (error) {
      console.error('[WHEEL DEBUG] Error fetching wheel data:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch wheel data');
      setWheelMetadata(null);
      setWheelPrizes([]);
    } finally {
      setIsLoadingWheel(false);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'badges') {
      fetchAllAchievements();
    } else if (activeTab === 'prizes' && playerProfile?.player_id) {
      fetchPrizes();
    } else if (activeTab === 'leaderboard') {
      fetchLeaderboard();
    } else if (activeTab === 'player' && playerProfile?.player_id) {
      fetchPlayerHistory();
    } else if (activeTab === 'quizzes') {
      fetchQuiz();
    } else if (activeTab === 'mystery') {
      console.log('[WHEEL DEBUG] Mystery tab selected, current state:', {
        isLoadingWheel,
        wheelPrizesCount: wheelPrizes.length,
        hasWheelMetadata: !!wheelMetadata,
        wheelMetadata: wheelMetadata
      });
      fetchWheelPrizes();
    }
  }, [activeTab, playerProfile?.player_id]);

  // Add logging for wheel rendering
  React.useEffect(() => {
    if (activeTab === 'mystery') {
      console.log('[WHEEL DEBUG] Wheel render state:', {
        isLoadingWheel,
        wheelPrizesCount: wheelPrizes.length,
        hasWheelMetadata: !!wheelMetadata,
        wheelMetadata: wheelMetadata,
        prizes: wheelPrizes.map(p => ({ id: p.id, name: p.name }))
      });
    }
  }, [activeTab, isLoadingWheel, wheelPrizes, wheelMetadata]);

  // Add logging for mystery tab selection
  React.useEffect(() => {
    if (activeTab === 'mystery') {
      console.log('[WHEEL DEBUG] Mystery tab selected, current state:', {
        isLoadingWheel,
        wheelPrizesCount: wheelPrizes.length,
        hasWheelMetadata: !!wheelMetadata,
        wheelMetadata: wheelMetadata
      });
    }
  }, [activeTab, isLoadingWheel, wheelPrizes, wheelMetadata]);

  if (isLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        Loading...
      </div>
    );
  }

  console.log('[DEBUG] RedeemedPrizes for table:', redeemedPrizes);
  redeemedPrizes.forEach((prize, idx) => console.log(`[DEBUG] Prize[${idx}]:`, prize));

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
          onClick={() => setActiveTab('quizzes')}
          style={{
            padding: '12px 24px',
            backgroundColor: activeTab === 'quizzes' ? '#646cff' : 'transparent',
            color: activeTab === 'quizzes' ? 'white' : '#666',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.1em',
            fontWeight: 'bold',
            borderRadius: '8px 8px 0 0',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            marginBottom: '-1px',
            borderBottom: activeTab === 'quizzes' ? '3px solid #646cff' : 'none',
            boxShadow: activeTab === 'quizzes' ? '0 -2px 4px rgba(0,0,0,0.1)' : 'none',
            transform: activeTab === 'quizzes' ? 'scale(1.05)' : 'scale(1)'
          }}
        >
          Quizzes
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
          onClick={() => setActiveTab('mystery')}
          style={{
            padding: '12px 24px',
            backgroundColor: activeTab === 'mystery' ? '#646cff' : 'transparent',
            color: activeTab === 'mystery' ? 'white' : '#666',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.1em',
            fontWeight: 'bold',
            borderRadius: '8px 8px 0 0',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            marginBottom: '-1px',
            borderBottom: activeTab === 'mystery' ? '3px solid #646cff' : 'none',
            boxShadow: activeTab === 'mystery' ? '0 -2px 4px rgba(0,0,0,0.1)' : 'none',
            transform: activeTab === 'mystery' ? 'scale(1.05)' : 'scale(1)'
          }}
        >
          Mystery
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
          onClick={() => setActiveTab('badges')}
          style={{
            padding: '12px 24px',
            backgroundColor: activeTab === 'badges' ? '#646cff' : 'transparent',
            color: activeTab === 'badges' ? 'white' : '#666',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.1em',
            fontWeight: 'bold',
            borderRadius: '8px 8px 0 0',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            marginBottom: '-1px',
            borderBottom: activeTab === 'badges' ? '3px solid #646cff' : 'none',
            boxShadow: activeTab === 'badges' ? '0 -2px 4px rgba(0,0,0,0.1)' : 'none',
            transform: activeTab === 'badges' ? 'scale(1.05)' : 'scale(1)'
          }}
        >
          Badges
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
              {missions
                .filter(mission => mission.category !== 'Hidden')  // Filter out hidden missions
                .map((mission) => {
                const isHovered = hoveredCard === mission.id;
                const points = mission.points || mission.reward?.points;
                const credits = mission.credits || mission.reward?.credits;
                
                console.log('Mission data:', {
                  name: mission.name,
                  points,
                  credits,
                  reward: mission.reward,
                  active: mission.active,
                  priority: mission.priority,
                  category: mission.category  // Added category to logging
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
                        gap: '12px',
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
          opacity: activeTab === 'quizzes' ? 1 : 0,
          transform: activeTab === 'quizzes' ? 'translateX(0)' : 'translateX(20px)',
          pointerEvents: activeTab === 'quizzes' ? 'auto' : 'none',
          visibility: activeTab === 'quizzes' ? 'visible' : 'hidden',
          position: activeTab === 'quizzes' ? 'relative' : 'absolute'
        }}>
          <div style={{ 
            opacity: isLoadingQuiz ? 0.5 : 1,
            transition: 'all 0.3s ease',
            transform: isLoadingQuiz ? 'scale(0.98)' : 'scale(1)'
          }}>
            {isLoadingQuiz ? (
              <div style={{ 
                textAlign: 'center', 
                color: '#666',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
              }}>
                Loading quiz...
              </div>
            ) : !quiz ? (
              <div style={{ 
                textAlign: 'center', 
                color: '#666',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
              }}>
                No quiz available
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
                  padding: '20px',
                  border: `1px solid ${hoveredCard === 'quiz' ? '#646cff' : '#e0e0e0'}`,
                  borderRadius: '12px',
                  backgroundColor: '#f8f8f8',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  width: '100%',
                  minHeight: '140px',
                  boxShadow: hoveredCard === 'quiz' ? '0 4px 8px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.05)'
                }}
                onMouseEnter={() => setHoveredCard('quiz')}
                onMouseLeave={() => setHoveredCard(null)}
                >
                  {/* Quiz Image - top, fills width */}
                  <div style={{
                    width: '100%',
                    height: '120px',
                    borderRadius: '8px 8px 0 0',
                    overflow: 'hidden',
                    backgroundColor: '#e0e0e0',
                    transition: 'all 0.3s ease',
                    transform: hoveredCard === 'quiz' ? 'scale(1.03)' : 'scale(1)'
                  }}>
                    <img
                      src={quiz.imgUrl || 'https://placehold.co/400x120?text=Quiz'}
                      alt={quiz.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'all 0.3s ease',
                        transform: hoveredCard === 'quiz' ? 'scale(1.07)' : 'scale(1)'
                      }}
                    />
                  </div>
                  {/* Quiz Content - below image */}
                  <div style={{ flex: 1, padding: '16px 8px 0 8px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '10px'
                    }}>
                      <h3 style={{
                        margin: 0,
                        color: hoveredCard === 'quiz' ? '#646cff' : '#333',
                        fontSize: '1.2em',
                        fontWeight: 'bold',
                        transition: 'all 0.3s ease'
                      }}>
                        {quiz.name}
                      </h3>
                    </div>
                    {quiz.description && (
                      <p style={{
                        color: hoveredCard === 'quiz' ? '#646cff' : '#666',
                        marginBottom: '15px',
                        fontSize: '0.95em',
                        lineHeight: '1.4',
                        textAlign: 'left',
                        transition: 'all 0.3s ease'
                      }}>
                        {quiz.description}
                      </p>
                    )}
                    {/* Quiz Stats and Button */}
                    <div style={{
                      display: 'flex',
                      gap: '12px',
                      marginTop: 'auto',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      width: '100%'
                    }}>
                      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {quiz.reward?.points !== undefined && (
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
                            transform: hoveredBadge === 'points-quiz' ? 'scale(1.05)' : 'scale(1)',
                            boxShadow: hoveredBadge === 'points-quiz' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                          }}
                          onMouseEnter={() => setHoveredBadge('points-quiz')}
                          onMouseLeave={() => setHoveredBadge(null)}
                          >
                            <span style={{ fontWeight: 'bold' }}>Points:</span>
                            <span>{quiz.reward.points.toLocaleString()}</span>
                          </div>
                        )}
                        {quiz.reward?.credits !== undefined && (
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
                            transform: hoveredBadge === 'credits-quiz' ? 'scale(1.05)' : 'scale(1)',
                            boxShadow: hoveredBadge === 'credits-quiz' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                          }}
                          onMouseEnter={() => setHoveredBadge('credits-quiz')}
                          onMouseLeave={() => setHoveredBadge(null)}
                          >
                            <span style={{ fontWeight: 'bold' }}>Credits:</span>
                            <span>{quiz.reward.credits.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                      <button
                        style={{
                          backgroundColor: '#646cff',
                          color: 'white',
                          padding: '10px 24px', // increased padding
                          borderRadius: '8px', // increased border radius
                          fontWeight: 'bold',
                          fontSize: '1.08em', // increased font size
                          border: 'none',
                          cursor: isStartingQuiz ? 'not-allowed' : 'pointer',
                          boxShadow: hoveredButton === 'go-quiz' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                          transition: 'all 0.3s ease',
                          transform: hoveredButton === 'go-quiz' ? 'scale(1.05)' : 'scale(1)',
                          opacity: isStartingQuiz ? 0.6 : 1
                        }}
                        onMouseEnter={() => setHoveredButton('go-quiz')}
                        onMouseLeave={() => setHoveredButton(null)}
                        onClick={() => quiz?.id && !isStartingQuiz && startQuiz(quiz.id)}
                        disabled={isStartingQuiz}
                      >
                        {isStartingQuiz ? 'Loading...' : 'GO!'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
                  {prizes
                    .filter(prize => prize.category !== 'Hidden')  // Filter out hidden prizes
                    .map((prize) => {
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
                              transition: 'all 0.3s ease',
                              width: '100%', // Fill the content area
                              padding: 0 // Remove side padding for true 100% width
                            }}>
                              {prize.description}
                            </p>
                          )}

                          {/* Prize Stats */}
                          <div style={{ 
                            display: 'flex', 
                            gap: '12px',
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
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <button
                                style={{
                                  backgroundColor: '#646cff',
                                  color: 'white',
                                  padding: '10px 24px', // increased padding
                                  borderRadius: '8px', // increased border radius
                                  fontWeight: 'bold',
                                  fontSize: '1.08em', // increased font size
                                  border: 'none',
                                  cursor: 'pointer',
                                  boxShadow: hoveredButton === `claim-${prize.id}` ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                                  transition: 'all 0.3s ease',
                                  transform: hoveredButton === `claim-${prize.id}` ? 'scale(1.05)' : 'scale(1)'
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
                                    await Promise.all([
                                      fetchPrizes(),
                                      onRefresh()
                                    ]);
                                  } catch (error) {
                                    console.error('Error claiming prize:', error);
                                    toast.error(error instanceof Error ? error.message : 'Failed to claim prize');
                                  }
                                }}
                              >
                                GET!
                              </button>
                            </div>
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

        {activeTab === 'mystery' && (
          <div style={{
            padding: '20px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            maxWidth: '800px',
            margin: '20px auto'
          }}>
            {/* Mystery Card */}
            <div style={{
              padding: '30px',
              border: '1px solid #e0e0e0',
              borderRadius: '16px',
              backgroundColor: '#f8f8f8',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '24px',
              marginBottom: '30px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
            }}>
              {/* Mystery Box Name */}
              {wheelMetadata?.name && (
                <h3 style={{
                  margin: 0,
                  color: '#333', // Match mission title color
                  fontSize: '1.2em',
                  fontWeight: 'bold',
                  transition: 'all 0.3s ease',
                  textAlign: 'left'
                }}>{wheelMetadata.name}</h3>
              )}
              {/* Card Header */}
              <div style={{
                textAlign: 'center',
                width: '100%'
              }}>
                {wheelMetadata?.end_date && (
                  <p style={{
                    margin: '0',
                    color: '#ff6b6b',
                    fontSize: '0.9em',
                    fontWeight: 'bold'
                  }}>
                    Ends: {new Date(wheelMetadata.end_date).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* Time Remaining with Clock Icon */}
              {wheelMetadata?.end_date && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginBottom: 12,
                  fontSize: '1.1em',
                  color: '#666',
                  fontWeight: 500
                }}>
                  <span role="img" aria-label="clock">⏰</span>
                  <span>Expires in: {getTimeRemaining(wheelMetadata.end_date)}</span>
                </div>
              )}

              {/* Wheel Container */}
              <div style={{
                position: 'relative',
                width: '400px',
                height: '400px',
                marginBottom: '24px'
              }}>
                {/* Mystery Prize Wheel */}
                <div
                  style={{
                    width: '376px',
                    height: '376px',
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    zIndex: 1,
                    transition: isWheelSpinning ? 'transform 3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
                    transform: `rotate(${wheelRotation}deg)`
                  }}
                >
                  <svg width="376" height="376" viewBox="0 0 376 376" style={{ width: '100%', height: '100%' }}>
                    {[...Array(12)].map((_, i) => {
                      const center = 188;
                      const radius = 188;
                      // Start at -90 degrees (top) and rotate clockwise
                      // Win zone is now at 3 o'clock (90 degrees)
                      const startAngle = (i * 30 - 90) * Math.PI / 180;
                      const endAngle = ((i + 1) * 30 - 90) * Math.PI / 180;
                      const x1 = center + radius * Math.cos(startAngle);
                      const y1 = center + radius * Math.sin(startAngle);
                      const x2 = center + radius * Math.cos(endAngle);
                      const y2 = center + radius * Math.sin(endAngle);
                      const largeArc = 0;
                      // Win zone is now at segment 3 (3 o'clock)
                      const color = i === 3 ? '#ffd600' : (i % 2 === 0 ? '#646cff' : '#535bf2');
                      return (
                        <path
                          key={`svg-segment-${i}`}
                          d={`M${center},${center} L${x1},${y1} A${radius},${radius} 0 ${largeArc} 1 ${x2},${y2} Z`}
                          fill={color}
                        />
                      );
                    })}
                  </svg>

                  {/* 12 Lights */}
                  {[...Array(12)].map((_, i) => {
                    const angle = (i * 30 - 90) * (Math.PI / 180); // -90 to start at top
                    const radius = 188 - 18; // inner radius minus light size
                    const x = 188 + radius * Math.cos(angle) - 10; // center + offset - half light size
                    const y = 188 + radius * Math.sin(angle) - 10;
                    return (
                      <div
                        key={`wheel-light-${i}`}
                        style={{
                          position: 'absolute',
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: '#ffd600',
                          boxShadow: '0 0 8px 2px #ffd60099',
                          left: x,
                          top: y,
                          zIndex: 3,
                          border: '3px solid #fff',
                        }}
                      />
                    );
                  })}

                  {/* Section dividers */}
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={`wheel-divider-${i}`}
                      style={{
                        position: 'absolute',
                        width: '2px',
                        height: '188px',
                        backgroundColor: '#fff',
                        transformOrigin: 'bottom center',
                        transform: `rotate(${i * 30}deg)`,
                        top: '0px',
                        left: '188px',
                        marginLeft: '-1px',
                        opacity: 0.5,
                        zIndex: 2
                      }}
                    />
                  ))}

                  {/* Center circle */}
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#646cff',
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                  }} />
                </div>

                {/* Pointer at 3 o'clock (inward facing, tip toward wheel) */}
                <div style={{
                  position: 'absolute',
                  width: 0,
                  height: 0,
                  left: '100%',
                  top: '50%',
                  transform: 'translateY(-50%) rotate(90deg)', // Point tip toward wheel
                  borderLeft: '18px solid transparent',
                  borderRight: '18px solid transparent',
                  borderTop: '32px solid #ffd600', // Inward facing
                  zIndex: 10,
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.18))'
                }} />
              </div>

              {/* Wheel Description below the wheel */}
              {wheelMetadata?.description && (
                <div style={{
                  margin: '0 0 18px 0',
                  width: '100%', // Fill the available width
                  textAlign: 'left',
                  color: '#666',
                  fontSize: '1.08em',
                  fontWeight: 500
                }}>
                  {wheelMetadata.description}
                </div>
              )}

              {/* Prizes info and SPIN! button/credits in a row */}
              <div style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-start',
                justifyContent: 'center',
                gap: 32,
                margin: '0 auto 18px auto',
                maxWidth: 700,
                width: '100%'
              }}>
                {/* Prizes info (left) */}
                {prizes && prizes.filter(p => {
                  const hasMBCategory = Array.isArray(p.category)
                    ? p.category.includes('MB')
                    : p.category === 'MB';
                  const hasMBTag = Array.isArray((p as any).tags)
                    ? ((p as any).tags as string[]).includes('MB')
                    : false;
                  return hasMBCategory || hasMBTag;
                }).length > 0 && (
                  <div style={{
                    flex: 2,
                    minWidth: 0,
                    color: '#333',
                    fontSize: '1.08em',
                    fontWeight: 500,
                    background: '#f3f4fa',
                    borderRadius: 8,
                    padding: '12px 0 8px 0',
                    boxShadow: '0 1px 4px rgba(100,108,255,0.07)',
                    textAlign: 'left',
                    maxWidth: 500 // increased from 400 to 500 (25% larger)
                  }}>
                    <div style={{ fontWeight: 700, marginBottom: 6, color: '#646cff' }}>Prizes Available</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {prizes
                        .filter(p => {
                          const hasMBCategory = Array.isArray(p.category)
                            ? p.category.includes('MB')
                            : p.category === 'MB';
                          const hasMBTag = Array.isArray((p as any).tags)
                            ? ((p as any).tags as string[]).includes('MB')
                            : false;
                          return hasMBCategory || hasMBTag;
                        })
                        .sort((a, b) => {
                          // Remove 'MB' from names for sorting and display
                          const nameA = (a.name || '').replace(/MB/gi, '').trim();
                          const nameB = (b.name || '').replace(/MB/gi, '').trim();
                          return nameA.localeCompare(nameB);
                        })
                        .map(prize => (
                          <div key={prize.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 12px', textAlign: 'left' }}>
                            <span style={{ flex: 1, textAlign: 'left' }}>{(prize.name || '').replace(/MB/gi, '').trim()}</span>
                            <span style={{
                              background: '#646cff',
                              color: 'white',
                              padding: '2px 10px',
                              borderRadius: '6px',
                              fontWeight: 'bold',
                              fontSize: '0.98em',
                              marginLeft: 8,
                              width: '48px', // Fixed width for all quantity badges
                              minWidth: '48px', // Ensure minimum width
                              display: 'inline-flex', // Use flexbox for centering
                              justifyContent: 'center', // Center the number
                              alignItems: 'center', // Vertical center
                              textAlign: 'center',
                            }}>{prize.stock?.available ?? 0}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
                {/* SPIN! button and credits (right) */}
                <div style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  minWidth: 120
                }}>
                  <button
                    onClick={async () => {
                      if (isWheelSpinning) return;
                      setIsWheelSpinning(true);
                      setShowWinIndicator(null);
                      // Randomly select a segment (0-11)
                      const selected = Math.floor(Math.random() * 12);
                      setLastWinningSegment(selected);
                      // For 3 o'clock, pointer is at segment 3
                      const pointerSegment = 3;
                      const extraSpins = 5;
                      const finalRotation = 360 * extraSpins + (360 - ((selected - pointerSegment + 12) % 12) * 30);
                      setWheelRotation(finalRotation);
                      // Wait for animation to finish
                      setTimeout(() => {
                        setIsWheelSpinning(false);
                        setWheelRotation((360 - ((selected - pointerSegment + 12) % 12) * 30) % 360); // keep wheel at final position
                        setShowWinIndicator(selected === pointerSegment);
                        if (selected === pointerSegment) {
                          toast.success('🏆 WIN ZONE!');
                        } else {
                          toast.error('❌ Not a win');
                        }
                      }, 3000);
                    }}
                    disabled={isWheelSpinning}
                    style={{
                      backgroundColor: '#646cff',
                      color: 'white',
                      padding: '12px 32px',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '1.2em',
                      fontWeight: 'bold',
                      cursor: isWheelSpinning ? 'not-allowed' : 'pointer',
                      opacity: isWheelSpinning ? 0.7 : 1,
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      transform: isWheelSpinning ? 'scale(0.95)' : 'scale(1)',
                      marginTop: 12
                    }}
                  >
                    Spin!
                  </button>
                  {/* Credits Display below button */}
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
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    marginTop: 12
                  }}>
                    <span style={{ fontWeight: 'bold' }}>Credits:</span>
                    <span>{typeof wheelMetadata?.cost === 'number' ? wheelMetadata.cost : '—'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

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
                maxWidth: '900px',
                margin: '20px auto'
              }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '18px',
                  width: '100%',
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
                      let cardBg = isCurrentPlayer ? '#e3e7f7' : '#f7f8fa'; // highlight only current player
                      let border = '1.5px solid #e0e0e0';
                      const isHovered = hoveredCard === entry.player_id;
                      const cardBorder = isHovered ? '1px solid #646cff' : border;
                      const cardBoxShadow = isHovered
                        ? '0 4px 8px rgba(0,0,0,0.1)'
                        : '0 2px 4px rgba(0,0,0,0.05)';
                      const cardTransform = isHovered ? 'scale(1.025)' : 'scale(1)';
                      return (
                        <div
                          key={entry.player_id}
                          style={{
                            width: '100%',
                            minHeight: 40,
                            padding: '6px 12px',
                            border: cardBorder,
                            borderRadius: '14px',
                            background: cardBg,
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: '12px',
                            boxShadow: cardBoxShadow,
                            transform: cardTransform,
                            transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                            outline: isCurrentPlayer ? '2px solid #646cff33' : 'none',
                            position: 'relative',
                            marginTop: 0,
                            cursor: 'pointer',
                          }}
                          onMouseEnter={() => setHoveredCard(entry.player_id)}
                          onMouseLeave={() => setHoveredCard(null)}
                          onClick={() => setSelectedCard(selectedCard === entry.player_id ? null : entry.player_id)}
                        >
                          {/* Rank Number */}
                          <div style={{
                            fontSize: '1.5em', // reduced font size
                            fontWeight: 'bold',
                            color: '#646cff',
                            marginRight: 10,
                            minWidth: 28,
                            textAlign: 'center',
                          }}>
                            {index + 1}
                          </div>
                          {/* Player Avatar */}
                          <div style={{
                            width: '36px', // reduced avatar size
                            height: '36px',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            border: '2px solid #646cff',
                            marginRight: 10,
                          }}>
                            <img 
                              src={playerAvatars[entry.player] || 'https://placehold.co/60x60?text=Player'} 
                              alt={`${entry.name}'s avatar`}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                            />
                          </div>
                          {/* Player Name */}
                          <h3 style={{ 
                            margin: 0,
                            color: isCurrentPlayer ? '#646cff' : '#333',
                            fontSize: '1.1em',
                            fontWeight: 'bold',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: 160,
                            textAlign: 'left',
                          }}>
                            {entry.name}
                          </h3>
                          {/* Spacer to push points to the right */}
                          <div style={{ flex: 1 }} />
                          {/* Points */}
                          <div style={{
                            backgroundColor: '#646cff',
                            color: 'white',
                            padding: '5px 10px', // reduced padding
                            borderRadius: '6px',
                            fontSize: '0.98em', // reduced font size
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            minWidth: '56px', // reduced min width
                            maxWidth: '56px', // reduced max width
                            justifyContent: 'center',
                          }}>
                            <span>{entry.scores?.toLocaleString() ?? 0}</span>
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
          opacity: activeTab === 'badges' ? 1 : 0,
          transform: activeTab === 'badges' ? 'translateX(0)' : 'translateX(20px)',
          pointerEvents: activeTab === 'badges' ? 'auto' : 'none',
          visibility: activeTab === 'badges' ? 'visible' : 'hidden',
          position: activeTab === 'badges' ? 'relative' : 'absolute'
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
                Loading badges...
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
                {/* Missions Completed Section */}
                <div style={{ marginBottom: '30px' }}>
                  <h2 style={{ color: '#333', marginBottom: '15px' }}>Missions Completed</h2>
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

                {/* Quizzes Completed Section - always show, even if empty */}
                <div style={{ marginBottom: '30px' }}>
                  <h2 style={{ color: '#333', marginBottom: '15px' }}>Quizzes Completed</h2>
                  {completedQuizzes && completedQuizzes.length > 0 ? (
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
                          <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e0e0e0' }}>Status</th>
                          <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e0e0e0' }}>First</th>
                          <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e0e0e0' }}>Last</th>
                        </tr>
                      </thead>
                      <tbody>
                        {completedQuizzes.map((row: any, idx: number) => (
                          <tr key={row.name + '-' + idx} style={{ borderBottom: '1px solid #e0e0e0' }}>
                            <td style={{ padding: '12px', textAlign: 'left' }}>{row.name}</td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>{row.status}</td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>{row.first ? new Date(row.first).toLocaleDateString() : '-'}</td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>{row.last ? new Date(row.last).toLocaleDateString() : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ color: '#888', textAlign: 'center', padding: '18px 0' }}>
                      No quizzes attempted yet.
                    </div>
                  )}
                </div>

                {/* Badges Completed Section */}
                <div style={{ marginBottom: '30px' }}>
                  <h2 style={{ color: '#333', marginBottom: '15px' }}>Badges Earned</h2>
                  <div style={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
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
                          <th style={{ fontWeight: 'bold', padding: '12px', textAlign: 'left', borderBottom: '2px solid #e0e0e0' }}>Name</th>
                          <th style={{ color: '#666', padding: '12px', textAlign: 'center', borderBottom: '2px solid #e0e0e0' }}>Status</th>
                          <th style={{ color: '#666', padding: '12px', textAlign: 'center', borderBottom: '2px solid #e0e0e0' }}>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {grantedAchievements.map((achievement: any) => {
                          const date = achievement.granted_at || achievement.actions?.completedOn;
                          let status = 'Granted';
                          if (achievement.status && achievement.status.toLowerCase() === 'unlocked') {
                            status = 'Unlocked';
                          }
                          return (
                            <tr key={achievement.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                              <td style={{ padding: '12px', textAlign: 'left' }}>{achievement.name}</td>
                              <td style={{ color: '#666', padding: '12px', textAlign: 'center' }}>{status}</td>
                              <td style={{ color: '#666', padding: '12px', textAlign: 'center' }}>{date ? new Date(date).toLocaleDateString() : '-'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Prizes Redeemed Section */}
                <div>
                  <h2 style={{ color: '#333', marginBottom: '15px' }}>Prizes Redeemed</h2>
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
                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e0e0e0' }}>Redemptions</th>
                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e0e0e0' }}>First</th>
                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e0e0e0' }}>Last</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(redeemedPrizes || []).map((prize) => {
                        const count = prize.actions?.count ?? 1;
                        return (
                          <tr key={prize.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                            <td style={{ padding: '12px', textAlign: 'left' }}>{prize.name}</td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>{count}</td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>{prize.actions?.firstCompletedOn ? new Date(prize.actions.firstCompletedOn).toLocaleDateString() : '-'}</td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>{prize.actions?.completedOn ? new Date(prize.actions.completedOn).toLocaleDateString() : '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Quiz Modal Popup */}
      {quizModalOpen && activeQuiz && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.45)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
            padding: '32px 24px',
            minWidth: 340,
            maxWidth: 520,
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto',
            position: 'relative',
          }}>
            <button
              onClick={() => setQuizModalOpen(false)}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                background: 'transparent',
                border: 'none',
                fontSize: 22,
                color: '#888',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
              aria-label="Close"
            >
              ×
            </button>
            <h2 style={{ marginTop: 0, marginBottom: 18, textAlign: 'center' }}>{activeQuiz.name}</h2>
            {/* Progress Bar */}
            {activeQuiz.questions && activeQuiz.questions.length > 1 && (
              <div style={{
                width: '100%',
                margin: '0 auto 24px auto',
                height: 10,
                background: '#e0e4fa',
                borderRadius: 6,
                overflow: 'hidden',
                boxShadow: '0 1px 4px rgba(100,108,255,0.07)'
              }}>
                <div
                  style={{
                    width: `${((currentQuestion + 1) / activeQuiz.questions.length) * 100}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #646cff 60%, #aab6ff 100%)',
                    borderRadius: 6,
                    transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)'
                  }}
                />
              </div>
            )}
            {(!activeQuiz.questions || activeQuiz.questions.length === 0) ? (
              <div style={{ color: '#c00', fontWeight: 600, textAlign: 'center', margin: '32px 0' }}>
                Error: Quiz data is incomplete or invalid. Please try again later.
              </div>
            ) : (
              <form onSubmit={e => { e.preventDefault(); submitQuizAnswers(); }}>
                {/* Show only the current question */}
                {(() => {
                  const q = activeQuiz.questions[currentQuestion];
                  const idx = currentQuestion;
                  return (
                    <div key={q.id || idx} style={{
                      marginBottom: 28,
                      background: '#f7f8ff',
                      borderRadius: 12,
                      boxShadow: '0 1px 4px rgba(100,108,255,0.07)',
                      padding: 18,
                      border: '1.5px solid #e0e0e0',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'stretch',
                      gap: 10,
                    }}>
                      {/* Question Image */}
                      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                        <img
                          src={q.imgUrl || 'https://placehold.co/320x160?text=Question'}
                          alt="Question"
                          style={{
                            maxWidth: '100%',
                            maxHeight: 140,
                            borderRadius: 8,
                            objectFit: 'cover',
                            boxShadow: '0 2px 8px rgba(100,108,255,0.08)',
                          }}
                        />
                      </div>
                      <div style={{ fontWeight: 600, marginBottom: 6, fontSize: '1.08em', color: '#333', textAlign: 'center' }}>{q.text || q.question || `Question ${idx + 1}`}</div>
                      {q.choices && Array.isArray(q.choices) ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                          {q.choices.map((choice: any, cidx: number) => (
                            <label key={choice.id || cidx} style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 14,
                              background: '#fff',
                              borderRadius: 8,
                              border: quizAnswers[q.id || idx] === (choice.id || choice) ? '2px solid #646cff' : '1.5px solid #e0e0e0',
                              boxShadow: quizAnswers[q.id || idx] === (choice.id || choice) ? '0 2px 8px rgba(100,108,255,0.10)' : 'none',
                              padding: '8px 12px',
                              cursor: 'pointer',
                              transition: 'border 0.2s, box-shadow 0.2s',
                            }}>
                              {/* Choice Image */}
                              <img
                                src={choice.imgUrl || 'https://placehold.co/48x48?text=Option'}
                                alt="Option"
                                style={{
                                  width: 44,
                                  height: 44,
                                  borderRadius: 6,
                                  objectFit: 'cover',
                                  background: '#e0e0e0',
                                  flexShrink: 0,
                                }}
                              />
                              <input
                                type="radio"
                                name={`quiz-q-${idx}`}
                                value={choice.id || choice}
                                checked={quizAnswers[q.id || idx] === (choice.id || choice)}
                                onChange={() => setQuizAnswers(a => ({ ...a, [q.id || idx]: choice.id || choice }))}
                                style={{ marginRight: 8 }}
                              />
                              <span style={{ fontSize: '1em', color: '#222', fontWeight: 500 }}>{choice.text || choice.label || choice}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={quizAnswers[q.id || idx] || ''}
                          onChange={e => setQuizAnswers(a => ({ ...a, [q.id || idx]: e.target.value }))}
                          style={{ width: '100%', padding: 10, borderRadius: 6, border: '1.5px solid #ccc', fontSize: '1em', marginTop: 8 }}
                          placeholder="Your answer"
                        />
                      )}
                    </div>
                  );
                })()}
                {/* Navigation Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => setCurrentQuestion(q => Math.max(0, q - 1))}
                    disabled={currentQuestion === 0}
                    style={{
                      background: '#eee',
                      color: '#333',
                      padding: '8px 20px',
                      borderRadius: 8,
                      fontWeight: 'bold',
                      fontSize: '1em',
                      border: 'none',
                      cursor: currentQuestion === 0 ? 'not-allowed' : 'pointer',
                      opacity: currentQuestion === 0 ? 0.6 : 1,
                      marginRight: 8
                    }}
                  >
                    Previous
                  </button>
                  {currentQuestion < activeQuiz.questions.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentQuestion(q => Math.min(activeQuiz.questions.length - 1, q + 1))}
                      disabled={!quizAnswers[activeQuiz.questions[currentQuestion].id || currentQuestion]}
                      style={{
                        background: '#646cff',
                        color: 'white',
                        padding: '8px 20px',
                        borderRadius: 8,
                        fontWeight: 'bold',
                        fontSize: '1em',
                        border: 'none',
                        cursor: !quizAnswers[activeQuiz.questions[currentQuestion].id || currentQuestion] ? 'not-allowed' : 'pointer',
                        opacity: !quizAnswers[activeQuiz.questions[currentQuestion].id || currentQuestion] ? 0.6 : 1
                      }}
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={!quizAnswers[activeQuiz.questions[currentQuestion].id || currentQuestion]}
                      style={{
                        background: '#646cff',
                        color: 'white',
                        padding: '8px 32px',
                        borderRadius: 8,
                        fontWeight: 'bold',
                        fontSize: '1.08em',
                        border: 'none',
                        cursor: !quizAnswers[activeQuiz.questions[currentQuestion].id || currentQuestion] ? 'not-allowed' : 'pointer',
                        marginTop: 10,
                        boxShadow: '0 2px 8px rgba(100,108,255,0.10)',
                        letterSpacing: 0.5,
                        opacity: !quizAnswers[activeQuiz.questions[currentQuestion].id || currentQuestion] ? 0.6 : 1
                      }}
                    >
                      Submit
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Missions; 