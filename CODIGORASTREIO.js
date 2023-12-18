const fs = require("fs");
const request = require("request");
const cheerio = require("cheerio");
const uri = "https://www.linkcorreios.com.br/";

function gerarCodigoRastreio() {
    const prefixo = "NB99";
    const numeros = Math.random().toString().slice(2, 9);
    return prefixo + numeros + "BR";
}

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
    return new Promise((resolve, reject) => {
        console.log(
            `Iniciando rastreamento para o código: ${codigo}, tentativa: ${tentativa}`
        );
        request(uri + codigo, function (error, response, body) {
            if (error || response.statusCode !== 200) {
                if (tentativa < 3) {
                    // Número máximo de retentativas
                    console.log(
                        `Erro na requisição para ${codigo}. Tentando novamente em ${
                            2 * tentativa
                        } segundos.`
                    );
                    setTimeout(() => {
                        resolve(rastrearObjeto(codigo, tentativa + 1));
                    }, 2000 * tentativa); // Backoff exponencial
                } else {
                    console.error(
                        `Erro final na requisição para o código ${codigo}:`,
                        error
                    );
                    reject("Falha na requisição após várias tentativas.");
                }
            } else {
                try {
                    const html = cheerio.load(body);
                    const rastreio = extrairDadosRastreio(html);
                    console.log(
                        `Rastreamento concluído para o código: ${codigo}`
                    );
                    resolve(rastreio);
                } catch (err) {
                    console.error(
                        `Erro ao processar os dados para o código ${codigo}:`,
                        err
                    );
                    reject("Erro ao processar os dados.");
                }
            }
        });
    });
}

function extrairDadosRastreio(html) {
    const ret = [];
    html(".linha_status").each(function () {
        const status = html(this).find('li:contains("Status")').text();
        const data = html(this).find('li:contains("Data")').text();

        // Filtrar apenas os eventos com status "Objeto postado"
        if (status.includes("Objeto postado")) {
            ret.push({ status, data });
        }
    });
    return ret;
}

async function processarLote(codigos) {
    const promessas = codigos.map(codigo =>
        rastrearObjeto(codigo)
            .then(rastreio => {
                if (rastreio && rastreio.length > 0) {
                    return { codigo, rastreio: rastreio[0] }; // Retorna apenas o primeiro evento (Objeto postado)
                }
                return null;
            })
            .catch(error => {
                console.error(`Erro ao rastrear o código ${codigo}:`, error);
                return null;
            })
    );

    const resultados = await Promise.all(promessas);
    console.log(`Lote processado.`);
    return resultados.filter(resultado => resultado !== null);
}

async function main() {
    const startTime = new Date();
    const resultados = [];
    console.log("Iniciando o script de rastreamento...");
    const todosCodigos = Array.from({ length: 10000000 }, gerarCodigoRastreio);
    const tamanhoLote = 5;

    for (let i = 0; i < todosCodigos.length; i += tamanhoLote) {
        const loteCodigos = todosCodigos.slice(i, i + tamanhoLote);
        const resultadosLote = await processarLote(loteCodigos);
        console.log(`Processando lote de códigos ${i + 1} até ${i + tamanhoLote}`);

        if (Array.isArray(resultadosLote)) {
            resultados.push(...resultadosLote);
        } else {
            console.error('Erro: resultadosLote não é um array.');
        }

        // Salvar periodicamente
        if (i % (2 * tamanhoLote) === 0) {
            // Verifica se o arquivo existe
            if (fs.existsSync("resultados_rastreio.json")) {
                // Lê os dados existentes e anexa os novos resultados
                let dadosExistentes = JSON.parse(
                    fs.readFileSync("resultados_rastreio.json")
                );
                dadosExistentes.push(...resultados);
                fs.writeFileSync(
                    "resultados_rastreio.json",
                    JSON.stringify(dadosExistentes, null, 2)
                );
            } else {
                // Cria um novo arquivo se ele não existir
                fs.writeFileSync(
                    "resultados_rastreio.json",
                    JSON.stringify(resultados, null, 2)
                );
            }
            // Limpa o array de resultados para evitar duplicação na próxima gravação
            resultados.length = 0;
        }
    }

    // Salvar os resultados finais no fim do script
    if (resultados.length > 0) {
        if (fs.existsSync("resultados_rastreio.json")) {
            let dadosExistentes = JSON.parse(
                fs.readFileSync("resultados_rastreio.json")
            );
            dadosExistentes.push(...resultados);
            fs.writeFileSync(
                "resultados_rastreio.json",
                JSON.stringify(dadosExistentes, null, 2)
            );
        } else {
            fs.writeFileSync(
                "resultados_rastreio.json",
                JSON.stringify(resultados, null, 2)
            );
        }
    }
}

main();
