require("dotenv").config();
const path = require("path"),
    fs = require("fs"),
    mime = require("mime-types"),
    {
        vcardToJSON: vcardToJSON,
        waitFor: waitFor,
        asyncForEach: asyncForEach,
        saveMedia: saveMedia,
        isUrl: isUrl
    } = require("./utils"),
    {
        MessageTypes: MessageTypes,
        Location: Location,
        List: List,
        Buttons: Buttons
    } = require("whatsapp-web.js"),
    {
        SESSION_ID: SESSION_ID,
        IMAGE_AND_DOCUMENT_PATH: IMAGE_AND_DOCUMENT_PATH,
        MULTI_DEVICE: MULTI_DEVICE
    } = process.env,
    getContact = async (e, s) => {
        let t = void 0;
        try {
            t = await s.getContactById(e)
        } catch (e) {
            console.log(`ex: ${e}`)
        }
        return t
    }, connectedHandler = () => {
        const {
            client: e
        } = require("./wa.utils"), {
            signalRClient: s,
            serverHub: t
        } = require("./signalr.util");
        console.log("SignalR client connected."), s.connection.hub.invoke(t, "Startup", JSON.stringify({
            message: "- Initialize...",
            sessionId: SESSION_ID
        }));
        (async () => {
            try {
                console.log("Initialize..."), await e.initialize()
            } catch (e) {
                console.error("initialize error ...."), s.connection.hub.invoke(t, "Startup", JSON.stringify({
                    message: new String(e),
                    sessionId: SESSION_ID
                }))
            }
        })(), e.on("message_ack", (e, n) => {
            if ("status@broadcast" === e.from || "status@broadcast" === e.to) return;
            if (!e.body && !e.hasMedia) return;
            const a = {
                id: e.id.id,
                sessionId: SESSION_ID,
                ack: e.ack ? e.ack : -1,
                content: e.body ? e.body : "",
                type: e.type ? e.type : "",
                from: e.from ? e.from : "",
                to: e.to ? e.to : "",
                unixTimestamp: e.timestamp ? e.timestamp : 0
            };
            a.type !== MessageTypes.CONTACT_CARD && a.type !== MessageTypes.CONTACT_CARD_MULTI && a.type !== MessageTypes.LOCATION || (a.content = ""), s.connection.hub.invoke(t, "MessageAck", JSON.stringify({
                message: JSON.stringify(a),
                sessionId: SESSION_ID
            }))
        }), e.on("group_join", async n => {
            const a = MULTI_DEVICE ? n.id.remote : n.chatId,
                i = await getContact(a, e),
                o = {
                    id: i.id._serialized ? i.id._serialized : "",
                    name: i.name ? i.name : "",
                    recipients: void 0
                };
            let r = [];
            for (const s of n.recipientIds) {
                const t = await getContact(s, e);
                let n = {};
                n = t ? {
                    id: t.id._serialized ? t.id._serialized : "",
                    name: t.name ? t.name : "",
                    shortName: t.shortName ? t.shortName : "",
                    pushname: t.pushname ? t.pushname : ""
                } : {
                    id: s,
                    name: "",
                    shortName: "",
                    pushname: ""
                }, r.push(n)
            }
            o.recipients = r, s.connection.hub.invoke(t, "GroupJoin", JSON.stringify({
                groupNotification: o,
                sessionId: SESSION_ID
            }))
        }), e.on("group_leave", async n => {
            const a = MULTI_DEVICE ? n.id.remote : n.chatId,
                i = await getContact(a, e),
                o = {
                    id: i.id._serialized ? i.id._serialized : "",
                    name: i.name ? i.name : "",
                    recipients: void 0
                };
            let r = [];
            for (const s of n.recipientIds) {
                const t = await getContact(s, e);
                let n = {};
                n = t ? {
                    id: t.id._serialized ? t.id._serialized : "",
                    name: t.name ? t.name : "",
                    shortName: t.shortName ? t.shortName : "",
                    pushname: t.pushname ? t.pushname : ""
                } : {
                    id: s,
                    name: "",
                    shortName: "",
                    pushname: ""
                }, r.push(n)
            }
            o.recipients = r, s.connection.hub.invoke(t, "GroupLeave", JSON.stringify({
                groupNotification: o,
                sessionId: SESSION_ID
            }))
        }), e.on("message_create", async e => {
            if (e.fromMe) {
                const n = "true",
                    a = e.to,
                    i = "chat" === e.type ? e.body : "",
                    o = e.id.id;
                s.connection.hub.invoke(t, "SendMessageStatus", JSON.stringify({
                    messageStatus: {
                        status: n,
                        send_to: a,
                        message: i,
                        messageId: o
                    },
                    sessionId: SESSION_ID
                }))
            }
        }), e.on("message", async n => {
            if ("status@broadcast" === n.from) return;
            if ("call_log" !== n.type && !n.body && !n.hasMedia) return;
            try {
                (await n.getChat()).sendSeen()
            } catch (e) {
                console.log(`ex: ${e}`)
            }
            let a = {},
                i = "";
            const o = n.hasMedia && IMAGE_AND_DOCUMENT_PATH;
            if (o) try {
                i = (a = await n.downloadMedia()).mimetype
            } catch (e) {
                console.log(`ex: ${e}`)
            }
            const r = n.from.endsWith("@g.us"),
                d = await getContact(n.from, e);
            let c = void 0;
            r && (c = await getContact(n.author, e));
            const l = {
                id: n.id._serialized,
                sessionId: SESSION_ID,
                content: n.body ? n.body : "",
                type: n.type ? n.type : "",
                from: n.from ? n.from : "",
                to: n.to ? n.to : "",
                sender: r ? void 0 : {
                    id: d.id._serialized ? d.id._serialized : "",
                    name: d.name ? d.name : "",
                    shortName: d.shortName ? d.shortName : "",
                    pushname: d.pushname ? d.pushname : ""
                },
                group: r ? {
                    id: d.id._serialized ? d.id._serialized : "",
                    name: d.name ? d.name : "",
                    sender: {
                        id: c.id._serialized ? c.id._serialized : "",
                        name: c.name ? c.name : "",
                        shortName: c.shortName ? c.shortName : "",
                        pushname: c.pushname ? c.pushname : ""
                    }
                } : void 0,
                unixTimestamp: n.timestamp ? n.timestamp : 0,
                filename: o ? `${n.timestamp}.${mime.extension(i)}` : "",
                location: n.type === MessageTypes.LOCATION ? n.location : void 0,
                vcards: n.type === MessageTypes.CONTACT_CARD || n.type === MessageTypes.CONTACT_CARD_MULTI ? [] : void 0,
                vcardFilenames: n.type === MessageTypes.CONTACT_CARD || n.type === MessageTypes.CONTACT_CARD_MULTI ? [] : void 0,
                selectedButtonId: n.type === MessageTypes.BUTTONS_RESPONSE ? n.selectedButtonId : void 0,
                selectedRowId: n.type === MessageTypes.LIST_RESPONSE ? n.selectedRowId : void 0
            };
            if (l.type !== MessageTypes.CONTACT_CARD && l.type !== MessageTypes.CONTACT_CARD_MULTI && l.type !== MessageTypes.LOCATION || (l.content = ""), l.type === MessageTypes.CONTACT_CARD && (l.vcards.push(vcardToJSON(n.body)), IMAGE_AND_DOCUMENT_PATH)) {
                const {
                    fn: e
                } = l.vcards[0], s = `${l.unixTimestamp}_${e}.vcf`;
                l.vcardFilenames.push(s)
            }
            if (l.type === MessageTypes.CONTACT_CARD_MULTI) {
                let e = 0;
                for (const s of n.vCards) {
                    if (l.vcards.push(vcardToJSON(s)), IMAGE_AND_DOCUMENT_PATH) {
                        const {
                            fn: s
                        } = l.vcards[e], t = `${l.unixTimestamp}_${s}.vcf`;
                        l.vcardFilenames.push(t)
                    }
                    e++
                }
            }
            if (s.connection.hub.invoke(t, "ReceiveMessage", JSON.stringify({
                    message: l,
                    sessionId: SESSION_ID
                })), o) {
                const {
                    data: e
                } = a, s = new Buffer.from(e, "base64");
                saveMedia(IMAGE_AND_DOCUMENT_PATH, l.filename, s)
            }
            if (n.type === MessageTypes.CONTACT_CARD && IMAGE_AND_DOCUMENT_PATH) {
                const e = l.vcardFilenames[0];
                saveMedia(IMAGE_AND_DOCUMENT_PATH, e, n.body)
            }
            if (l.type === MessageTypes.CONTACT_CARD_MULTI && IMAGE_AND_DOCUMENT_PATH) {
                let e = 0;
                for (const s of n.vCards) {
                    const t = l.vcardFilenames[e];
                    saveMedia(IMAGE_AND_DOCUMENT_PATH, t, s), e++
                }
            }
        })
    }, onSetStatusHandler = async e => {
        const {
            client: s,
            sendTextAsync: t,
            sendImageOrFileAsync: n,
            sendImageOrFileFromUrlAsync: a
        } = require("./wa.utils"), i = JSON.parse(e), {
            sessionId: o,
            send_to: r,
            message: d,
            type: c,
            attachmentOrUrl: l
        } = i;
        o === SESSION_ID && ("image" === c ? await n(r, l, d, null, s) : "url" === c ? await a(r, l, d, null, s) : await t(r, d, null, s))
    }, onSendMessageHandler = async e => {
        const {
            client: s,
            sendTextAsync: t,
            sendListOrButtonAsync: n,
            sendImageOrFileAsync: a,
            sendImageOrFileFromUrlAsync: i,
            replyAsync: o
        } = require("./wa.utils"), {
            signalRClient: r,
            serverHub: d
        } = require("./signalr.util"), c = JSON.parse(e), {
            sessionId: l,
            send_to: S,
            message: u,
            type: m,
            attachmentOrUrl: g,
            quotedMessageId: I,
            mentions: p
        } = c;
        if (l === SESSION_ID)
            if ("image" === m || "file" === m) {
                const e = (await a(S, g, u, p, s)).toString().split("_"),
                    [t, n, i, o] = e;
                "false" === t && r.connection.hub.invoke(d, "SendMessageStatus", JSON.stringify({
                    messageStatus: {
                        status: t,
                        send_to: n,
                        message: i,
                        messageId: o
                    },
                    sessionId: SESSION_ID
                }))
            } else if ("url" === m) {
            const e = (await i(S, g, u, p, s)).toString().split("_"),
                [t, n, a, o] = e;
            "false" === t && r.connection.hub.invoke(d, "SendMessageStatus", JSON.stringify({
                messageStatus: {
                    status: t,
                    send_to: n,
                    message: a,
                    messageId: o
                },
                sessionId: SESSION_ID
            }))
        } else if ("location" === m) {
            const e = JSON.parse(u),
                n = new Location(e.latitude, e.longitude, e.description);
            let a = "";
            const i = (a = I ? await o(S, n, I, s) : await t(S, n, p, s)).toString().split("_"),
                [c, l, m, g] = i;
            "false" === c && r.connection.hub.invoke(d, "SendMessageStatus", JSON.stringify({
                messageStatus: {
                    status: c,
                    send_to: l,
                    message: m,
                    messageId: g
                },
                sessionId: SESSION_ID
            }))
        } else if ("list" === m) {
            const e = JSON.parse(u),
                t = new List(e.content, e.listText, e.sections, e.title),
                a = (await n(S, t, m, null, p, s)).toString().split("_"),
                [i, o, c, l] = a;
            "false" === i && r.connection.hub.invoke(d, "SendMessageStatus", JSON.stringify({
                messageStatus: {
                    status: i,
                    send_to: o,
                    message: c,
                    messageId: l
                },
                sessionId: SESSION_ID
            }))
        } else if ("button" === m) {
            const e = JSON.parse(u);
            let t = void 0;
            if (g) {
                const {
                    MessageMedia: a
                } = require("whatsapp-web.js");
                let i = void 0;
                i = isUrl(g) ? await a.fromUrl(g) : a.fromFilePath(g);
                const o = new Buttons(i, e.items);
                t = await n(S, o, m, e.content, p, s)
            } else {
                const a = new Buttons(e.content, e.items, e.title);
                t = await n(S, a, m, null, p, s)
            }
            const a = t.toString().split("_"),
                [i, o, c, l] = a;
            "false" === i && r.connection.hub.invoke(d, "SendMessageStatus", JSON.stringify({
                messageStatus: {
                    status: i,
                    send_to: o,
                    message: c,
                    messageId: l
                },
                sessionId: SESSION_ID
            }))
        } else {
            let e = "";
            const n = (e = I ? await o(S, u, I, s) : await t(S, u, p, s)).toString().split("_"),
                [a, i, c, l] = n;
            "false" === a && r.connection.hub.invoke(d, "SendMessageStatus", JSON.stringify({
                messageStatus: {
                    status: a,
                    send_to: i,
                    message: c,
                    messageId: l
                },
                sessionId: SESSION_ID
            }))
        }
    }, onBroadcastMessageHandler = async (e, s) => {
        const {
            client: t,
            sendTextAsync: n,
            sendImageOrFileAsync: a,
            sendImageOrFileFromUrlAsync: i
        } = require("./wa.utils"), {
            signalRClient: o,
            serverHub: r
        } = require("./signalr.util"), d = JSON.parse(e);
        await asyncForEach(d, async e => {
            const {
                sessionId: d,
                send_to: c,
                message: l,
                type: S,
                attachmentOrUrl: u,
                mentions: m
            } = e;
            if (d === SESSION_ID) {
                if ("image" === S || "file" === S) {
                    const e = (await a(c, u, l, m, t)).toString().split("_"),
                        [s, n, i, d] = e;
                    "false" === s && o.connection.hub.invoke(r, "SendMessageStatus", JSON.stringify({
                        messageStatus: {
                            status: s,
                            send_to: n,
                            message: i,
                            messageId: d
                        },
                        sessionId: SESSION_ID
                    }))
                } else if ("url" === S) {
                    const e = (await i(c, u, l, m, t)).toString().split("_"),
                        [s, n, a, d] = e;
                    "false" === s && o.connection.hub.invoke(r, "SendMessageStatus", JSON.stringify({
                        messageStatus: {
                            status: s,
                            send_to: n,
                            message: a,
                            messageId: d
                        },
                        sessionId: SESSION_ID
                    }))
                } else if ("location" === S) {
                    const e = JSON.parse(l),
                        s = new Location(e.latitude, e.longitude, e.description),
                        a = (await n(c, s, m, t)).toString().split("_"),
                        [i, d, S, u] = a;
                    "false" === i && o.connection.hub.invoke(r, "SendMessageStatus", JSON.stringify({
                        messageStatus: {
                            status: i,
                            send_to: d,
                            message: S,
                            messageId: u
                        },
                        sessionId: SESSION_ID
                    }))
                } else {
                    const e = (await n(c, l, m, t)).toString().split("_"),
                        [s, a, i, d] = e;
                    "false" === s && o.connection.hub.invoke(r, "SendMessageStatus", JSON.stringify({
                        messageStatus: {
                            status: s,
                            send_to: a,
                            message: i,
                            messageId: d
                        },
                        sessionId: SESSION_ID
                    }))
                }
                await waitFor(s)
            }
        })
    }, onVerifyWANumberHandler = async (e, s) => {
        const {
            client: t
        } = require("./wa.utils"), {
            signalRClient: n,
            serverHub: a
        } = require("./signalr.util"), i = JSON.parse(e);
        let o = [];
        await asyncForEach(i, async e => {
            const {
                phoneNumber: i,
                sessionId: r
            } = e;
            if (r === SESSION_ID) {
                if (await t.isRegisteredUser(i))
                    if (s) {
                        const e = await getContact(i, t);
                        if (e) {
                            const s = {
                                id: e.id._serialized ? e.id._serialized : "",
                                name: e.name ? e.name : "",
                                shortName: e.shortName ? e.shortName : "",
                                pushname: e.pushname ? e.pushname : "",
                                verifiedName: e.verifiedName ? e.verifiedName : "",
                                sessionId: SESSION_ID
                            };
                            o.push(s), 100 === o.length && (n.connection.hub.invoke(a, "ReceiveContacts", JSON.stringify({
                                contacts: o,
                                sessionId: SESSION_ID
                            })), o = [])
                        }
                    } else {
                        const e = {
                            id: i,
                            name: "Verified",
                            sessionId: SESSION_ID
                        };
                        o.push(e), 100 === o.length && (n.connection.hub.invoke(a, "ReceiveContacts", JSON.stringify({
                            contacts: o,
                            sessionId: SESSION_ID
                        })), o = [])
                    }
                else {
                    const e = {
                        id: i,
                        name: "Not verified",
                        sessionId: SESSION_ID
                    };
                    o.push(e), 100 === o.length && (n.connection.hub.invoke(a, "ReceiveContacts", JSON.stringify({
                        contacts: o,
                        sessionId: SESSION_ID
                    })), o = [])
                }
            }
        }), o.push({
            id: "status@broadcast"
        }), n.connection.hub.invoke(a, "ReceiveContacts", JSON.stringify({
            contacts: o,
            sessionId: SESSION_ID
        }))
    }, onGrabContactHandler = async e => {
        const {
            client: s
        } = require("./wa.utils"), {
            signalRClient: t,
            serverHub: n
        } = require("./signalr.util"), a = JSON.parse(e), {
            sessionId: i
        } = a;
        if (i !== SESSION_ID) return;
        let o = [];
        try {
            o = await s.getContacts()
        } catch (e) {
            console.log(`ex: ${e}`)
        }
        let r = [];
        o.forEach(e => {
            if (!e.isMe) {
                const s = e.id._serialized.toString().split("@");
                if (s[0].length > 5 && "c.us" === s[1]) {
                    const s = {
                        id: e.id._serialized ? e.id._serialized : "",
                        name: e.name ? e.name : "",
                        shortName: e.shortName ? e.shortName : "",
                        pushname: e.pushname ? e.pushname : "",
                        verifiedName: e.verifiedName ? e.verifiedName : "",
                        sessionId: SESSION_ID
                    };
                    "status@broadcast" !== s.id && r.push(s), 100 === r.length && (t.connection.hub.invoke(n, "ReceiveContacts", JSON.stringify({
                        contacts: r,
                        sessionId: SESSION_ID
                    })), r = [])
                }
            }
        }), r.push({
            id: "status@broadcast"
        }), t.connection.hub.invoke(n, "ReceiveContacts", JSON.stringify({
            contacts: r,
            sessionId: SESSION_ID
        }))
    }, onGrabGroupHandler = async e => {
        const {
            client: s
        } = require("./wa.utils"), {
            signalRClient: t,
            serverHub: n
        } = require("./signalr.util"), a = JSON.parse(e), {
            sessionId: i
        } = a;
        if (i !== SESSION_ID) return;
        let o = [];
        try {
            o = await s.getChats()
        } catch (e) {
            console.log(`ex: ${e}`)
        }
        let r = [];
        o.forEach(e => {
            if (e.isGroup) {
                const s = {
                    id: e.id._serialized ? e.id._serialized : "",
                    name: e.name ? e.name : "",
                    sessionId: SESSION_ID
                };
                r.push(s)
            }
        }), r.push({
            id: "status@broadcast"
        }), t.connection.hub.invoke(n, "ReceiveGroups", JSON.stringify({
            groups: r,
            sessionId: SESSION_ID
        }))
    }, onGrabGroupAndMemberHandler = async e => {
        const {
            client: s
        } = require("./wa.utils"), {
            signalRClient: t,
            serverHub: n
        } = require("./signalr.util"), a = JSON.parse(e), {
            sessionId: i
        } = a;
        if (i !== SESSION_ID) return;
        let o = [];
        try {
            o = await s.getChats()
        } catch (e) {
            console.log(`ex: ${e}`)
        }
        let r = [];
        o.forEach(e => {
            if (e.isGroup) {
                let s = [];
                e.groupMetadata.participants.forEach(e => {
                    const t = {
                        id: e.id._serialized ? e.id._serialized : "",
                        name: "",
                        shortName: "",
                        pushname: ""
                    };
                    s.push(t)
                });
                const t = {
                    id: e.id._serialized ? e.id._serialized : "",
                    name: e.name ? e.name : "",
                    sessionId: SESSION_ID,
                    members: s
                };
                r.push(t)
            }
        });
        let d = [];
        for (const e of r) {
            for (const t of e.members) try {
                const e = await getContact(t.id, s);
                t.name = e.name ? e.name : "", t.shortName = e.shortName ? e.shortName : "", t.pushname = e.pushname ? e.pushname : ""
            } catch (e) {
                console.log(`ex: ${e}`)
            }
            d.push(e), 1 === d.length && (t.connection.hub.invoke(n, "ReceiveGroups", JSON.stringify({
                groups: d,
                sessionId: SESSION_ID
            })), d = [])
        }
        d.push({
            id: "status@broadcast"
        }), t.connection.hub.invoke(n, "ReceiveGroups", JSON.stringify({
            groups: d,
            sessionId: SESSION_ID
        }))
    }, onArchiveChatHandler = async e => {
        const {
            client: s
        } = require("./wa.utils"), t = JSON.parse(e), {
            sessionId: n,
            phoneNumber: a
        } = t;
        if (n === SESSION_ID)
            if (a) try {
                (await s.getChatById(a)).archive()
            } catch (e) {
                console.log(`ex: ${e}`)
            } else try {
                const e = await s.getChats();
                for (const s of e) await s.archive()
            } catch (e) {
                console.log(`ex: ${e}`)
            }
    }, onDeleteChatHandler = async e => {
        const {
            client: s
        } = require("./wa.utils"), t = JSON.parse(e), {
            sessionId: n,
            phoneNumber: a
        } = t;
        if (n === SESSION_ID)
            if (a) try {
                (await s.getChatById(a)).delete()
            } catch (e) {
                console.log(`ex: ${e}`)
            } else try {
                const e = await s.getChats();
                for (const s of e) await s.delete()
            } catch (e) {
                console.log(`ex: ${e}`)
            }
    }, onGetBatteryStatusHandler = async e => {
        const {
            client: s
        } = require("./wa.utils"), {
            signalRClient: t,
            serverHub: n
        } = require("./signalr.util"), a = JSON.parse(e), {
            sessionId: i
        } = a;
        if (i === SESSION_ID) try {
            const e = await s.info.getBatteryStatus(),
                {
                    battery: a,
                    plugged: i
                } = e;
            t.connection.hub.invoke(n, "ChangeBattery", JSON.stringify({
                battery: a,
                plugged: i,
                sessionId: SESSION_ID
            }))
        } catch (e) {
            console.log(`ex: ${e}`)
        }
    }, onGetCurrentStateHandler = async e => {
        const {
            client: s
        } = require("./wa.utils"), {
            signalRClient: t,
            serverHub: n
        } = require("./signalr.util"), a = JSON.parse(e), {
            sessionId: i
        } = a;
        if (i === SESSION_ID) try {
            const e = await s.getState();
            t.connection.hub.invoke(n, "ChangeState", JSON.stringify({
                state: e,
                sessionId: SESSION_ID
            }))
        } catch (e) {
            console.log(`ex: ${e}`)
        }
    }, onDisconnectHandler = async e => {
        const {
            signalRClient: s
        } = require("./signalr.util"), {
            client: t
        } = require("./wa.utils"), n = JSON.parse(e), {
            sessionId: a
        } = n;
        if (a === SESSION_ID) {
            try {
                await t.destroy()
            } catch (e) {
                console.log(`ex: ${e}`)
            }
            setTimeout(() => process.exit(), 500), s.end()
        }
    }, onLogoutHandler = async e => {
        const {
            signalRClient: s
        } = require("./signalr.util"), {
            client: t
        } = require("./wa.utils"), n = JSON.parse(e), {
            sessionId: a
        } = n;
        if (a === SESSION_ID) {
            try {
                if (await t.logout(), !MULTI_DEVICE) {
                    const e = path.join(path.resolve("./session"), `${SESSION_ID}.json`);
                    fs.rm(e, {
                        force: !0
                    }, e => {
                        e && console.log(e)
                    })
                }
            } catch (e) {
                console.log(`ex: ${e}`)
            }
            setTimeout(() => process.exit(), 500), s.end()
        }
    }, onGetAllMessageHandler = async e => {
        const {
            client: s
        } = require("./wa.utils"), {
            signalRClient: t,
            serverHub: n
        } = require("./signalr.util"), a = JSON.parse(e), {
            sessionId: i,
            phoneNumber: o,
            limit: r
        } = a;
        if (i !== SESSION_ID) return;
        let d = [];
        if (o) {
            const e = await s.getChatById(o);
            if (!e) return;
            const a = await e.fetchMessages({
                limit: r
            });
            for (const e of a) {
                if (!e.body) continue;
                const a = e.from.endsWith("@g.us"),
                    i = await getContact(e.from, s);
                let o = void 0;
                a && (o = await getContact(e.author, s));
                const r = {
                    id: e.id._serialized,
                    sessionId: SESSION_ID,
                    content: e.body ? e.body : "",
                    type: e.type ? e.type : "",
                    from: e.from ? e.from : "",
                    to: e.to ? e.to : "",
                    sender: a ? void 0 : {
                        id: i.id._serialized ? i.id._serialized : "",
                        name: i.name ? i.name : "",
                        shortName: i.shortName ? i.shortName : "",
                        pushname: i.pushname ? i.pushname : ""
                    },
                    group: a ? {
                        id: i.id._serialized ? i.id._serialized : "",
                        name: i.name ? i.name : "",
                        sender: {
                            id: o.id._serialized ? o.id._serialized : "",
                            name: o.name ? o.name : "",
                            shortName: o.shortName ? o.shortName : "",
                            pushname: o.pushname ? o.pushname : ""
                        }
                    } : void 0,
                    unixTimestamp: e.timestamp ? e.timestamp : 0,
                    filename: "",
                    location: e.type === MessageTypes.LOCATION ? e.location : void 0,
                    vcards: e.type === MessageTypes.CONTACT_CARD || e.type === MessageTypes.CONTACT_CARD_MULTI ? [] : void 0,
                    selectedButtonId: e.type === MessageTypes.BUTTONS_RESPONSE ? e.selectedButtonId : void 0,
                    selectedRowId: e.type === MessageTypes.LIST_RESPONSE ? e.selectedRowId : void 0
                };
                if (r.type !== MessageTypes.CONTACT_CARD && r.type !== MessageTypes.CONTACT_CARD_MULTI && r.type !== MessageTypes.LOCATION || (r.content = ""), r.type === MessageTypes.CONTACT_CARD && r.vcards.push(vcardToJSON(e.body)), r.type === MessageTypes.CONTACT_CARD_MULTI)
                    for (const s of e.vCards) r.vcards.push(vcardToJSON(s));
                d.push(r), 50 === d.length && (t.connection.hub.invoke(n, "ReceiveMessages", JSON.stringify({
                    messages: d,
                    sessionId: SESSION_ID
                })), d = [])
            }
            d.push({
                id: "status@broadcast",
                type: "text",
                content: "",
                sessionId: SESSION_ID
            }), d.length > 0 && (t.connection.hub.invoke(n, "ReceiveMessages", JSON.stringify({
                messages: d,
                sessionId: SESSION_ID
            })), d = [])
        }
    }, onGetUnreadMessageHandler = async e => {
        const {
            client: s
        } = require("./wa.utils"), {
            signalRClient: t,
            serverHub: n
        } = require("./signalr.util"), a = JSON.parse(e), {
            sessionId: i
        } = a;
        if (i !== SESSION_ID) return;
        let o = [];
        try {
            o = await s.getChats()
        } catch (e) {
            console.log(`ex: ${e}`)
        }
        let r = [];
        for (const e of o)
            if (e.sendSeen(), e.unreadCount > 0) {
                const a = await e.fetchMessages({
                    limit: e.unreadCount
                });
                for (const e of a) {
                    if (!e.body) continue;
                    const a = e.from.endsWith("@g.us"),
                        i = await getContact(e.from, s);
                    let o = void 0;
                    a && (o = await getContact(e.author, s));
                    const d = {
                        id: e.id._serialized,
                        sessionId: SESSION_ID,
                        content: e.body ? e.body : "",
                        type: e.type ? e.type : "",
                        from: e.from ? e.from : "",
                        to: e.to ? e.to : "",
                        sender: a ? void 0 : {
                            id: i.id._serialized ? i.id._serialized : "",
                            name: i.name ? i.name : "",
                            shortName: i.shortName ? i.shortName : "",
                            pushname: i.pushname ? i.pushname : ""
                        },
                        group: a ? {
                            id: i.id._serialized ? i.id._serialized : "",
                            name: i.name ? i.name : "",
                            sender: {
                                id: o.id._serialized ? o.id._serialized : "",
                                name: o.name ? o.name : "",
                                shortName: o.shortName ? o.shortName : "",
                                pushname: o.pushname ? o.pushname : ""
                            }
                        } : void 0,
                        unixTimestamp: e.timestamp ? e.timestamp : 0,
                        filename: "",
                        location: e.type === MessageTypes.LOCATION ? e.location : void 0,
                        vcards: e.type === MessageTypes.CONTACT_CARD || e.type === MessageTypes.CONTACT_CARD_MULTI ? [] : void 0,
                        selectedButtonId: e.type === MessageTypes.BUTTONS_RESPONSE ? e.selectedButtonId : void 0,
                        selectedRowId: e.type === MessageTypes.LIST_RESPONSE ? e.selectedRowId : void 0
                    };
                    if (d.type !== MessageTypes.CONTACT_CARD && d.type !== MessageTypes.CONTACT_CARD_MULTI && d.type !== MessageTypes.LOCATION || (d.content = ""), d.type === MessageTypes.CONTACT_CARD && d.vcards.push(vcardToJSON(e.body)), d.type === MessageTypes.CONTACT_CARD_MULTI)
                        for (const s of e.vCards) d.vcards.push(vcardToJSON(s));
                    r.push(d), 100 === r.length && (t.connection.hub.invoke(n, "ReceiveMessages", JSON.stringify({
                        messages: r,
                        sessionId: SESSION_ID
                    })), r = [])
                }
            } r.push({
            id: "status@broadcast",
            type: "text",
            content: "",
            sessionId: SESSION_ID
        }), r.length > 0 && (t.connection.hub.invoke(n, "ReceiveMessages", JSON.stringify({
            messages: r,
            sessionId: SESSION_ID
        })), r = [])
    };
module.exports = {
    connectedHandler: connectedHandler,
    onSetStatusHandler: onSetStatusHandler,
    onSendMessageHandler: onSendMessageHandler,
    onBroadcastMessageHandler: onBroadcastMessageHandler,
    onVerifyWANumberHandler: onVerifyWANumberHandler,
    onGrabContactHandler: onGrabContactHandler,
    onGrabGroupHandler: onGrabGroupHandler,
    onGrabGroupAndMemberHandler: onGrabGroupAndMemberHandler,
    onArchiveChatHandler: onArchiveChatHandler,
    onDeleteChatHandler: onDeleteChatHandler,
    onGetUnreadMessageHandler: onGetUnreadMessageHandler,
    onGetAllMessageHandler: onGetAllMessageHandler,
    onDisconnectHandler: onDisconnectHandler,
    onLogoutHandler: onLogoutHandler,
    onGetBatteryStatusHandler: onGetBatteryStatusHandler,
    onGetCurrentStateHandler: onGetCurrentStateHandler
};