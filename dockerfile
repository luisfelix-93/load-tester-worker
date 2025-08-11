# ---- Estágio de Build ----
# Usamos uma imagem Node.js como base para construir a aplicação.
# A tag 'builder' nos permite referenciar este estágio posteriormente.
FROM node:22-alpine AS builder

# Define o diretório de trabalho dentro do container
WORKDIR /usr/src/app

# Copia os arquivos de manifesto de pacotes para o diretório de trabalho
# O uso de 'package*.json' garante que tanto package.json quanto package-lock.json sejam copiados
COPY package*.json ./

# Instala todas as dependências, incluindo as de desenvolvimento (necessárias para o build)
RUN npm install

# Copia o restante do código-fonte da aplicação
COPY . .

# Compila o código TypeScript para JavaScript, gerando o diretório 'dist'
RUN npm run build

# ---- Estágio de Produção ----
# Começamos com uma imagem Node.js limpa e leve para a versão final
FROM node:22-alpine

WORKDIR /usr/src/app

# Copia apenas os artefatos necessários do estágio de 'builder'
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/package*.json ./

# Instala SOMENTE as dependências de produção
RUN npm install --omit=dev


# Comando para iniciar o worker quando o container for executado
CMD ["npm", "start"]

