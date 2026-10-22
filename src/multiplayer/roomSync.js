import { Peer } from 'peerjs';

const PEER_PREFIX = 'tcc-cidades-inteligentes-v2-sala-';
const BC_PREFIX = 'tcc_cidades_bc_sala_';

/**
 * Cria um gerenciador de sala Multiplayer que funciona tanto:
 * 1) Entre computadores/celulares diferentes via WebRTC (PeerJS Cloud)
 * 2) Entre abas do mesmo computador via BroadcastChannel (instantâneo e funciona até offline)
 */
export class RoomConnectionManager {
  constructor({ role, roomCode, onMessage, onPeerStatusChange, onError }) {
    this.role = role; // 'host' | 'guest'
    this.roomCode = String(roomCode).trim().toUpperCase();
    this.onMessage = onMessage;
    this.onPeerStatusChange = onPeerStatusChange;
    this.onError = onError;

    this.peer = null;
    this.connections = new Map(); // peerId -> DataConnection (para o host)
    this.hostConn = null; // DataConnection (para o guest)
    this.bc = null;
    this.destroyed = false;

    this.initBroadcastChannel();
    this.initPeerJS();
  }

  initBroadcastChannel() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.bc = new BroadcastChannel(`${BC_PREFIX}${this.roomCode}`);
        this.bc.onmessage = (event) => {
          if (this.destroyed || !event.data) return;
          this.onMessage?.(event.data, 'local-tab');
        };
      } catch (err) {
        console.warn('BroadcastChannel indisponível:', err);
      }
    }
  }

  initPeerJS() {
    const targetPeerId = `${PEER_PREFIX}${this.roomCode}`;

    try {
      if (this.role === 'host') {
        this.peer = new Peer(targetPeerId, {
          debug: 1
        });

        this.peer.on('open', () => {
          if (this.destroyed) return;
          this.onPeerStatusChange?.('online');
        });

        this.peer.on('connection', (conn) => {
          if (this.destroyed) return;
          conn.on('open', () => {
            this.connections.set(conn.peer, conn);
            this.onPeerStatusChange?.('online', this.connections.size);
          });

          conn.on('data', (data) => {
            if (this.destroyed) return;
            this.onMessage?.(data, conn.peer);
          });

          conn.on('close', () => {
            this.connections.delete(conn.peer);
            this.onMessage?.({ type: 'PEER_DISCONNECTED', peerId: conn.peer }, conn.peer);
          });

          conn.on('error', () => {
            this.connections.delete(conn.peer);
          });
        });

        this.peer.on('error', (err) => {
          if (this.destroyed) return;
          if (err.type === 'unavailable-id') {
            this.onError?.('Este código de sala já está em uso. Tente criar outra sala.');
          } else {
            // Continua funcionando localmente via BroadcastChannel mesmo se a rede bloquear WebRTC
            this.onPeerStatusChange?.('local-only');
          }
        });
      } else {
        // Guest conecta ao Host
        this.peer = new Peer({
          debug: 1
        });

        this.peer.on('open', () => {
          if (this.destroyed) return;
          const conn = this.peer.connect(targetPeerId, { reliable: true });
          this.hostConn = conn;

          conn.on('open', () => {
            if (this.destroyed) return;
            this.onPeerStatusChange?.('connected');
          });

          conn.on('data', (data) => {
            if (this.destroyed) return;
            this.onMessage?.(data, 'host');
          });

          conn.on('close', () => {
            if (this.destroyed) return;
            this.onPeerStatusChange?.('disconnected');
          });

          conn.on('error', () => {
            if (this.destroyed) return;
            this.onPeerStatusChange?.('local-only');
          });
        });

        this.peer.on('error', (err) => {
          if (this.destroyed) return;
          if (err.type === 'peer-unavailable') {
            // Ainda pode encontrar via BroadcastChannel se estiver no mesmo PC
            this.onPeerStatusChange?.('searching-local');
          } else {
            this.onPeerStatusChange?.('local-only');
          }
        });
      }
    } catch (err) {
      console.warn('Erro ao iniciar PeerJS:', err);
      this.onPeerStatusChange?.('local-only');
    }
  }

  send(payload) {
    if (this.destroyed) return;

    // Envia via BroadcastChannel (para abas no mesmo PC)
    if (this.bc) {
      try {
        this.bc.postMessage(payload);
      } catch (e) {
        // ignore
      }
    }

    // Envia via PeerJS (para computadores diferentes)
    if (this.role === 'host') {
      this.connections.forEach((conn) => {
        if (conn && conn.open) {
          try {
            conn.send(payload);
          } catch (e) {
            // ignore
          }
        }
      });
    } else if (this.hostConn && this.hostConn.open) {
      try {
        this.hostConn.send(payload);
      } catch (e) {
        // ignore
      }
    }
  }

  destroy() {
    this.destroyed = true;
    if (this.bc) {
      try {
        this.bc.close();
      } catch (e) {
        // ignore
      }
      this.bc = null;
    }
    if (this.hostConn) {
      try {
        this.hostConn.close();
      } catch (e) {
        // ignore
      }
      this.hostConn = null;
    }
    this.connections.forEach((conn) => {
      try {
        conn.close();
      } catch (e) {
        // ignore
      }
    });
    this.connections.clear();
    if (this.peer) {
      try {
        this.peer.destroy();
      } catch (e) {
        // ignore
      }
      this.peer = null;
    }
  }
}
