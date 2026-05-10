# Usar imagem oficial do Node
FROM node:20-slim

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar o restante do código
COPY . .

# Expor a porta do Vite
EXPOSE 5173

# Comando para rodar em modo desenvolvimento
CMD ["npm", "run", "dev", "--", "--host"]
