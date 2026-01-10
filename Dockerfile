# Usa Node 20 como base
FROM node:20-alpine

# Directorio de trabajo
WORKDIR /usr/src/app

# Copia package.json y package-lock.json
COPY package*.json ./

# Instala dependencias
RUN npm install

# Copia todo el proyecto
COPY . .

# Expone el puerto de la app
EXPOSE 9090

# Variable de entorno para producción (opcional)
# ENV NODE_ENV=production

# Comando para iniciar la app
CMD ["node", "app/app.js"]
