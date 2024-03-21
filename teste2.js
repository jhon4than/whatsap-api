const fs = require('fs');
const correios = require('brazuka-correios');

const cacheFile = "cache_rastreio.json";
let cache = {};

// Carregar cache se existir
if (fs.existsSync(cacheFile)) {
    console.log('Carregando cache existente...');
    cache = JSON.parse(fs.readFileSync(cacheFile));
}

function gerarCodigoAleatorio() {
    const numero = Math.floor(Math.random() * 1e9).toString().padStart(9, '0');
    return `NB${numero}BR`;
}

async function rastrearObjeto(codigo) {
    if (cache.hasOwnProperty(codigo)) {
        return Promise.resolve(cache[codigo]);
    }

    try {
        const resultado = await correios.rastrearObjeto(codigo);
        cache[codigo] = resultado; 
        fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2)); // Atualiza o cache
        return resultado;
    } catch (error) {
        console.error(`Erro ao rastrear o código ${codigo}:`, error);
        return null;
    }
}

async function processarLote(codigos) {
    const resultados = await Promise.all(codigos.map(codigo => rastrearObjeto(codigo)));
    console.log(`Lote processado.`);
    return resultados.filter(resultado => resultado !== null && resultado.length > 0);
}

async function main() {
    const todosCodigos = Array.from({ length: 100 }, gerarCodigoAleatorio); // Gera 100 códigos aleatórios
    const resultados = await processarLote(todosCodigos);
    
    // Inicializando um array para armazenar os resultados válidos
    const resultadosValidos = [];

    // Processando os resultados
    for (const resultado of resultados) {
        if (resultado) { // Verifica se o resultado não é nulo
            // Aqui você pode adicionar lógica adicional para verificar os dados específicos do resultado
            // Por exemplo, se você está procurando por códigos com determinado status ou condição
            resultadosValidos.push(resultado);
        }
    }

    console.log('Resultados Válidos:', resultadosValidos);

    // Salvando os resultados válidos em um arquivo JSON
    fs.writeFileSync('resultados_validos.json', JSON.stringify(resultadosValidos, null, 2));
}

main();
