import urllib.request
import zipfile
import os
import sys
import re

# ID do arquivo no Google Drive
FILE_ID = "1eAj3-EH3NZzPKtBGgyyNzqhe2yyDy35N"
DESTINO_ZIP = "backend/data/database.zip"
PASTA_DATA = "backend/data"
ARQUIVO_FINAL = os.path.join(PASTA_DATA, "database.db")

def get_confirm_token(response):
    for key, value in response.getheaders():
        if key.lower() == 'set-cookie' and 'download_warning' in value:
            return value.split('download_warning_')[1].split('=')[0]
    return None

def baixar_banco():
    if not os.path.exists(PASTA_DATA):
        os.makedirs(PASTA_DATA)

    if os.path.exists(ARQUIVO_FINAL):
        print(f"✅ O banco de dados já existe em: {ARQUIVO_FINAL}")
        return

    print(f"🚀 Iniciando download do banco de dados (Google Drive)...")
    
    url = f"https://drive.google.com/uc?export=download&id={FILE_ID}"
    
    try:
        # Primeira tentativa para pegar o token de confirmação de arquivos grandes
        with urllib.request.urlopen(url) as response:
            content = response.read().decode('utf-8', errors='ignore')
            match = re.search(r'confirm=([0-9A-Za-z_]+)', content)
            if match:
                confirm_token = match.group(1)
                url = f"https://drive.google.com/uc?export=download&confirm={confirm_token}&id={FILE_ID}"
        
        # Download real
        print("📥 Baixando arquivo ZIP (isso pode demorar alguns minutos)...")
        urllib.request.urlretrieve(url, DESTINO_ZIP)
        
    except Exception as e:
        print(f"❌ Erro ao baixar o arquivo: {e}")
        print("DICA: Verifique se o link do Drive está como 'Qualquer pessoa com o link'.")
        sys.exit(1)

    print("📦 Extraindo arquivo ZIP...")
    try:
        with zipfile.ZipFile(DESTINO_ZIP, 'r') as zip_ref:
            zip_ref.extractall(PASTA_DATA)
        print("✨ Extração concluída!")
    except Exception as e:
        print(f"❌ Erro ao extrair o arquivo ZIP: {e}")
        sys.exit(1)
    finally:
        if os.path.exists(DESTINO_ZIP):
            os.remove(DESTINO_ZIP)

    if os.path.exists(ARQUIVO_FINAL):
        print(f"✅ Sucesso! Banco de dados pronto em {ARQUIVO_FINAL}")
    else:
        print("⚠️ Aviso: O arquivo database.db não foi encontrado após a extração.")

if __name__ == "__main__":
    baixar_banco()
