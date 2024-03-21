const axios = require('axios');

async function consultarRastreio(codigo) {
    const url = `https://global.cainiao.com/global/detail.json?mailNos=${codigo}&lang=en-U`;

    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error('Erro ao consultar a API:', error);
        return null;
    }
}

async function main() {
    const codigoExemplo = "NM062508760BR"; // Exemplo de código de rastreio
    const dadosRastreio = await consultarRastreio(codigoExemplo);

    if (dadosRastreio && dadosRastreio.success) {
        console.log('Dados do Rastreio:', dadosRastreio);
        // Aqui você pode adicionar a lógica para verificar a data
    } else {
        console.log('Nenhum dado encontrado para o código fornecido.');
    }
}

main();
