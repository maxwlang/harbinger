import { EmbedBuilder, WebhookClient } from 'discord.js'
import { FeedConfig } from './types'
import { CheerioAPI } from 'cheerio'
import * as cheerioParser from 'cheerio'

class Feed {
    constructor(feedConfig: FeedConfig) {
        this.id = feedConfig.id
        this.feed = feedConfig.feed
        this.webhook = feedConfig.webhook
        this.interval = feedConfig.interval * 1000 || 60_000
        this.username = feedConfig.username || 'Harbinger'
        this.avatarURL =
            feedConfig.avatarURL || 'https://i.imgur.com/AfFp7pu.png'
        this._embedFactory = feedConfig.embedFactory
        this._hashFactory = feedConfig.hashFactory
        this._messageFactory = feedConfig.messageFactory
        this._ignoreFactory = feedConfig.ignoreFactory

        this.webhookClient = new WebhookClient({ url: this.webhook })
    }

    public id: string
    public feed: string
    public webhook: string
    public interval: number
    public username: string
    public avatarURL: string
    private hash: string | null = null
    private _embedFactory: FeedConfig['embedFactory']
    private _hashFactory: FeedConfig['hashFactory']
    private _messageFactory: FeedConfig['messageFactory']
    private _ignoreFactory: FeedConfig['ignoreFactory']
    private webhookClient: WebhookClient
    private timer: NodeJS.Timeout | null = null

    public async process(): Promise<void> {
        try {
            // Get content and hash
            console.log(`[Feed][${this.id}] Checking feed`)
            const response = await fetch(this.feed)
            const content = await response.text()
            console.log(`[Feed][${this.id}] Feed fetched`)

            const cheerio = cheerioParser.load(content, { xml: true })
            const hash = await this.hashFactory({ content, cheerio })
            console.log(
                `[Feed][${this.id}] Hash ${hash}, previously ${this.hash}`
            )

            if (hash === this.hash) return
            const prevHash = this.hash
            this.hash = hash

            // Check if we should ignore the feed
            const ignore = await this.ignoreFactory({
                content,
                cheerio,
                hash,
                prevHash
            })
            if (ignore) {
                console.log(`[Feed][${this.id}] Feed matches ignore criteria`)
                return
            }

            // Build embed and messages, then send webhook
            const embed = await this.embedFactory({
                content,
                cheerio,
                hash,
                prevHash
            })

            const message = await this.messageFactory({
                content,
                cheerio,
                hash,
                prevHash
            })

            await this.sendWebhook(message, embed)
        } catch (error) {
            console.error(`[Feed][${this.id}] Error processing feed: ${error}`)
            return
        }
    }

    /**
     * A function that takes the content and cheerio object and returns a hash used to indicate content has changed.
     * Behavior is defined by the user in the config.
     */
    private async hashFactory(params: {
        content: string
        cheerio: CheerioAPI
    }): Promise<string> {
        return this._hashFactory(params)
    }

    /**
     * A function that takes the content and cheerio object and returns an EmbedBuilder for webhooks.
     * Behavior is defined by the user in the config.
     */
    private async embedFactory(params: {
        content: string
        cheerio: CheerioAPI
        hash: string
        prevHash: string | null
    }): Promise<EmbedBuilder | EmbedBuilder[] | undefined> {
        return this._embedFactory?.(params)
    }

    /**
     * A function that takes the content and cheerio object and returns message content for non-embed webhooks.
     * Behavior is defined by the user in the config.
     */
    private async messageFactory(params: {
        content: string
        cheerio: CheerioAPI
        hash: string
        prevHash: string | null
    }): Promise<string | undefined> {
        return this._messageFactory?.(params)
    }

    /**
     * A function that takes the content and cheerio object and returns a boolean indicating whether to ignore the feed under certain conditions.
     * Behavior is defined by the user in the config.
     */
    private async ignoreFactory(params: {
        content: string
        cheerio: CheerioAPI
        hash: string
        prevHash: string | null
    }): Promise<boolean | undefined> {
        return this._ignoreFactory?.(params)
    }

    /**
     * Send a webhook with the given embed.
     * @param content The message content to send.
     * @param embed The embed to send.
     */
    private async sendWebhook(
        message?: string,
        embeds?: EmbedBuilder | EmbedBuilder[]
    ): Promise<void> {
        console.log(`[Feed][${this.id}] Sending webhook`)

        if (
            !message &&
            (!embeds || (Array.isArray(embeds) && embeds.length === 0))
        ) {
            console.error(
                `[Feed][${this.id}] No message or embed to send to webhook`
            )
            return
        }

        await this.webhookClient.send({
            username: this.username,
            avatarURL: this.avatarURL,
            content: message,
            embeds: Array.isArray(embeds) ? embeds : embeds ? [embeds] : []
        })
    }

    /**
     * Start monitoring the feed.
     * @returns void
     */
    public async monitor(): Promise<void> {
        if (this.timer) return

        console.log(`[Feed][${this.id}] Starting monitor`)
        await this.process()
        this.timer = setInterval(
            async () => await this.process(),
            this.interval
        )
    }

    /**
     * Stop monitoring the feed.
     */
    public async stop(): Promise<void> {
        if (!this.timer) return
        clearInterval(this.timer)
        this.timer = null
        console.log(`[Feed][${this.id}] Stopped monitoring`)
    }
}

export default Feed
