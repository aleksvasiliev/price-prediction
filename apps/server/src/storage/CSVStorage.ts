import * as fs from 'fs';
import * as path from 'path';
import * as lockfile from 'proper-lockfile';
import { PlayerRecord, SessionRecord, RoundRecord } from './shared/index';

export class CSVStorage {
  private dataDir: string;
  private playersFile: string;
  private sessionsFile: string;
  private roundsFile: string;

  constructor(dataDir: string = 'data') {
    this.dataDir = path.resolve(dataDir);
    this.playersFile = path.join(this.dataDir, 'players.csv');
    this.sessionsFile = path.join(this.dataDir, 'sessions.csv');
    this.roundsFile = path.join(this.dataDir, 'rounds.csv');

    this.ensureDirectoryExists();
    this.initializeFiles();
  }

  private ensureDirectoryExists() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
      console.log(`Created data directory: ${this.dataDir}`);
    }
  }

  private initializeFiles() {
    // Initialize players.csv with header
    if (!fs.existsSync(this.playersFile)) {
      fs.writeFileSync(this.playersFile, 'wallet,points,telegram_handle\n');
      console.log('Initialized players.csv');
    }

    // Initialize sessions.csv with header
    if (!fs.existsSync(this.sessionsFile)) {
      fs.writeFileSync(this.sessionsFile, 'session_id,temp_points,created_at,last_seen,is_guest\n');
      console.log('Initialized sessions.csv');
    }

    // Initialize rounds.csv with header
    if (!fs.existsSync(this.roundsFile)) {
      fs.writeFileSync(this.roundsFile, 'timestamp,round_id,identity,choice,p0,p1,result,latency_ms\n');
      console.log('Initialized rounds.csv');
    }
  }

  private async withFileLock<T>(filePath: string, operation: () => Promise<T>): Promise<T> {
    const lockPath = `${filePath}.lock`;
    
    try {
      await lockfile.lock(filePath, {
        lockfilePath: lockPath,
        retries: {
          retries: 5,
          factor: 1.5,
          minTimeout: 100,
          maxTimeout: 1000,
        },
      });

      const result = await operation();
      
      await lockfile.unlock(filePath, { lockfilePath: lockPath });
      return result;
    } catch (error) {
      try {
        await lockfile.unlock(filePath, { lockfilePath: lockPath });
      } catch (unlockError) {
        console.error('Error unlocking file:', unlockError);
      }
      throw error;
    }
  }

  private escapeCSV(value: string | number | boolean): string {
    if (typeof value === 'string') {
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }
    return String(value);
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i += 2;
        } else {
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }

    result.push(current);
    return result;
  }

  // Player operations
  async savePlayer(player: PlayerRecord): Promise<void> {
    await this.withFileLock(this.playersFile, async () => {
      const line = `${this.escapeCSV(player.wallet)},${this.escapeCSV(player.points)},${this.escapeCSV(player.telegramHandle || '')}\n`;
      fs.appendFileSync(this.playersFile, line);
    });
  }

  async getPlayer(wallet: string): Promise<PlayerRecord | null> {
    return this.withFileLock(this.playersFile, async () => {
      const content = fs.readFileSync(this.playersFile, 'utf-8');
      const lines = content.split('\n').slice(1); // Skip header

      for (const line of lines) {
        if (line.trim()) {
          const [csvWallet, csvPoints, csvTelegram] = this.parseCSVLine(line);
          if (csvWallet === wallet) {
            return {
              wallet: csvWallet,
              points: parseInt(csvPoints) || 0,
              telegramHandle: csvTelegram || undefined,
            };
          }
        }
      }

      return null;
    });
  }

  async updatePlayerPoints(wallet: string, points: number): Promise<void> {
    await this.withFileLock(this.playersFile, async () => {
      const content = fs.readFileSync(this.playersFile, 'utf-8');
      const lines = content.split('\n');
      const header = lines[0];
      const dataLines = lines.slice(1);

      let found = false;
      const updatedLines = dataLines.map(line => {
        if (line.trim()) {
          const [csvWallet, csvPoints, csvTelegram] = this.parseCSVLine(line);
          if (csvWallet === wallet) {
            found = true;
            return `${this.escapeCSV(wallet)},${this.escapeCSV(points)},${this.escapeCSV(csvTelegram || '')}`;
          }
        }
        return line;
      });

      if (!found) {
        // Add new player
        updatedLines.push(`${this.escapeCSV(wallet)},${this.escapeCSV(points)},`);
      }

      const newContent = [header, ...updatedLines.filter(line => line.trim())].join('\n') + '\n';
      fs.writeFileSync(this.playersFile, newContent);
    });
  }

  async getTopPlayers(limit: number = 10): Promise<PlayerRecord[]> {
    return this.withFileLock(this.playersFile, async () => {
      const content = fs.readFileSync(this.playersFile, 'utf-8');
      const lines = content.split('\n').slice(1); // Skip header

      const players: PlayerRecord[] = [];

      for (const line of lines) {
        if (line.trim()) {
          const [wallet, points, telegram] = this.parseCSVLine(line);
          players.push({
            wallet,
            points: parseInt(points) || 0,
            telegramHandle: telegram || undefined,
          });
        }
      }

      return players
        .sort((a, b) => b.points - a.points)
        .slice(0, limit);
    });
  }

  // Session operations
  async saveSession(session: SessionRecord): Promise<void> {
    await this.withFileLock(this.sessionsFile, async () => {
      const line = `${this.escapeCSV(session.sessionId)},${this.escapeCSV(session.tempPoints)},${this.escapeCSV(session.createdAt)},${this.escapeCSV(session.lastSeen)},${this.escapeCSV(session.isGuest)}\n`;
      fs.appendFileSync(this.sessionsFile, line);
    });
  }

  // Round operations
  async saveRound(round: RoundRecord): Promise<void> {
    await this.withFileLock(this.roundsFile, async () => {
      const line = `${this.escapeCSV(round.timestamp)},${this.escapeCSV(round.roundId)},${this.escapeCSV(round.identity)},${this.escapeCSV(round.choice)},${this.escapeCSV(round.p0)},${this.escapeCSV(round.p1)},${this.escapeCSV(round.result)},${this.escapeCSV(round.latencyMs)}\n`;
      fs.appendFileSync(this.roundsFile, line);
    });
  }

  // Maintenance operations
  async compactFiles(): Promise<void> {
    console.log('Starting CSV file compaction...');

    // For this simple implementation, we'll just clean up old sessions
    await this.withFileLock(this.sessionsFile, async () => {
      const content = fs.readFileSync(this.sessionsFile, 'utf-8');
      const lines = content.split('\n');
      const header = lines[0];
      const dataLines = lines.slice(1);

      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      const validLines = dataLines.filter(line => {
        if (!line.trim()) return false;

        const [, , , lastSeen] = this.parseCSVLine(line);
        const lastSeenTimestamp = parseInt(lastSeen) || 0;
        return (now - lastSeenTimestamp) < maxAge;
      });

      const newContent = [header, ...validLines].join('\n') + '\n';
      fs.writeFileSync(this.sessionsFile, newContent);
    });

    console.log('CSV file compaction completed');
  }
}
