import { nanoid } from 'nanoid';
import { PlayerSession } from '@predictor/shared';

export interface Session {
  id: string;
  tempPoints: number;
  isGuest: boolean;
  wallet?: string;
  connectedAt: number;
  lastSeen: number;
  roundsPlayed: number;
}

export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private walletToSession: Map<string, string> = new Map();

  public createGuestSession(): Session {
    const sessionId = nanoid();
    const session: Session = {
      id: sessionId,
      tempPoints: 0,
      isGuest: true,
      connectedAt: Date.now(),
      lastSeen: Date.now(),
      roundsPlayed: 0,
    };

    this.sessions.set(sessionId, session);
    console.log(`Guest session created: ${sessionId}`);
    return session;
  }

  public connectWallet(sessionId: string, wallet: string): Session | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    // Check if wallet is already connected to another session
    const existingSessionId = this.walletToSession.get(wallet);
    if (existingSessionId && existingSessionId !== sessionId) {
      // Merge guest points with existing wallet session
      const existingSession = this.sessions.get(existingSessionId);
      if (existingSession) {
        existingSession.tempPoints += session.tempPoints;
        existingSession.lastSeen = Date.now();
        
        // Remove the guest session
        this.sessions.delete(sessionId);
        
        console.log(`Merged guest session ${sessionId} with wallet session ${existingSessionId}`);
        return existingSession;
      }
    }

    // Convert guest session to wallet session
    session.wallet = wallet;
    session.isGuest = false;
    session.lastSeen = Date.now();
    
    this.walletToSession.set(wallet, sessionId);
    
    console.log(`Wallet connected to session ${sessionId}: ${wallet}`);
    return session;
  }

  public getSession(sessionId: string): Session | null {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastSeen = Date.now();
    }
    return session || null;
  }

  public getSessionByWallet(wallet: string): Session | null {
    const sessionId = this.walletToSession.get(wallet);
    return sessionId ? this.getSession(sessionId) : null;
  }

  public addPoints(sessionId: string, points: number): number {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return 0;
    }

    session.tempPoints += points;
    session.lastSeen = Date.now();
    
    if (points > 0) {
      session.roundsPlayed += 1;
    }

    return session.tempPoints;
  }

  public incrementRoundsPlayed(sessionId: string): number {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return 0;
    }

    session.roundsPlayed += 1;
    return session.roundsPlayed;
  }

  public getPoints(sessionId: string): number {
    const session = this.sessions.get(sessionId);
    return session ? session.tempPoints : 0;
  }

  public shouldAskTelegram(sessionId: string): 'none' | '10_rounds' | 'exit_game' {
    const session = this.sessions.get(sessionId);
    if (!session || session.isGuest) {
      return 'none';
    }

    // Ask for telegram after 10 rounds
    if (session.roundsPlayed >= 10) {
      return '10_rounds';
    }

    return 'none';
  }

  public getAllSessions(): Session[] {
    return Array.from(this.sessions.values());
  }

  public cleanupOldSessions(): number {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    let cleaned = 0;

    for (const [sessionId, session] of this.sessions) {
      if (now - session.lastSeen > maxAge) {
        this.sessions.delete(sessionId);
        if (session.wallet) {
          this.walletToSession.delete(session.wallet);
        }
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`Cleaned up ${cleaned} old sessions`);
    }

    return cleaned;
  }
}
