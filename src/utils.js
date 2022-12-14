const fs = require("fs"),
    mime = require("mime"),
    fetch = require("node-fetch"),
    vcardToJSON = e => {
        const o = {},
            r = e.split("\n");
        for (const e of r) {
            const [r, t] = e.split(":");
            "BEGIN" !== r && "END" !== r && "PHOTO;BASE64" !== r && ("VERSION" === r && (o.version = t), "N" === r && (o.n = t), "FN" === r && (o.fn = t), "ORG" === r && (o.org = t), "TITLE" === r && (o.title = t), r.toLowerCase().indexOf("waid") >= 0 && (o.waid = t), "TEL;type=Work" === r && (o.telWork = t), "TEL;type=Home" === r && (o.telHome = t), "EMAIL;TYPE=Work" === r && (o.emailWork = t), "EMAIL;TYPE=Home" === r && (o.emailHome = t), r.indexOf("ADR;type=Work") >= 0 && (o.adrWork = t), r.indexOf("ADR;type=Home") >= 0 && (o.adrHome = t))
        }
        return o
    },
    waitFor = e => new Promise(o => setTimeout(o, e)),
    asyncForEach = async (e, o) => {
        for (let r = 0; r < e.length; r++) await o(e[r], r, e)
    }, saveMedia = (e, o, r) => {
        fs.writeFile(`${e}\\${o}`, r, e => {
            e && console.log(e)
        })
    }, isUrl = e => /^(?:\w+:)?\/\/([^\s\.]+\.\S{2}|localhost[\:?\d]*)\S*$/.test(e);
module.exports = {
    vcardToJSON: vcardToJSON,
    waitFor: waitFor,
    asyncForEach: asyncForEach,
    saveMedia: saveMedia,
    isUrl: isUrl
};