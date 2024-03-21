const fs = require("fs");
const request = require("request");
const cheerio = require("cheerio");
const async = require('async');
const uri = "https://track24.net/?code=";

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
    // return `${prefixo}${contador++}${sufixo}`;
    return `NM069574919BR`;
}


// function gerarCodigoRastreio() {
//     const prefixo = "NB";
//     const sufixo = "BR";
//     let numero;

//     do {
//         contador++;
//         numero = contador.toString().padStart(9, '0');
//     } while (cache.hasOwnProperty(prefixo + numero + sufixo))

//     return prefixo + numero + sufixo;
// }
// let contador = 980023570; // Ponto inicial do contador

// function gerarCodigoRastreio() {
//     const prefixo = "NB";
//     const sufixo = "BR";

//     // Incrementa o contador para gerar o próximo número
//     contador++;

//     // Garante que o número tenha sempre 9 dígitos (ajusta conforme a necessidade)
//     const numero = contador.toString().padStart(9, '0');

//     // Retorna o código completo
//     return prefixo + numero + sufixo;
// }

// function gerarCodigoRastreio() {
//     const prefixo = "NB9";
//     const numeros = Math.random().toString().slice(2, 10);
//     return prefixo + numeros + "BR";
// }

// function gerarCodigoRastreio() {
//     const letras = "NB";
//     const numeros = Math.random().toString().slice(2, 11);
//     return letras + numeros + "BR";
// }
// function gerarCodigoRastreio() {
//     const prefixo = "NB";
//     const sufixo = "BR";

//     // Gerar os três primeiros dígitos, variando entre 950 e 999
//     const tresPrimeirosDigitos = Math.floor(950 + Math.random() * 50);

//     // Gerar os seis últimos dígitos de forma aleatória
//     const seisUltimosDigitos = Math.floor(100000 + Math.random() * 900000);

//     return prefixo + tresPrimeirosDigitos + seisUltimosDigitos + sufixo;
// }

function converterParaData(strData) {
    const partes = strData.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (partes) {
        const dia = parseInt(partes[1], 10);
        const mes = parseInt(partes[2], 10) - 1; // mês começa do 0 em JavaScript
        const ano = parseInt(partes[3], 10);
        return new Date(ano, mes, dia);
    }
    return null;
}

function compararDatasSemHora(data1, data2) {
    return (
        data1.getDate() === data2.getDate() &&
        data1.getMonth() === data2.getMonth() &&
        data1.getFullYear() === data2.getFullYear()
    );
}

function filtrarPorData(rastreio, dataDesejada) {
    return rastreio.filter((evento) => {
        const dataEvento = converterParaData(evento.data);
        return dataEvento && compararDatasSemHora(dataEvento, dataDesejada);
    });
}

function rastrearObjeto(codigo, tentativa = 1) {
    // Verifica se o código já está no cache
    if (cache.hasOwnProperty(codigo)) {
        return Promise.resolve(cache[codigo]);
    }

    return new Promise((resolve, reject) => {
        console.log(`Iniciando rastreamento para o código: ${codigo}, tentativa: ${tentativa}`);
        request(uri + codigo, function (error, response, body) {
            if (error || response.statusCode !== 200) {
                if (tentativa < 3) {
                    // Número máximo de retentativas
                    console.log(`Erro na requisição para ${codigo}. Tentando novamente em ${2 * tentativa} segundos.`);
                    setTimeout(() => {
                        resolve(rastrearObjeto(codigo, tentativa + 1));
                    }, 2000 * tentativa); // Backoff exponencial
                } else {
                    console.error(`Erro final na requisição para o código ${codigo}:`, error);
                    reject("Falha na requisição após várias tentativas.");
                }
            } else {
                try {
                    const html = cheerio.load(body);
                    
                    // Salva o HTML em um arquivo
                    const nomeArquivo = `pagina_${codigo}.html`; // Nome do arquivo com base no código
                    fs.writeFileSync(nomeArquivo, html.html()); // Salva o corpo da resposta no arquivo

                    const rastreio = extrairDadosRastreio(html);
                    console.log(`Rastreamento concluído para o código: ${codigo}`);

                    // Salva no cache e escreve no arquivo
                    cache[codigo] = rastreio;
                    fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2));

                    resolve(rastreio);
                } catch (err) {
                    console.error(`Erro ao processar os dados para o código ${codigo}:`, err);
                    reject("Erro ao processar os dados.");
                }
            }
        });
    });
}

function extrairDadosRastreio(html) {
    const rastreio = [];
    const trackingInfoRows = html(".trackingInfoRow");

    trackingInfoRows.each(function () {
        const data = $(this).find(".date b").text().trim();
        const hora = $(this).find(".time").text().trim();
        const status = $(this).find(".operationAttribute").text().trim();
        const tipoOperacao = $(this).find(".operationType").text().trim();
        const localOperacao = $(this).find(".operationPlace").text().trim();

        rastreio.push({ data, hora, status, tipoOperacao, localOperacao });
    });
    console.log(rastreio);
    return rastreio;
}


async function processarLote(codigos) {
    const limiteConcorrencia = 100; // Ajuste conforme necessário
    const delayEntreSolicitacoes = 5000; // Defina o tempo de atraso em milissegundos (5 segundos neste exemplo)

    return new Promise((resolve, reject) => {
        async.parallelLimit(
            codigos.map((codigo, index) => {
                return callback => {
                    // Adiciona um atraso antes de cada solicitação
                    setTimeout(() => {
                        rastrearObjeto(codigo)
                            .then(rastreio => {
                                if (rastreio && rastreio.length > 0) {
                                    callback(null, { codigo, rastreio: rastreio[0] });
                                } else {
                                    callback(null, null);
                                }
                            })
                            .catch(error => {
                                console.error(`Erro ao rastrear o código ${codigo}:`, error);
                                callback(error, null);
                            });
                    }, index * delayEntreSolicitacoes); // Aplica um atraso incremental com base no índice
                };
            }),
            limiteConcorrencia,
            (err, resultados) => {
                if (err) {
                    console.error('Erro no processamento:', err);
                    reject(err);
                } else {
                    console.log('Lote processado.');
                    resolve(resultados.filter(resultado => resultado !== null));
                }
            }
        );
    });
}


async function main() {
    const startTime = new Date();
    const resultados = [];
    console.log("Iniciando o script de rastreamento...");
    
    // Gera uma lista de códigos de rastreio
    const todosCodigos = Array.from({ length: 10000000 }, gerarCodigoRastreio);
    const tamanhoLote = 10;

    for (let i = 0; i < todosCodigos.length; i += tamanhoLote) {
        const loteCodigos = todosCodigos.slice(i, i + tamanhoLote);

        try {
            // Processa cada lote de códigos
            const resultadosLote = await processarLote(loteCodigos);
            console.log(`Processando lote de códigos ${i + 1} até ${i + tamanhoLote}`);

            if (Array.isArray(resultadosLote)) {
                resultados.push(...resultadosLote);
            } else {
                console.error('Erro: resultadosLote não é um array.');
            }
        } catch (error) {
            console.error('Erro ao processar lote:', error);
        }

        // Salva os resultados periodicamente
        if (i % (2 * tamanhoLote) === 0) {
            const arquivoResultado = "resultados_rastreio.json";
            let dadosExistentes = [];

            // Verifica se o arquivo existe e lê os dados existentes
            if (fs.existsSync(arquivoResultado)) {
                dadosExistentes = JSON.parse(fs.readFileSync(arquivoResultado));
            }

            dadosExistentes.push(...resultados);
            fs.writeFileSync(arquivoResultado, JSON.stringify(dadosExistentes, null, 2));

            // Limpa o array de resultados para evitar duplicação
            resultados.length = 0;
        }
    }

    // Salva os resultados finais no fim do script
    if (resultados.length > 0) {
        const arquivoResultadoFinal = "resultados_rastreio.json";
        let dadosExistentes = [];

        if (fs.existsSync(arquivoResultadoFinal)) {
            dadosExistentes = JSON.parse(fs.readFileSync(arquivoResultadoFinal));
        }

        dadosExistentes.push(...resultados);
        fs.writeFileSync(arquivoResultadoFinal, JSON.stringify(dadosExistentes, null, 2));
    }

    const endTime = new Date();
    console.log(`Script concluído. Tempo total de execução: ${(endTime - startTime) / 1000} segundos.`);
}

main();
