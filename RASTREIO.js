const axios = require("axios");
const fs = require("fs");

const cacheFile = "cache_rastreio.json";
let cache = {};

// Carregar cache se existir
if (fs.existsSync(cacheFile)) {
    cache = JSON.parse(fs.readFileSync(cacheFile));
}

const prefixo = "NM069574";
const sufixo = "BR";
let contador = 200; // Iniciar a partir do número 200

function gerarCodigoRastreio() {
    // Incrementa o contador a cada chamada da função
    return `${prefixo}${contador++}${sufixo}`;
}
function salvarInformacoesSimplificadas(dados) {
    // Ler dados existentes do arquivo, se existir
    let dadosExistentes = [];
    if (fs.existsSync("rastreio_simplificado.json")) {
        dadosExistentes = JSON.parse(
            fs.readFileSync("rastreio_simplificado.json")
        );
    }

    // Filtrar e preparar os novos dados para serem adicionados
    const novosDados = dados
        .map(({ codigo, data }) => {
            if (!data || !data.module || data.module.length === 0) {
                return null;
            }

            const moduleData = data.module[0];
            const daysNumber = moduleData?.daysNumber;
            const statusDesc = moduleData?.statusDesc;

            // Retorna um objeto se todas as informações necessárias estiverem disponíveis
            // ou se o status for "Awaiting seller dispatch"
            if (
                (codigo && daysNumber && statusDesc) ||
                statusDesc === "Awaiting seller dispatch"
            ) {
                return {
                    codigo,
                    daysNumber: daysNumber || "Sem informação de dias",
                    statusDesc,
                };
            } else {
                return null;
            }
        })
        .filter((item) => item !== null); // Filtrar registros nulos

    // Concatenar os dados existentes com os novos e salvar no arquivo
    fs.writeFileSync(
        "rastreio_simplificado.json",
        JSON.stringify([...dadosExistentes, ...novosDados], null, 2)
    );
}

async function rastrearObjeto(codigo, tentativa = 1) {
    const url = `https://global.cainiao.com/global/detail.json?mailNos=${codigo}&lang=en-U`;

    // Se o código já está no cache, retorna os dados do cache
    if (cache.hasOwnProperty(codigo)) {
        return Promise.resolve(cache[codigo]);
    }

    return new Promise((resolve, reject) => {
        console.log(
            `Iniciando rastreamento para o código: ${codigo}, tentativa: ${tentativa}`
        );
        axios
            .get(url)
            .then((response) => {
                const data = response.data;
                cache[codigo] = data; // Atualiza o cache independente do resultado
                fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2));

                if (data.module && data.module.length > 0) {
                    const daysNumber = data.module[0].daysNumber;
                    if (
                        daysNumber &&
                        parseInt(daysNumber.match(/\d+/)[0], 10) <= 5
                    ) {
                        resolve({ codigo, data });
                    } else {
                        resolve(null);
                    }
                } else {
                    resolve(null);
                }
            })
            .catch((error) => {
                if (tentativa < 3) {
                    setTimeout(() => {
                        resolve(rastrearObjeto(codigo, tentativa + 1));
                    }, 2000 * tentativa);
                } else {
                    console.error(
                        `Erro final na requisição para o código ${codigo}:`,
                        error
                    );
                    reject("Falha na requisição após várias tentativas.");
                }
            });
    });
}

async function processarLote(codigos) {
    const promessas = codigos.map((codigo) => rastrearObjeto(codigo));
    const resultados = await Promise.all(promessas);
    console.log(`Lote processado.`);
    return resultados.filter((resultado) => resultado !== null);
}

async function main() {
    const todosCodigos = Array.from({ length: 1000 }, gerarCodigoRastreio); // Ajuste o comprimento conforme necessário
    const tamanhoLote = 1; // Ajuste o tamanho do lote conforme necessário
    const resultados = [];

    for (let i = 0; i < todosCodigos.length; i += tamanhoLote) {
        const loteCodigos = todosCodigos.slice(i, i + tamanhoLote);
        const resultadosLote = await processarLote(loteCodigos);

        if (Array.isArray(resultadosLote) && resultadosLote.length > 0) {
            salvarInformacoesSimplificadas(resultadosLote);
        }
        console.log(
            `Processando lote de códigos ${i + 1} até ${i + tamanhoLote}`
        );

        if (Array.isArray(resultadosLote)) {
            resultados.push(...resultadosLote);
        } else {
            console.error("Erro: resultadosLote não é um array.");
        }

        if (i % (2 * tamanhoLote) === 0) {
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
            resultados.length = 0;
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
