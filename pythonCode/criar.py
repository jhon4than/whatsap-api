prefixo = "NM154940"
sufixo = "BR"
contador = 100
quantidade_codigos = 1000
codigos_por_arquivo = 100

# Inicializa o número do arquivo
numero_arquivo = 1

# Lista para armazenar os códigos gerados
codigos = []

# Gerar os códigos e adicioná-los à lista
for _ in range(quantidade_codigos):
    codigo = f"{prefixo}{contador}{sufixo}"
    codigos.append(codigo)
    contador += 1

    # Verifica se é hora de salvar os códigos em um novo arquivo
    if len(codigos) == codigos_por_arquivo:
        with open(f"codigos_rastreio_{numero_arquivo}.txt", "w") as arquivo:
            for codigo in codigos:
                arquivo.write(codigo + "\n")
        print(
            f"{codigos_por_arquivo} códigos de rastreio foram gerados e salvos em 'codigos_rastreio_{numero_arquivo}.txt'."
        )
        numero_arquivo += 1
        codigos = []

# Verifica se há códigos restantes para salvar em um arquivo
if codigos:
    with open(f"codigos_rastreio_{numero_arquivo}.txt", "w") as arquivo:
        for codigo in codigos:
            arquivo.write(codigo + "\n")
    print(
        f"{len(codigos)} códigos de rastreio foram gerados e salvos em 'codigos_rastreio_{numero_arquivo}.txt'."
    )

print(
    f"Total de {quantidade_codigos} códigos de rastreio foram gerados e salvos em arquivos separados."
)
