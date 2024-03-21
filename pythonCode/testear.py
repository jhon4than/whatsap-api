import gspread
from oauth2client.service_account import ServiceAccountCredentials

def main():
    SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
    APPLICATION_NAME = 'Engenharia de Software Desafio Gabriel Monteiro da Fonseca'
    SPREADSHEET_ID = '1GDhQEIPBA70Z5PGXrlzS35IO61vRWavhQ_lCvLWEYeE'
    SHEET_NAME = 'Engenharia de Software - Desafio Gabriel Monteiro da Fonseca'
    CREDENTIALS_FILE_PATH = './client_id.json'

    try:
        creds = authenticate(CREDENTIALS_FILE_PATH)

        # Autenticação com o Google Sheets
        gc = gspread.service_account(filename=CREDENTIALS_FILE_PATH)
        sh = gc.open(SHEET_NAME)
        worksheet = sh.sheet1

        # Lê os valores da planilha
        values = worksheet.get_all_values()

        if values:
            for row in values:
                print(' '.join(row))

            # Calcule seu resultado aqui
            # Por exemplo, vamos supor que queremos somar dois valores
            value1 = int(values[0][0])
            value2 = int(values[0][1])
            result = value1 + value2

            # Escreva o resultado na planilha
            worksheet.update('C1', [[result]])
        else:
            print('No data found.')
    except Exception as ex:
        print(f'An error occurred: {ex}')

def authenticate(credentials_file_path):
    SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
    creds = None

    try:
        creds = ServiceAccountCredentials.from_json_keyfile_name(
            credentials_file_path, SCOPES)
    except Exception as ex:
        print(f'An error occurred during authentication: {ex}')

    return creds

if __name__ == '__main__':
    main()
