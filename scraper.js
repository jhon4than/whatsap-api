const request = require('request');
const cheerio = require('cheerio');
const uri = "https://www.linkcorreios.com.br/";

module.exports = function (code) {
    return new Promise((resolve, reject) => {
        request(uri + code, function (error, response, body) {
            if (error || response.statusCode !== 200) {
                return reject('Falha na requisição ou status HTTP inválido.');
            }

            try {
                const html = cheerio.load(body);
                const rastreio = extrairDadosRastreio(html);
                resolve({ rastreio, status_code: response.statusCode });
            } catch (err) {
                reject('Erro ao processar os dados.');
            }
        });
    });
}

function extrairDadosRastreio(html) {
    const ret = [];
    html('.linha_status').each(function () {
        const status = html(this).find('li:contains("Status")').text();
        const data = html(this).find('li:contains("Data")').text();
        const local = html(this).find('li:contains("Local")').text();
        const origem = html(this).find('li:contains("Origem")').text();
        const destino = html(this).find('li:contains("Destino")').text();

        ret.push({ status, data, local, origem, destino });
    });
    return ret.reverse();
}
