import { EmbedBuilder } from 'discord.js'
import { createHash } from 'crypto'
import * as cheerioParser from 'cheerio'
import { Cheerio } from 'cheerio'
import { FeedConfig } from '../types'
import { Element } from 'domhandler'

const webhook = process.env.DISCORD_WEBHOOK_FRIENDS
if (!webhook) throw new Error('DISCORD_WEBHOOK_FRIENDS is not set')

const feed: FeedConfig = {
    id: 'most-viewed-bills',
    feed: 'https://www.congress.gov/rss/most-viewed-bills.xml',
    webhook,
    interval: 2 * 60 * 60, // 2 hours
    embedFactory: async ({ cheerio, hash }): Promise<EmbedBuilder> => {
        const title = cheerio('rss > channel > title').text()
        const weekTitle = cheerio('rss > channel > item > title').text()
        const description = cheerio('rss > channel > description').text()
        const billsList = cheerio('rss > channel > item > description').text()
        const billsParser = cheerioParser.load(billsList, { xml: true })
        const bills = billsParser('ol')
            .find('li')
            .map((_i, el) => formatBill(billsParser(el)))
            .get()

        return new EmbedBuilder()
            .setTitle(weekTitle)
            .setDescription(`${description}\n\n${bills.join('\n')}`)
            .setURL('https://www.congress.gov/most-viewed-bills')
            .setColor('#e7e7e7')
            .setTimestamp()
            .setFooter({ text: hash })
            .setAuthor({
                name: `Congress.gov - ${title}`,
                url: 'https://www.congress.gov/most-viewed-bills',
                iconURL:
                    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Seal_of_the_United_States_Congress.svg/1200px-Seal_of_the_United_States_Congress.svg.png'
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

const formatBill = (cheerio: Cheerio<Element>): string => {
    const link = cheerio.find('a').attr('href')
    const text = cheerio.text()
    return `- [${text}](${link})`
}

export default feed
