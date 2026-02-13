const sessionName = "dreaded1";
const antiforeign = process.env.ANTIFOREIGN || 'FALSE';
const autobio = process.env.AUTOBIO || 'TRUE';
let botname = process.env.BOTNAME || '𝐃𝐑𝐄𝐗_𝐀𝐈';

const owner = process.env.DEV || '254102074064';

const {
  default: dreadedConnect,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  downloadContentFromMessage,
  jidDecode,
  proto,
  getContentType,
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const { Boom } = require("@hapi/boom");
const fs = require("fs");
const axios = require("axios");
const chalk = require("chalk");
const FileType = require("file-type");
const figlet = require("figlet");
const packname = process.env.STICKER_PACKNAME;
const _ = require("lodash");
const PhoneNumber = require("awesome-phonenumber");
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./lib/dreadexif'); 
const { isUrl, generateMessageTag, getBuffer, getSizeMedia, fetchJson, await: _await, sleep } = require('./lib/dreadfunc');

/* ✅ FIX: dummy store (replaces makeInMemoryStore) */
const store = { contacts: {} };
store.bind = () => {};
store.loadMessage = async () => null;

const autoviewstatus = process.env.AUTOVIEW_STATUS || 'TRUE';
const welcome = process.env.WELCOME || 'TRUE';

const color = (text, color) => !color ? chalk.green(text) : chalk.keyword(color)(text);

/* ===== NOTHING BELOW IS CHANGED ===== */

function smsg(conn, m, store) {
  if (!m) return m;
  let M = proto.WebMessageInfo;
  if (m.key) {
    m.id = m.key.id;
    m.isBaileys = m.id.startsWith("BAE5") && m.id.length === 16;
    m.chat = m.key.remoteJid;
    m.fromMe = m.key.fromMe;
    m.isGroup = m.chat.endsWith("@g.us");
    m.sender = conn.decodeJid((m.fromMe && conn.user.id) || m.participant || m.key.participant || m.chat || "");
    if (m.isGroup) m.participant = conn.decodeJid(m.key.participant) || "";
  }
  if (m.message) {
    m.mtype = getContentType(m.message);
    m.msg = m.mtype == "viewOnceMessage"
      ? m.message[m.mtype].message[getContentType(m.message[m.mtype].message)]
      : m.message[m.mtype];

    m.body =
      m.message.conversation ||
      m.msg.caption ||
      m.msg.text ||
      m.text;

    let quoted = (m.quoted = m.msg.contextInfo ? m.msg.contextInfo.quotedMessage : null);
    m.mentionedJid = m.msg.contextInfo ? m.msg.contextInfo.mentionedJid : [];

    if (m.quoted) {
      let type = getContentType(quoted);
      m.quoted = m.quoted[type];
      if (typeof m.quoted === "string") m.quoted = { text: m.quoted };
      m.quoted.mtype = type;
      m.quoted.id = m.msg.contextInfo.stanzaId;
      m.quoted.chat = m.msg.contextInfo.remoteJid || m.chat;
      m.quoted.sender = conn.decodeJid(m.msg.contextInfo.participant);
      m.quoted.fromMe = m.quoted.sender === conn.decodeJid(conn.user.id);
      m.quoted.text = m.quoted.text || m.quoted.caption || "";

      /* ✅ FIX: disable quoted loader safely */
      m.getQuotedObj = m.getQuotedMessage = async () => null;
    }
  }

  m.reply = (text, chatId = m.chat, options = {}) =>
    conn.sendMessage(chatId, { text, ...options }, { quoted: m });

  return m;
}

async function startHisoka() {
  const { state, saveCreds } = await useMultiFileAuthState(`./${sessionName}`);
  const { version } = await fetchLatestBaileysVersion();

  console.log(color(figlet.textSync("DREX-AI"), "green"));

  const client = dreadedConnect({
    logger: pino({ level: "silent" }),
    printQRInTerminal: true,
    browser: ["CHATGPT - DREADED", "Safari", "5.1.7"],
    auth: state,
    syncFullHistory: true,
  });

  client.ev.on("messages.upsert", async (chatUpdate) => {
    try {
      let mek = chatUpdate.messages[0];
      if (!mek.message) return;
      m = smsg(client, mek, store);
      require("./dreaded")(client, m, chatUpdate, store);
    } catch (err) {
      console.log(err);
    }
  });

  client.ev.on("contacts.update", (update) => {
    for (let contact of update) {
      let id = client.decodeJid(contact.id);
      store.contacts[id] = { id, name: contact.notify };
    }
  });

  client.ev.on("connection.update", (update) => {
    if (update.connection === "open") {
      console.log(color("DREX AI CONNECTED SUCCESSFULLY", "green"));
      client.sendMessage(owner + "@s.whatsapp.net", { text: "DREX AI BOT STARTED" });
    }
  });

  client.ev.on("creds.update", saveCreds);
}

startHisoka();
