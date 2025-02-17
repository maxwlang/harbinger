import { EmbedBuilder } from 'discord.js'
import { createHash } from 'crypto'
import { Cheerio } from 'cheerio'
import { FeedConfig } from '../types'
import { Element } from 'domhandler'

const currentCongress = process.env.CURRENT_CONGRESS
const webhook = process.env.DISCORD_WEBHOOK_FRIENDS
if (!currentCongress) throw new Error('CURRENT_CONGRESS is not set')
if (!webhook) throw new Error('DISCORD_WEBHOOK_FRIENDS is not set')

const feed: FeedConfig = {
    id: 'senate-floor-today',
    feed: 'https://www.congress.gov/rss/senate-floor-today.xml',
    webhook,
    interval: 2 * 60 * 60, // 2 hours
    embedFactory: async ({ cheerio, hash }): Promise<EmbedBuilder> => {
        const title = cheerio('rss > channel > title').text()
        const description = cheerio('rss > channel > description').text()
        const bills = cheerio('rss > channel')
            .find('item')
            .map((_i, el) => formatBill(cheerio(el)))
            .get()

        return new EmbedBuilder()
            .setTitle(
                `${title} - ${new Date().toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                })}`
            )
            .setDescription(
                `${description}\n\n${bills.join(
                    '\n'
                )}\n\n-# *: Entries marked \"New Bill\" may not link correctly due to limitations with [how congress.gov operates](https://www.congress.gov/help/faq#legislationnew). We will make our best attempt to provide a valid link, but you may need to check new bills the day after they have appeared or google them yourself.`
            )
            .setURL('https://www.congress.gov/most-viewed-bills')
            .setColor('#e7e7e7')
            .setTimestamp()
            .setFooter({ text: hash })
            .setAuthor({
                name: `Congress.gov - ${title}`,
                url: 'https://www.congress.gov/most-viewed-bills',
                iconURL:
                    'https://upload.wikimedia.org/wikipedia/commons/f/f0/Seal_of_the_United_States_Senate.svg'
            })
    },
    hashFactory: async ({ cheerio }): Promise<string> => {
        const title = cheerio('rss > channel > title').text()
        const description = cheerio('rss > channel > description').text()
        const bills = cheerio('rss > channel')
            .find('item')
            .map((_i, el) => formatBill(cheerio(el)))
            .get()

        return createHash('md5')
            .update(`${title}${description}${bills}`)
            .digest('hex')
    },
    ignoreFactory: async ({ cheerio }): Promise<boolean> => {
        const items = cheerio('rss > channel').find('item').length
        return items === 0
    }
}

const formatBill = (cheerio: Cheerio<Element>): string => {
    const bill = cheerio.find('title').text()
    const name = cheerio.find('description').text()
    const link = cheerio.find('link').text()

    const billNumber = bill.split('.').reverse()[0]
    const isNewBill =
        link === 'https://www.congress.gov/help/faq#legislationnew' ||
        !link.startsWith('https://www.congress.gov/bill/')

    const billLink = isNewBill
        ? `https://www.congress.gov/bill/${currentCongress}-congress/senate-bill/${billNumber}`
        : link

    return `- [${bill} - ${name}](${billLink})${
        isNewBill ? '  [New Bill*]' : ''
    }`
}

export default feed
