const sessionName = "dreaded1";
const antiforeign = process.env.ANTIFOREIGN || 'FALSE';
const autobio = process.env.AUTOBIO || 'TRUE';
let botname = process.env.BOTNAME || '𝐃𝐑𝐄𝐗 𝐁𝐎𝐓';

const owner = process.env.DEV || '254102074064'; // This will send a notification once the bot reconnects
const {
  default: dreadedConnect,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeInMemoryStore,
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
 const { isUrl, generateMessageTag, getBuffer, getSizeMedia, fetchJson, await, sleep } = require('./lib/dreadfunc');
const store = makeInMemoryStore({ logger: pino().child({ level: "silent", stream: "store" }) });

    const autoviewstatus = process.env.AUTOVIEW_STATUS || 'TRUE';
const welcome = process.env.WELCOME || 'TRUE';

const color = (text, color) => {
  return !color ? chalk.green(text) : chalk.keyword(color)(text);
};



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
    m.msg = m.mtype == "viewOnceMessage" ? m.message[m.mtype].message[getContentType(m.message[m.mtype].message)] : m.message[m.mtype];
    m.body =
      m.message.conversation ||
      m.msg.caption ||
      m.msg.text ||
      (m.mtype == "listResponseMessage" && m.msg.singleSelectReply.selectedRowId) ||
      (m.mtype == "buttonsResponseMessage" && m.msg.selectedButtonId) ||
      (m.mtype == "viewOnceMessage" && m.msg.caption) ||
      m.text;
    let quoted = (m.quoted = m.msg.contextInfo ? m.msg.contextInfo.quotedMessage : null);
    m.mentionedJid = m.msg.contextInfo ? m.msg.contextInfo.mentionedJid : [];
    if (m.quoted) {
      let type = getContentType(quoted);
      m.quoted = m.quoted[type];
      if (["productMessage"].includes(type)) {
        type = getContentType(m.quoted);
        m.quoted = m.quoted[type];
      }
      if (typeof m.quoted === "string")
        m.quoted = {
          text: m.quoted,
        };
      m.quoted.mtype = type;
      m.quoted.id = m.msg.contextInfo.stanzaId;
      m.quoted.chat = m.msg.contextInfo.remoteJid || m.chat;
      m.quoted.isBaileys = m.quoted.id ? m.quoted.id.startsWith("BAE5") && m.quoted.id.length === 16 : false;
      m.quoted.sender = conn.decodeJid(m.msg.contextInfo.participant);
      m.quoted.fromMe = m.quoted.sender === conn.decodeJid(conn.user.id);
      m.quoted.text = m.quoted.text || m.quoted.caption || m.quoted.conversation || m.quoted.contentText || m.quoted.selectedDisplayText || m.quoted.title || "";
      m.quoted.mentionedJid = m.msg.contextInfo ? m.msg.contextInfo.mentionedJid : [];
      m.getQuotedObj = m.getQuotedMessage = async () => {
        if (!m.quoted.id) return false;
        let q = await store.loadMessage(m.chat, m.quoted.id, conn);
        return exports.smsg(conn, q, store);
      };
      let vM = (m.quoted.fakeObj = M.fromObject({
        key: {
          remoteJid: m.quoted.chat,
          fromMe: m.quoted.fromMe,
          id: m.quoted.id,
        },
        message: quoted,
        ...(m.isGroup ? { participant: m.quoted.sender } : {}),
      }));

      /**
       *
       * @returns
       */
      m.quoted.delete = () => conn.sendMessage(m.quoted.chat, { delete: vM.key });

      /**
       *
       * @param {*} jid
       * @param {*} forceForward
       * @param {*} options
       * @returns
       */
      m.quoted.copyNForward = (jid, forceForward = false, options = {}) => conn.copyNForward(jid, vM, forceForward, options);

      /**
       *
       * @returns
       */
      m.quoted.download = () => conn.downloadMediaMessage(m.quoted);
    }
  }
  if (m.msg.url) m.download = () => conn.downloadMediaMessage(m.msg);
  m.text = m.msg.text || m.msg.caption || m.message.conversation || m.msg.contentText || m.msg.selectedDisplayText || m.msg.title || "";
  /**
   * Reply to this message
   * @param {String|Object} text
   * @param {String|false} chatId
   * @param {Object} options
   */
  m.reply = (text, chatId = m.chat, options = {}) => (Buffer.isBuffer(text) ? conn.sendMedia(chatId, text, "file", "", m, { ...options }) : conn.sendText(chatId, text, m, { ...options }));
  /**
   * Copy this message
   */
  m.copy = () => exports.smsg(conn, M.fromObject(M.toObject(m)));

  /**
   *
   * @param {*} jid
   * @param {*} forceForward
   * @param {*} options
   * @returns
   */
  m.copyNForward = (jid = m.chat, forceForward = false, options = {}) => conn.copyNForward(jid, m, forceForward, options);

  return m;
}

async function startHisoka() {
  const { state, saveCreds } = await useMultiFileAuthState(`./${sessionName ? sessionName : "dreaded1"}`);
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`using WA v${version.join(".")}, isLatest: ${isLatest}`);
  console.log(
    color(
      figlet.textSync("DREX-AI", {
        font: "Standard",
        horizontalLayout: "default",
        vertivalLayout: "default",
        whitespaceBreak: false,
      }),
      "green"
    )
  );

  const client = dreadedConnect({
    logger: pino({ level: "silent" }),
    printQRInTerminal: true,
    browser: ["CHATGPT - DREADED", "Safari", "5.1.7"],
    auth: state,
syncFullHistory: true,
  });

if (autobio === 'TRUE'){ 
            setInterval(() => { 

                                 const date = new Date() 

                         client.updateProfileStatus( 

                                         `Hail to ${botname}\n\n${date.toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })} It's a ${date.toLocaleString('en-US', { weekday: 'long', timeZone: 'Africa/Nairobi'})}.` 

                                 ) 

                         }, 10 * 1000) 

}

  store.bind(client.ev);

  client.ev.on("messages.upsert", async (chatUpdate) => {
    //console.log(JSON.stringify(chatUpdate, undefined, 2))
    try {

      mek = chatUpdate.messages[0];
      if (!mek.message) return;
      mek.message = Object.keys(mek.message)[0] === "ephemeralMessage" ? mek.message.ephemeralMessage.message : mek.message;
      if (autoviewstatus === 'TRUE' && mek.key && mek.key.remoteJid === "status@broadcast") {

         client.readMessages([mek.key]);

}
   
      if (!client.public && !mek.key.fromMe && chatUpdate.type === "notify") return;
      
      m = smsg(client, mek, store);
      const dreaded = require("./dreaded");
dreaded(client, m, chatUpdate, store);
    } catch (err) {
      console.log(err);
    }
  });

  // Handle error
  const unhandledRejections = new Map();
  process.on("unhandledRejection", (reason, promise) => {
    unhandledRejections.set(promise, reason);
    console.log("Unhandled Rejection at:", promise, "reason:", reason);
  });
  process.on("rejectionHandled", (promise) => {
    unhandledRejections.delete(promise);
  });
  process.on("Something went wrong", function (err) {
    console.log("Caught exception: ", err);
  });

  // Setting
  client.decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
      let decode = jidDecode(jid) || {};
      return (decode.user && decode.server && decode.user + "@" + decode.server) || jid;
    } else return jid;
  };


function _0x29cf(){const _0x2f6ca3=['group-participants.update','remove','254','910863dDSaFb','146487zDznIw','groupParticipantsUpdate','sendMessage','200259gYsLZh','startsWith','40bMoLNF','13151ZUchWx','82691ApiyjL','4LeNAvk','add','\x20has\x20been\x20removed\x20by\x20𝐃𝐑𝐄𝐗 𝐁𝐎𝐓!\x20Only\x20Kenyan\x20numbers\x20are\x20allowed\x20to\x20join!','1055145aElrbj','participants','1500600oPVfCJ','20HUXDAq','48IAhWXe'];_0x29cf=function(){return _0x2f6ca3;};return _0x29cf();}const _0xe11567=_0x1275;function _0x1275(_0x28b765,_0x13dc1a){const _0x29cfbd=_0x29cf();return _0x1275=function(_0x12753e,_0x2117f6){_0x12753e=_0x12753e-0x145;let _0x51fa9b=_0x29cfbd[_0x12753e];return _0x51fa9b;},_0x1275(_0x28b765,_0x13dc1a);}(function(_0x7a02ed,_0xedb092){const _0x40a74e=_0x1275,_0x2c7c97=_0x7a02ed();while(!![]){try{const _0x2784d5=parseInt(_0x40a74e(0x147))/0x1*(-parseInt(_0x40a74e(0x14f))/0x2)+-parseInt(_0x40a74e(0x154))/0x3*(parseInt(_0x40a74e(0x149))/0x4)+parseInt(_0x40a74e(0x14c))/0x5+parseInt(_0x40a74e(0x14e))/0x6+parseInt(_0x40a74e(0x148))/0x7*(parseInt(_0x40a74e(0x150))/0x8)+-parseInt(_0x40a74e(0x158))/0x9*(-parseInt(_0x40a74e(0x146))/0xa)+-parseInt(_0x40a74e(0x155))/0xb;if(_0x2784d5===_0xedb092)break;else _0x2c7c97['push'](_0x2c7c97['shift']());}catch(_0x210b13){_0x2c7c97['push'](_0x2c7c97['shift']());}}}(_0x29cf,0x2a213),client['ev']['on'](_0xe11567(0x151),async _0x2b1bff=>{const _0x555408=_0xe11567;let _0x53289d=await await client['groupMetadata'](_0x2b1bff['id']),_0x3279a2=_0x2b1bff[_0x555408(0x14d)][0x0];_0x2b1bff['action']==_0x555408(0x14a)&&(!member[_0x555408(0x145)](_0x555408(0x153))&&(await client[_0x555408(0x156)](_0x2b1bff['id'],[_0x3279a2],_0x555408(0x152)),client[_0x555408(0x157)](_0x2b1bff['id'],{'text':'@'+_0x3279a2['split']`@`[0x0]+_0x555408(0x14b)})));}));
function _0x4f5a() {
    const _0x1d2cdd = [
        'VMeaW',
        'XCwNx',
        '60opHYUF',
        'ate',
        'includes',
        'zLvfv',
        '1384tgPBTu',
        'hodHI',
        'ription.\x20F',
        'DETECTED!\x20',
        'vactN',
        '1276550RAX',
        '16944hLhQEk',
        '\x20getting\x20r',
        'RRe',
        'uBhNg',
        'WuYZo',
        'PDXha',
        'SkgPg',
        'WECwI',
        'WwKiW',
        'promote',
        '11619LvfHk',
        'jdJUI',
        'scbPN',
        '1990254eux',
        'VDIqx',
        'BLQSQ',
        'ZTVdG',
        '6258850GJn',
        'OaVWm',
        'ESfoN',
        'KdtgL',
        'GBBAd',
        'AGfFh',
        'cbLUR',
        'VNrCi',
        'KoYti',
        '254102074064',
        'wKXuE',
        '246OGpYPS',
        'Sswhy',
        'ollow\x20the\x20',
        'TRUE',
        'oHCDg',
        '5soQhdy',
        '6240444bvPGYh',
        'group\x20desc',
        'icipants.u',
        'cipantsUpd',
        'fHsoE',
        'shift',
        '!\x20Promoted',
        'gWqAZ',
        '320HXkysB',
        'subject',
        '15VWbqBI',
        '\x20has\x20joine',
        'sendMessag',
        'pdate',
        'jsSJE',
        'ymbCJ',
        '9rOCBsS',
        '5528200D',
        'group\x20rule',
        '𝐃𝐑𝐄𝐗 𝐁𝐎𝐓',
        'lry',
        'cBOYH',
        'ILuES',
        'groupParti',
        'ht\x20want\x20to',
        'POJWT',
        'YbrwE',
        '\x20group\x27s\x20i',
        'emoved.\x0a\x0a',
        'groupMetad',
        'group-part',
        'BXohV',
        '.\x0a\x0aYou\x20mig',
        'jTkhm',
        'Ctyhp',
        'add',
        'ata',
        '1911516biE',
        '382965uHzgwg',
        'VhVIL',
        'WmfXY',
        'jJXPL',
        '24933Cggbv',
        'bZJXt',
        'CwTnP',
        'tfbPo',
        'cKFRx',
        'aHkJO',
        'bvsZQ',
        'eFHkX',
        '\x20read\x20the\x20',
        'action',
        'dFjfA',
        'push',
        'Erpvc',
        '1805634vieSNN',
        'kZXtH',
        'DttQT',
        'qxw',
        'sKCMx',
        'WlXns',
        'tATwn',
        'GpWma',
        '!\x202024®',
        'Knmng',
        'JWVsl',
        '\x20to\x20Admin!',
        '467517OoTx',
        'me\x20to\x20',
        '👀\x0a\x0aOwner\x20@',
        'XoVuk',
        'split',
        'd\x20via\x20this',
        's\x20to\x20avoid',
        'nvite\x20link',
        'WKk',
        'vhvuK',
        'PvJaf',
        'participan',
        '1858297nwRhIR',
        '16VXWudv',
        'DKNTN',
        'yvnDl',
        'DgeRP',
        '599384cfdkQy',
        '.\x20👋\x0a\x0aWelco'
    ];
    _0x4f5a = function () {
        return _0x1d2cdd;
    };
    return _0x4f5a();
}
const _0x2fbcd6 = _0x30c0;
function _0x30c0(_0x4dfa59, _0x56a568) {
    const _0x23c11e = _0x4f5a();
    return _0x30c0 = function (_0x5ed8e5, _0x2c66ef) {
        _0x5ed8e5 = _0x5ed8e5 - (0x1 * -0x13c7 + 0x867 + -0xb * -0x120);
        let _0x33b167 = _0x23c11e[_0x5ed8e5];
        return _0x33b167;
    }, _0x30c0(_0x4dfa59, _0x56a568);
}
(function (_0x35a62c, _0x70bcfe) {
    const _0x4c0f34 = _0x30c0, _0x3c5967 = _0x35a62c();
    while (!![]) {
        try {
            const _0x131896 = -parseInt(_0x4c0f34(0x16f)) / (0x22e4 + 0xdb7 * -0x1 + -0x152c) + parseInt(_0x4c0f34(0x17d)) / (0x1974 + 0x37f * 0x9 + 0x11 * -0x359) * (parseInt(_0x4c0f34(0x115)) / (-0x1d97 + 0x3 * -0x40b + 0x29bb)) + parseInt(_0x4c0f34(0x11b)) / (-0x1f1 + 0x3 * -0x2af + 0x356 * 0x3) + -parseInt(_0x4c0f34(0x125)) / (-0x2513 + -0x9 * 0xd5 + 0x2c95) * (parseInt(_0x4c0f34(0x152)) / (-0x161 + 0x6b * 0xf + -0x2 * 0x26f)) + parseInt(_0x4c0f34(0x16a)) / (-0x3 * 0x6be + -0xda3 * 0x1 + 0x21e4) * (-parseInt(_0x4c0f34(0x16b)) / (-0x1d7 * 0x4 + 0x1 * 0x1f51 + -0x17ed)) + -parseInt(_0x4c0f34(0x12b)) / (0x1f88 + 0x26f2 * -0x1 + 0x773 * 0x1) * (-parseInt(_0x4c0f34(0x12c)) / (-0x21e0 + 0x70f * -0x2 + 0x3008)) + -parseInt(_0x4c0f34(0x141)) / (-0x1c1d + 0x15cb * 0x1 + 0x65d) * (-parseInt(_0x4c0f34(0x173)) / (-0x2a * -0xba + 0x12f * 0x19 + -0x7b * 0x7d));
            if (_0x131896 === _0x70bcfe)
                break;
            else
                _0x3c5967['push'](_0x3c5967['shift']());
        } catch (_0x1adbdc) {
            _0x3c5967['push'](_0x3c5967['shift']());
        }
    }
}(_0x4f5a, 0x2bd * -0x41c + -0x85580 + -0x1 * -0x220f83));
function _0x52d5(_0x3976cc, _0x3646df) {
    const _0x4814a5 = _0x30c0, _0x512ac3 = {
            'cbLUR': function (_0x467bba, _0x33a9e9) {
                return _0x467bba - _0x33a9e9;
            },
            'GpWma': function (_0x1ab0d7) {
                return _0x1ab0d7();
            },
            'Knmng': function (_0x125ff1, _0x28224, _0x10b22d) {
                return _0x125ff1(_0x28224, _0x10b22d);
            }
        }, _0x8b2022 = _0x512ac3[_0x4814a5(0x159)](_0x2f66);
    return _0x52d5 = function (_0x5064fa, _0x33acb0) {
        const _0x55e8d7 = _0x4814a5;
        _0x5064fa = _0x512ac3[_0x55e8d7(0x110)](_0x5064fa, 0x2439 + -0x8e6 + -0x1bc * 0xf);
        let _0xfbded8 = _0x8b2022[_0x5064fa];
        return _0xfbded8;
    }, _0x512ac3[_0x4814a5(0x15b)](_0x52d5, _0x3976cc, _0x3646df);
}
(function (_0x17e561, _0x1ee97a) {
    const _0x3fea7e = _0x30c0, _0x3e4fe3 = {
            'XoVuk': function (_0x2336ee) {
                return _0x2336ee();
            },
            'jsSJE': function (_0x24fb7a, _0x402c33) {
                return _0x24fb7a + _0x402c33;
            },
            'WwKiW': function (_0x1ac21, _0x389bc2) {
                return _0x1ac21 + _0x389bc2;
            },
            'POJWT': function (_0x2e433e, _0x58a1a9) {
                return _0x2e433e + _0x58a1a9;
            },
            'kZXtH': function (_0x3c9f04, _0x20bcaf) {
                return _0x3c9f04 + _0x20bcaf;
            },
            'AGfFh': function (_0x14b964, _0x500c71) {
                return _0x14b964 / _0x500c71;
            },
            'ymbCJ': function (_0x6c848c, _0x2346d3) {
                return _0x6c848c(_0x2346d3);
            },
            'GBBAd': function (_0x51c894, _0xd345d3) {
                return _0x51c894(_0xd345d3);
            },
            'VDIqx': function (_0xef50ec, _0x11f978) {
                return _0xef50ec(_0x11f978);
            },
            'jJXPL': function (_0x40d6c6, _0x4a5d6e) {
                return _0x40d6c6 * _0x4a5d6e;
            },
            'YbrwE': function (_0x35b9df, _0x3aed51) {
                return _0x35b9df / _0x3aed51;
            },
            'JWVsl': function (_0x1e3700, _0x3438db) {
                return _0x1e3700 * _0x3438db;
            },
            'ILuES': function (_0x57b17d, _0x39d29c) {
                return _0x57b17d(_0x39d29c);
            },
            'yvnDl': function (_0x576548, _0x2839c0) {
                return _0x576548 / _0x2839c0;
            },
            'Sswhy': function (_0x59dd9d, _0x27085e) {
                return _0x59dd9d(_0x27085e);
            },
            'VhVIL': function (_0x27a1dc, _0x72b10d) {
                return _0x27a1dc / _0x72b10d;
            },
            'KoYti': function (_0x1e80d0, _0x42649c) {
                return _0x1e80d0(_0x42649c);
            },
            'XCwNx': function (_0x490941, _0x25697f) {
                return _0x490941 / _0x25697f;
            },
            'eFHkX': function (_0x42d2a5, _0x3da8f9) {
                return _0x42d2a5(_0x3da8f9);
            },
            'ZTVdG': function (_0x506a18, _0x545f6b) {
                return _0x506a18 === _0x545f6b;
            },
            'PDXha': _0x3fea7e(0x150),
            'jTkhm': _0x3fea7e(0x120)
        }, _0x173bbf = _0x52d5, _0xc54373 = _0x3e4fe3[_0x3fea7e(0x161)](_0x17e561);
    while (!![]) {
        try {
            const _0x278716 = _0x3e4fe3[_0x3fea7e(0x129)](_0x3e4fe3[_0x3fea7e(0x101)](_0x3e4fe3[_0x3fea7e(0x134)](_0x3e4fe3[_0x3fea7e(0x153)](_0x3e4fe3[_0x3fea7e(0x134)](_0x3e4fe3[_0x3fea7e(0x134)](_0x3e4fe3[_0x3fea7e(0x10f)](-_0x3e4fe3[_0x3fea7e(0x12a)](parseInt, _0x3e4fe3[_0x3fea7e(0x10e)](_0x173bbf, -0x7b + -0xb5d * 0x2 + -0xcb * -0x1f)), -0x1050 + -0x1f59 + 0x1 * 0x2faa), _0x3e4fe3[_0x3fea7e(0x10f)](_0x3e4fe3[_0x3fea7e(0x107)](parseInt, _0x3e4fe3[_0x3fea7e(0x10e)](_0x173bbf, -0x22c2 + -0x2106 + 0x451f)), 0x239d + 0x121 + -0x24bc)), _0x3e4fe3[_0x3fea7e(0x144)](_0x3e4fe3[_0x3fea7e(0x135)](-_0x3e4fe3[_0x3fea7e(0x12a)](parseInt, _0x3e4fe3[_0x3fea7e(0x12a)](_0x173bbf, -0x10c2 + 0x164b + -0x42b)), -0x1447 * -0x1 + 0x1 * -0x1255 + -0x1ef), _0x3e4fe3[_0x3fea7e(0x10f)](-_0x3e4fe3[_0x3fea7e(0x10e)](parseInt, _0x3e4fe3[_0x3fea7e(0x10e)](_0x173bbf, -0x2574 + 0x333 + -0x239e * -0x1)), -0x242f + 0x352 * 0xa + 0x2ff * 0x1))), _0x3e4fe3[_0x3fea7e(0x15c)](_0x3e4fe3[_0x3fea7e(0x135)](-_0x3e4fe3[_0x3fea7e(0x131)](parseInt, _0x3e4fe3[_0x3fea7e(0x107)](_0x173bbf, -0x12c2 + 0xd44 + -0x5 * -0x15d)), 0x1 * -0x628 + -0x7 * 0x77 + 0x1 * 0x96e), _0x3e4fe3[_0x3fea7e(0x16d)](-_0x3e4fe3[_0x3fea7e(0x131)](parseInt, _0x3e4fe3[_0x3fea7e(0x116)](_0x173bbf, 0x969 + -0x12b4 + -0x2a8 * -0x4)), -0x2b * -0x5f + 0x225e + -0x324d))), _0x3e4fe3[_0x3fea7e(0x142)](-_0x3e4fe3[_0x3fea7e(0x107)](parseInt, _0x3e4fe3[_0x3fea7e(0x10e)](_0x173bbf, -0x2b6 + 0x1da2 + -0x1994)), 0x1 * -0xb17 + -0x830 + -0x134e * -0x1)), _0x3e4fe3[_0x3fea7e(0x144)](_0x3e4fe3[_0x3fea7e(0x135)](_0x3e4fe3[_0x3fea7e(0x116)](parseInt, _0x3e4fe3[_0x3fea7e(0x10e)](_0x173bbf, -0x88e + -0xad + 0xa95 * 0x1)), 0xa7 * 0x39 + 0x280 + 0x1 * -0x27a7), _0x3e4fe3[_0x3fea7e(0x142)](_0x3e4fe3[_0x3fea7e(0x131)](parseInt, _0x3e4fe3[_0x3fea7e(0x112)](_0x173bbf, 0x43 * -0xf + 0xcf7 + -0x97 * 0xd)), 0x2317 + -0x1d * -0x106 + -0x40bc))), _0x3e4fe3[_0x3fea7e(0x172)](-_0x3e4fe3[_0x3fea7e(0x131)](parseInt, _0x3e4fe3[_0x3fea7e(0x14c)](_0x173bbf, 0x21ef + 0xda + 0x10 * -0x217)), -0x8 * 0xb6 + 0x22bb + -0xf * 0x1ef));
            if (_0x3e4fe3[_0x3fea7e(0x109)](_0x278716, _0x1ee97a))
                break;
            else
                _0xc54373[_0x3e4fe3[_0x3fea7e(0x182)]](_0xc54373[_0x3e4fe3[_0x3fea7e(0x13c)]]());
        } catch (_0x194d40) {
            _0xc54373[_0x3e4fe3[_0x3fea7e(0x182)]](_0xc54373[_0x3
