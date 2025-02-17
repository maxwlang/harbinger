import { EmbedBuilder } from 'discord.js'
import { createHash } from 'crypto'
import { FeedConfig } from '../types'

const webhook = process.env.DISCORD_WEBHOOK_FRIENDS
if (!webhook) throw new Error('DISCORD_WEBHOOK_FRIENDS is not set')

const feed: FeedConfig = {
    id: 'wired',
    feed: 'https://www.wired.com/feed/rss',
    webhook,
    interval: 0.5 * 60 * 60, // 30 minutes
    embedFactory: async ({ cheerio, hash }): Promise<EmbedBuilder> => {
        const publisherName = cheerio('rss > channel > title').text()
        const publisherDescription = cheerio(
            'rss > channel > description'
        ).text()
        const publisherLink = cheerio('rss > channel > link').text()
        // const publisherLogo = cheerio('rss > channel > image > url').text()

        // Just get first article
        const article = cheerio('rss > channel > item').first()
        const articleTitle = article.find('title').text()
        const articleDescription = article.find('description').text()
        const articleImage = article.find('media\\:thumbnail').attr('url')
        const articleUrl = article.find('link').text()
        const articleKeywords = article.find('media\\:keywords').text()

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
                iconURL:
                    'https://www.wired.com/verso/static/wired-us/assets/logo-header.svg'
            })
            .setFields([
                {
                    name: 'Keywords',
                    value: articleKeywords
                }
            ])
    },
    hashFactory: async ({ cheerio }): Promise<string> => {
        const article = cheerio('rss > channel > item').first()
        const articleTitle = article.find('title').text()
        const articleDescription = article.find('description').text()
        const articleImage = article.find('media\\:thumbnail').attr('url')
        const articleUrl = article.find('link').text()
        const articleKeywords = article.find('media\\:keywords').text()

        return createHash('md5')
            .update(
                `${articleTitle}${articleDescription}${articleImage}${articleUrl}${articleKeywords}`
            )
            .digest('hex')
    },
    ignoreFactory: async ({ cheerio }): Promise<boolean> => {
        const article = cheerio('rss > channel > item').first()
        const articleCategories = article
            .find('category')
            .map((_i, el) => cheerio(el).text())
            .get()

        // Only post articles that are in the "Politics" category
        return !articleCategories.includes('Politics')
    }
}

export default feed
