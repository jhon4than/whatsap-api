# coding:utf-8
import requests
import hashlib
import base64
import json

# Substitua as chaves de autenticação pelas suas próprias chaves
appKey = '198901'
appSecret = '638b21d11279f3a0f8412b4909b91750'

# Escolha o ambiente apropriado (formal, pré-lançamento, sandbox) conforme suas necessidades
url = 'https://link.cainiao.com/gateway/link.do'

headers = {
    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
}

results = ''  # Armazena os resultados

def get_address():
    try:
        with open('address.txt', 'r', encoding='utf-8') as f:
            address = f.readlines()
        return address
    except Exception as e:
        print('Falha ao abrir o arquivo de endereços:', str(e))
        return []

def get_param(sign, content):
    param = {
        'msg_type': 'API_QUERY_REALTIME_TRACK',
        'data_digest': sign,
        'logistic_provider_id': '638b21d11279f3a0f8412b4909b91750',
        'logistics_interface': content
    }
    return param

def get_data_digest(inputs, appSecret):
    m1 = hashlib.md5()
    m1.update((inputs + appSecret).encode('utf-8'))
    return base64.b64encode(m1.digest()).decode('utf-8')

address_list = get_address()

for x in address_list:
    # Converte unicode para caracteres chineses, remove espaços em branco
    inputs = json.dumps({"mailNo": x.strip()}, ensure_ascii=False).replace(' ', '')

    result = requests.post(url, data=get_param(get_data_digest(inputs, appSecret), inputs), headers=headers)
    result = result.content.decode(encoding='utf-8')
    results = results + result + '\r\n'

try:
    with open('result.txt', 'w', encoding='utf-8') as f:
        f.write(results)
        print("Escrita dos resultados concluída com sucesso")
except Exception as e:
    print("Falha ao escrever o arquivo de resultados:", str(e))
