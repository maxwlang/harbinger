import { Database } from 'sqlite3'
import Feed from './Feed'
import repl from 'repl'

const startRepl = (feeds: Feed[], db: Database): void => {
    console.log('Welcome to Harbinger. Type .help for a list of commands.')
    const loop = repl.start({
        prompt: '> ',
        ignoreUndefined: true,
        breakEvalOnSigint: true // allow exiting with ctrl-C during evaluation
    })

    loop.defineCommand('stop-all', {
        help: 'Stop all feeds',
        action: async () => {
            for (const feed of feeds) {
                await feed.stop()
            }
        }
    })

    loop.defineCommand('stop', {
        help: 'Stop a feed',
        action: async (id: string) => {
            const feed = feeds.find(feed => feed.id === id)
            if (!feed) {
                console.error(`Feed "${id}" not found`)
                return
            }
            await feed.stop()
        }
    })

    loop.defineCommand('start', {
        help: 'Start a feed',
        action: async (id: string) => {
            const feed = feeds.find(feed => feed.id === id)
            if (!feed) {
                console.error(`Feed "${id}" not found`)
                return
            }
            await feed.monitor()
        }
    })

    loop.defineCommand('start-all', {
        help: 'Start all feeds',
        action: async () => {
            for (const feed of feeds) {
                await feed.monitor()
            }
        }
    })

    loop.defineCommand('add-feed', {
        help: 'Add a feed',
        action: async (id: string) => {
            try {
                const feedConfig = (await import(`./feeds/${id}.feed.js`))
                    .default
                const feed = new Feed(feedConfig)
                feeds.push(feed)
                console.log(`Added feed "${id}"`)
            } catch (e) {
                console.error(`Failed to add feed "${id}"`, e)
            }
        }
    })

    loop.defineCommand('remove-feed', {
        help: 'Remove a feed',
        action: async (id: string) => {
            const feed = feeds.find(feed => feed.id === id)
            if (!feed) {
                console.error(`Feed "${id}" not found`)
                return
            }
            await feed.stop()
            feeds.splice(feeds.indexOf(feed), 1)
        }
    })

    loop.defineCommand('list', {
        help: 'List all feeds',
        action: () => {
            console.log(feeds.map(feed => feed.id))
        }
    })

    loop.defineCommand('show-feed-states', {
        help: 'Show the feed states',
        action: () => {
            db.all('SELECT * FROM feed_states', (err, rows) => {
                if (err) {
                    console.error(err)
                    return
                }
                console.log(rows)
            })
        }
    })

    loop.defineCommand('clear-feed-states', {
        help: 'Clear the database',
        action: () => {
            db.run('DELETE FROM feed_states', err => {
                if (err) {
                    console.error(err)
                    return
                }
                console.log('Cleared database')
            })
        }
    })

    loop.defineCommand('exit', {
        help: 'Exit the repl',
        action: () => {
            process.exit(0)
        }
    })
}

export default startRepl
