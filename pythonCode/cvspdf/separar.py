import pandas as pd
import os

# Carrega o arquivo CSV com todos os contatos
all_contacts = pd.read_csv('lista_unica.csv', sep=';')

# Divide os contatos em grupos de 3000
group_size = 3000
num_groups = len(all_contacts) // group_size + 1

# Cria o diretório para salvar os arquivos se ele não existir
output_directory = 'contatos_divididos'
os.makedirs(output_directory, exist_ok=True)

# Divide os contatos em grupos e salva cada grupo em um arquivo CSV
for i in range(num_groups):
    start_idx = i * group_size
    end_idx = min((i + 1) * group_size, len(all_contacts))
    group_contacts = all_contacts.iloc[start_idx:end_idx]
    output_file = os.path.join(output_directory, f'contatos_{i+1}.csv')
    group_contacts.to_csv(output_file, index=False, sep=';')
    print(f'Arquivo {output_file} criado com sucesso.')
