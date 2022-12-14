require("dotenv").config();
const {
    MULTI_DEVICE: MULTI_DEVICE
} = process.env, {
    signalRClient: signalRClient,
    serverHub: serverHub
} = require("./signalr.util");

signalRClient.start();
const {
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
} = require("./index.handler");

signalRClient.on("connected", connectedHandler),
    signalRClient.on("reconnecting", n => {
        console.log(`SignalR client reconnecting(${n}).`)
    }),
    signalRClient.on("disconnected", n => {
        console.log(`SignalR client disconnected(${n}).`)
    }),
    signalRClient.on("error", (n, e) => {
        console.log(`SignalR client connect error: ${n}.`),
            setTimeout(() => process.exit(), 500)
    }),
    MULTI_DEVICE || signalRClient.connection.hub.on(serverHub, "OnSetStatus", onSetStatusHandler),
    signalRClient.connection.hub.on(serverHub, "OnSendMessage", onSendMessageHandler), signalRClient.connection.hub.on(serverHub, "OnBroadcastMessage", onBroadcastMessageHandler), signalRClient.connection.hub.on(serverHub, "OnVerifyWANumber", onVerifyWANumberHandler), signalRClient.connection.hub.on(serverHub, "OnGrabContact", onGrabContactHandler), signalRClient.connection.hub.on(serverHub, "OnGrabGroup", onGrabGroupHandler), signalRClient.connection.hub.on(serverHub, "OnGrabGroupAndMember", onGrabGroupAndMemberHandler), signalRClient.connection.hub.on(serverHub, "OnArchiveChat", onArchiveChatHandler), signalRClient.connection.hub.on(serverHub, "OnDeleteChat", onDeleteChatHandler), MULTI_DEVICE || signalRClient.connection.hub.on(serverHub, "OnGetBatteryStatus", onGetBatteryStatusHandler), signalRClient.connection.hub.on(serverHub, "OnGetCurrentState", onGetCurrentStateHandler), signalRClient.connection.hub.on(serverHub, "OnGetUnreadMessage", onGetUnreadMessageHandler), signalRClient.connection.hub.on(serverHub, "OnGetAllMessage", onGetAllMessageHandler), signalRClient.connection.hub.on(serverHub, "OnDisconnect", onDisconnectHandler), signalRClient.connection.hub.on(serverHub, "OnLogout", onLogoutHandler);