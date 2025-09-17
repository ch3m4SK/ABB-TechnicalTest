FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build --if-present

FROM node:20-alpine AS runtime
WORKDIR /app
RUN npm i -g serve@14
ENV PORT=5173
ENV BUILD_DIR=dist
COPY --from=builder /app /app
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD wget -qO- http://localhost:${PORT} >/dev/null 2>&1 || exit 1
CMD ["sh","-c","test -d /app/${BUILD_DIR} || (echo \"[ERROR] Missing /app/${BUILD_DIR}. Did the build run?\" && ls -la /app && exit 1); serve -s /app/${BUILD_DIR} -l ${PORT}"]
