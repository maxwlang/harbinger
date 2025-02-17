import { Database } from 'sqlite3'

export interface FeedRepository {
    getLastHash(feedId: string): Promise<string | null>
    saveHash(feedId: string, hash: string): Promise<void>
}

export class InMemoryFeedRepository implements FeedRepository {
    private store: Map<string, string> = new Map()

    async getLastHash(feedId: string): Promise<string | null> {
        return this.store.get(feedId) || null
    }

    async saveHash(feedId: string, hash: string): Promise<void> {
        this.store.set(feedId, hash)
    }
}

export class SQLiteFeedRepository implements FeedRepository {
    constructor(db: Database) {
        this.db = db
    }

    private db: Database

    async getLastHash(feedId: string): Promise<string | null> {
        return new Promise((resolve, reject) => {
            this.db.get<{ hash: string }>(
                'SELECT hash FROM feed_states WHERE feedId = ?',
                [feedId],
                (err, row) => {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(row ? row.hash : null)
                    }
                }
            )
        })
    }

    async saveHash(feedId: string, hash: string): Promise<void> {
        await this.db.run(
            `INSERT INTO feed_states (feedId, hash, last_updated)
       VALUES (?, ?, ?)
       ON CONFLICT(feedId) DO UPDATE SET hash=excluded.hash`,
            feedId,
            hash,
            Date.now()
        )
    }
}
