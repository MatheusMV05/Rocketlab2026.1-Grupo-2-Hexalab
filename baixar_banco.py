import urllib.request
import os
import sys
import re

# ID do arquivo no Google Drive
FILE_ID = "1eAj3-EH3NZzPKtBGgyyNzqhe2yyDy35N"
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
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            content = response.read().decode('utf-8', errors='ignore')
            
            # Novo formato do Google Drive (usa uuid e drive.usercontent.google.com)
            uuid_match = re.search(r'name="uuid" value="([^"]+)"', content)
            if uuid_match:
                uuid_val = uuid_match.group(1)
                url = f"https://drive.usercontent.google.com/download?id={FILE_ID}&export=download&confirm=t&uuid={uuid_val}"
            else:
                # Formato antigo (fallback)
                match = re.search(r'confirm=([0-9A-Za-z_]+)', content)
                if match:
                    confirm_token = match.group(1)
                    url = f"https://drive.google.com/uc?export=download&confirm={confirm_token}&id={FILE_ID}"
        
        # Download real
        print(f"📥 Baixando arquivo (isso pode demorar alguns minutos)...")
        req_download = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req_download) as response, open(ARQUIVO_FINAL, 'wb') as out_file:
            chunk_size = 8192
            while True:
                chunk = response.read(chunk_size)
                if not chunk:
                    break
                out_file.write(chunk)
        
    except Exception as e:
        print(f"❌ Erro ao baixar o arquivo: {e}")
        print("DICA: Verifique se o link do Drive está como 'Qualquer pessoa com o link'.")
        sys.exit(1)

    if os.path.exists(ARQUIVO_FINAL):
        print(f"✅ Sucesso! Banco de dados pronto em {ARQUIVO_FINAL}")
    else:
        print("⚠️ Aviso: O arquivo database.db não foi baixado corretamente.")

if __name__ == "__main__":
    baixar_banco()
