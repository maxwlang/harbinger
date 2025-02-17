import fs from 'fs/promises'
import Feed from './Feed'
import { FeedConfig } from './types'
import { setupDatabase } from './database'
import startRepl from './repl'

const getFeedConfigs = async (): Promise<FeedConfig[]> => {
    const disabledFeeds = process.env.DISABLED_FEEDS
        ? process.env.DISABLED_FEEDS.split(',')
        : []

    const files = await fs.readdir('./dist/feeds')
    const feedConfigs: FeedConfig[] = []
    for (const file of files) {
        if (!file.endsWith('.feed.js')) continue
        try {
            const feedConfig: FeedConfig = (await import(`./feeds/${file}`))
                .default
            if (!feedConfig) continue

            if (disabledFeeds.includes(feedConfig.id)) {
                console.log(
                    `[Loader][${feedConfig.id}] Feed is disabled. Skipping.`
                )
                continue
            }

            if (!feedConfig.id) {
                console.error(
                    `[Loader][${feedConfig.id}] Feed "${file}" is missing an id. Skipping.`
                )
                continue
            }

            if (feedConfigs.find(feed => feed.id === feedConfig.id)) {
                console.error(
                    `[Loader][${feedConfig.id}] Duplicate feed id. Skipping.`
                )
                continue
            }

            feedConfigs.push(feedConfig)
        } catch (e) {
            console.error(`[Loader] Failed to load feed ${file}`, e)
        }
    }
    return feedConfigs
}

const initializeFeeds = async (feedConfigs: FeedConfig[]): Promise<Feed[]> => {
    const feeds: Feed[] = []
    for (const feedConfig of feedConfigs) {
        const feed = new Feed(feedConfig)
        await feed.monitor()
        feeds.push(feed)
    }
    return feeds
}

;(async (): Promise<void> => {
    const db = await setupDatabase()
    const feedConfigs = await getFeedConfigs()
    const feeds = await initializeFeeds(feedConfigs)

    await startRepl(feeds, db)
})()
