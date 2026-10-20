import React, { useState, useEffect } from 'react';
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
  ArrowRight
} from 'lucide-react';
import {
  BOARD_SPACES,
  PROGRESSO_REGRESSO_CARDS,
  ACAO_CARDS,
  SMART_CITIES_DEFINITION
} from './data/cidadesData';

export default function App() {
  // Telas: 'welcome' | 'playing'
  const [screen, setScreen] = useState('welcome');
  const [showRankingModal, setShowRankingModal] = useState(false);

  // Identificação obrigatória: Nome e Turma ('8º A' ou '8º B')
  const [playerName, setPlayerName] = useState('');
  const [playerClass, setPlayerClass] = useState('');
  const [formError, setFormError] = useState('');

  // Rankings separados para 8º A e 8º B (inicia 100% limpo)
  const [ranking, setRanking] = useState(() => {
    const saved = localStorage.getItem('cidades_inteligentes_ranking_v1');
    return saved ? JSON.parse(saved) : [];
  });

  // Estado da partida
  const [position, setPosition] = useState(0); // 0 a 19
  const [greenCredits, setGreenCredits] = useState(5); // começa com 5 créditos verdes iniciais
  const [puzzlePieces, setPuzzlePieces] = useState(0); // 0 a 3 (1 peça por volta concluída)
  const [turnCount, setTurnCount] = useState(0);
  const [diceValue, setDiceValue] = useState(1);
  const [isRolling, setIsRolling] = useState(false);

  // Carta ou evento ativo na rodada atual
  // activeEvent: { type: 'pr' | 'acao' | 'space', card?: obj, space?: obj, answered?: bool, chosenIdx?: number }
  const [activeEvent, setActiveEvent] = useState(null);
  const [isGameFinished, setIsGameFinished] = useState(false);

  useEffect(() => {
    localStorage.setItem('cidades_inteligentes_ranking_v1', JSON.stringify(ranking));
  }, [ranking]);

  // Iniciar partida validando Nome e Turma (8º A ou 8º B)
  const handleStartGame = (e) => {
    if (e) e.preventDefault();
    const trimmed = playerName.trim();
    if (!trimmed && !playerClass) {
      setFormError('Por favor, digite seu nome e escolha sua turma (8º A ou 8º B)!');
      return;
    }
    if (!trimmed) {
      setFormError('Por favor, digite seu nome antes de começar!');
      return;
    }
    if (!playerClass) {
      setFormError('Por favor, selecione sua turma (8º A ou 8º B) antes de começar!');
      return;
    }

    setFormError('');
    setPosition(0);
    setGreenCredits(5);
    setPuzzlePieces(0);
    setTurnCount(0);
    setDiceValue(1);
    setActiveEvent({
      type: 'space',
      title: 'Bem-vindo à Trilha das Cidades Inteligentes!',
      message:
        'Você começa na casa INÍCIO com 5 Créditos Verdes iniciais. Lance o dado para percorrer o tabuleiro e juntar as 3 peças do Quebra-Cabeça (3 voltas)!'
    });
    setIsGameFinished(false);
    setScreen('playing');
  };

  // Lançar o dado (1 a 6)
  const rollDice = () => {
    if (isRolling || isGameFinished) return;
    if (activeEvent?.type === 'acao' && !activeEvent.answered) return;

    setIsRolling(true);
    const rolled = Math.floor(Math.random() * 6) + 1;

    setTimeout(() => {
      setDiceValue(rolled);
      setIsRolling(false);
      movePlayer(rolled);
    }, 450);
  };

  // Movimentar peão e verificar se passou pelo Início (ganha peça do quebra-cabeça)
  const movePlayer = (steps) => {
    const rawNext = position + steps;
    const passedStart = rawNext >= 20;
    let nextPos = rawNext % 20;
    let nextPieces = puzzlePieces;
    let currentCredits = greenCredits;
    const nextTurns = turnCount + 1;
    setTurnCount(nextTurns);

    if (passedStart) {
      nextPieces = Math.min(3, puzzlePieces + 1);
      setPuzzlePieces(nextPieces);
    }

    setPosition(nextPos);

    // Se completou as 3 peças do Quebra-Cabeça (3 voltas), finaliza a partida!
    if (nextPieces >= 3) {
      finishGame(currentCredits, nextTurns);
      return;
    }

    const landedSpace = BOARD_SPACES[nextPos];

    // Tratar o efeito da casa onde caiu
    if (landedSpace.tipo === 'progresso_regresso') {
      const randomCard =
        PROGRESSO_REGRESSO_CARDS[Math.floor(Math.random() * PROGRESSO_REGRESSO_CARDS.length)];
      const updatedCredits = Math.max(0, currentCredits + randomCard.creditos);
      setGreenCredits(updatedCredits);
      setActiveEvent({
        type: 'pr',
        card: randomCard,
        passedStart
      });
    } else if (landedSpace.tipo === 'acao') {
      const randomAction = ACAO_CARDS[Math.floor(Math.random() * ACAO_CARDS.length)];
      setActiveEvent({
        type: 'acao',
        card: randomAction,
        answered: false,
        chosenIdx: null,
        passedStart
      });
    } else if (landedSpace.tipo === 'steam') {
      const updatedCredits = currentCredits + 2;
      setGreenCredits(updatedCredits);
      setActiveEvent({
        type: 'space',
        title: '🚀 Espaço STEAM+ (+2 Créditos Verdes)',
        message: landedSpace.descricao,
        passedStart
      });
    } else if (landedSpace.tipo === 'bike_avance3') {
      const bonusPos = (nextPos + 3) % 20;
      const updatedCredits = currentCredits + 2;
      setPosition(bonusPos);
      setGreenCredits(updatedCredits);
      setActiveEvent({
        type: 'space',
        title: '🚲 Pedal Sustentável! Avançou 3 casas (+2 Créditos Verdes)',
        message:
          'Você andou de bike e não emitiu nenhum CO₂! Avançou 3 casas e ganhou +2 Créditos Verdes de incentivo!',
        passedStart
      });
    } else if (landedSpace.tipo === 'lixo_volte2') {
      const backPos = Math.max(0, nextPos - 2);
      setPosition(backPos);
      setActiveEvent({
        type: 'space',
        title: '⚠️ Descarte Incorreto de Lixo! Voltou 2 casas',
        message:
          'Você não descartou o lixo corretamente e precisou voltar 2 casas para a casa de Momento de Descanso.',
        passedStart
      });
    } else if (landedSpace.tipo === 'estudo_jogue_novamente') {
      const updatedCredits = currentCredits + 2;
      setGreenCredits(updatedCredits);
      setActiveEvent({
        type: 'space',
        title: '🎲 Compartilhando Saberes! (+2 Créditos Verdes)',
        message:
          'Você estudou sobre as cidades inteligentes e está compartilhando com outras pessoas! Ganhou +2 Créditos Verdes — lance o dado novamente!',
        passedStart
      });
    } else if (landedSpace.tipo === 'parque') {
      setTurnCount((t) => t + 1);
      setActiveEvent({
        type: 'space',
        title: '🌳 Passeio no Parque',
        message:
          'Você chegou ao parque! Aproveite o passeio em contato com a natureza (+1 rodada contabilizada).',
        passedStart
      });
    } else {
      setActiveEvent({
        type: 'space',
        title: `🌈 ${landedSpace.nome}`,
        message: landedSpace.descricao,
        passedStart
      });
    }
  };

  // Responder a uma Carta de Ação (Quiz, Criatividade, Debate ou Ação Cidadã)
  const handleAnswerActionCard = (optionIndex) => {
    if (!activeEvent || activeEvent.type !== 'acao' || activeEvent.answered) return;

    const isCorrect = optionIndex === activeEvent.card.correta;
    let updatedCredits = greenCredits;

    if (isCorrect) {
      updatedCredits = greenCredits + activeEvent.card.creditos;
      setGreenCredits(updatedCredits);
    }

    setActiveEvent({
      ...activeEvent,
      answered: true,
      chosenIdx: optionIndex,
      isCorrect
    });
  };

  // Finalizar partida ao completar as 3 peças do Quebra-Cabeça (3 voltas)
  const finishGame = (finalCredits, totalTurns) => {
    setIsGameFinished(true);
    setActiveEvent(null);

    const newEntry = {
      id: Date.now(),
      name: playerName.trim(),
      turma: playerClass,
      credits: finalCredits,
      turns: totalTurns
    };

    setRanking((prev) => [...prev, newEntry].sort((a, b) => b.credits - a.credits));

    confetti({
      particleCount: 120,
      spread: 85,
      origin: { y: 0.6 }
    });
  };

  const clearClassRanking = (turmaAlvo) => {
    setRanking((prev) => prev.filter((item) => item.turma !== turmaAlvo));
  };

  const ranking8A = ranking.filter((r) => r.turma === '8º A');
  const ranking8B = ranking.filter((r) => r.turma === '8º B');
  const currentSpace = BOARD_SPACES[position];
  const waitingForActionAnswer = activeEvent?.type === 'acao' && !activeEvent.answered;

  return (
    <div className="cidades-app">
      {/* Barra de Topo */}
      <header className="cidades-topbar">
        <div className="brand-box" onClick={() => setScreen('welcome')}>
          <img src="/assets/moeda_5.jpg" alt="Crédito Verde" className="brand-coin-img" />
          <div>
            <div className="brand-title">Cidades Inteligentes • Jogo de Tabuleiro</div>
            <div className="brand-sub">Projeto Educativo TCC • 8º Ano Ensino Fundamental</div>
          </div>
        </div>

        <div className="hud-row">
          {screen === 'playing' && (
            <>
              <div className="hud-badge">
                <span>👤 {playerName} ({playerClass})</span>
              </div>

              <div className="hud-badge credits" title="Total de Créditos Verdes acumulados">
                <span>🪙 Créditos Verdes: {greenCredits}</span>
              </div>

              <div className="hud-badge" title="Peças do Quebra-Cabeça (1 peça a cada volta completa)">
                <Puzzle size={17} color="#facc15" />
                <span>Quebra-Cabeça: {puzzlePieces}/3</span>
              </div>
            </>
          )}

          <button className="btn-top" onClick={() => setShowRankingModal(true)}>
            <Trophy size={16} />
            <span>Rankings (8º A / 8º B)</span>
          </button>
        </div>
      </header>

      {/* TELA DE BOAS-VINDAS E IDENTIFICAÇÃO */}
      {screen === 'welcome' && (
        <main className="welcome-wrap">
          <div className="welcome-card">
            <div>
              <span
                style={{
                  display: 'inline-block',
                  padding: '0.3rem 0.9rem',
                  borderRadius: '999px',
                  background: '#2d6a4f',
                  color: '#fff',
                  fontFamily: 'Fredoka, sans-serif',
                  fontSize: '0.85rem',
                  marginBottom: '0.7rem'
                }}
              >
                RECURSO C1.1 • TABULEIRO DIGITAL 8º ANO
              </span>

              <h1 style={{ fontSize: '2.25rem', lineHeight: 1.12, marginBottom: '0.75rem' }}>
                Jogo Cidades Inteligentes
              </h1>

              <p style={{ fontSize: '0.98rem', lineHeight: 1.5, fontWeight: 700 }}>
                Percorra o tabuleiro lançando o dado, acumule <strong>Moedas de Créditos Verdes</strong> e
                complete as <strong>3 voltas</strong> para montar o <strong>Quebra-Cabeça Cidades Inteligentes</strong>!
              </p>

              <ul className="rules-list">
                <li>⚡ <strong>Progresso ou Regresso:</strong> ganhe ou perca Créditos Verdes conforme as atitudes urbanas da cidade.</li>
                <li>🌼 <strong>Cartas de Ação (Quiz, Criatividade, Debate e Ação Cidadã):</strong> escolha a melhor solução sustentável para ganhar +4 ou +5 Créditos Verdes!</li>
                <li>🧩 <strong>Quebra-Cabeça (3 Voltas):</strong> toda vez que passar pela casa <em>Início</em>, você ganha 1 peça do quebra-cabeça. Ao juntar as 3 peças, o jogo termina!</li>
              </ul>

              <div className="coins-showcase">
                <img src="/assets/moeda_1.jpg" alt="1 Crédito Verde" className="coin-thumb" />
                <img src="/assets/moeda_2.jpg" alt="2 Créditos Verdes" className="coin-thumb" />
                <img src="/assets/moeda_5.jpg" alt="5 Créditos Verdes" className="coin-thumb" />
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1b4332' }}>
                  Acumule o máximo de Créditos Verdes para liderar o Ranking da sua turma!
                </span>
              </div>
            </div>

            <form className="login-panel" onSubmit={handleStartGame}>
              <img
                src="/assets/moeda_5.jpg"
                alt="Moeda 5 Créditos Verdes"
                style={{ width: '84px', height: '84px', borderRadius: '50%', objectFit: 'cover', marginBottom: '0.6rem', border: '3px solid #2d6a4f' }}
              />
              <h2 style={{ fontSize: '1.4rem', marginBottom: '0.85rem' }}>Identificação do Estudante</h2>

              <input
                type="text"
                className="field-input"
                placeholder="Digite seu nome *"
                value={playerName}
                onChange={(e) => {
                  setPlayerName(e.target.value);
                  if (formError) setFormError('');
                }}
                maxLength={26}
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
                <option value="8º A">8º A</option>
                <option value="8º B">8º B</option>
              </select>

              {formError && (
                <div
                  style={{
                    background: '#fee2e2',
                    color: '#dc2626',
                    border: '1.5px solid #f87171',
                    borderRadius: '12px',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    marginBottom: '0.75rem'
                  }}
                >
                  ⚠️ {formError}
                </div>
              )}

              <button type="submit" className="btn-play-green">
                <Play size={22} fill="currentColor" />
                <span>Começar Partida</span>
              </button>
            </form>
          </div>
        </main>
      )}

      {/* TELA DE JOGO: TABULEIRO + DADO/CARTAS/QUEBRA-CABEÇA */}
      {screen === 'playing' && (
        <main className="game-layout">
          {/* Lado Esquerdo: Tabuleiro Original Cidades Inteligentes */}
          <section className="board-stage-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#d8f3dc' }}>
                📍 Posição Atual: <strong>Casa {position} — {currentSpace.nome}</strong>
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#95d5b2' }}>
                Volta {Math.min(3, puzzlePieces + 1)} de 3 • Rodadas: {turnCount}
              </div>
            </div>

            <div className="board-image-container">
              <img
                src="/assets/tabuleiro_cidades.jpg"
                alt="Tabuleiro Cidades Inteligentes"
                className="board-main-img"
              />

              {/* Marcadores numerados sutis nas 20 casas */}
              {BOARD_SPACES.map((sp) => (
                <div
                  key={sp.index}
                  className={`space-dot ${position === sp.index ? 'current' : ''}`}
                  style={{ left: `${sp.x}%`, top: `${sp.y}%` }}
                >
                  {sp.index}
                </div>
              ))}

              {/* Peão do Jogador posicionado na casa atual */}
              <div
                className="player-pawn-marker"
                style={{
                  left: `${currentSpace.x}%`,
                  top: `${currentSpace.y}%`
                }}
              >
                <div className="pawn-bubble">
                  <span>🛼</span>
                  <span>{playerName.slice(0, 12)}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Lado Direito: Dado + Carta Ativa + Quebra-Cabeça de 3 Peças */}
          <aside className="side-column">
            {/* Controle de Lançar Dado */}
            {!isGameFinished && (
              <div className="dice-control-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                  <div className={`dice-cube ${isRolling ? 'rolling' : ''}`}>
                    {diceValue}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '1.15rem', fontWeight: 700 }}>
                      {waitingForActionAnswer
                        ? 'Responda à Carta de Ação abaixo!'
                        : 'Sua vez de jogar!'}
                    </div>
                    <div style={{ fontSize: '0.84rem', color: '#b7e4c7', fontWeight: 700 }}>
                      {waitingForActionAnswer
                        ? 'Escolha a alternativa correta para liberar o dado.'
                        : 'Clique no botão para lançar o dado (1 a 6).'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={rollDice}
                  disabled={isRolling || waitingForActionAnswer}
                  className="btn-play-green"
                  style={{ width: 'auto', padding: '0.8rem 1.4rem', fontSize: '1.1rem' }}
                >
                  <Dices size={22} />
                  <span>{isRolling ? 'Girando...' : 'Lançar Dado'}</span>
                </button>
              </div>
            )}

            {/* Resumo Final quando completar as 3 peças do Quebra-Cabeça (3 Voltas) */}
            {isGameFinished && (
              <div
                className="game-card-frame progresso"
                style={{ background: 'linear-gradient(180deg, #2d6a4f, #1b4332)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
                  <Sparkles size={26} color="#facc15" />
                  <h2 style={{ fontSize: '1.5rem' }}>
                    Parabéns! Quebra-Cabeça Completo (3 Voltas)!
                  </h2>
                </div>

                <div className="card-inner-white" style={{ marginBottom: '1rem' }}>
                  <p style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '0.6rem', color: '#1b4332' }}>
                    🎉 <strong>{playerName}</strong> ({playerClass}), você concluiu as 3 voltas e acumulou{' '}
                    <strong>{greenCredits} Créditos Verdes</strong> em {turnCount} rodadas!
                  </p>
                  <p style={{ fontSize: '0.88rem', lineHeight: 1.5, fontWeight: 700, color: '#334155', background: '#f0fdf4', padding: '0.75rem', borderRadius: '12px', border: '1.5px solid #86efac' }}>
                    📖 <strong>Definição Oficial Desbloqueada:</strong> "{SMART_CITIES_DEFINITION}"
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <button onClick={handleStartGame} className="btn-top" style={{ background: '#16a34a' }}>
                    <RotateCcw size={16} /> Jogar Novamente
                  </button>
                  <button
                    onClick={() => {
                      setPlayerName('');
                      setPlayerClass('');
                      setScreen('welcome');
                    }}
                    className="btn-top"
                    style={{ background: '#7209b7' }}
                  >
                    <UserPlus size={16} /> Novo Jogador
                  </button>
                  <button
                    onClick={() => setShowRankingModal(true)}
                    className="btn-top"
                    style={{ background: '#0284c7' }}
                  >
                    <Trophy size={16} /> Ver Rankings (8º A / 8º B)
                  </button>
                </div>
              </div>
            )}

            {/* Exibição da Carta Sorteada: Progresso ou Regresso */}
            {!isGameFinished && activeEvent?.type === 'pr' && (
              <div
                className={`game-card-frame ${
                  activeEvent.card.subtipo === 'Progresso' ? 'progresso' : 'regresso'
                }`}
              >
                {activeEvent.passedStart && (
                  <div style={{ background: '#facc15', color: '#0f172a', padding: '0.35rem 0.75rem', borderRadius: '10px', fontWeight: 900, fontSize: '0.82rem', marginBottom: '0.65rem' }}>
                    🧩 Você passou pelo INÍCIO e ganhou +1 peça do Quebra-Cabeça!
                  </div>
                )}

                <div className="card-top-meta">
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 900, opacity: 0.9 }}>STEAM+ • CARTA SORTEADA</div>
                    <span className="card-type-pill">
                      ⚡ {activeEvent.card.subtipo}
                    </span>
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
                  <p style={{ fontSize: '1.08rem', fontWeight: 800, lineHeight: 1.45, marginBottom: '0.6rem' }}>
                    “{activeEvent.card.texto}”
                  </p>
                  <div
                    style={{
                      fontSize: '0.86rem',
                      fontWeight: 800,
                      color: activeEvent.card.creditos > 0 ? '#15803d' : '#b91c1c'
                    }}
                  >
                    {activeEvent.card.creditos > 0
                      ? `✅ Sua cidade avançou! Você recebeu +${activeEvent.card.creditos} Créditos Verdes.`
                      : `⚠️ Impacto negativo! Você perdeu ${Math.abs(activeEvent.card.creditos)} Créditos Verdes.`}
                  </div>
                </div>
              </div>
            )}

            {/* Exibição da Carta de Ação (Quiz, Criatividade, Debate ou Ação Cidadã) */}
            {!isGameFinished && activeEvent?.type === 'acao' && (
              <div className="game-card-frame acao">
                {activeEvent.passedStart && (
                  <div style={{ background: '#facc15', color: '#0f172a', padding: '0.35rem 0.75rem', borderRadius: '10px', fontWeight: 900, fontSize: '0.82rem', marginBottom: '0.65rem' }}>
                    🧩 Você passou pelo INÍCIO e ganhou +1 peça do Quebra-Cabeça!
                  </div>
                )}

                <div className="card-top-meta">
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 900 }}>STEAM+ • CARTA DE AÇÃO</div>
                    <span className="card-type-pill">🌼 {activeEvent.card.categoria}</span>
                  </div>

                  <div className="card-credits-circle">
                    <span>+{activeEvent.card.creditos}</span>
                    <small style={{ fontSize: '0.55rem' }}>créditos</small>
                  </div>
                </div>

                <div className="card-inner-white">
                  <p style={{ fontSize: '1.02rem', fontWeight: 800, lineHeight: 1.42, marginBottom: '0.5rem' }}>
                    {activeEvent.card.pergunta}
                  </p>

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
                        disabled={activeEvent.answered}
                        onClick={() => handleAnswerActionCard(idx)}
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
                            <span>Mandou bem! Você ganhou +{activeEvent.card.creditos} Créditos Verdes!</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={18} color="#dc2626" />
                            <span>Resposta incorreta! Não recebeu os créditos desta carta.</span>
                          </>
                        )}
                      </div>
                      <p>{activeEvent.card.explicacao}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Evento de Casa Especial (Início, Descanso, Parque, Bike, Lixo, STEAM) */}
            {!isGameFinished && activeEvent?.type === 'space' && (
              <div className="game-card-frame progresso">
                {activeEvent.passedStart && (
                  <div style={{ background: '#facc15', color: '#0f172a', padding: '0.35rem 0.75rem', borderRadius: '10px', fontWeight: 900, fontSize: '0.82rem', marginBottom: '0.65rem' }}>
                    🧩 Você passou pelo INÍCIO e ganhou +1 peça do Quebra-Cabeça!
                  </div>
                )}
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.6rem' }}>{activeEvent.title}</h3>
                <div className="card-inner-white">
                  <p style={{ fontSize: '0.96rem', fontWeight: 700, lineHeight: 1.48 }}>
                    {activeEvent.message}
                  </p>
                </div>
              </div>
            )}

            {/* Quebra-Cabeça Cidades Inteligentes (3 Peças = 3 Voltas) */}
            <div className="puzzle-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 700, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Puzzle size={19} color="#facc15" />
                  Quebra-Cabeça Cidades Inteligentes
                </span>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#95d5b2' }}>
                  {puzzlePieces}/3 peças (1 por volta)
                </span>
              </div>

              <div className="puzzle-pieces-grid">
                {[1, 2, 3].map((pieceNum) => {
                  const unlocked = puzzlePieces >= pieceNum || isGameFinished;
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
                    Nenhum aluno do 8º A jogou ainda.
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
                          3/3 Peças • Concluído em {r.turns} rodadas
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
                    Nenhum aluno do 8º B jogou ainda.
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
                          3/3 Peças • Concluído em {r.turns} rodadas
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
