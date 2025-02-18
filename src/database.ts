import sqlite3, { Database } from 'sqlite3'
import fs from 'fs/promises'

export const setupDatabase = async (): Promise<Database> =>
    new Promise(resolve => {
        fs.mkdir('./data', { recursive: true }).catch(console.error)

        const db = new sqlite3.Database('./data/harbinger.db', err => {
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
