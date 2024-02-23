import { addExif } from '../lib/sticker.js'

let handler = async (m, { conn, text, args }) => {
 if (!m.quoted || !m.quoted.mimetype || !/webp/.test(m.quoted.mimetype)) throw 'Respond to a sticker'
 let stiker = false
 let stick = args.join(" ").split("|");
 let packname = stick[0] || '';
 let author = stick[1] || '';
 try {
 let img = await m.quoted.download()
 if (!img) throw 'Failed to download the sticker'
 stiker = await addExif(img, packname, author)
 } catch (e) {
 console.error(e)
 if (Buffer.isBuffer(e)) stiker = e
 } finally {
 if (stiker) conn.sendFile(m.chat, stiker, 'wm.webp', '', m, null, null)
 else throw 'Conversion failed'
 }
}

handler.help = ['take <name>|<author>']
handler.tags = ['sticker']
handler.command = ['swm', 'wm'] 

export default handler
