import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Puzzle,
  RotateCcw,
  UserPlus,
  X,
  ChevronRight,
  Users,
  Copy,
  Check,
  Home,
  Award,
  AlertCircle
} from 'lucide-react';
import {
  BOARD_SPACES,
  PROGRESSO_REGRESSO_CARDS,
  ACAO_CARDS
} from './data/cidadesData';
import { RoomConnectionManager } from './multiplayer/roomSync';
import {
  registrarXpNoBanco,
  buscarRankingDoBanco,
  filtrarRankingExpirado
} from './services/xpApi';

// 4 Peões 3D oficiais recortados da imagem enviada pela usuária
export const PAWN_OPTIONS = [
  {
    id: 'skate_patins',
    label: 'Patins Retrô',
    img: '/assets/pawn_patins.png',
    color: '#ec4899'
  },
  {
    id: 'bike_solar',
    label: 'Bike Verde',
    img: '/assets/pawn_bike.png',
    color: '#22c55e'
  },
  {
    id: 'skate_eco',
    label: 'Skate Solar',
    img: '/assets/pawn_skate.png',
    color: '#38bdf8'
  },
  {
    id: 'patinete_smart',
    label: 'Patinete Elétrico',
    img: '/assets/pawn_patinete.png',
    color: '#a855f7'
  }
];

// Coordenadas (left%, top%) das 20 casas sobre o Tabuleiro 3D em Espiral (/assets/tabuleiro_3d.png)
const SPIRAL_COORDS = [
  { left: 55, top: 84 }, // 0: INÍCIO (Comunidade azul inferior)
  { left: 42, top: 83 }, // 1: Engrenagem azul
  { left: 31, top: 77 }, // 2: Reciclagem verde
  { left: 22, top: 69 }, // 3: Tablet roxo
  { left: 16, top: 60 }, // 4: Lâmpada azul
  { left: 11, top: 49 }, // 5: Globo azul
  { left: 9,  top: 39 }, // 6: Rede azul
  { left: 12, top: 29 }, // 7: Reciclagem azul
  { left: 17, top: 21 }, // 8: Folha verde
  { left: 24, top: 16 }, // 9: Engrenagem azul
  { left: 31, top: 22 }, // 10: Folha verde interna
  { left: 38, top: 17 }, // 11: Interrogação amarela (?)
  { left: 48, top: 13 }, // 12: Tablet roxo topo
  { left: 58, top: 12 }, // 13: Reciclagem verde topo
  { left: 67, top: 14 }, // 14: Lâmpada azul topo-direita
  { left: 75, top: 19 }, // 15: Interrogação amarela (?)
  { left: 82, top: 27 }, // 16: Folha verde direita
  { left: 87, top: 38 }, // 17: Engrenagem azul direita
  { left: 88, top: 50 }, // 18: Diamante ciano direita
  { left: 80, top: 68 }  // 19: Reta final de volta ao INÍCIO
];

// Logo Oficial AstroLearn com a nova imagem transparente
function AstroLearnBrandLogo() {
  return (
    <div className="cidades-brand-logo">
      <div className="cidades-logo-img-wrap">
        <img
          src="/assets/logo_astrolearn.png"
          alt="Logo AstroLearn"
          className="cidades-official-logo-img"
        />
      </div>
      <span className="cidades-logo-text">
        <strong>Astro</strong>Learn
      </span>
    </div>
  );
}

// Folha Verde Vetorial
function GreenLeafSVG({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <defs>
        <linearGradient id="leafGrad8" x1="4" y1="4" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#86efac" />
          <stop offset="0.5" stopColor="#22c55e" />
          <stop offset="1" stopColor="#15803d" />
        </linearGradient>
      </defs>
      <path
        d="M23 5C14 5 7 10.5 6 19.5C6 20.8 6.8 22 8 22C17 21 22.5 14 23 5Z"
        fill="url(#leafGrad8)"
        stroke="#bbf7d0"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M6 22C10.5 17.5 15.5 13.5 21 9"
        stroke="#dcfce7"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Componente visual do Dado 3D Arredondado
function DiceFace3D({ value, isRolling }) {
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
    <div className={`dice-3d-widget ${isRolling ? 'rolling' : ''}`}>
      <div className="dice-face-grid">
        {Array.from({ length: 9 }).map((_, idx) => (
          <span
            key={idx}
            className={`dice-pip-dot ${activePips.includes(idx) ? 'visible' : ''}`}
          />
        ))}
      </div>
    </div>
  );
}

// Gera código alfanumérico curto de 4 caracteres para a sala
function generateRoomCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export default function App() {
  // Telas: 'home' | 'howto' | 'setup' | 'join' | 'lobby' | 'playing' | 'result'
  const [screen, setScreen] = useState('home');
  const [showRankingModal, setShowRankingModal] = useState(false);
  const [showPuzzleModal, setShowPuzzleModal] = useState(false);

  // Dados do jogador local na tela Criar Sala / Entrar na Sala
  const [playerName, setPlayerName] = useState('');
  const [playerClass, setPlayerClass] = useState('8º A');
  const [selectedPawnId, setSelectedPawnId] = useState(PAWN_OPTIONS[0].id);
  const [joinDigits, setJoinDigits] = useState(['', '', '', '']);
  const [formError, setFormError] = useState('');

  // Adicionar jogador no mesmo computador (dentro do Lobby)
  const [localAddName, setLocalAddName] = useState('');
  const [localAddClass, setLocalAddClass] = useState('8º A');
  const [showAddLocalForm, setShowAddLocalForm] = useState(false);

  // Opção selecionada antes de clicar em "Confirmar" no modal de Pergunta (Painel 7)
  const [pendingOptionIdx, setPendingOptionIdx] = useState(null);

  // Identificador único deste navegador/aba
  const [myClientId] = useState(() => 'p_' + Math.random().toString(36).slice(2, 10));

  // Estado da Sala Multiplayer
  const [roomRole, setRoomRole] = useState('host'); // 'host' | 'guest'
  const [roomCode, setRoomCode] = useState('');
  const [networkStatus, setNetworkStatus] = useState('online');
  const [copiedCode, setCopiedCode] = useState(false);

  // Rankings separados para 8º A e 8º B (expira após 2 horas)
  const [ranking, setRanking] = useState(() => {
    const saved = localStorage.getItem('cidades_inteligentes_ranking_v1');
    return saved ? filtrarRankingExpirado(JSON.parse(saved)) : [];
  });

  // Estado Sincronizado da Partida
  const [players, setPlayers] = useState([]);
  const [currentTurnIdx, setCurrentTurnIdx] = useState(0);
  const [diceValue, setDiceValue] = useState(5);
  const [isRolling, setIsRolling] = useState(false);
  const [isMovingPawn, setIsMovingPawn] = useState(false);
  const [steppingPlayerId, setSteppingPlayerId] = useState(null);
  const [activeEvent, setActiveEvent] = useState(null);
  const [turnReadyToAdvance, setTurnReadyToAdvance] = useState(false);
  const [extraRollGranted, setExtraRollGranted] = useState(false);
  const [isGameFinished, setIsGameFinished] = useState(false);
  const [winnerPlayer, setWinnerPlayer] = useState(null);

  const digitRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];
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

  useEffect(() => {
    buscarRankingDoBanco('jogo8').then((dbRanking) => {
      if (dbRanking && dbRanking.length > 0) {
        const mapped = dbRanking.map((r) => ({
          id: r.id,
          name: r.name,
          turma: r.turma,
          credits: r.score,
          xpGanho: r.xpGanho,
          turns: 1,
          puzzlePieces: r.correct ?? 3,
          createdAt: r.createdAt || Date.now()
        }));
        setRanking(filtrarRankingExpirado(mapped));
      }
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setRanking((prev) => filtrarRankingExpirado(prev));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (showRankingModal) {
      setRanking((prev) => filtrarRankingExpirado(prev));
    }
  }, [showRankingModal]);

  useEffect(() => {
    return () => {
      if (roomManagerRef.current) {
        roomManagerRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    setPendingOptionIdx(null);
  }, [activeEvent?.card?.id, activeEvent?.type]);

  useEffect(() => {
    if (
      roomRole === 'host' &&
      roomManagerRef.current &&
      (screen === 'lobby' || screen === 'playing' || screen === 'result')
    ) {
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

  const validateIdentity = () => {
    const trimmed = playerName.trim();
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
      credits: 10,
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

  const handleGoToJoinScreen = () => {
    if (!validateIdentity()) return;
    setFormError('');
    setJoinDigits(['', '', '', '']);
    setScreen('join');
  };

  const handleDigitChange = (index, val) => {
    const clean = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(-1);
    const updated = [...joinDigits];
    updated[index] = clean;
    setJoinDigits(updated);
    if (formError) setFormError('');
    if (clean && index < 3) {
      digitRefs[index + 1].current?.focus();
    }
  };

  const handleDigitKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !joinDigits[index] && index > 0) {
      digitRefs[index - 1].current?.focus();
    }
  };

  const handleDigitPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4);
    if (pasted.length > 0) {
      e.preventDefault();
      const next = ['', '', '', ''];
      for (let i = 0; i < 4; i++) {
        next[i] = pasted[i] || '';
      }
      setJoinDigits(next);
    }
  };

  const handleJoinRoom = (e) => {
    if (e) e.preventDefault();
    if (!validateIdentity()) return;
    const cleanCode = joinDigits.join('').trim().toUpperCase();
    if (cleanCode.length < 4) {
      setFormError('Digite os 4 dígitos do código da sala.');
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

    setTimeout(() => {
      manager.send({
        type: 'JOIN_REQUEST',
        player: myPlayerInfo
      });
    }, 250);

    setScreen('lobby');
  };

  const handleHostReceiveMessage = (data, senderPeerId) => {
    const st = stateRef.current;
    if (!data || !data.type) return;

    if (data.type === 'JOIN_REQUEST' && data.player) {
      setPlayers((prev) => {
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
          credits: 10,
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

  const handleGuestReceiveMessage = (data) => {
    if (!data || !data.type) return;

    if (data.type === 'JOIN_REJECTED' && data.targetId === myClientId) {
      setFormError(data.reason || 'Não foi possível entrar na sala.');
      setScreen('setup');
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
      credits: 10,
      puzzlePieces: 0,
      turns: 0,
      skipNextTurn: false
    };

    setPlayers((prev) => [...prev, newLocalPlayer]);
    setLocalAddName('');
    setShowAddLocalForm(false);
  };

  const handleRemovePlayer = (idToRemove) => {
    if (roomRole !== 'host') return;
    setPlayers((prev) => prev.filter((p) => p.id !== idToRemove));
  };

  const handleCyclePawnInLobby = (playerId) => {
    const player = players.find((p) => p.id === playerId);
    if (!player) return;
    const currentIdx = PAWN_OPTIONS.findIndex((po) => po.id === player.pawnId);
    for (let offset = 1; offset <= PAWN_OPTIONS.length; offset++) {
      const candidate = PAWN_OPTIONS[(currentIdx + offset) % PAWN_OPTIONS.length];
      const taken = players.some((p) => p.id !== playerId && p.pawnId === candidate.id);
      if (!taken) {
        if (roomRole === 'host') {
          setPlayers((prev) =>
            prev.map((p) => (p.id === playerId ? { ...p, pawnId: candidate.id } : p))
          );
        } else {
          roomManagerRef.current?.send({
            type: 'CHANGE_PAWN',
            playerId,
            pawnId: candidate.id
          });
        }
        break;
      }
    }
  };

  const handleStartMatchFromLobby = () => {
    if (roomRole !== 'host' || players.length === 0) return;

    const initializedPlayers = players.map((p) => ({
      ...p,
      position: 0,
      credits: 10,
      puzzlePieces: 0,
      turns: 0,
      skipNextTurn: false
    }));

    setPlayers(initializedPlayers);
    setCurrentTurnIdx(0);
    setDiceValue(5);
    setIsRolling(false);
    setIsMovingPawn(false);
    setSteppingPlayerId(null);
    setTurnReadyToAdvance(false);
    setExtraRollGranted(false);
    setIsGameFinished(false);
    setWinnerPlayer(null);
    setActiveEvent(null);
    setScreen('playing');
  };

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const triggerRollDiceOnHost = async () => {
    const st = stateRef.current;
    if (st.isRolling || st.isMovingPawn || st.isGameFinished) return;
    if (st.activeEvent) return;

    const activePlayer = st.players[st.currentTurnIdx];
    if (!activePlayer) return;

    setTurnReadyToAdvance(false);
    setExtraRollGranted(false);
    setActiveEvent(null);
    setIsRolling(true);

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

    for (let step = 1; step <= rolled; step++) {
      await sleep(280);
      currentPos = (currentPos + 1) % 20;

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

      if (currentPieces >= 3) {
        await sleep(350);
        setIsMovingPawn(false);
        setSteppingPlayerId(null);
        finishMatchOnHost(st.currentTurnIdx, currentCredits + 4, updatedTurns);
        return;
      }
    }

    await sleep(220);

    const landedSpace = BOARD_SPACES[currentPos];

    if (landedSpace.tipo === 'bike_avance3') {
      currentCredits += 2;
      setPlayers((prev) =>
        prev.map((p, idx) =>
          idx === st.currentTurnIdx ? { ...p, credits: currentCredits } : p
        )
      );

      for (let bonusStep = 1; bonusStep <= 3; bonusStep++) {
        await sleep(270);
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
      setActiveEvent({
        type: 'card_feedback',
        isPositive: true,
        playerName: activePlayer.name,
        title: 'Carta de Ação',
        message: `${activePlayer.name} pedalou pela ciclovia solar sem emitir CO₂ e avançou +3 casas!`,
        creditsDelta: 2,
        passedStart: passedStartDuringMove
      });
      setTurnReadyToAdvance(true);
      return;
    }

    if (landedSpace.tipo === 'lixo_volte2') {
      currentCredits = Math.max(0, currentCredits - 2);
      setPlayers((prev) =>
        prev.map((p, idx) =>
          idx === st.currentTurnIdx ? { ...p, credits: currentCredits } : p
        )
      );

      for (let backStep = 1; backStep <= 2; backStep++) {
        await sleep(290);
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
      setActiveEvent({
        type: 'card_feedback',
        isPositive: false,
        playerName: activePlayer.name,
        title: 'Ops!',
        message: 'Descarte incorreto de resíduos! Você voltou 2 casas na trilha.',
        creditsDelta: -2,
        passedStart: passedStartDuringMove
      });
      setTurnReadyToAdvance(true);
      return;
    }

    setIsMovingPawn(false);
    setSteppingPlayerId(null);

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
        type: 'card_feedback',
        isPositive: randomCard.categoria === 'PROGRESSO',
        playerName: activePlayer.name,
        title: randomCard.categoria === 'PROGRESSO' ? 'Carta de Ação' : 'Ops!',
        message: randomCard.texto,
        creditsDelta: randomCard.creditos,
        passedStart: passedStartDuringMove
      });
      setTurnReadyToAdvance(true);
    } else if (landedSpace.tipo === 'acao') {
      const randomAction = ACAO_CARDS[Math.floor(Math.random() * ACAO_CARDS.length)];
      setActiveEvent({
        type: 'acao',
        playerName: activePlayer.name,
        card: randomAction,
        answered: false,
        chosenIdx: null,
        passedStart: passedStartDuringMove
      });
      setTurnReadyToAdvance(false);
    } else if (landedSpace.tipo === 'steam' || landedSpace.tipo === 'estudo_jogue_novamente') {
      const bonus = 3;
      const updatedCredits = currentCredits + bonus;
      setPlayers((prev) =>
        prev.map((p, idx) =>
          idx === st.currentTurnIdx ? { ...p, credits: updatedCredits } : p
        )
      );
      if (landedSpace.tipo === 'estudo_jogue_novamente') {
        setExtraRollGranted(true);
      }
      setActiveEvent({
        type: 'card_feedback',
        isPositive: true,
        playerName: activePlayer.name,
        title: 'Carta de Ação',
        message: landedSpace.descricao,
        creditsDelta: bonus,
        passedStart: passedStartDuringMove
      });
      setTurnReadyToAdvance(true);
    } else {
      // Nas demais casas, sorteia uma Pergunta de Ação para manter o jogo sempre dinâmico!
      const randomAction = ACAO_CARDS[Math.floor(Math.random() * ACAO_CARDS.length)];
      setActiveEvent({
        type: 'acao',
        playerName: activePlayer.name,
        card: randomAction,
        answered: false,
        chosenIdx: null,
        passedStart: passedStartDuringMove
      });
      setTurnReadyToAdvance(false);
    }
  };

  const triggerAnswerActionCardOnHost = (optionIndex) => {
    const st = stateRef.current;
    if (!st.activeEvent || st.activeEvent.type !== 'acao' || st.activeEvent.answered) return;

    const isCorrect = optionIndex === st.activeEvent.card.correta;
    const activePlayer = st.players[st.currentTurnIdx];
    if (!activePlayer) return;

    const delta = isCorrect ? st.activeEvent.card.creditos : -2;
    const updatedCredits = Math.max(0, activePlayer.credits + delta);

    setPlayers((prev) =>
      prev.map((p, idx) =>
        idx === st.currentTurnIdx ? { ...p, credits: updatedCredits } : p
      )
    );

    // Transiciona para o Card de Feedback (Painel 8: "Carta de Ação" verde ou "Ops!" vermelho)
    setActiveEvent({
      type: 'card_feedback',
      isPositive: isCorrect,
      playerName: activePlayer.name,
      title: isCorrect ? 'Carta de Ação' : 'Ops!',
      message: st.activeEvent.card.explicacao,
      creditsDelta: delta,
      passedStart: st.activeEvent.passedStart
    });
    setTurnReadyToAdvance(true);
  };

  const triggerNextTurnOnHost = () => {
    const st = stateRef.current;
    if (st.isRolling || st.isMovingPawn || st.isGameFinished) return;

    if (st.extraRollGranted) {
      setExtraRollGranted(false);
      setTurnReadyToAdvance(false);
      setActiveEvent(null);
      return;
    }

    const total = st.players.length;
    setActiveEvent(null);
    setTurnReadyToAdvance(false);
    setExtraRollGranted(false);

    if (total <= 1) {
      return;
    }

    let nextIdx = (st.currentTurnIdx + 1) % total;
    const nextCandidate = st.players[nextIdx];
    if (nextCandidate && nextCandidate.skipNextTurn) {
      setPlayers((prev) =>
        prev.map((p, idx) => (idx === nextIdx ? { ...p, skipNextTurn: false } : p))
      );
      nextIdx = (nextIdx + 1) % total;
    }

    setCurrentTurnIdx(nextIdx);
  };

  const finishMatchOnHost = (winnerIdx, winnerFinalCredits, winnerTurns) => {
    const st = stateRef.current;
    const updatedPlayers = st.players.map((p, idx) =>
      idx === winnerIdx
        ? { ...p, credits: winnerFinalCredits, puzzlePieces: 3, turns: winnerTurns }
        : p
    );

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
    setScreen('result');

    const newEntries = updatedPlayers.map((p, i) => {
      const xpCalculado = Math.max(80, (p.credits || 0) * 50 + (p.puzzlePieces || 0) * 100);
      registrarXpNoBanco({
        nome: p.name,
        turma: p.turma,
        jogo: 'jogo8',
        pontuacao: p.credits,
        xpGanho: xpCalculado,
        acertos: p.puzzlePieces || 0,
        detalhes: `${p.credits} Créditos Verdes • ${p.puzzlePieces || 0}/3 Peças do Quebra-Cabeça`
      });
      return {
        id: Date.now() + i,
        createdAt: Date.now(),
        name: p.name,
        turma: p.turma,
        credits: p.credits,
        xpGanho: xpCalculado,
        turns: p.turns || 1,
        puzzlePieces: p.puzzlePieces
      };
    });

    setRanking((prev) =>
      filtrarRankingExpirado([...prev, ...newEntries]).sort((a, b) => b.credits - a.credits)
    );

    confetti({
      particleCount: 150,
      spread: 95,
      origin: { y: 0.6 }
    });
  };

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

  const handleConfirmQuestionOption = () => {
    if (pendingOptionIdx === null) return;
    if (roomRole === 'host') {
      triggerAnswerActionCardOnHost(pendingOptionIdx);
    } else {
      roomManagerRef.current?.send({
        type: 'GUEST_ACTION',
        playerId: myClientId,
        action: 'ANSWER_CARD',
        optionIndex: pendingOptionIdx
      });
    }
  };

  const handleDismissFeedbackModal = () => {
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
    setActiveEvent(null);
    setScreen('home');
  };

  const ranking8A = ranking.filter((r) => r.turma === '8º A');
  const ranking8B = ranking.filter((r) => r.turma === '8º B');

  const currentPlayer = players[currentTurnIdx] || players[0] || {
    id: myClientId,
    name: playerName || 'Jogador 1',
    turma: playerClass || '8º A',
    pawnId: selectedPawnId,
    position: 0,
    credits: 10,
    puzzlePieces: 0,
    turns: 0
  };

  const canControlCurrentTurn =
    roomRole === 'host'
      ? currentPlayer.id === myClientId || currentPlayer.isLocalOnHost
      : currentPlayer.id === myClientId;

  // Selecionar a cena de fundo conforme a tela atual
  let activeBg = '/assets/scene_welcome.jpg';
  if (screen === 'howto') {
    activeBg = '/assets/scene_howto.jpg';
  } else if (screen === 'setup' || screen === 'lobby') {
    activeBg = '/assets/scene_setup.jpg';
  } else if (screen === 'join') {
    activeBg = '/assets/scene_join.jpg';
  } else if (screen === 'playing') {
    if (activeEvent?.type === 'acao') {
      activeBg = '/assets/scene_question.jpg';
    } else {
      activeBg = '/assets/scene_board_bg.jpg';
    }
  } else if (screen === 'result') {
    activeBg = '/assets/scene_result.jpg';
  }

  return (
    <div
      className={`cidades-stage screen-${screen}`}
      style={{
        backgroundImage: `url('${activeBg}')`
      }}
    >
      {/* BARRA SUPERIOR */}
      <header className="cidades-topbar">
        <div className="topbar-left">
          {screen !== 'home' && (
            <button
              className="btn-circle-icon"
              onClick={handleLeaveRoom}
              title="Voltar ao Início"
            >
              <Home size={22} />
            </button>
          )}

          {(screen === 'lobby' || screen === 'playing') && roomCode && (
            <button
              className="top-pill-btn"
              onClick={handleCopyRoomCode}
              title="Clique para copiar o código da sala"
            >
              <span>Sala: {roomCode}</span>
              {copiedCode ? <Check size={15} color="#4ade80" /> : <Copy size={15} />}
            </button>
          )}
        </div>

        <div className="topbar-right">
          {screen === 'playing' && (
            <button
              className="top-pill-btn"
              onClick={() => setShowPuzzleModal(true)}
              title="Ver progresso do Quebra-Cabeça"
            >
              <Puzzle size={16} color="#4ade80" />
              <span>Quebra-Cabeça ({currentPlayer.puzzlePieces}/3)</span>
            </button>
          )}

          <button
            className="top-pill-btn"
            onClick={() => setShowRankingModal(true)}
            title="Ver Rankings do 8º A e 8º B"
          >
            <Trophy size={16} color="#facc15" />
            <span>Rankings (8º A / 8º B)</span>
          </button>
        </div>
      </header>

      {/* PALCO PRINCIPAL */}
      <main className="cidades-main-content">
        {/* =======================================================
            PAINEL 1: TELA INICIAL (Logo Nova + Título 3D + COMEÇAR >)
           ======================================================= */}
        {screen === 'home' && (
          <div className="right-hero-column">
            <AstroLearnBrandLogo />

            <div className="cidades-3d-title-block">
              <div className="title-3d-gold">Trilha das</div>
              <div className="title-3d-green">CIDADES</div>
              <div className="title-3d-green">INTELIGENTES</div>
            </div>

            <p className="home-hero-subtitle">
              Explore, jogue e ajude a construir
              <br />
              um futuro mais sustentável!
            </p>

            <button
              type="button"
              onClick={() => setScreen('howto')}
              className="btn-astro-pill btn-hero-start"
            >
              <span>COMEÇAR</span>
              <ChevronRight size={26} strokeWidth={3} />
            </button>
          </div>
        )}

        {/* =======================================================
            PAINEL 2: COMO FUNCIONA? (4 Passos + ENTENDI! >)
           ======================================================= */}
        {screen === 'howto' && (
          <div className="right-hero-column">
            <div className="dark-glass-panel howto-panel">
              <h2 className="panel-heading-howto">
                COMO <span className="violet-gradient-text">FUNCIONA?</span>
              </h2>

              <div className="howto-list">
                <div className="howto-row">
                  <div className="howto-badge-icon purple">
                    <Users size={22} color="#e9d5ff" />
                  </div>
                  <span className="howto-num">1</span>
                  <p>
                    Crie uma sala e jogue com até 4 amigos em computadores diferentes (ou no mesmo PC).
                  </p>
                </div>

                <div className="howto-row">
                  <div className="howto-badge-icon blue">
                    <img
                      src="/assets/dado_3d.png"
                      alt="Dado 3D"
                      style={{ width: '28px', height: '28px', objectFit: 'contain' }}
                    />
                  </div>
                  <span className="howto-num">2</span>
                  <p>
                    Lance o dado 3D e avance pelo tabuleiro.
                  </p>
                </div>

                <div className="howto-row">
                  <div className="howto-badge-icon gold">
                    <Award size={22} color="#fde047" />
                  </div>
                  <span className="howto-num">3</span>
                  <p>
                    Responda às Cartas de Ação e ganhe ou perca Créditos Verdes.
                  </p>
                </div>

                <div className="howto-row">
                  <div className="howto-badge-icon green">
                    <Puzzle size={22} color="#86efac" />
                  </div>
                  <span className="howto-num">4</span>
                  <p>
                    Complete 3 voltas para montar o Quebra-Cabeça Cidades Inteligentes!
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setScreen('setup')}
                className="btn-astro-pill"
              >
                <span>ENTENDI!</span>
                <ChevronRight size={24} strokeWidth={3} />
              </button>
            </div>
          </div>
        )}

        {/* =======================================================
            PAINEL 3: CRIAR SALA / IDENTIFICAÇÃO + 4 PEÕES 3D
           ======================================================= */}
        {screen === 'setup' && (
          <div className="center-stage-wrap">
            <form className="mint-light-card setup-card" onSubmit={handleCreateRoom}>
              <h2 className="mint-card-title">Criar Sala</h2>

              <div className="setup-field-group">
                <label>Identificação do Jogador</label>
                <input
                  type="text"
                  className="mint-input"
                  placeholder="Digite seu nome *"
                  value={playerName}
                  onChange={(e) => {
                    setPlayerName(e.target.value);
                    if (formError) setFormError('');
                  }}
                  maxLength={22}
                />
              </div>

              <div className="setup-field-group">
                <label>Escolha sua turma *</label>
                <select
                  className="mint-input"
                  value={playerClass}
                  onChange={(e) => {
                    setPlayerClass(e.target.value);
                    if (formError) setFormError('');
                  }}
                >
                  <option value="8º A">8º A</option>
                  <option value="8º B">8º B</option>
                </select>
              </div>

              <div className="setup-field-group">
                <label>Escolha seu Peão para o Tabuleiro:</label>
                <div className="pawns-4col-grid">
                  {PAWN_OPTIONS.map((po) => {
                    const isSelected = selectedPawnId === po.id;
                    return (
                      <button
                        type="button"
                        key={po.id}
                        className={`pawn-card-option ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedPawnId(po.id)}
                      >
                        <img src={po.img} alt={po.label} className="pawn-card-img" />
                        <span className="pawn-card-label">{po.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {formError && (
                <div className="setup-error-banner">
                  <AlertCircle size={16} />
                  <span>{formError}</span>
                </div>
              )}

              <button type="submit" className="btn-green-create-room">
                Criar Sala (1 a 4 Jogadores)
              </button>

              <button
                type="button"
                onClick={handleGoToJoinScreen}
                className="btn-secondary-join-room"
              >
                Já tem um código? Entrar em uma Sala
              </button>
            </form>
          </div>
        )}

        {/* =======================================================
            PAINEL 4: ENTRAR EM UMA SALA (4 Caixas de Dígitos)
           ======================================================= */}
        {screen === 'join' && (
          <div className="right-hero-column">
            <form className="dark-glass-panel join-room-panel" onSubmit={handleJoinRoom}>
              <h2 className="join-panel-title">Entrar em uma Sala</h2>
              <p className="join-panel-sub">
                Digite o código da sala para se juntar ao jogo.
              </p>

              <div className="code-4boxes-row" onPaste={handleDigitPaste}>
                {joinDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={digitRefs[idx]}
                    type="text"
                    className="code-digit-box"
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                    maxLength={1}
                  />
                ))}
              </div>

              {formError && (
                <div className="setup-error-banner" style={{ marginBottom: '0.9rem' }}>
                  <AlertCircle size={16} />
                  <span>{formError}</span>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', alignItems: 'center' }}>
                <button type="submit" className="btn-astro-pill">
                  <span>Entrar na Sala</span>
                  <ChevronRight size={24} strokeWidth={3} />
                </button>

                <button
                  type="button"
                  onClick={() => setScreen('setup')}
                  className="btn-link-back"
                >
                  Voltar para Criar Sala
                </button>
              </div>
            </form>
          </div>
        )}

        {/* =======================================================
            PAINEL 5: AGUARDANDO JOGADORES (Lobby com 4 Slots)
           ======================================================= */}
        {screen === 'lobby' && (
          <div className="center-stage-wrap">
            <div className="dark-glass-panel lobby-glass-panel">
              <div className="lobby-header-title">
                <Users size={26} color="#67e8f9" />
                <h2>Aguardando Jogadores</h2>
              </div>
              <p className="lobby-subtitle">
                Compartilhe o código da sala com seus amigos!
              </p>

              {/* Código da Sala em Destaque */}
              <button
                type="button"
                className="lobby-code-display"
                onClick={handleCopyRoomCode}
                title="Clique para copiar o código"
              >
                <span>{roomCode}</span>
                {copiedCode ? <Check size={22} color="#4ade80" /> : <Copy size={22} color="#93c5fd" />}
              </button>

              {/* 4 Slots de Jogadores lado a lado */}
              <div className="lobby-slots-4grid">
                {[0, 1, 2, 3].map((slotIdx) => {
                  const p = players[slotIdx];
                  const pawnObj = p
                    ? PAWN_OPTIONS.find((po) => po.id === p.pawnId) || PAWN_OPTIONS[0]
                    : null;

                  if (p) {
                    return (
                      <div key={p.id} className="lobby-slot-card filled">
                        {roomRole === 'host' && !p.isHost && (
                          <button
                            type="button"
                            className="slot-remove-btn"
                            onClick={() => handleRemovePlayer(p.id)}
                            title="Remover jogador"
                          >
                            <X size={13} />
                          </button>
                        )}
                        <div className="slot-player-name">{p.name}</div>
                        <div className="slot-player-turma">{p.turma}</div>
                        <img
                          src={pawnObj.img}
                          alt={pawnObj.label}
                          className="slot-pawn-img"
                          onClick={() => handleCyclePawnInLobby(p.id)}
                          title="Clique para trocar de peão"
                        />
                        <span className="slot-pawn-label">{pawnObj.label}</span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={slotIdx}
                      className="lobby-slot-card empty"
                      onClick={() => {
                        if (roomRole === 'host') setShowAddLocalForm(true);
                      }}
                      style={{ cursor: roomRole === 'host' ? 'pointer' : 'default' }}
                      title={
                        roomRole === 'host'
                          ? 'Clique para adicionar um jogador neste mesmo computador'
                          : 'Aguardando jogador...'
                      }
                    >
                      <div className="slot-dashed-circle">
                        {roomRole === 'host' ? <UserPlus size={20} color="#94a3b8" /> : null}
                      </div>
                      <span className="slot-waiting-text">
                        {roomRole === 'host' ? '+ Mesmo PC' : 'Aguardando...'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Formulário rápido para adicionar colega no mesmo PC */}
              {roomRole === 'host' && showAddLocalForm && players.length < 4 && (
                <form className="add-local-inline-form" onSubmit={handleAddLocalPlayer}>
                  <input
                    type="text"
                    placeholder="Nome do colega no mesmo PC"
                    value={localAddName}
                    onChange={(e) => setLocalAddName(e.target.value)}
                    className="mint-input"
                    maxLength={20}
                    autoFocus
                  />
                  <select
                    value={localAddClass}
                    onChange={(e) => setLocalAddClass(e.target.value)}
                    className="mint-input"
                    style={{ maxWidth: '115px' }}
                  >
                    <option value="8º A">8º A</option>
                    <option value="8º B">8º B</option>
                  </select>
                  <button type="submit" className="btn-green-small">
                    Adicionar
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddLocalForm(false)}
                    className="btn-cancel-small"
                  >
                    Cancelar
                  </button>
                </form>
              )}

              {roomRole === 'host' ? (
                <button
                  type="button"
                  onClick={handleStartMatchFromLobby}
                  className="btn-lobby-start"
                >
                  <span>Iniciar Jogo</span>
                  <ChevronRight size={22} />
                </button>
              ) : (
                <div className="guest-waiting-pill">
                  Conectado ({networkStatus}) • Aguardando o anfitrião iniciar a partida...
                </div>
              )}
            </div>
          </div>
        )}

        {/* =======================================================
            PAINEL 6: TABULEIRO 3D EM ESPIRAL + DADO 3D + BARRA DE 4 JOGADORES
           ======================================================= */}
        {screen === 'playing' && (
          <div className="playing-stage-container">
            <div className="board-and-dice-row">
              {/* Tabuleiro Espiral 3D Central com Peões posicionados nas 20 casas */}
              <div className="spiral-board-wrapper">
                <img
                  src="/assets/tabuleiro_3d.png"
                  alt="Tabuleiro Cidades Inteligentes"
                  className="spiral-board-img"
                />

                {/* Marcador Verde de Folha na casa do jogador da vez */}
                {currentPlayer && SPIRAL_COORDS[currentPlayer.position] && (
                  <div
                    className="active-space-leaf-token"
                    style={{
                      left: `${SPIRAL_COORDS[currentPlayer.position].left}%`,
                      top: `${SPIRAL_COORDS[currentPlayer.position].top}%`
                    }}
                    title={`Casa atual de ${currentPlayer.name}`}
                  >
                    <GreenLeafSVG size={18} />
                  </div>
                )}

                {/* Peões 3D de todos os jogadores na trilha */}
                {players.map((p, idx) => {
                  const coord = SPIRAL_COORDS[p.position] || SPIRAL_COORDS[0];
                  const pawnObj =
                    PAWN_OPTIONS.find((po) => po.id === p.pawnId) || PAWN_OPTIONS[idx % 4];
                  // Pequeno deslocamento caso mais de 1 jogador esteja na mesma casa
                  const sameSpacePlayers = players.filter((other) => other.position === p.position);
                  const posInGroup = sameSpacePlayers.findIndex((other) => other.id === p.id);
                  const offsetX = (posInGroup - (sameSpacePlayers.length - 1) / 2) * 2.8;

                  return (
                    <div
                      key={p.id}
                      className={`board-pawn-marker ${
                        steppingPlayerId === p.id ? 'stepping' : ''
                      } ${idx === currentTurnIdx ? 'is-turn' : ''}`}
                      style={{
                        left: `calc(${coord.left}% + ${offsetX}%)`,
                        top: `${coord.top}%`
                      }}
                      title={`${p.name} (${pawnObj.label})`}
                    >
                      <img src={pawnObj.img} alt={p.name} className="board-pawn-3d-img" />
                      <span className="board-pawn-name-tag">{p.name}</span>
                    </div>
                  );
                })}
              </div>

              {/* Painel Lateral Direito do Dado 3D + Botão "Lançar Dado" */}
              <div className="dice-dock-card">
                <div className="turn-player-badge">
                  Vez de <strong>{currentPlayer.name}</strong>
                </div>

                <DiceFace3D value={diceValue} isRolling={isRolling} />

                <button
                  type="button"
                  className="btn-roll-green"
                  disabled={
                    !canControlCurrentTurn ||
                    isRolling ||
                    isMovingPawn ||
                    Boolean(activeEvent)
                  }
                  onClick={handleRollDiceClick}
                >
                  {isRolling
                    ? 'Sorteando...'
                    : isMovingPawn
                    ? 'Avançando...'
                    : 'Lançar Dado'}
                </button>
              </div>
            </div>

            {/* Barra Inferior com os 4 Cards de Jogadores (Idêntica ao Painel 6) */}
            <div className="bottom-players-bar">
              {[0, 1, 2, 3].map((slotIdx) => {
                const p = players[slotIdx];
                if (!p) {
                  return (
                    <div key={slotIdx} className="hud-player-card inactive-slot">
                      <span className="inactive-slot-label">Slot {slotIdx + 1} livre</span>
                    </div>
                  );
                }

                const pawnObj =
                  PAWN_OPTIONS.find((po) => po.id === p.pawnId) || PAWN_OPTIONS[slotIdx % 4];
                const isTurn = slotIdx === currentTurnIdx;

                return (
                  <div
                    key={p.id}
                    className={`hud-player-card ${isTurn ? 'active-turn-card' : ''}`}
                  >
                    <img src={pawnObj.img} alt={pawnObj.label} className="hud-pawn-thumb" />
                    <div className="hud-player-details">
                      <div className="hud-player-name">{p.name}</div>
                      <div className="hud-player-credits">
                        <GreenLeafSVG size={18} />
                        <span>{p.credits}</span>
                        <span className="hud-puzzle-mini" title="Peças do Quebra-Cabeça">
                          • 🧩 {p.puzzlePieces}/3
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =======================================================
            PAINEL 7: MODAL DE PERGUNTA (A, B, C + Botão Confirmar)
           ======================================================= */}
        {screen === 'playing' && activeEvent?.type === 'acao' && (
          <div className="event-overlay-backdrop">
            <div className="dark-glass-panel question-modal-card">
              <div className="question-modal-header">
                <div className="q-header-left">
                  <GreenLeafSVG size={22} />
                  <span>Pergunta • {activeEvent.playerName}</span>
                </div>
                <span className="q-header-counter">
                  +{activeEvent.card.creditos} Créditos
                </span>
              </div>

              <div className="question-white-box">
                <p className="question-box-title">{activeEvent.card.pergunta}</p>

                <div className="question-options-stack">
                  {activeEvent.card.opcoes.map((optText, idx) => {
                    const letter = ['A', 'B', 'C'][idx] || String(idx + 1);
                    const isSelected = pendingOptionIdx === idx;
                    return (
                      <button
                        type="button"
                        key={idx}
                        className={`q-option-row ${isSelected ? 'selected' : ''}`}
                        disabled={!canControlCurrentTurn}
                        onClick={() => setPendingOptionIdx(idx)}
                      >
                        <span className="q-option-circle">{letter}</span>
                        <span className="q-option-label">{optText}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                className="btn-confirm-green"
                disabled={!canControlCurrentTurn || pendingOptionIdx === null}
                onClick={handleConfirmQuestionOption}
              >
                Confirmar
              </button>
            </div>
          </div>
        )}

        {/* =======================================================
            PAINEL 8: MODAL DE CARTA DE AÇÃO (Verde) OU OPS! (Vermelho)
           ======================================================= */}
        {screen === 'playing' && activeEvent?.type === 'card_feedback' && (
          <div className="event-overlay-backdrop">
            <div
              className={`action-feedback-frame ${
                activeEvent.isPositive ? 'positive-frame' : 'negative-frame'
              }`}
            >
              <div className="feedback-frame-header">
                {activeEvent.isPositive ? (
                  <>
                    <GreenLeafSVG size={22} />
                    <span>Carta de Ação</span>
                  </>
                ) : (
                  <>
                    <X size={24} color="#fb7185" strokeWidth={3} />
                    <span>Ops!</span>
                  </>
                )}
              </div>

              <div className="feedback-inner-body">
                <div className="feedback-ill-wrap">
                  <img
                    src={
                      activeEvent.isPositive
                        ? '/assets/card_progresso_ill.jpg'
                        : '/assets/card_regresso_ill.jpg'
                    }
                    alt={activeEvent.title}
                    className="feedback-ill-img"
                  />
                </div>

                {activeEvent.passedStart && (
                  <div className="passed-start-pill">
                    🧩 Completou uma volta e ganhou +1 peça do Quebra-Cabeça!
                  </div>
                )}

                <p className="feedback-desc-text">{activeEvent.message}</p>

                <div
                  className={`feedback-credits-delta ${
                    activeEvent.isPositive ? 'delta-gain' : 'delta-loss'
                  }`}
                >
                  {activeEvent.creditsDelta >= 0
                    ? `Ganhe +${activeEvent.creditsDelta} Créditos Verdes!`
                    : `Você perde ${activeEvent.creditsDelta} Créditos Verdes!`}
                </div>

                <button
                  type="button"
                  className="btn-astro-pill btn-ok-card"
                  disabled={!canControlCurrentTurn}
                  onClick={handleDismissFeedbackModal}
                >
                  <span>OK</span>
                  <ChevronRight size={20} strokeWidth={3} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =======================================================
            PAINEL 9: TELA DE VITÓRIA / QUEBRA-CABEÇA COMPLETO (3/3)
           ======================================================= */}
        {screen === 'result' && (
          <div className="right-hero-column">
            <div className="dark-glass-panel puzzle-result-panel">
              <div className="puzzle-result-header">
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Puzzle size={24} color="#4ade80" />
                  <span>Quebra-Cabeça</span>
                </div>
                <span>3/3</span>
              </div>

              <div className="puzzle-3col-showcase">
                {[1, 2, 3].map((num) => (
                  <div key={num} className="puzzle-piece-frame">
                    <img
                      src={`/assets/quebra_cabeca_${num}.jpg`}
                      alt={`Peça ${num} Cidades Inteligentes`}
                      className="puzzle-piece-img"
                    />
                  </div>
                ))}
              </div>

              {winnerPlayer && (
                <p className="winner-congrats-line">
                  🎉 <strong>{winnerPlayer.name}</strong> ({winnerPlayer.turma}) venceu com{' '}
                  <strong>{winnerPlayer.credits} Créditos Verdes</strong> e liberou XP na Loja AstroLearn!
                </p>
              )}

              <button
                type="button"
                className="btn-confirm-green"
                onClick={() => {
                  if (roomRole === 'host') {
                    handleStartMatchFromLobby();
                  } else {
                    handleLeaveRoom();
                  }
                }}
              >
                Quebra-cabeça completo! (Jogar Novamente)
              </button>

              <div className="result-secondary-btns">
                <button
                  type="button"
                  className="top-pill-btn"
                  onClick={() => setShowRankingModal(true)}
                >
                  <Trophy size={15} color="#facc15" />
                  <span>Ver Rankings</span>
                </button>
                <button
                  type="button"
                  className="top-pill-btn"
                  onClick={handleLeaveRoom}
                >
                  <Home size={15} />
                  <span>Início</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL DO QUEBRA-CABEÇA DURANTE A PARTIDA */}
      {showPuzzleModal && (
        <div className="event-overlay-backdrop" onClick={() => setShowPuzzleModal(false)}>
          <div
            className="dark-glass-panel puzzle-result-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="puzzle-result-header">
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <Puzzle size={24} color="#4ade80" />
                <span>Quebra-Cabeça de {currentPlayer.name}</span>
              </div>
              <span>{currentPlayer.puzzlePieces}/3</span>
            </div>

            <div className="puzzle-3col-showcase">
              {[1, 2, 3].map((num) => {
                const unlocked = currentPlayer.puzzlePieces >= num || isGameFinished;
                return (
                  <div key={num} className="puzzle-piece-frame">
                    {unlocked ? (
                      <img
                        src={`/assets/quebra_cabeca_${num}.jpg`}
                        alt={`Peça ${num}`}
                        className="puzzle-piece-img"
                      />
                    ) : (
                      <div className="puzzle-piece-locked">
                        <Puzzle size={28} color="#64748b" />
                        <span>{num}ª Volta</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              className="btn-confirm-green"
              onClick={() => setShowPuzzleModal(false)}
            >
              Voltar ao Tabuleiro
            </button>
          </div>
        </div>
      )}

      {/* MODAL DOS RANKINGS SEPARADOS (8º A e 8º B — renova a cada 2h, sem botão de limpar) */}
      {showRankingModal && (
        <div className="event-overlay-backdrop" onClick={() => setShowRankingModal(false)}>
          <div
            className="dark-glass-panel ranking-modal-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ranking-modal-top">
              <h2>
                <Trophy size={26} color="#facc15" />
                <span>Rankings Cidades Inteligentes • 8º A e 8º B</span>
              </h2>
              <button
                type="button"
                onClick={() => setShowRankingModal(false)}
                className="top-pill-btn"
              >
                <X size={18} /> Fechar
              </button>
            </div>

            <div className="rankings-2col-grid">
              {/* Coluna 8º A */}
              <div className="rank-col-box">
                <h3>
                  <Award size={19} color="#4ade80" />
                  <span>Turma 8º A</span>
                </h3>
                {ranking8A.length === 0 ? (
                  <p className="empty-rank-text">Nenhum aluno do 8º A jogou nas últimas 2 horas.</p>
                ) : (
                  ranking8A.map((r, i) => (
                    <div key={r.id} className={`rank-item-row ${i === 0 ? 'top1' : ''}`}>
                      <div>
                        <div className="rank-item-name">
                          {i + 1}º • {r.name}
                        </div>
                        <div className="rank-item-sub">
                          {r.puzzlePieces ?? 3}/3 Peças • {r.turns} rodadas
                        </div>
                      </div>
                      <div className="rank-item-credits">{r.credits} créditos</div>
                    </div>
                  ))
                )}
              </div>

              {/* Coluna 8º B */}
              <div className="rank-col-box">
                <h3>
                  <Award size={19} color="#4ade80" />
                  <span>Turma 8º B</span>
                </h3>
                {ranking8B.length === 0 ? (
                  <p className="empty-rank-text">Nenhum aluno do 8º B jogou nas últimas 2 horas.</p>
                ) : (
                  ranking8B.map((r, i) => (
                    <div key={r.id} className={`rank-item-row ${i === 0 ? 'top1' : ''}`}>
                      <div>
                        <div className="rank-item-name">
                          {i + 1}º • {r.name}
                        </div>
                        <div className="rank-item-sub">
                          {r.puzzlePieces ?? 3}/3 Peças • {r.turns} rodadas
                        </div>
                      </div>
                      <div className="rank-item-credits">{r.credits} créditos</div>
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
