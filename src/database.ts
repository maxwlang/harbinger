import sqlite3, { Database } from 'sqlite3'

export const setupDatabase = async (): Promise<Database> =>
    new Promise(resolve => {
        const db = new sqlite3.Database('./harbinger.db', err => {
            if (err) {
                console.error('[Database] Error opening database:', err.message)
                return
            }
            console.log('[Database] Connected to SQLite database.')
        })

        db.run(
            'CREATE TABLE IF NOT EXISTS feed_states (feedId TEXT PRIMARY KEY, hash TEXT, last_updated INTEGER)',
            err => {
                if (err) {
                    console.error(
                        '[Database] Error creating feeds table:',
                        err.message
                    )
                    return
                }
                console.log('[Database] Feeds table created or already exists.')
                resolve(db)
            }
        )
    })
