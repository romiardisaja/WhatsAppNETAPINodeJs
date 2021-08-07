require("dotenv").config();const{CHROME_PATH:CHROME_PATH,SESSION_ID:SESSION_ID}=process.env,path=require("path"),fs=require("fs"),{Client:Client,MessageMedia:MessageMedia}=require("whatsapp-web.js"),SESSION_FILE_PATH=path.join(path.resolve("./session"),`${SESSION_ID}.json`);let sessionCfg;fs.existsSync(SESSION_FILE_PATH)&&(sessionCfg=require(SESSION_FILE_PATH));const client=new Client({puppeteer:{headless:!0,executablePath:CHROME_PATH},session:sessionCfg}),{signalRClient:signalRClient,serverHub:serverHub}=require("./signalr.util"),qr=require("qr-image");client.on("qr",e=>{const n="- Scan QRCode...";console.log(n);const s=path.join(path.resolve("./"),"session",`qr_code_${SESSION_ID}.png`);var t=qr.imageSync(e,{type:"png"});fs.writeFileSync(s,t),signalRClient.connection.hub.invoke(serverHub,"Startup",n),signalRClient.connection.hub.invoke(serverHub,"ScanMe",s)}),client.on("authenticated",e=>{const n="- Authenticated";console.log(n),fs.writeFile(SESSION_FILE_PATH,JSON.stringify(e),e=>{e&&console.error(e)}),signalRClient.connection.hub.invoke(serverHub,"Startup",n)}),client.on("auth_failure",e=>{const n="- Authentication Failure\n- Session has been reset, please try again";console.log(n),console.log(`msg_failure: ${e}`),fs.rm(SESSION_FILE_PATH,{force:!0},e=>{e&&console.log(e),console.log(`${SESSION_FILE_PATH} is deleted!`),signalRClient.connection.hub.invoke(serverHub,"Startup",n)})}),client.on("ready",()=>{console.log("- Ready"),signalRClient.connection.hub.invoke(serverHub,"Startup","- Ready")}),client.on("disconnected",e=>{console.log("Client was logged out",e)}),client.on("change_state",e=>{console.log("CHANGE STATE",e),signalRClient.connection.hub.invoke(serverHub,"ChangeState",e)});const replyAsync=async(e,n,s,t)=>{try{return await t.isRegisteredUser(e)?(await t.sendMessage(e,n,{quotedMessageId:s}),`true_${e}_${n}`):`false_${e}_${n}`}catch(e){console.log("error ...."),console.log(e)}return`false_${e}_${n}`},sendTextAsync=async(e,n,s)=>{try{return await s.isRegisteredUser(e)?(await s.sendMessage(e,n),`true_${e}_${n}`):`false_${e}_${n}`}catch(e){console.log("error ...."),console.log(e)}return`false_${e}_${n}`},sendImageOrFileAsync=async(e,n,s,t)=>{try{if(await t.isRegisteredUser(e)){const r=MessageMedia.fromFilePath(n);return await t.sendMessage(e,r,{caption:s}),`true_${e}_${s}`}return`false_${e}_${s}`}catch(e){console.log(e)}return`false_${e}_${s}`},sendImageOrFileFromUrlAsync=async(e,n,s,t)=>{try{if(await t.isRegisteredUser(e))try{const r=await MessageMedia.fromUrl(n);return await t.sendMessage(e,r,{caption:s}),`true_${e}_${s}`}catch(e){console.log(e)}return`false_${e}_${s}`}catch(e){console.log(e)}return`false_${e}_${s}`};module.exports={client:client,SESSION_FILE_PATH:SESSION_FILE_PATH,sendTextAsync:sendTextAsync,sendImageOrFileAsync:sendImageOrFileAsync,sendImageOrFileFromUrlAsync:sendImageOrFileFromUrlAsync,replyAsync:replyAsync};