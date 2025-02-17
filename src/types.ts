import { EmbedBuilder } from 'discord.js'
import { CheerioAPI } from 'cheerio'

export interface FeedConfig {
    /**
     * A unique ID for the feed. It can be any string.
     */
    id: string

    /**
     * If the feed is disabled
     */
    disabled?: boolean

    /**
     * The feed to check.
     */
    feed: string

    /**
     * The webhook to send the embed to.
     */
    webhook: string

    /**
     * How often to check the feed in seconds.
     */
    interval: number

    /**
     * Username of the posting user.
     * Defaults to the bot's username if not set.
     */
    username?: string

    /**
     * Avatar URL of the posting user.
     * Defaults to the bot's avatar if not set.
     */
    avatarURL?: string

    /**
     * A hash used to indicate content has changed.
     */
    // hash: string | null

    /**
     * A function that takes the content and cheerio object and returns a hash used to indicate content has changed.
     */
    hashFactory: ({
        content,
        cheerio
    }: {
        content: string
        cheerio: CheerioAPI
    }) => Promise<string>

    /**
     * A function that takes the content and cheerio object and returns an EmbedBuilder for webhooks.
     */
    embedFactory?: ({
        content,
        cheerio,
        hash,
        prevHash
    }: {
        content: string
        cheerio: CheerioAPI
        hash: string
        prevHash: string | null
    }) => Promise<EmbedBuilder | EmbedBuilder[]>

    /**
     * A function that takes the content and cheerio object and returns message content for non-embed webhooks.
     */
    messageFactory?: ({
        content,
        cheerio
    }: {
        content: string
        cheerio: CheerioAPI
    }) => Promise<string>

    /**
     * A function that takes the content and cheerio object and returns a boolean indicating whether to ignore the feed under certain conditions.
     */
    ignoreFactory?: ({
        content,
        cheerio,
        hash,
        prevHash
    }: {
        content: string
        cheerio: CheerioAPI
        hash: string
        prevHash: string | null
    }) => Promise<boolean>
}
