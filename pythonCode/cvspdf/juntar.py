import pandas as pd
from faker import Faker

# Inicializa o Faker para gerar dados fictícios
fake = Faker(['pt_BR'])

# Carrega os arquivos CSV
lista1 = pd.read_csv('lista1.csv', sep=';')
lista3 = pd.read_csv('lista3.csv', sep=';', header=None, names=['email', 'phone', 'data'])

# Carrega o arquivo XLSX
lista2 = pd.read_excel('lista2.xlsx', header=None, names=['name', 'email', 'phone'])

# Preenche os dados ausentes com informações fictícias
lista1['name'].fillna(fake.name(), inplace=True)
lista1['cpf'].fillna(fake.cpf(), inplace=True)
lista2['name'].fillna(fake.name(), inplace=True)

# Converte os números de telefone para strings
lista1['phone'] = lista1['phone'].astype(str)
lista2['phone'] = lista2['phone'].astype(str)
lista3['phone'] = lista3['phone'].astype(str)

# Formata os números de telefone
def format_phone(phone):
    return '+55' + ''.join(filter(str.isdigit, phone))

lista1['phone'] = lista1['phone'].apply(format_phone)
lista2['phone'] = lista2['phone'].apply(format_phone)
lista3['phone'] = lista3['phone'].apply(format_phone)

# Concatena os dataframes
result = pd.concat([lista1[['name', 'email', 'phone']], lista2[['name', 'email', 'phone']], lista3[['email', 'phone']]])

# Salva o resultado em um arquivo CSV
result.to_csv('lista_unica.csv', index=False, sep=';')
