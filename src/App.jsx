import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Dices,
  Puzzle,
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
  UserPlus,
  Trash2,
  X,
  Play,
  ArrowRight,
  Users,
  Copy,
  Check,
  Wifi,
  Monitor,
  Crown,
  LogOut,
  Volume2
} from 'lucide-react';
import {
  BOARD_SPACES,
  PROGRESSO_REGRESSO_CARDS,
  ACAO_CARDS,
  SMART_CITIES_DEFINITION
} from './data/cidadesData';
import { RoomConnectionManager } from './multiplayer/roomSync';

// 4 Peões disponíveis para os até 4 jogadores da sala
export const PAWN_OPTIONS = [
  {
    id: 'skate_patins',
    emoji: '🛼',
    label: 'Patins Retrô',
    color: '#9333ea',
    gradient: 'linear-gradient(135deg, #a855f7, #ec4899)',
    lightBg: '#f3e8ff'
  },
  {
    id: 'bike_solar',
    emoji: '🚲',
    label: 'Bike Verde',
    color: '#059669',
    gradient: 'linear-gradient(135deg, #10b981, #047857)',
    lightBg: '#d1fae5'
  },
  {
    id: 'skate_eco',
    emoji: '🛹',
    label: 'Skate Solar',
    color: '#ea580c',
    gradient: 'linear-gradient(135deg, #f97316, #dc2626)',
    lightBg: '#ffedd5'
  },
  {
    id: 'patinete_smart',
    emoji: '🛴',
    label: 'Patinete Elétrico',
    color: '#0284c7',
    gradient: 'linear-gradient(135deg, #38bdf8, #0369a1)',
    lightBg: '#e0f2fe'
  }
];

// Componente visual do Dado 3D com bolinhas reais (1 a 6)
function DiceFace({ value, isRolling }) {
  const pipPositions = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8]
  };
  const activePips = pipPositions[value] || [4];

  return (
    <div className={`dice-3d-cube ${isRolling ? 'rolling' : ''}`}>
      <div className="dice-grid-3x3">
        {Array.from({ length: 9 }).map((_, idx) => (
          <span
            key={idx}
            className={`dice-pip ${activePips.includes(idx) ? 'visible' : ''} ${
              value === 1 && idx === 4 ? 'pip-center-big' : ''
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// Gera código numérico curto de 4 dígitos para a sala
function generateRoomCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export default function App() {
  // Telas: 'welcome' | 'lobby' | 'playing'
  const [screen, setScreen] = useState('welcome');
  const [showRankingModal, setShowRankingModal] = useState(false);

  // Dados do jogador local na tela inicial
  const [playerName, setPlayerName] = useState('');
  const [playerClass, setPlayerClass] = useState('');
  const [selectedPawnId, setSelectedPawnId] = useState(PAWN_OPTIONS[0].id);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [formError, setFormError] = useState('');

  // Adicionar jogador no mesmo computador (dentro do Lobby)
  const [localAddName, setLocalAddName] = useState('');
  const [localAddClass, setLocalAddClass] = useState('8º A');
  const [showAddLocalForm, setShowAddLocalForm] = useState(false);

  // Identificador único deste navegador/aba
  const [myClientId] = useState(() => 'p_' + Math.random().toString(36).slice(2, 10));

  // Estado da Sala Multiplayer
  const [roomRole, setRoomRole] = useState('host'); // 'host' | 'guest'
  const [roomCode, setRoomCode] = useState('');
  const [networkStatus, setNetworkStatus] = useState('online'); // 'online' | 'connected' | 'local-only' | 'disconnected'
  const [copiedCode, setCopiedCode] = useState(false);

  // Rankings separados para 8º A e 8º B
  const [ranking, setRanking] = useState(() => {
    const saved = localStorage.getItem('cidades_inteligentes_ranking_v1');
    return saved ? JSON.parse(saved) : [];
  });

  // Estado Sincronizado da Partida (Host é a fonte da verdade e transmite aos Guests)
  const [players, setPlayers] = useState([]);
  const [currentTurnIdx, setCurrentTurnIdx] = useState(0);
  const [diceValue, setDiceValue] = useState(1);
  const [isRolling, setIsRolling] = useState(false);
  const [isMovingPawn, setIsMovingPawn] = useState(false);
  const [steppingPlayerId, setSteppingPlayerId] = useState(null);
  const [activeEvent, setActiveEvent] = useState(null);
  const [turnReadyToAdvance, setTurnReadyToAdvance] = useState(false);
  const [extraRollGranted, setExtraRollGranted] = useState(false);
  const [isGameFinished, setIsGameFinished] = useState(false);
  const [winnerPlayer, setWinnerPlayer] = useState(null);

  // Refs para ter sempre o estado mais recente dentro dos callbacks de rede e timers
  const roomManagerRef = useRef(null);
  const stateRef = useRef({});
  stateRef.current = {
    screen,
    roomRole,
    roomCode,
    players,
    currentTurnIdx,
    diceValue,
    isRolling,
    isMovingPawn,
    steppingPlayerId,
    activeEvent,
    turnReadyToAdvance,
    extraRollGranted,
    isGameFinished,
    winnerPlayer
  };

  useEffect(() => {
    localStorage.setItem('cidades_inteligentes_ranking_v1', JSON.stringify(ranking));
  }, [ranking]);

  // Limpa conexão ao desmontar
  useEffect(() => {
    return () => {
      if (roomManagerRef.current) {
        roomManagerRef.current.destroy();
      }
    };
  }, []);

  // Sempre que o Host alterar o estado relevante da sala/jogo, transmite para todos os conectados
  useEffect(() => {
    if (roomRole === 'host' && roomManagerRef.current && (screen === 'lobby' || screen === 'playing')) {
      roomManagerRef.current.send({
        type: 'ROOM_STATE_SYNC',
        payload: {
          screen,
          players,
          currentTurnIdx,
          diceValue,
          isRolling,
          isMovingPawn,
          steppingPlayerId,
          activeEvent,
          turnReadyToAdvance,
          extraRollGranted,
          isGameFinished,
          winnerPlayer
        }
      });
    }
  }, [
    roomRole,
    screen,
    players,
    currentTurnIdx,
    diceValue,
    isRolling,
    isMovingPawn,
    steppingPlayerId,
    activeEvent,
    turnReadyToAdvance,
    extraRollGranted,
    isGameFinished,
    winnerPlayer
  ]);

  // Validação dos campos básicos do jogador
  const validateIdentity = () => {
    const trimmed = playerName.trim();
    if (!trimmed && !playerClass) {
      setFormError('Por favor, digite seu nome e selecione sua turma (8º A ou 8º B)!');
      return false;
    }
    if (!trimmed) {
      setFormError('Por favor, digite seu nome antes de continuar!');
      return false;
    }
    if (!playerClass) {
      setFormError('Por favor, escolha sua turma (8º A ou 8º B)!');
      return false;
    }
    setFormError('');
    return true;
  };

  // Criar Sala como Host
  const handleCreateRoom = (e) => {
    if (e) e.preventDefault();
    if (!validateIdentity()) return;

    if (roomManagerRef.current) {
      roomManagerRef.current.destroy();
    }

    const code = generateRoomCode();
    const hostPlayer = {
      id: myClientId,
      name: playerName.trim(),
      turma: playerClass,
      pawnId: selectedPawnId,
      isHost: true,
      isLocalOnHost: true,
      position: 0,
      credits: 5,
      puzzlePieces: 0,
      turns: 0,
      skipNextTurn: false
    };

    setRoomRole('host');
    setRoomCode(code);
    setPlayers([hostPlayer]);
    setCurrentTurnIdx(0);
    setIsGameFinished(false);
    setWinnerPlayer(null);
    setActiveEvent(null);
    setTurnReadyToAdvance(false);
    setExtraRollGranted(false);
    setScreen('lobby');

    const manager = new RoomConnectionManager({
      role: 'host',
      roomCode: code,
      onPeerStatusChange: (status) => {
        setNetworkStatus(status);
      },
      onError: (msg) => {
        setFormError(msg);
      },
      onMessage: (data, senderPeerId) => {
        handleHostReceiveMessage(data, senderPeerId);
      }
    });

    roomManagerRef.current = manager;
  };

  // Entrar em Sala existente como Convidado (Guest em outro computador ou outra aba)
  const handleJoinRoom = (e) => {
    if (e) e.preventDefault();
    if (!validateIdentity()) return;
    const cleanCode = joinCodeInput.trim().toUpperCase();
    if (cleanCode.length < 4) {
      setFormError('Digite o código de 4 números da sala criada pelo seu colega!');
      return;
    }

    if (roomManagerRef.current) {
      roomManagerRef.current.destroy();
    }

    setFormError('');
    setRoomRole('guest');
    setRoomCode(cleanCode);
    setNetworkStatus('searching');

    const myPlayerInfo = {
      id: myClientId,
      name: playerName.trim(),
      turma: playerClass,
      pawnId: selectedPawnId,
      isHost: false,
      isLocalOnHost: false
    };

    const manager = new RoomConnectionManager({
      role: 'guest',
      roomCode: cleanCode,
      onPeerStatusChange: (status) => {
        setNetworkStatus(status);
        if (status === 'connected' || status === 'searching-local' || status === 'local-only') {
          manager.send({
            type: 'JOIN_REQUEST',
            player: myPlayerInfo
          });
        }
      },
      onError: (msg) => {
        setFormError(msg);
      },
      onMessage: (data) => {
        handleGuestReceiveMessage(data);
      }
    });

    roomManagerRef.current = manager;

    // Envia pedido imediato também pelo BroadcastChannel (caso seja na mesma máquina)
    setTimeout(() => {
      manager.send({
        type: 'JOIN_REQUEST',
        player: myPlayerInfo
      });
    }, 250);

    setJoinModalOpen(false);
    setScreen('lobby');
  };

  // Host processa mensagens vindas dos outros jogadores conectados
  const handleHostReceiveMessage = (data, senderPeerId) => {
    const st = stateRef.current;
    if (!data || !data.type) return;

    if (data.type === 'JOIN_REQUEST' && data.player) {
      setPlayers((prev) => {
        // Se já está na sala, apenas atualiza e reenvia estado
        const existing = prev.find((p) => p.id === data.player.id);
        if (existing) return [...prev];
        if (prev.length >= 4) {
          roomManagerRef.current?.send({
            type: 'JOIN_REJECTED',
            targetId: data.player.id,
            reason: 'A sala já está cheia (máximo de 4 jogadores).'
          });
          return prev;
        }

        // Escolhe um peão livre caso o escolhido já esteja em uso
        const usedPawns = prev.map((p) => p.pawnId);
        let assignedPawn = data.player.pawnId;
        if (usedPawns.includes(assignedPawn)) {
          const freePawn = PAWN_OPTIONS.find((po) => !usedPawns.includes(po.id));
          if (freePawn) assignedPawn = freePawn.id;
        }

        const newGuest = {
          id: data.player.id,
          peerId: senderPeerId,
          name: data.player.name.slice(0, 22),
          turma: data.player.turma || '8º A',
          pawnId: assignedPawn,
          isHost: false,
          isLocalOnHost: false,
          position: 0,
          credits: 5,
          puzzlePieces: 0,
          turns: 0,
          skipNextTurn: false
        };
        return [...prev, newGuest];
      });
    } else if (data.type === 'CHANGE_PAWN' && data.playerId && data.pawnId) {
      setPlayers((prev) => {
        const alreadyTaken = prev.some((p) => p.id !== data.playerId && p.pawnId === data.pawnId);
        if (alreadyTaken) return prev;
        return prev.map((p) => (p.id === data.playerId ? { ...p, pawnId: data.pawnId } : p));
      });
    } else if (data.type === 'GUEST_ACTION') {
      const currentPlayer = st.players[st.currentTurnIdx];
      if (!currentPlayer || currentPlayer.id !== data.playerId) return;

      if (data.action === 'ROLL_DICE') {
        triggerRollDiceOnHost();
      } else if (data.action === 'ANSWER_CARD') {
        triggerAnswerActionCardOnHost(data.optionIndex);
      } else if (data.action === 'NEXT_TURN') {
        triggerNextTurnOnHost();
      }
    }
  };

  // Guest recebe sincronização de estado vinda do Host
  const handleGuestReceiveMessage = (data) => {
    if (!data || !data.type) return;

    if (data.type === 'JOIN_REJECTED' && data.targetId === myClientId) {
      setFormError(data.reason || 'Não foi possível entrar na sala.');
      setScreen('welcome');
      return;
    }

    if (data.type === 'ROOM_STATE_SYNC' && data.payload) {
      const p = data.payload;
      setNetworkStatus('connected');
      if (p.screen) setScreen(p.screen);
      if (p.players) setPlayers(p.players);
      if (typeof p.currentTurnIdx === 'number') setCurrentTurnIdx(p.currentTurnIdx);
      if (typeof p.diceValue === 'number') setDiceValue(p.diceValue);
      setIsRolling(Boolean(p.isRolling));
      setIsMovingPawn(Boolean(p.isMovingPawn));
      setSteppingPlayerId(p.steppingPlayerId || null);
      setActiveEvent(p.activeEvent || null);
      setTurnReadyToAdvance(Boolean(p.turnReadyToAdvance));
      setExtraRollGranted(Boolean(p.extraRollGranted));
      setIsGameFinished(Boolean(p.isGameFinished));
      setWinnerPlayer(p.winnerPlayer || null);
    }
  };

  // Adicionar jogador no mesmo computador (para jogar em 2 a 4 amigos no mesmo PC ou misto)
  const handleAddLocalPlayer = (e) => {
    if (e) e.preventDefault();
    if (players.length >= 4) return;
    const trimmed = localAddName.trim();
    if (!trimmed) return;

    const usedPawns = players.map((p) => p.pawnId);
    const freePawn = PAWN_OPTIONS.find((po) => !usedPawns.includes(po.id)) || PAWN_OPTIONS[0];

    const newLocalPlayer = {
      id: 'local_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      name: trimmed.slice(0, 22),
      turma: localAddClass || playerClass || '8º A',
      pawnId: freePawn.id,
      isHost: false,
      isLocalOnHost: true,
      position: 0,
      credits: 5,
      puzzlePieces: 0,
      turns: 0,
      skipNextTurn: false
    };

    setPlayers((prev) => [...prev, newLocalPlayer]);
    setLocalAddName('');
    setShowAddLocalForm(false);
  };

  // Remover um jogador da sala (apenas no Lobby pelo Host)
  const handleRemovePlayer = (idToRemove) => {
    if (roomRole !== 'host') return;
    setPlayers((prev) => prev.filter((p) => p.id !== idToRemove));
  };

  // Trocar peão no Lobby
  const handleSelectPawnInLobby = (playerId, newPawnId) => {
    const taken = players.some((p) => p.id !== playerId && p.pawnId === newPawnId);
    if (taken) return;

    if (roomRole === 'host') {
      setPlayers((prev) =>
        prev.map((p) => (p.id === playerId ? { ...p, pawnId: newPawnId } : p))
      );
    } else {
      roomManagerRef.current?.send({
        type: 'CHANGE_PAWN',
        playerId,
        pawnId: newPawnId
      });
    }
  };

  // Iniciar partida a partir do Lobby (Host)
  const handleStartMatchFromLobby = () => {
    if (roomRole !== 'host' || players.length === 0) return;

    const initializedPlayers = players.map((p) => ({
      ...p,
      position: 0,
      credits: 5,
      puzzlePieces: 0,
      turns: 0,
      skipNextTurn: false
    }));

    setPlayers(initializedPlayers);
    setCurrentTurnIdx(0);
    setDiceValue(1);
    setIsRolling(false);
    setIsMovingPawn(false);
    setSteppingPlayerId(null);
    setTurnReadyToAdvance(false);
    setExtraRollGranted(false);
    setIsGameFinished(false);
    setWinnerPlayer(null);
    setActiveEvent({
      type: 'space',
      spaceType: 'inicio',
      title: '🚦 Partida Iniciada na Trilha das Cidades Inteligentes!',
      message: `${initializedPlayers[0].name} começa a rodada! Todos iniciam na casa INÍCIO com 5 Créditos Verdes. Complete 3 voltas (3 peças do Quebra-Cabeça) para vencer!`
    });
    setScreen('playing');
  };

  // Utilitário de espera assíncrona para caminhar casa por casa
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // Lógica principal de girar o dado e caminhar CASA POR CASA no tabuleiro (executada no Host)
  const triggerRollDiceOnHost = async () => {
    const st = stateRef.current;
    if (st.isRolling || st.isMovingPawn || st.isGameFinished) return;
    if (st.activeEvent?.type === 'acao' && !st.activeEvent.answered) return;

    const activePlayer = st.players[st.currentTurnIdx];
    if (!activePlayer) return;

    setTurnReadyToAdvance(false);
    setExtraRollGranted(false);
    setActiveEvent(null);
    setIsRolling(true);

    // Animação visual de faces do dado girando
    const rolled = Math.floor(Math.random() * 6) + 1;
    await sleep(600);

    setDiceValue(rolled);
    setIsRolling(false);
    setIsMovingPawn(true);
    setSteppingPlayerId(activePlayer.id);

    let currentPos = activePlayer.position;
    let currentPieces = activePlayer.puzzlePieces;
    let currentCredits = activePlayer.credits;
    const updatedTurns = activePlayer.turns + 1;
    let passedStartDuringMove = false;

    // Caminha CASA POR CASA (1 casa de cada vez) seguindo o perímetro do tabuleiro!
    for (let step = 1; step <= rolled; step++) {
      await sleep(290);
      currentPos = (currentPos + 1) % 20;

      // Se passou ou parou na casa 0 (Início), completou mais 1 volta e ganha +1 peça do Quebra-Cabeça!
      if (currentPos === 0) {
        passedStartDuringMove = true;
        currentPieces = Math.min(3, currentPieces + 1);
      }

      const posSnapshot = currentPos;
      const piecesSnapshot = currentPieces;

      setPlayers((prev) =>
        prev.map((p, idx) =>
          idx === st.currentTurnIdx
            ? { ...p, position: posSnapshot, puzzlePieces: piecesSnapshot, turns: updatedTurns }
            : p
        )
      );

      // Se já conquistou as 3 peças do Quebra-Cabeça (3 voltas), encerra imediatamente na casa Início!
      if (currentPieces >= 3) {
        await sleep(350);
        setIsMovingPawn(false);
        setSteppingPlayerId(null);
        finishMatchOnHost(st.currentTurnIdx, currentCredits + 3, updatedTurns);
        return;
      }
    }

    await sleep(220);

    // Verifica a casa onde o peão parou
    const landedSpace = BOARD_SPACES[currentPos];

    // CASO 1: Casa 9 — Pedal Sustentável (+2 Créditos Verdes e Avança 3 casas passo a passo!)
    if (landedSpace.tipo === 'bike_avance3') {
      currentCredits += 2;
      setPlayers((prev) =>
        prev.map((p, idx) =>
          idx === st.currentTurnIdx ? { ...p, credits: currentCredits } : p
        )
      );

      setActiveEvent({
        type: 'space',
        spaceType: 'bike_avance3',
        playerName: activePlayer.name,
        title: '🚲 Pedal Sustentável! (+2 Créditos e Avança 3 Casas)',
        message: `${activePlayer.name} andou de bike sem emitir CO₂! Ganhou +2 Créditos Verdes e vai avançar mais 3 casas agora!`,
        passedStart: passedStartDuringMove
      });

      // Pausa para o jogador ver que parou na casa 9 antes de avançar as 3 casas bônus
      await sleep(850);

      for (let bonusStep = 1; bonusStep <= 3; bonusStep++) {
        await sleep(290);
        currentPos = (currentPos + 1) % 20;
        const bonusPosSnapshot = currentPos;
        setPlayers((prev) =>
          prev.map((p, idx) =>
            idx === st.currentTurnIdx ? { ...p, position: bonusPosSnapshot } : p
          )
        );
      }

      setIsMovingPawn(false);
      setSteppingPlayerId(null);
      setTurnReadyToAdvance(true);
      return;
    }

    // CASO 2: Casa 12 — Descarte Incorreto de Lixo (Volta 2 casas passo a passo até a Casa 10!)
    if (landedSpace.tipo === 'lixo_volte2') {
      setActiveEvent({
        type: 'space',
        spaceType: 'lixo_volte2',
        playerName: activePlayer.name,
        title: '⚠️ Descarte Incorreto de Lixo! (Volte 2 Casas)',
        message: `${activePlayer.name} não descartou o lixo corretamente e precisa voltar 2 casas até o Momento de Descanso.`,
        passedStart: passedStartDuringMove
      });

      // Pausa para o jogador ver que caiu na casa 12 antes do peão voltar 2 casas
      await sleep(850);

      for (let backStep = 1; backStep <= 2; backStep++) {
        await sleep(310);
        currentPos = (currentPos - 1 + 20) % 20;
        const backPosSnapshot = currentPos;
        setPlayers((prev) =>
          prev.map((p, idx) =>
            idx === st.currentTurnIdx ? { ...p, position: backPosSnapshot } : p
          )
        );
      }

      setIsMovingPawn(false);
      setSteppingPlayerId(null);
      setTurnReadyToAdvance(true);
      return;
    }

    setIsMovingPawn(false);
    setSteppingPlayerId(null);

    // CASO 3: Casa Progresso ou Regresso
    if (landedSpace.tipo === 'progresso_regresso') {
      const randomCard =
        PROGRESSO_REGRESSO_CARDS[Math.floor(Math.random() * PROGRESSO_REGRESSO_CARDS.length)];
      const updatedCredits = Math.max(0, currentCredits + randomCard.creditos);

      setPlayers((prev) =>
        prev.map((p, idx) =>
          idx === st.currentTurnIdx ? { ...p, credits: updatedCredits } : p
        )
      );

      setActiveEvent({
        type: 'pr',
        playerName: activePlayer.name,
        card: randomCard,
        passedStart: passedStartDuringMove
      });
      setTurnReadyToAdvance(true);
    } else if (landedSpace.tipo === 'acao') {
      // CASO 4: Carta de Ação (Quiz, Criatividade, Debate ou Ação Cidadã)
      const randomAction = ACAO_CARDS[Math.floor(Math.random() * ACAO_CARDS.length)];
      setActiveEvent({
        type: 'acao',
        playerName: activePlayer.name,
        card: randomAction,
        answered: false,
        chosenIdx: null,
        passedStart: passedStartDuringMove
      });
      // Só libera passar a vez depois de responder à pergunta
      setTurnReadyToAdvance(false);
    } else if (landedSpace.tipo === 'steam') {
      // CASO 5: Espaço STEAM+ (+2 Créditos Verdes)
      const updatedCredits = currentCredits + 2;
      setPlayers((prev) =>
        prev.map((p, idx) =>
          idx === st.currentTurnIdx ? { ...p, credits: updatedCredits } : p
        )
      );
      setActiveEvent({
        type: 'space',
        spaceType: 'steam',
        playerName: activePlayer.name,
        title: '🚀 Espaço STEAM+ (+2 Créditos Verdes)',
        message: landedSpace.descricao,
        passedStart: passedStartDuringMove
      });
      setTurnReadyToAdvance(true);
    } else if (landedSpace.tipo === 'estudo_jogue_novamente') {
      // CASO 6: Compartilhando Saberes (+2 Créditos Verdes e Jogue Novamente!)
      const updatedCredits = currentCredits + 2;
      setPlayers((prev) =>
        prev.map((p, idx) =>
          idx === st.currentTurnIdx ? { ...p, credits: updatedCredits } : p
        )
      );
      setActiveEvent({
        type: 'space',
        spaceType: 'estudo_jogue_novamente',
        playerName: activePlayer.name,
        title: '🎲 Compartilhando Saberes! (+2 Créditos e Jogue Novamente)',
        message: `${activePlayer.name} estudou sobre as cidades inteligentes e compartilhou com a comunidade! Ganhou +2 Créditos Verdes e direito a jogar o dado novamente!`,
        passedStart: passedStartDuringMove
      });
      setExtraRollGranted(true);
      setTurnReadyToAdvance(true);
    } else if (landedSpace.tipo === 'parque') {
      // CASO 7: Passeio no Parque (descansa 1 rodada quando há mais jogadores)
      setPlayers((prev) =>
        prev.map((p, idx) =>
          idx === st.currentTurnIdx
            ? { ...p, skipNextTurn: prev.length > 1 }
            : p
        )
      );
      setActiveEvent({
        type: 'space',
        spaceType: 'parque',
        playerName: activePlayer.name,
        title: '🌳 Passeio no Parque',
        message:
          st.players.length > 1
            ? `${activePlayer.name} chegou ao parque! Aproveite o passeio em contato com a natureza (descansa na próxima rodada).`
            : `${activePlayer.name} chegou ao parque! Aproveite o passeio em contato com a natureza.`,
        passedStart: passedStartDuringMove
      });
      setTurnReadyToAdvance(true);
    } else {
      // CASO 8: Início ou Momento de Descanso
      setActiveEvent({
        type: 'space',
        spaceType: landedSpace.tipo,
        playerName: activePlayer.name,
        title: `🌈 ${landedSpace.nome}`,
        message: landedSpace.descricao,
        passedStart: passedStartDuringMove
      });
      setTurnReadyToAdvance(true);
    }
  };

  // Responder Carta de Ação (executado no Host)
  const triggerAnswerActionCardOnHost = (optionIndex) => {
    const st = stateRef.current;
    if (!st.activeEvent || st.activeEvent.type !== 'acao' || st.activeEvent.answered) return;

    const isCorrect = optionIndex === st.activeEvent.card.correta;
    const activePlayer = st.players[st.currentTurnIdx];
    if (!activePlayer) return;

    if (isCorrect) {
      const updatedCredits = activePlayer.credits + st.activeEvent.card.creditos;
      setPlayers((prev) =>
        prev.map((p, idx) =>
          idx === st.currentTurnIdx ? { ...p, credits: updatedCredits } : p
        )
      );
    }

    setActiveEvent({
      ...st.activeEvent,
      answered: true,
      chosenIdx: optionIndex,
      isCorrect
    });
    setTurnReadyToAdvance(true);
  };

  // Avançar para o próximo jogador da roda (ou jogar novamente se tirou bônus)
  const triggerNextTurnOnHost = () => {
    const st = stateRef.current;
    if (st.isRolling || st.isMovingPawn || st.isGameFinished) return;

    // Se o jogador atual ganhou direito a jogar novamente (Casa 16)
    if (st.extraRollGranted) {
      setExtraRollGranted(false);
      setTurnReadyToAdvance(false);
      setActiveEvent({
        type: 'space',
        spaceType: 'estudo_jogue_novamente',
        title: `🎲 Rodada Bônus de ${st.players[st.currentTurnIdx]?.name}!`,
        message: 'Lance o dado novamente para continuar avançando pela Cidade Inteligente!'
      });
      return;
    }

    const total = st.players.length;
    if (total <= 1) {
      setTurnReadyToAdvance(false);
      return;
    }

    let nextIdx = (st.currentTurnIdx + 1) % total;
    let skippedPlayerName = null;

    // Verifica se o próximo jogador estava descansando no Passeio no Parque
    const nextCandidate = st.players[nextIdx];
    if (nextCandidate && nextCandidate.skipNextTurn) {
      skippedPlayerName = nextCandidate.name;
      setPlayers((prev) =>
        prev.map((p, idx) => (idx === nextIdx ? { ...p, skipNextTurn: false } : p))
      );
      nextIdx = (nextIdx + 1) % total;
    }

    const upcomingPlayer = st.players[nextIdx];
    setCurrentTurnIdx(nextIdx);
    setTurnReadyToAdvance(false);
    setExtraRollGranted(false);
    setActiveEvent({
      type: 'space',
      spaceType: 'turn_change',
      title: `🎲 Agora é a vez de ${upcomingPlayer?.name}!`,
      message: skippedPlayerName
        ? `🌳 ${skippedPlayerName} aproveitou o Passeio no Parque nesta rodada. Agora é a vez de ${upcomingPlayer?.name} lançar o dado!`
        : `${upcomingPlayer?.name}, clique em "Lançar Dado" para fazer sua jogada!`
    });
  };

  // Finaliza partida e salva todos os jogadores no Ranking de suas respectivas turmas (8º A / 8º B)
  const finishMatchOnHost = (winnerIdx, winnerFinalCredits, winnerTurns) => {
    const st = stateRef.current;
    const updatedPlayers = st.players.map((p, idx) =>
      idx === winnerIdx
        ? { ...p, credits: winnerFinalCredits, puzzlePieces: 3, turns: winnerTurns }
        : p
    );

    // Ordena pódio por peças do quebra-cabeça e depois por créditos verdes
    const sortedByRank = [...updatedPlayers].sort((a, b) => {
      if (b.puzzlePieces !== a.puzzlePieces) return b.puzzlePieces - a.puzzlePieces;
      return b.credits - a.credits;
    });

    const champ = sortedByRank[0];
    setPlayers(updatedPlayers);
    setWinnerPlayer(champ);
    setIsGameFinished(true);
    setActiveEvent(null);
    setTurnReadyToAdvance(false);

    // Salva todos os participantes da sala nos rankings de suas turmas
    const newEntries = updatedPlayers.map((p, i) => ({
      id: Date.now() + i,
      name: p.name,
      turma: p.turma,
      credits: p.credits,
      turns: p.turns || 1,
      puzzlePieces: p.puzzlePieces
    }));

    setRanking((prev) => [...prev, ...newEntries].sort((a, b) => b.credits - a.credits));

    confetti({
      particleCount: 150,
      spread: 95,
      origin: { y: 0.6 }
    });
  };

  // Ações disparadas pelo botão na UI (se for Host executa direto; se for Guest envia ao Host)
  const handleRollDiceClick = () => {
    if (roomRole === 'host') {
      triggerRollDiceOnHost();
    } else {
      roomManagerRef.current?.send({
        type: 'GUEST_ACTION',
        playerId: myClientId,
        action: 'ROLL_DICE'
      });
    }
  };

  const handleAnswerCardClick = (optionIndex) => {
    if (roomRole === 'host') {
      triggerAnswerActionCardOnHost(optionIndex);
    } else {
      roomManagerRef.current?.send({
        type: 'GUEST_ACTION',
        playerId: myClientId,
        action: 'ANSWER_CARD',
        optionIndex
      });
    }
  };

  const handleNextTurnClick = () => {
    if (roomRole === 'host') {
      triggerNextTurnOnHost();
    } else {
      roomManagerRef.current?.send({
        type: 'GUEST_ACTION',
        playerId: myClientId,
        action: 'NEXT_TURN'
      });
    }
  };

  const handleCopyRoomCode = () => {
    if (!roomCode) return;
    navigator.clipboard?.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleLeaveRoom = () => {
    if (roomManagerRef.current) {
      roomManagerRef.current.destroy();
      roomManagerRef.current = null;
    }
    setScreen('welcome');
  };

  const clearClassRanking = (turmaAlvo) => {
    setRanking((prev) => prev.filter((item) => item.turma !== turmaAlvo));
  };

  const ranking8A = ranking.filter((r) => r.turma === '8º A');
  const ranking8B = ranking.filter((r) => r.turma === '8º B');

  const currentPlayer = players[currentTurnIdx] || players[0] || {
    id: myClientId,
    name: playerName || 'Jogador 1',
    turma: playerClass || '8º A',
    pawnId: selectedPawnId,
    position: 0,
    credits: 5,
    puzzlePieces: 0,
    turns: 0
  };

  const currentSpace = BOARD_SPACES[currentPlayer.position] || BOARD_SPACES[0];
  const waitingForActionAnswer = activeEvent?.type === 'acao' && !activeEvent.answered;

  // Verifica se este computador pode controlar o jogador da vez:
  // - Se o jogador da vez é este cliente (id === myClientId)
  // - Ou se estamos no Host e o jogador da vez foi adicionado localmente no PC do Host (isLocalOnHost)
  const canControlCurrentTurn =
    currentPlayer.id === myClientId || (roomRole === 'host' && currentPlayer.isLocalOnHost);

  // Calcula deslocamento (offset) quando 2, 3 ou 4 peões estão na mesma casa para nunca ficarem sobrepostos!
  const getPawnCoordinates = (player) => {
    const space = BOARD_SPACES[player.position] || BOARD_SPACES[0];
    const sameSpacePlayers = players.filter((p) => p.position === player.position);
    const count = sameSpacePlayers.length;
    const idxInSpace = sameSpacePlayers.findIndex((p) => p.id === player.id);

    let offsetX = 0;
    let offsetY = 0;

    if (count === 2) {
      offsetX = idxInSpace === 0 ? -3.1 : 3.1;
      offsetY = idxInSpace === 0 ? -1.8 : 1.8;
    } else if (count === 3) {
      const offsets = [
        { x: -3.2, y: -2.4 },
        { x: 3.2, y: -2.4 },
        { x: 0, y: 2.8 }
      ];
      offsetX = offsets[idxInSpace]?.x || 0;
      offsetY = offsets[idxInSpace]?.y || 0;
    } else if (count >= 4) {
      const offsets = [
        { x: -3.3, y: -2.6 },
        { x: 3.3, y: -2.6 },
        { x: -3.3, y: 2.6 },
        { x: 3.3, y: 2.6 }
      ];
      offsetX = offsets[idxInSpace]?.x || 0;
      offsetY = offsets[idxInSpace]?.y || 0;
    }

    return {
      left: `${space.x + offsetX}%`,
      top: `${space.y + offsetY}%`
    };
  };

  // Peças máximas conquistadas ou do jogador ativo para exibir no painel do Quebra-Cabeça
  const myViewPlayer =
    players.find((p) => p.id === myClientId) || currentPlayer;

  return (
    <div className="cidades-app">
      {/* BARRA DE TOPO */}
      <header className="cidades-topbar">
        <div className="brand-box" onClick={handleLeaveRoom} title="Voltar ao Menu Inicial">
          <img src="/assets/moeda_5.jpg" alt="Crédito Verde" className="brand-coin-img" />
          <div>
            <div className="brand-title">Cidades Inteligentes • Tabuleiro Online</div>
            <div className="brand-sub">Projeto Educativo TCC • 8º Ano Ensino Fundamental (1 a 4 Jogadores)</div>
          </div>
        </div>

        <div className="hud-row">
          {(screen === 'lobby' || screen === 'playing') && roomCode && (
            <div className="hud-badge room-pill" onClick={handleCopyRoomCode} title="Clique para copiar o código da sala">
              <Wifi size={15} color="#4ade80" />
              <span>Sala: <strong>{roomCode}</strong></span>
              {copiedCode ? <Check size={14} color="#4ade80" /> : <Copy size={14} />}
            </div>
          )}

          {screen === 'playing' && (
            <div className="hud-badge turn-indicator-pill">
              <span>🎲 Vez de: <strong>{currentPlayer.name}</strong></span>
            </div>
          )}

          <button className="btn-top" onClick={() => setShowRankingModal(true)}>
            <Trophy size={16} />
            <span>Rankings (8º A / 8º B)</span>
          </button>

          {screen !== 'welcome' && (
            <button
              className="btn-top btn-leave"
              onClick={handleLeaveRoom}
              title="Sair da sala atual"
            >
              <LogOut size={15} />
              <span>Sair</span>
            </button>
          )}
        </div>
      </header>

      {/* =========================================================
          TELA 1: BOAS-VINDAS, ESCOLHA DO PEÃO E CRIAR / ENTRAR SALA
         ========================================================= */}
      {screen === 'welcome' && (
        <main className="welcome-wrap">
          <div className="welcome-card">
            <div className="welcome-left-info">
              <div className="welcome-badges-row">
                <span className="tag-pill-green">TABULEIRO DIGITAL • 8º ANO</span>
                <span className="tag-pill-gold">
                  <Users size={14} /> 1 A 4 JOGADORES (ONLINE OU MESMO PC)
                </span>
              </div>

              <h1 className="welcome-main-title">
                Trilha das Cidades Inteligentes
              </h1>

              <p className="welcome-lead">
                Crie uma sala para jogar com até <strong>4 amigos em computadores diferentes</strong> (ou no mesmo PC),
                lance o dado 3D, responda às <strong>Cartas de Ação</strong> e complete <strong>3 voltas</strong> para montar o{' '}
                <strong>Quebra-Cabeça Cidades Inteligentes</strong>!
              </p>

              <div className="feature-cards-grid">
                <div className="feature-mini-card">
                  <span className="feature-icon">⚡</span>
                  <div>
                    <strong>Progresso ou Regresso</strong>
                    <p>Sorteie cartas que aumentam ou reduzem seus Créditos Verdes conforme as escolhas urbanas.</p>
                  </div>
                </div>

                <div className="feature-mini-card">
                  <span className="feature-icon">🌼</span>
                  <div>
                    <strong>Cartas de Ação STEAM+</strong>
                    <p>Desafios de Quiz, Criatividade, Debate e Ação Cidadã valendo +4 ou +5 Créditos Verdes!</p>
                  </div>
                </div>

                <div className="feature-mini-card">
                  <span className="feature-icon">🧩</span>
                  <div>
                    <strong>Quebra-Cabeça (3 Voltas)</strong>
                    <p>Cada vez que seu peão passa pelo <em>Início</em>, você conquista 1 peça. Junte as 3 para vencer!</p>
                  </div>
                </div>
              </div>

              <div className="coins-showcase">
                <div className="coins-stack">
                  <img src="/assets/moeda_1.jpg" alt="1 Crédito Verde" className="coin-thumb" />
                  <img src="/assets/moeda_2.jpg" alt="2 Créditos Verdes" className="coin-thumb" />
                  <img src="/assets/moeda_5.jpg" alt="5 Créditos Verdes" className="coin-thumb" />
                </div>
                <span>
                  Todos começam com <strong>5 Créditos Verdes</strong>. Quem terminar com mais créditos lidera o Ranking da turma!
                </span>
              </div>
            </div>

            {/* Painel de Identificação + Criar/Entrar na Sala */}
            <div className="login-panel">
              <div className="login-header-badge">
                <Users size={20} />
                <span>Central Multiplayer (1 a 4 Jogadores)</span>
              </div>

              <h2 style={{ fontSize: '1.38rem', marginBottom: '0.75rem', color: '#1b4332' }}>
                Identificação do Jogador
              </h2>

              <input
                type="text"
                className="field-input"
                placeholder="Digite seu nome *"
                value={playerName}
                onChange={(e) => {
                  setPlayerName(e.target.value);
                  if (formError) setFormError('');
                }}
                maxLength={22}
              />

              <select
                className="field-input"
                value={playerClass}
                onChange={(e) => {
                  setPlayerClass(e.target.value);
                  if (formError) setFormError('');
                }}
                style={{ cursor: 'pointer' }}
              >
                <option value="">Escolha sua turma (8º A ou 8º B) *</option>
                <option value="8º A">Turma 8º A</option>
                <option value="8º B">Turma 8º B</option>
              </select>

              {/* Seleção de Peão */}
              <div className="pawn-picker-label">Escolha seu Peão para o Tabuleiro:</div>
              <div className="pawn-picker-grid">
                {PAWN_OPTIONS.map((po) => {
                  const active = selectedPawnId === po.id;
                  return (
                    <button
                      key={po.id}
                      type="button"
                      onClick={() => setSelectedPawnId(po.id)}
                      className={`pawn-pick-btn ${active ? 'selected' : ''}`}
                      style={{
                        borderColor: active ? po.color : '#e2e8f0',
                        background: active ? po.lightBg : '#f8fafc'
                      }}
                    >
                      <span className="pawn-pick-emoji">{po.emoji}</span>
                      <span className="pawn-pick-name">{po.label}</span>
                    </button>
                  );
                })}
              </div>

              {formError && (
                <div className="form-error-alert">
                  ⚠️ {formError}
                </div>
              )}

              <div className="lobby-buttons-stack">
                <button
                  type="button"
                  onClick={handleCreateRoom}
                  className="btn-play-green"
                >
                  <Play size={21} fill="currentColor" />
                  <span>Criar Sala (1 a 4 Jogadores)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!validateIdentity()) return;
                    setJoinModalOpen(true);
                  }}
                  className="btn-join-room"
                >
                  <Users size={20} />
                  <span>Entrar em uma Sala com Código</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* MODAL PARA DIGITAR O CÓDIGO DA SALA */}
      {joinModalOpen && (
        <div className="modal-backdrop" onClick={() => setJoinModalOpen(false)}>
          <div
            className="modal-content join-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
              <h2 style={{ fontSize: '1.45rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Wifi size={24} color="#16a34a" />
                Entrar na Sala de um Colega
              </h2>
              <button
                onClick={() => setJoinModalOpen(false)}
                className="btn-top"
                style={{ background: '#1b4332', padding: '0.35rem 0.8rem' }}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#334155', marginBottom: '1rem' }}>
              Peça o <strong>Código de 4 dígitos</strong> para quem criou a sala e digite abaixo para conectar seu computador ao tabuleiro:
            </p>

            <form onSubmit={handleJoinRoom}>
              <input
                type="text"
                className="room-code-big-input"
                placeholder="Ex: 4829"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.replace(/[^0-9a-zA-Z]/g, '').slice(0, 6))}
                autoFocus
              />

              <button type="submit" className="btn-play-green" style={{ marginTop: '0.9rem' }}>
                <ArrowRight size={22} />
                <span>Conectar à Sala Agora</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          TELA 2: SALA DE ESPERA (LOBBY ATÉ 4 JOGADORES)
         ========================================================= */}
      {screen === 'lobby' && (
        <main className="welcome-wrap">
          <div className="lobby-container-card">
            <div className="lobby-top-banner">
              <div>
                <span className="tag-pill-green">SALA MULTIPLAYER ATIVA</span>
                <h1 style={{ fontSize: '1.9rem', color: '#1b4332', marginTop: '0.3rem' }}>
                  Sala de Espera • Cidades Inteligentes
                </h1>
                <p style={{ fontSize: '0.92rem', fontWeight: 700, color: '#475569' }}>
                  Até 4 jogadores podem participar juntos! Compartilhe o código abaixo com outros computadores ou adicione jogadores neste PC.
                </p>
              </div>

              <div className="room-code-showcase" onClick={handleCopyRoomCode}>
                <span className="room-code-label">CÓDIGO DA SALA</span>
                <div className="room-code-digits">{roomCode}</div>
                <span className="room-code-copy-hint">
                  {copiedCode ? '✅ Código copiado!' : '📋 Clique para copiar'}
                </span>
              </div>
            </div>

            {/* Grade de 4 Slots de Jogadores */}
            <div className="lobby-slots-grid">
              {[0, 1, 2, 3].map((slotIdx) => {
                const p = players[slotIdx];
                if (p) {
                  const pawnObj = PAWN_OPTIONS.find((po) => po.id === p.pawnId) || PAWN_OPTIONS[0];
                  return (
                    <div
                      key={p.id}
                      className="lobby-player-slot filled"
                      style={{ borderColor: pawnObj.color }}
                    >
                      <div className="slot-header-row">
                        <span
                          className="slot-player-badge"
                          style={{ background: pawnObj.gradient }}
                        >
                          Jogador {slotIdx + 1}
                        </span>
                        {p.isHost ? (
                          <span className="slot-origin-tag host">
                            <Crown size={13} /> Líder da Sala
                          </span>
                        ) : p.isLocalOnHost ? (
                          <span className="slot-origin-tag local">
                            <Monitor size={13} /> Neste PC
                          </span>
                        ) : (
                          <span className="slot-origin-tag online">
                            <Wifi size={13} /> Online
                          </span>
                        )}
                      </div>

                      <div className="slot-Avatar-circle" style={{ background: pawnObj.lightBg, borderColor: pawnObj.color }}>
                        <span>{pawnObj.emoji}</span>
                      </div>

                      <div className="slot-player-name">{p.name}</div>
                      <div className="slot-player-turma">Turma: {p.turma}</div>

                      {/* Troca rápida de peão se for o próprio jogador ou Host */}
                      {(roomRole === 'host' || p.id === myClientId) && (
                        <div className="slot-mini-pawns">
                          {PAWN_OPTIONS.map((po) => {
                            const usedByOther = players.some(
                              (other) => other.id !== p.id && other.pawnId === po.id
                            );
                            return (
                              <button
                                key={po.id}
                                type="button"
                                disabled={usedByOther}
                                onClick={() => handleSelectPawnInLobby(p.id, po.id)}
                                className={`mini-pawn-btn ${p.pawnId === po.id ? 'active' : ''}`}
                                title={usedByOther ? `${po.label} (em uso)` : `Escolher ${po.label}`}
                              >
                                {po.emoji}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {roomRole === 'host' && !p.isHost && (
                        <button
                          type="button"
                          onClick={() => handleRemovePlayer(p.id)}
                          className="slot-remove-btn"
                        >
                          <Trash2 size={13} /> Remover
                        </button>
                      )}
                    </div>
                  );
                }

                return (
                  <div key={slotIdx} className="lobby-player-slot empty">
                    <div className="empty-slot-circle">{slotIdx + 1}</div>
                    <div className="empty-slot-title">Aguardando Jogador {slotIdx + 1}...</div>
                    <p className="empty-slot-sub">
                      Outro computador pode entrar com o código <strong>{roomCode}</strong>
                    </p>
                    {roomRole === 'host' && (
                      <button
                        type="button"
                        onClick={() => setShowAddLocalForm(true)}
                        className="btn-add-local-slot"
                      >
                        <UserPlus size={15} /> + Adicionar Neste PC
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Formulário rápido para adicionar amigo no mesmo computador */}
            {roomRole === 'host' && showAddLocalForm && players.length < 4 && (
              <form className="add-local-bar" onSubmit={handleAddLocalPlayer}>
                <span style={{ fontWeight: 800, color: '#1b4332' }}>
                  💻 Novo Jogador neste PC:
                </span>
                <input
                  type="text"
                  placeholder="Nome do colega *"
                  value={localAddName}
                  onChange={(e) => setLocalAddName(e.target.value)}
                  className="field-input"
                  style={{ margin: 0, maxWidth: '220px', padding: '0.55rem 0.85rem' }}
                  maxLength={22}
                  autoFocus
                />
                <select
                  value={localAddClass}
                  onChange={(e) => setLocalAddClass(e.target.value)}
                  className="field-input"
                  style={{ margin: 0, maxWidth: '150px', padding: '0.55rem 0.85rem' }}
                >
                  <option value="8º A">Turma 8º A</option>
                  <option value="8º B">Turma 8º B</option>
                </select>
                <button type="submit" className="btn-top" style={{ background: '#16a34a' }}>
                  <Check size={16} /> Adicionar
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddLocalForm(false)}
                  className="btn-top"
                  style={{ background: '#64748b' }}
                >
                  Cancelar
                </button>
              </form>
            )}

            {/* Rodapé do Lobby */}
            <div className="lobby-footer-actions">
              {roomRole === 'host' ? (
                <button
                  type="button"
                  onClick={handleStartMatchFromLobby}
                  className="btn-play-green"
                  style={{ maxWidth: '420px', fontSize: '1.25rem' }}
                >
                  <Play size={22} fill="currentColor" />
                  <span>
                    Iniciar Partida com {players.length}{' '}
                    {players.length === 1 ? 'Jogador' : 'Jogadores'}!
                  </span>
                </button>
              ) : (
                <div className="guest-waiting-box">
                  <Sparkles size={20} color="#16a34a" />
                  <span>
                    Você está conectado na sala <strong>{roomCode}</strong>! Aguardando o líder iniciar a partida...
                  </span>
                </div>
              )}
            </div>
          </div>
        </main>
      )}

      {/* =========================================================
          TELA 3: PARTIDA EM ANDAMENTO (TABULEIRO + DADO 3D + CARTAS)
         ========================================================= */}
      {screen === 'playing' && (
        <main className="game-layout">
          {/* Lado Esquerdo: Tabuleiro Oficial Cidades Inteligentes */}
          <section className="board-stage-box">
            {/* Barra de Jogadores da Partida (1 a 4 Jogadores) */}
            <div className="players-scoreboard-strip">
              {players.map((p, idx) => {
                const pawnObj = PAWN_OPTIONS.find((po) => po.id === p.pawnId) || PAWN_OPTIONS[0];
                const isTurn = idx === currentTurnIdx && !isGameFinished;
                return (
                  <div
                    key={p.id}
                    className={`player-score-card ${isTurn ? 'active-turn' : ''}`}
                    style={{
                      borderColor: isTurn ? pawnObj.color : 'rgba(255,255,255,0.18)'
                    }}
                  >
                    <div
                      className="player-score-avatar"
                      style={{ background: pawnObj.gradient }}
                    >
                      {pawnObj.emoji}
                    </div>
                    <div className="player-score-info">
                      <div className="player-score-name-row">
                        <span className="player-score-name">{p.name}</span>
                        <span className="player-score-class">{p.turma}</span>
                      </div>
                      <div className="player-score-metrics">
                        <span className="metric-pill credits">🪙 {p.credits}</span>
                        <span className="metric-pill puzzle">🧩 {p.puzzlePieces}/3</span>
                        <span className="metric-pill space">📍 Casa {p.position}</span>
                      </div>
                    </div>
                    {isTurn && <span className="turn-live-dot" title="Jogador da vez" />}
                  </div>
                );
              })}
            </div>

            {/* Moldura do Tabuleiro com Peões Passo a Passo */}
            <div className="board-outer-padding">
              <div className="board-image-container">
                <img
                  src="/assets/tabuleiro_cidades.jpg"
                  alt="Tabuleiro Cidades Inteligentes"
                  className="board-main-img"
                />

                {/* Marcadores numerados nas 20 casas do perímetro */}
                {BOARD_SPACES.map((sp) => {
                  const hasActivePlayerHere = currentPlayer.position === sp.index;
                  return (
                    <div
                      key={sp.index}
                      className={`space-dot ${hasActivePlayerHere ? 'current' : ''}`}
                      style={{ left: `${sp.x}%`, top: `${sp.y}%` }}
                      title={`Casa ${sp.index}: ${sp.nome}`}
                    >
                      {sp.index}
                    </div>
                  );
                })}

                {/* Peões de todos os jogadores (1 a 4) com separação automática na mesma casa */}
                {players.map((p, idx) => {
                  const pawnObj = PAWN_OPTIONS.find((po) => po.id === p.pawnId) || PAWN_OPTIONS[0];
                  const coords = getPawnCoordinates(p);
                  const isCurrentTurnPawn = idx === currentTurnIdx;
                  const isHopping = steppingPlayerId === p.id && isMovingPawn;

                  return (
                    <div
                      key={p.id}
                      className={`player-pawn-marker ${isCurrentTurnPawn ? 'active-pawn' : ''} ${
                        isHopping ? 'hopping' : ''
                      }`}
                      style={{
                        left: coords.left,
                        top: coords.top,
                        zIndex: isCurrentTurnPawn ? 25 : 15 + idx
                      }}
                    >
                      <div
                        className="pawn-pin-token"
                        style={{
                          background: pawnObj.gradient,
                          borderColor: isCurrentTurnPawn ? '#fef08a' : '#ffffff'
                        }}
                      >
                        <span className="pawn-pin-emoji">{pawnObj.emoji}</span>
                      </div>
                      <div
                        className="pawn-name-tag"
                        style={{
                          background: isCurrentTurnPawn ? '#0f172a' : 'rgba(15, 23, 42, 0.85)',
                          borderColor: pawnObj.color
                        }}
                      >
                        {p.name.slice(0, 10)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Lado Direito: Controle do Dado 3D + Cartas + Quebra-Cabeça */}
          <aside className="side-column">
            {/* Caixa do Dado e Controle de Vez */}
            {!isGameFinished && (
              <div className="dice-control-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <DiceFace value={diceValue} isRolling={isRolling} />

                  <div>
                    <div className="turn-badge-header">
                      <span>
                        {PAWN_OPTIONS.find((po) => po.id === currentPlayer.pawnId)?.emoji || '🛼'}{' '}
                        Vez de <strong>{currentPlayer.name}</strong> ({currentPlayer.turma})
                      </span>
                    </div>
                    <div style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '1.12rem', fontWeight: 700, marginTop: '0.2rem' }}>
                      {isRolling
                        ? 'Sorteando número no dado...'
                        : isMovingPawn
                        ? `Andando pelo tabuleiro (${diceValue} ${diceValue === 1 ? 'casa' : 'casas'})...`
                        : waitingForActionAnswer
                        ? 'Responda à Carta de Ação abaixo!'
                        : turnReadyToAdvance
                        ? extraRollGranted
                          ? 'Bônus! Você ganhou mais uma jogada!'
                          : 'Jogada concluída!'
                        : 'Lance o dado para avançar!'}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#b7e4c7', fontWeight: 700 }}>
                      Casa atual: <strong>{currentPlayer.position} ({currentSpace.nome})</strong> • Volta {Math.min(3, currentPlayer.puzzlePieces + 1)}/3
                    </div>
                  </div>
                </div>

                {/* Botões de Ação da Vez */}
                <div className="dice-action-buttons">
                  {!turnReadyToAdvance ? (
                    <button
                      onClick={handleRollDiceClick}
                      disabled={
                        isRolling ||
                        isMovingPawn ||
                        waitingForActionAnswer ||
                        !canControlCurrentTurn
                      }
                      className="btn-play-green"
                      style={{ width: '100%', padding: '0.85rem 1.4rem', fontSize: '1.12rem' }}
                    >
                      <Dices size={22} />
                      <span>
                        {!canControlCurrentTurn
                          ? `Aguardando ${currentPlayer.name} jogar...`
                          : isRolling
                          ? 'Girando Dado...'
                          : isMovingPawn
                          ? 'Movendo Peão...'
                          : waitingForActionAnswer
                          ? 'Responda a Carta Abaixo'
                          : 'Lançar Dado (1 a 6)'}
                      </span>
                    </button>
                  ) : (
                    <button
                      onClick={
                        players.length === 1 && !extraRollGranted
                          ? handleRollDiceClick
                          : handleNextTurnClick
                      }
                      disabled={!canControlCurrentTurn && roomRole !== 'host'}
                      className="btn-next-turn"
                    >
                      {extraRollGranted ? (
                        <>
                          <Dices size={21} />
                          <span>🎲 Jogar Dado Novamente (Bônus)!</span>
                        </>
                      ) : players.length === 1 ? (
                        <>
                          <Dices size={21} />
                          <span>Lançar Dado Novamente</span>
                        </>
                      ) : (
                        <>
                          <ArrowRight size={21} />
                          <span>
                            Passar a Vez para {players[(currentTurnIdx + 1) % players.length]?.name}
                          </span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Tela de Fim de Jogo e Pódio quando alguém completa as 3 peças do Quebra-Cabeça */}
            {isGameFinished && (
              <div
                className="game-card-frame progresso"
                style={{ background: 'linear-gradient(180deg, #2d6a4f, #1b4332)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.65rem' }}>
                  <Sparkles size={28} color="#facc15" />
                  <h2 style={{ fontSize: '1.45rem' }}>
                    Quebra-Cabeça Completo! Fim da Partida!
                  </h2>
                </div>

                <div className="card-inner-white" style={{ marginBottom: '1rem' }}>
                  <p style={{ fontWeight: 900, fontSize: '1.05rem', marginBottom: '0.75rem', color: '#1b4332' }}>
                    🏆 Vitória de <strong>{winnerPlayer?.name}</strong> ({winnerPlayer?.turma}) com{' '}
                    <strong>{winnerPlayer?.credits} Créditos Verdes</strong>!
                  </p>

                  {/* Pódio dos Jogadores da Sala */}
                  <div className="match-podium-list">
                    {[...players]
                      .sort((a, b) => {
                        if (b.puzzlePieces !== a.puzzlePieces) return b.puzzlePieces - a.puzzlePieces;
                        return b.credits - a.credits;
                      })
                      .map((p, idx) => {
                        const pawnObj = PAWN_OPTIONS.find((po) => po.id === p.pawnId) || PAWN_OPTIONS[0];
                        return (
                          <div key={p.id} className="podium-row">
                            <span className="podium-rank">
                              {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '4º'}
                            </span>
                            <span style={{ fontSize: '1.2rem' }}>{pawnObj.emoji}</span>
                            <div style={{ flex: 1 }}>
                              <strong>{p.name}</strong> <small>({p.turma})</small>
                            </div>
                            <span className="podium-credits">🪙 {p.credits} créditos</span>
                          </div>
                        );
                      })}
                  </div>

                  <p
                    style={{
                      fontSize: '0.86rem',
                      lineHeight: 1.5,
                      fontWeight: 700,
                      color: '#1e293b',
                      background: '#f0fdf4',
                      padding: '0.75rem',
                      borderRadius: '12px',
                      border: '1.5px solid #86efac',
                      marginTop: '0.75rem'
                    }}
                  >
                    📖 <strong>Conceito Oficial Desbloqueado:</strong> "{SMART_CITIES_DEFINITION}"
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  {roomRole === 'host' && (
                    <button
                      onClick={handleStartMatchFromLobby}
                      className="btn-top"
                      style={{ background: '#16a34a' }}
                    >
                      <RotateCcw size={16} /> Jogar Novamente com a Sala
                    </button>
                  )}
                  <button
                    onClick={() => setShowRankingModal(true)}
                    className="btn-top"
                    style={{ background: '#0284c7' }}
                  >
                    <Trophy size={16} /> Ver Rankings (8º A / 8º B)
                  </button>
                  <button
                    onClick={handleLeaveRoom}
                    className="btn-top"
                    style={{ background: '#7209b7' }}
                  >
                    <UserPlus size={16} /> Menu Inicial
                  </button>
                </div>
              </div>
            )}

            {/* CARTA SORTEADA: PROGRESSO OU REGRESSO */}
            {!isGameFinished && activeEvent?.type === 'pr' && (
              <div
                className={`game-card-frame ${
                  activeEvent.card.subtipo === 'Progresso' ? 'progresso' : 'regresso'
                }`}
              >
                {activeEvent.passedStart && (
                  <div className="passed-start-banner">
                    🧩 Passou pelo INÍCIO e conquistou +1 peça do Quebra-Cabeça!
                  </div>
                )}

                <div className="card-top-meta">
                  <div>
                    <div style={{ fontSize: '0.76rem', fontWeight: 900, opacity: 0.92 }}>
                      STEAM+ • CARTA DE {activeEvent.playerName?.toUpperCase()}
                    </div>
                    <span className="card-type-pill">⚡ {activeEvent.card.subtipo}</span>
                  </div>

                  <div className="card-credits-circle">
                    <span>
                      {activeEvent.card.creditos > 0
                        ? `+${activeEvent.card.creditos}`
                        : activeEvent.card.creditos}
                    </span>
                    <small style={{ fontSize: '0.55rem' }}>créditos</small>
                  </div>
                </div>

                <div className="card-inner-white">
                  <p style={{ fontSize: '1.06rem', fontWeight: 800, lineHeight: 1.45, marginBottom: '0.6rem' }}>
                    “{activeEvent.card.texto}”
                  </p>
                  <div
                    style={{
                      fontSize: '0.88rem',
                      fontWeight: 800,
                      color: activeEvent.card.creditos > 0 ? '#15803d' : '#b91c1c'
                    }}
                  >
                    {activeEvent.card.creditos > 0
                      ? `✅ Atitude sustentável! ${activeEvent.playerName} recebeu +${activeEvent.card.creditos} Créditos Verdes.`
                      : `⚠️ Impacto negativo! ${activeEvent.playerName} perdeu ${Math.abs(activeEvent.card.creditos)} Créditos Verdes.`}
                  </div>
                </div>
              </div>
            )}

            {/* CARTA DE AÇÃO (QUIZ, CRIATIVIDADE, DEBATE OU AÇÃO CIDADÃ) */}
            {!isGameFinished && activeEvent?.type === 'acao' && (
              <div className="game-card-frame acao">
                {activeEvent.passedStart && (
                  <div className="passed-start-banner">
                    🧩 Passou pelo INÍCIO e conquistou +1 peça do Quebra-Cabeça!
                  </div>
                )}

                <div className="card-top-meta">
                  <div>
                    <div style={{ fontSize: '0.76rem', fontWeight: 900 }}>
                      STEAM+ • DESAFIO PARA {activeEvent.playerName?.toUpperCase()}
                    </div>
                    <span className="card-type-pill">🌼 {activeEvent.card.categoria}</span>
                  </div>

                  <div className="card-credits-circle">
                    <span>+{activeEvent.card.creditos}</span>
                    <small style={{ fontSize: '0.55rem' }}>créditos</small>
                  </div>
                </div>

                <div className="card-inner-white">
                  <p style={{ fontSize: '1.02rem', fontWeight: 800, lineHeight: 1.42, marginBottom: '0.55rem' }}>
                    {activeEvent.card.pergunta}
                  </p>

                  {!canControlCurrentTurn && !activeEvent.answered && (
                    <div
                      style={{
                        background: '#fffbeb',
                        color: '#b45309',
                        padding: '0.45rem 0.75rem',
                        borderRadius: '10px',
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        marginBottom: '0.45rem',
                        border: '1px solid #fde68a'
                      }}
                    >
                      👀 Aguardando <strong>{currentPlayer.name}</strong> escolher uma alternativa...
                    </div>
                  )}

                  {activeEvent.card.opcoes.map((opTexto, idx) => {
                    let cls = 'action-option-btn';
                    if (activeEvent.answered) {
                      if (idx === activeEvent.card.correta) cls += ' correct';
                      else if (idx === activeEvent.chosenIdx) cls += ' wrong';
                    }

                    return (
                      <button
                        key={idx}
                        className={cls}
                        disabled={activeEvent.answered || !canControlCurrentTurn}
                        onClick={() => handleAnswerCardClick(idx)}
                      >
                        {opTexto}
                      </button>
                    );
                  })}

                  {activeEvent.answered && (
                    <div
                      style={{
                        marginTop: '0.85rem',
                        padding: '0.75rem 0.9rem',
                        borderRadius: '12px',
                        background: activeEvent.isCorrect ? '#f0fdf4' : '#fef2f2',
                        border: `1.5px solid ${activeEvent.isCorrect ? '#86efac' : '#fca5a5'}`,
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        color: activeEvent.isCorrect ? '#14532d' : '#7f1d1d'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 900, marginBottom: '0.25rem' }}>
                        {activeEvent.isCorrect ? (
                          <>
                            <CheckCircle2 size={18} color="#16a34a" />
                            <span>
                              Mandou bem! {activeEvent.playerName} ganhou +{activeEvent.card.creditos} Créditos Verdes!
                            </span>
                          </>
                        ) : (
                          <>
                            <XCircle size={18} color="#dc2626" />
                            <span>Resposta incorreta! Nenhum crédito ganho nesta carta.</span>
                          </>
                        )}
                      </div>
                      <p>{activeEvent.card.explicacao}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* EVENTO DE CASA ESPECIAL (INÍCIO, DESCANSO, PARQUE, BIKE, LIXO, STEAM) */}
            {!isGameFinished && activeEvent?.type === 'space' && (
              <div
                className={`game-card-frame ${
                  activeEvent.spaceType === 'lixo_volte2' ? 'regresso' : 'progresso'
                }`}
              >
                {activeEvent.passedStart && (
                  <div className="passed-start-banner">
                    🧩 Passou pelo INÍCIO e conquistou +1 peça do Quebra-Cabeça!
                  </div>
                )}
                <h3 style={{ fontSize: '1.18rem', marginBottom: '0.6rem' }}>{activeEvent.title}</h3>
                <div className="card-inner-white">
                  <p style={{ fontSize: '0.95rem', fontWeight: 700, lineHeight: 1.48 }}>
                    {activeEvent.message}
                  </p>
                </div>
              </div>
            )}

            {/* QUEBRA-CABEÇA CIDADES INTELIGENTES (3 PEÇAS = 3 VOLTAS) */}
            <div className="puzzle-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
                <span style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 700, fontSize: '1.02rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Puzzle size={19} color="#facc15" />
                  Quebra-Cabeça de {currentPlayer.name}
                </span>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#95d5b2' }}>
                  {currentPlayer.puzzlePieces}/3 peças (1 por volta)
                </span>
              </div>

              <div className="puzzle-pieces-grid">
                {[1, 2, 3].map((pieceNum) => {
                  const unlocked = currentPlayer.puzzlePieces >= pieceNum || isGameFinished;
                  return (
                    <div key={pieceNum} className="puzzle-slot">
                      {unlocked ? (
                        <img
                          src={`/assets/quebra_cabeca_${pieceNum}.jpg`}
                          alt={`Peça ${pieceNum} do Quebra-Cabeça`}
                        />
                      ) : (
                        <div className="puzzle-locked-label">
                          🔒 Peça {pieceNum}
                          <br />
                          <small>({pieceNum}ª volta)</small>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        </main>
      )}

      {/* MODAL DOS DOIS RANKINGS SEPARADOS (8º A e 8º B) */}
      {showRankingModal && (
        <div className="modal-backdrop" onClick={() => setShowRankingModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.55rem' }}>
                <Trophy size={26} color="#eab308" />
                Rankings Cidades Inteligentes • 8º A e 8º B
              </h2>
              <button
                onClick={() => setShowRankingModal(false)}
                className="btn-top"
                style={{ background: '#1b4332' }}
              >
                <X size={18} /> Fechar
              </button>
            </div>

            <div className="rankings-2col">
              {/* Coluna 8º A */}
              <div className="rank-col-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '1.2rem' }}>🏆 Ranking 8º A</h3>
                  {ranking8A.length > 0 && (
                    <button
                      onClick={() => clearClassRanking('8º A')}
                      className="btn-top"
                      style={{ background: '#dc2626', padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
                    >
                      <Trash2 size={13} /> Limpar 8º A
                    </button>
                  )}
                </div>

                {ranking8A.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '1.5rem 0', opacity: 0.65, fontWeight: 700 }}>
                    Nenhum aluno do 8º A registrado ainda.
                  </p>
                ) : (
                  ranking8A.map((r, i) => (
                    <div key={r.id} className={`rank-row ${i === 0 ? 'first' : ''}`}>
                      <div>
                        <div style={{ fontWeight: 800 }}>
                          {i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : `${i + 1}º `}
                          {r.name}
                        </div>
                        <div style={{ fontSize: '0.78rem', opacity: 0.75, fontWeight: 700 }}>
                          {r.puzzlePieces ?? 3}/3 Peças • {r.turns} rodadas
                        </div>
                      </div>
                      <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: '#2d6a4f' }}>
                        🪙 {r.credits} créditos
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Coluna 8º B */}
              <div className="rank-col-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '1.2rem' }}>🏆 Ranking 8º B</h3>
                  {ranking8B.length > 0 && (
                    <button
                      onClick={() => clearClassRanking('8º B')}
                      className="btn-top"
                      style={{ background: '#dc2626', padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
                    >
                      <Trash2 size={13} /> Limpar 8º B
                    </button>
                  )}
                </div>

                {ranking8B.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '1.5rem 0', opacity: 0.65, fontWeight: 700 }}>
                    Nenhum aluno do 8º B registrado ainda.
                  </p>
                ) : (
                  ranking8B.map((r, i) => (
                    <div key={r.id} className={`rank-row ${i === 0 ? 'first' : ''}`}>
                      <div>
                        <div style={{ fontWeight: 800 }}>
                          {i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : `${i + 1}º `}
                          {r.name}
                        </div>
                        <div style={{ fontSize: '0.78rem', opacity: 0.75, fontWeight: 700 }}>
                          {r.puzzlePieces ?? 3}/3 Peças • {r.turns} rodadas
                        </div>
                      </div>
                      <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: '#2d6a4f' }}>
                        🪙 {r.credits} créditos
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
