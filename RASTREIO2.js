const axios = require("axios");
const fs = require("fs");
const { randomInt } = require("crypto"); // Para gerar números aleatórios

const cacheFile = "cache_rastreio.json";
let cache = {};

// Carregar cache se existir
if (fs.existsSync(cacheFile)) {
    cache = JSON.parse(fs.readFileSync(cacheFile));
}

const prefixo = "NM0";
const sufixo = "BR";
let contador = 69583574;

const agentesUsuario = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/100.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Firefox/100.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_0) AppleWebKit/537.36 (KHTML, like Gecko) Safari/100.0.0.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Version/100.0.0.0 Chrome/100.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Opera/100.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:100.0) Gecko/20100101 Firefox/100.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Edge/100.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; Trident/7.0; AS; rv:11.0) like Gecko",
];

function gerarCodigoRastreio(qtd) {
    let codigos = [];
    for (let i = 0; i < qtd; i++) {
        codigos.push(`${prefixo}${contador++}${sufixo}`);
    }
    return codigos;
}

function salvarInformacoesSimplificadas(dados) {
    let dadosExistentes = [];
    if (fs.existsSync("rastreio_simplificado.json")) {
        dadosExistentes = JSON.parse(
            fs.readFileSync("rastreio_simplificado.json")
        );
    }

    const dadosFiltrados = dados.flatMap((dado) => {
        if (!dado.data || !dado.data.module) {
            return [];
        }

        return dado.data.module
            .filter(
                (item) =>
                    (item.daysNumber === "1\tday(s)" && item.statusDesc) ||
                    item.statusDesc === "Awaiting seller dispatch"
            )
            .map((item) => {
                // Não inclui 'daysNumber' se o status for 'Awaiting seller dispatch'
                return item.statusDesc === "Awaiting seller dispatch"
                    ? {
                          codigo: item.mailNo,
                          statusDesc: item.statusDesc,
                      }
                    : {
                          codigo: item.mailNo,
                          daysNumber: item.daysNumber,
                          statusDesc: item.statusDesc,
                      };
            });
    });

    const dadosParaSalvar = [...dadosExistentes, ...dadosFiltrados];

    fs.writeFileSync(
        "rastreio_simplificado.json",
        JSON.stringify(dadosParaSalvar, null, 2)
    );
}

async function rastrearObjeto(codigos, tentativa = 1) {
    const url = `https://global.cainiao.com/global/detail.json?mailNos=${codigos.join(
        ","
    )}&lang=en-US`;

    // Ajuste na checagem de cache
    const cacheKey = codigos.join(",");
    if (cache.hasOwnProperty(cacheKey)) {
        return Promise.resolve(cache[cacheKey]);
    }

    const agenteUsuarioAleatorio =
        agentesUsuario[randomInt(0, agentesUsuario.length - 1)];
    const delay = randomInt(1000, 3000);
    await new Promise((resolve) => setTimeout(resolve, delay));

    return new Promise((resolve, reject) => {
        console.log(
            `Iniciando rastreamento para os códigos: ${codigos}, tentativa: ${tentativa}`
        );
        axios
            .get(url, { headers: { "User-Agent": agenteUsuarioAleatorio } })
            .then((response) => {
                const data = response.data;
                cache[cacheKey] = data;
                fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2));
                resolve({ codigos, data });
            })
            .catch((error) => {
                if (tentativa < 3) {
                    setTimeout(() => {
                        resolve(rastrearObjeto(codigos, tentativa + 1));
                    }, 2000 * tentativa);
                } else {
                    console.error(
                        `Erro final na requisição para os códigos ${codigos}:`,
                        error
                    );
                    reject("Falha na requisição após várias tentativas.");
                }
            });
    });
}

async function processarLote(codigos) {
    const resultado = await rastrearObjeto(codigos);
    console.log(`Lote processado.`);
    return resultado ? [resultado] : []; // Retorna um array com o resultado ou um array vazio
}

async function main() {
    const todosCodigos = gerarCodigoRastreio(1000); // Gera 1000 códigos
    const tamanhoLote = 100; // Define o tamanho do lote como 100

    for (let i = 0; i < todosCodigos.length; i += tamanhoLote) {
        const todosCodigos = gerarCodigoRastreio(1000);
        const tamanhoLote = 100;

        for (let i = 0; i < todosCodigos.length; i += tamanhoLote) {
            const loteCodigos = todosCodigos.slice(i, i + tamanhoLote);
            const resultadoLote = await processarLote(loteCodigos);

            if (Array.isArray(resultadoLote) && resultadoLote.length > 0) {
                salvarInformacoesSimplificadas(resultadoLote);
            }

            console.log(
                `Processando lote de códigos ${i + 1} até ${i + tamanhoLote}`
            );

            await new Promise((resolve) => setTimeout(resolve, 120000));
        }
    }

    if (resultados.length > 0) {
        if (fs.existsSync("resultados_rastreio_new.json")) {
            let dadosExistentes = JSON.parse(
                fs.readFileSync("resultados_rastreio_new.json")
            );
            dadosExistentes.push(...resultados);
            fs.writeFileSync(
                "resultados_rastreio_new.json",
                JSON.stringify(dadosExistentes, null, 2)
            );
        } else {
            fs.writeFileSync(
                "resultados_rastreio_new.json",
                JSON.stringify(resultados, null, 2)
            );
        }
    }
}

main();
