const fs = require("fs");
const request = require("request");
const cheerio = require("cheerio");
const uri = "https://global.cainiao.com/";

function converterParaData(strData) {
    const partes = strData.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (partes) {
        const dia = parseInt(partes[1], 10);
        const mes = parseInt(partes[2], 10) - 1;
        const ano = parseInt(partes[3], 10);
        return new Date(ano, mes, dia);
    }
    return null;
}

function extrairDadosRastreio(html) {
  let ultimoStatus = { status: "", data: "", entregue: false, destino: "Destino ainda não definido" };

  // Inverte a ordem dos blocos de status para começar do mais recente
  const statusBlocks = html(".linha_status").toArray();

  for (const block of statusBlocks) {
      const statusText = html(block).find('li:contains("Status")').text();
      const dataText = html(block).find('li:contains("Data")').text();
      const destinoText = html(block).find('li:contains("Destino:")').text();

      if (statusText && dataText && ultimoStatus.status === "") {
          ultimoStatus.status = statusText.replace("Status:", "").trim();
          ultimoStatus.data = dataText.replace("Data  :", "").split('|')[0].trim();
      }

      if (destinoText && ultimoStatus.destino === "Destino ainda não definido") {
          ultimoStatus.destino = destinoText.replace("Destino:", "").trim();
      }

      if (statusText.includes("Objeto entregue ao destinatário")) {
          ultimoStatus.entregue = true;
      }

      // Se já encontrou o status e a data, mas ainda não tem destino, continua procurando
      if (ultimoStatus.status !== "" && ultimoStatus.data !== "" && ultimoStatus.destino !== "Destino ainda não definido") {
          break;
      }
  }

  return ultimoStatus;
}


function rastrearObjeto(codigo) {
    console.log(`Rastreando o código: ${codigo}`);
    return new Promise((resolve, reject) => {
        request(uri + codigo, function (error, response, body) {
            if (error || response.statusCode !== 200) {
                reject(`Erro na requisição para ${codigo}: ${error}`);
            } else {
                try {
                    const html = cheerio.load(body);
                    console.log(body);
                    const rastreio = extrairDadosRastreio(html);
                    console.log(rastreio);
                    resolve(rastreio);
                } catch (err) {
                    reject(`Erro ao processar os dados para ${codigo}: ${err}`);
                }
            }
        });
    });
}

async function verificarEntregas(codigos) {
    const resultados = [];
    for (let codigo of codigos) {
        try {
            const rastreio = await rastrearObjeto(codigo);
            resultados.push({ codigo, ...rastreio });
        } catch (error) {
            console.error(error);
        }
    }
    return resultados;
}

function formatarDadosParaTexto(dados) {
    return dados
        .map(
            (d) =>
                `Código: ${d.codigo}\nStatus: ${d.status}\nData: ${d.data}\nEntregue: ${d.entregue}\nDestino: ${d.destino}\n\n`
        )
        .join("");
}

async function main() {
  console.log("Iniciando a leitura dos códigos de rastreamento do arquivo.");
  const conteudoArquivo = fs.readFileSync("RASTREIO_0.txt", "utf8");
  const codigos = conteudoArquivo.split("\n").filter(Boolean);

  console.log("Iniciando o processo de verificação das entregas.");
  const entregas = await verificarEntregas(codigos);
  const dadosFormatados = formatarDadosParaTexto(entregas);

  // Obter data e hora atuais
  const agora = new Date();
  const dataFormatada = agora.toLocaleDateString('pt-BR');
  const horaFormatada = agora.toLocaleTimeString('pt-BR');

  // Preparar o cabeçalho com data e hora
  const cabecalho = `Consulta realizada em: ${dataFormatada} às ${horaFormatada}\n\n`;

  console.log("Salvando os resultados.");
  fs.writeFileSync("resultados_rastreamento.txt", cabecalho + dadosFormatados);
  console.log("Processamento concluído.");
}

main();

