# おみくじアプリ

SvelteKit (Svelte 5) 製のおみくじアプリ。Vercel に SSR でデプロイする前提の構成です。

## 構成

| パス | 役割 |
| --- | --- |
| `/` | おみくじを引くページ。form action `?/draw` でサーバー抽選 → 記録保存 |
| `/history` | おみくじ記録の一覧ページ |

- 抽選ロジックは [omikuji.ts](src/lib/server/omikuji.ts)（サーバー専用、重み付き抽選）
- 記録の保存・取得は [omikuji-store.ts](src/lib/server/omikuji-store.ts)
- ユーザー識別は [hooks.server.ts](src/hooks.server.ts) で Cookie による匿名 ID を発行

## SSR について

- `adapter-vercel`（`nodejs22.x`）を使用し、Vercel の Serverless Function 上で SSR します。
- [+layout.server.ts](src/routes/+layout.server.ts) で `ssr = true` / `prerender = false` を明示。
- 抽選も保存も `+page.server.ts` の form action 内で完結するため、クライアント JS が無効でも動作します。

## Redis（Upstash）について

**まだ Redis を確保していない状態でもそのまま動きます。**
環境変数が未設定の場合は自動的にインメモリ保存へフォールバックし、
`/history` にその旨のバナーを表示します（Serverless ではインスタンスをまたぐと消えます）。

用意ができたら以下を設定するだけで永続化に切り替わります。

```
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
```

Vercel Marketplace から Upstash を連携すると `KV_REST_API_*` が自動注入されます。
Upstash コンソールから直接コピーする場合は `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` でも可。

### キー設計

- キー: `omikuji:history:<userId>`（Redis List）
- 書き込み: `LPUSH` → `LTRIM 0 (LIMIT-1)` で新しい順に最大 `OMIKUJI_HISTORY_LIMIT` 件（既定 50）
- 読み出し: `LRANGE 0 LIMIT-1`
- REST ベースの `@upstash/redis` を使用しているため、Serverless / Edge どちらでも接続を持ち越さずに済みます。

## 開発

```bash
npm install
npm run dev
```

## デプロイ

```bash
npm i -g vercel
vercel
```

Framework Preset は自動で SvelteKit が選択されます。環境変数は Vercel の Project Settings に登録してください。
