FROM node:bookworm-slim AS builder

ARG TARGETARCH

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

ARG TINI_VERSION=v0.19.0
ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini-static-${TARGETARCH} /tini
RUN chmod +x /tini

FROM gcr.io/distroless/nodejs20-debian12
COPY --from=builder /tini /tini
COPY --from=builder /app/dist/ /app/

ENTRYPOINT ["/tini", "/nodejs/bin/node", "/app/index.js"]
