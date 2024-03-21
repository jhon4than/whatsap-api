# Nome do arquivo de entrada e saída
arquivo_entrada = 'result.txt'
arquivo_saida = 'RASTREIO_25.txt'

# Lista para armazenar os números
numeros = []

# Abrir o arquivo de entrada e ler as linhas
with open(arquivo_entrada, 'r', encoding='utf-8') as entrada:
    linhas = entrada.readlines()

# Variável para armazenar o número atual
numero_atual = ''

# Percorrer as linhas do arquivo
for linha in linhas:
    # Verificar se a linha começa com "Number"
    if linha.startswith('Number'):
        # Extrair o número da linha
        numero = linha.split('：', 1)[-1].strip()  # Use apenas a primeira ocorrência dos dois pontos
        numero_atual = numero
    elif linha.startswith('======================================'):
        # Se a linha começar com "======================================",
        # adicionar o número à lista
        if numero_atual:
            numeros.append(numero_atual)
            numero_atual = ''

# Salvar os números em um novo arquivo de texto
with open(arquivo_saida, 'w', encoding='utf-8') as saida:
    for numero in numeros:
        saida.write(numero + '\n')

print(f'Números foram salvos em "{arquivo_saida}"')
