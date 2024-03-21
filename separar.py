import json
from datetime import datetime

# Função para converter a string de data para um objeto datetime
def converter_data(data_str):
    return datetime.strptime(data_str.split('|')[0].strip(), "Data  : %d/%m/%Y")

# Ler dados do arquivo JSON
with open('resultados_rastreio.json', 'r') as file:
    dados_json = json.load(file)

# Data de início para o filtro
data_inicio = datetime(2023, 12, 6)
# Data atual
data_atual = datetime.now()

# Filtrar dados entre 08/12/2023 e a data atual
dados_filtrados = [d for d in dados_json if data_inicio <= converter_data(d["rastreio"]["data"]) <= data_atual]

# Verificar por códigos repetidos
codigos = [d["codigo"] for d in dados_filtrados]
codigos_unicos = set(codigos)
codigos_repetidos = set([c for c in codigos if codigos.count(c) > 1])

# Exibir dados repetidos, se houver
if codigos_repetidos:
    print("Dados repetidos encontrados:")
    for codigo in codigos_repetidos:
        print(codigo)

# Escrever códigos em um arquivo TXT
with open("codigos.txt", "w") as arquivo:
    for codigo in codigos_unicos:
        arquivo.write(codigo + "\n")
