const qrcode = require("qrcode-terminal");
const { Client, MessageMedia, LocalAuth } = require("whatsapp-web.js");
const schedule = require("node-schedule");

// const GROUP_ID = "120363195182514950@g.us"; Grupo Principal
const GROUP_ID = "120363181583253665@g.us";
//const GROUP_ID = "120363195085351965@g.us";
const SIGNAL_INTERVAL_MINUTES = 5;
const SIGNAL_IMAGE_PATH = "./sinal.jpg"; // Certifique-se de que este caminho seja válido para todas as imagens dos jogos

const games = [
    { name: "🐂 Fortune Ox 🐂", image: "./fortune_ox.jpg" },
    { name: "🐭 Fortune Mouse 🐭", image: "./Fortune_mouse.jpg" },
    { name: "🐰 Fortune Rabbit 🐰", image: "./Fortune_rabbit.jpeg" },
    { name: "🐯 Fortune Tiger 🐯", image: "./Fortune_tigger.png" },
];

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
    const signalImageInicial = MessageMedia.fromFilePath(SIGNAL_IMAGE_PATH);
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
    const game = games[currentGameIndex]; // Get the current game from the array
    const gameImage = MessageMedia.fromFilePath(game.image);
    const number_of_games1 = Math.floor(Math.random() * 5) + 5;
    const number_of_games2 = Math.floor(Math.random() * 6) + 2;
    const number_of_games3 = Math.floor(Math.random() * 8) + 5;
    const message = `🍀 OPORTUNIDADE IDENTIFICADA HACKER 10X

${game["name"]}
🟢 Iniciar: Agora
⏰ Validade: 5 minutos
📊 ENTRE E JOGUE NO APLICATIVO

🔃 https://hacker-10x.vercel.app/login 🔃
🎰 𝗣𝗹𝗮𝘁𝗮𝗳𝗼𝗿𝗺𝗮: https://m.phoenix777slots.com/?gfs=gpmhthug
❎ NÃO TENTE EM OUTRO SITE! ❎`;

    client.sendMessage(chatId, gameImage, { caption: message }).then(() => {
        signalCount++;
        if (signalCount < 5) {
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

// Modificação na função sendChangeGameMessage
function sendChangeGameMessage(chatId) {
    if (currentGameIndex === 0 && signalCount === 0) {
        // Todos os jogos foram percorridos, enviar mensagem de finalização e pausar por 20 minutos
        sendEndSessionMessage(chatId);
        setTimeout(() => startSendingSignals(chatId), 1000 * 60 * 50); // Pausa de 20 minutos
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

// client.on('qr', qr => {
//     qrcode.generate(qr, {small: true});
// });

client.on("ready", () => {
    console.log("Bot Online!");
    startSendingSignals(GROUP_ID); // Inicia o processo assim que o bot estiver pronto
});


// client.on('ready', () => {
//     console.log('Client is ready!');
//     client.getChats().then(chats => {
//         const groups = chats.filter(chat => chat.isGroup);
//         groups.forEach(group => {
//             console.log(`Group Name: ${group.name}, Group ID: ${group.id._serialized}`);
//         });
//     });
// });

client.initialize();
