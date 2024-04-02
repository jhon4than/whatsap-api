const qrcode = require("qrcode-terminal");
const { Client, MessageMedia, LocalAuth } = require("whatsapp-web.js");
const schedule = require("node-schedule");

// const GROUP_ID = "120363195182514950@g.us"; Grupo Principal
const groupIds = [
    "120363205945896855@g.us",
    "120363219756067105@g.us",
];

//const GROUP_ID = "120363195085351965@g.us";
const SIGNAL_INTERVAL_MINUTES = 5;

const games = [
    { name: "🐉 Fortune Dragon 🐉", image: "./fortune_dragon.png" },
    { name: "🐯 Fortune Tiger 🐯", image: "./Fortune_tigger.png" },
    { name: "🐰 Fortune Rabbit 🐰", image: "./Fortune_rabbit.jpeg" },
    { name: "🐂 Fortune Ox 🐂", image: "./fortune_ox.jpg" },
    { name: "🐭 Fortune Mouse 🐭", image: "./Fortune_mouse.jpg" },
];

const groupLinks = {
    "120363205945896855@g.us": "https://greendasorte.com.br/register?code=XCF296T00P",
    "120363219756067105@g.us": "https://seulink",
};


let currentGameIndex = 0;
let signalCount = 0;

// Configure o cliente para usar a autenticação local (armazena a sessão localmente)
const client = new Client({
    authStrategy: new LocalAuth(),
});

// Função que gerencia a sequência de envio dos sinais
function startSendingSignals(chatId) {
    sendAnalysisMessage(chatId); // Primeira chamada para iniciar o processo
}

// Função para enviar a mensagem de análise de padrões
function sendAnalysisMessage(chatId) {
    client
        .sendMessage(
            chatId,
            "👑 ATENÇÃO... IDENTIFICANDO PADRÕES🔎❗\n📊 ANALISANDO ALGORITMO...\n"
        )
        .then(() => {
            setTimeout(
                () => sendGameSignal(chatId),
                1000 * 60 * SIGNAL_INTERVAL_MINUTES
            );
        });
}

function sendGameSignal(chatId) {
    const game = games[currentGameIndex];
    const gameImage = MessageMedia.fromFilePath(game.image);
    const number_of_games1 = Math.floor(Math.random() * 5) + 5;
    const number_of_games2 = Math.floor(Math.random() * 6) + 2;
    const number_of_games3 = Math.floor(Math.random() * 8) + 5;

    const link = groupLinks[chatId]; // Use o link correspondente ao ID do grupo, ou um link padrão se não houver correspondência
    const message = `🍀 OPORTUNIDADE IDENTIFICADA

${game["name"]}
🟢 Iniciar: Agora
⏰ Validade: 5 minutos

🔃 Alternar entre:
🚀 ${number_of_games3} GIROS NO TURBO
🎮 ${number_of_games2} GIROS NO NORMAL
🚀 10 GIROS NO TURBO AUTOMÁTICO

🔃 Giros de 0,40 até 2.50 🔃
⬇️DEPÓSITO MÍNIMO: R$20,00 ⬇️

🎰𝗣𝗹𝗮𝘁𝗮𝗳𝗼𝗿𝗺𝗮: ${link}
❎NÃO TENTE EM OUTRO SITE!❎`;

    client.sendMessage(chatId, gameImage, { caption: message }).then(() => {
        signalCount++;
        if (signalCount < 2) {
            setTimeout(
                () => sendAnalysisMessage(chatId),
                1000 * 60 * SIGNAL_INTERVAL_MINUTES
            );
        } else {
            signalCount = 0;
            currentGameIndex = (currentGameIndex + 1) % games.length;
            setTimeout(
                () => sendChangeGameMessage(chatId),
                1000 * 60 * SIGNAL_INTERVAL_MINUTES
            );
        }
    });
}


// Função para enviar a mensagem de mudança de jogo
// Função para enviar a mensagem de mudança de jogo
function sendChangeGameMessage(chatId) {
    if (currentGameIndex === 0 && signalCount === 0) {
        // Todos os jogos foram percorridos, enviar mensagem de finalização e pausar por 20 minutos
        sendEndSessionMessage(chatId);
        setTimeout(() => startSendingSignals(chatId), 1000 * 60 * 20); // Pausa de 20 minutos
    } else {
        const changeGameMessage =
            "🔄 Atenção à mudança do jogo! \n" +
            "Encontramos outro jogo que está com uma assertividade melhor!! \n" +
            "🎯 A qualquer momento iremos mandar os sinais! 🔔";
        client.sendMessage(chatId, changeGameMessage).then(() => {
            setTimeout(
                () => startSendingSignals(chatId),
                1000 * 60 * SIGNAL_INTERVAL_MINUTES
            );
        });
    }
}


// Função para enviar a mensagem de finalização de sessão
function sendEndSessionMessage(chatId) {
    const endSessionMessage =
        "🚨 SESSÃO FINALIZADA 🚨\n\n" +
        "🌟 Contas novas têm PRIORIDADE, então sempre que conseguir, criem novas contas tocando ✨ e aumente suas chances de LUCRAR 💰🎰\n\n" +
        "Motivo:\n" +
        "Se você utiliza novas contas, você é como se fosse uma nova pessoa para a plataforma, dessa forma ela solta mais prêmios 🎁 no começo para passar uma boa “CREDIBILIDADE” 👍, então LUCRAMOS com mais facilidade 📈\n\n" +
        "👀 FIQUE PRONTO PARA A PRÓXIMA OPERAÇÃO! ⏳";

    client.sendMessage(chatId, endSessionMessage);
}


client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
});

client.on("ready", () => {
    console.log("Bot Online!");
    groupIds.forEach(groupId => {
        startSendingSignals(groupId);
    });
});



client.on('ready', () => {
    console.log('Client is ready!');
    client.getChats().then(chats => {
        const groups = chats.filter(chat => chat.isGroup);
        groups.forEach(group => {
            console.log(`Group Name: ${group.name}, Group ID: ${group.id._serialized}`);
        });
    });
});

client.initialize();
