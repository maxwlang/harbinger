import { EmbedBuilder } from 'discord.js'
import { createHash } from 'crypto'
import { FeedConfig } from '../types'

const webhook = process.env.DISCORD_WEBHOOK_FRIENDS
if (!webhook) throw new Error('DISCORD_WEBHOOK_FRIENDS is not set')

const feed: FeedConfig = {
    id: 'the-handbasket',
    feed: 'https://rss.beehiiv.com/feeds/40ZQ7CSldT.xml',
    webhook,
    interval: 1 * 60 * 60, // 1 hour
    embedFactory: async ({ cheerio, hash }): Promise<EmbedBuilder> => {
        const publisherName = cheerio('rss > channel > title').text()
        const publisherDescription = cheerio(
            'rss > channel > description'
        ).text()
        const publisherLink = cheerio('rss > channel > link').text()
        const publisherLogo = cheerio('rss > channel > image > url').text()

        // Just get first article
        const article = cheerio('rss > channel > item').first()
        const articleTitle = article.find('title').text()
        const articleDescription = article.find('description').text()
        const articleImage = article.find('enclosure').attr('url')
        const articleUrl = article.find('link').text()

        return new EmbedBuilder()
            .setTitle(articleTitle)
            .setDescription(articleDescription)
            .setURL(articleUrl)
            .setImage(articleImage || null)
            .setColor('#e7e7e7')
            .setTimestamp()
            .setFooter({ text: `${publisherDescription} | ${hash}` })
            .setAuthor({
                name: publisherName,
                url: publisherLink,
                iconURL: publisherLogo
            })
    },
    hashFactory: async ({ cheerio }): Promise<string> => {
        const title = cheerio('rss > channel > title').text()
        const description = cheerio('rss > channel > description').text()
        const weekTitle = cheerio('rss > channel > item > title').text()
        const billsText = cheerio('rss > channel > item > description').text()

        return createHash('md5')
            .update(`${title}${description}${weekTitle}${billsText}`)
            .digest('hex')
    }
}

export default feed
