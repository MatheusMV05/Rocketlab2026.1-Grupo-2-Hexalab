import os
import sqlite3
import urllib.request
import re

# Configurações
DB_PATH = os.path.join("backend", "data", "database.db")
EXPECTED_SIZE_MB = 864
FILE_ID = "1eAj3-EH3NZzPKtBGgyyNzqhe2yyDy35N"

def format_bytes(size):
    power = 2**10
    n = 0
    power_labels = {0 : '', 1: 'K', 2: 'M', 3: 'G', 4: 'T'}
    while size > power:
        size /= power
        n += 1
    return f"{size:.2f} {power_labels[n]}B"

def testar_conexao_drive():
    print("🔍 1. Testando disponibilidade no Google Drive...")
    url = f"https://drive.google.com/uc?export=download&id={FILE_ID}"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            content = response.read().decode('utf-8', errors='ignore')
            
            if 'name="uuid"' in content:
                print("✅ Link do Google Drive está acessível e pronto para download.")
            else:
                print("⚠️  Aviso: O formato da página do Drive mudou ou o link está inacessível.")
    except Exception as e:
        print(f"❌ Erro ao acessar o Google Drive: {e}")

def verificar_arquivo_local():
    print(f"\n📁 2. Verificando arquivo local: {DB_PATH}")
    if not os.path.exists(DB_PATH):
        print(f"❌ Erro: O arquivo {DB_PATH} não foi encontrado!")
        print("DICA: Rode 'python baixar_banco.py' primeiro.")
        return False
    
    size_bytes = os.path.getsize(DB_PATH)
    print(f"📏 Tamanho encontrado: {format_bytes(size_bytes)}")
    
    size_mb = size_bytes / (1024 * 1024)
    if abs(size_mb - EXPECTED_SIZE_MB) < 50:
        print(f"✅ O tamanho parece correto (~{EXPECTED_SIZE_MB} MB).")
    else:
        print(f"⚠️  Aviso: O tamanho ({size_mb:.2f} MB) é diferente do esperado ({EXPECTED_SIZE_MB} MB).")
    return True

def testar_integridade_sqlite():
    print("\n🗄️ 3. Testando integridade do banco de dados (SQLite)...")
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        # Tenta listar as tabelas
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' LIMIT 5;")
        tables = cursor.fetchall()
        
        if tables:
            print(f"✅ Conexão bem-sucedida! Tabelas encontradas: {', '.join([t[0] for t in tables])}...")
        else:
            print("⚠️  Conectado, mas o banco parece estar vazio (nenhuma tabela encontrada).")
            
        conn.close()
    except Exception as e:
        print(f"❌ Erro ao ler o arquivo como SQLite: {e}")
        print("DICA: O arquivo pode estar corrompido ou não ser um banco de dados SQLite válido.")

if __name__ == "__main__":
    print("=== DIAGNÓSTICO DO BANCO DE DADOS ===\n")
    testar_conexao_drive()
    if verificar_arquivo_local():
        testar_integridade_sqlite()
    print("\n=====================================")
