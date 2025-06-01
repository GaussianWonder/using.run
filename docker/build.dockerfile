FROM oven/bun:1.2.15-alpine AS build

WORKDIR /app

COPY bun.lock package.json ./

RUN bun install --frozen-lockfile

COPY . .

RUN bun run build

FROM oven/bun:1.2.15-alpine

WORKDIR /app

COPY --from=build /app/.output/ /app/

ARG PORT=3000
ENV NUXT_PORT=${PORT}
ENV NUXT_HOST=0.0.0.0

ENV NODE_ENV=production

EXPOSE $PORT

CMD [ "node", "server/index.mjs" ]
