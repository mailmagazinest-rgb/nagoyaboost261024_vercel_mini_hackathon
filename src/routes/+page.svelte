<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let drawing = $state(false);

	const rankTone: Record<string, string> = {
		大吉: '#c9a227',
		中吉: '#b3261e',
		小吉: '#b3261e',
		吉: '#3f6d4e',
		末吉: '#3f6d4e',
		凶: '#4a4a4a',
		大凶: '#2b2b2b'
	};
</script>

<svelte:head>
	<title>おみくじ</title>
	<meta name="description" content="SvelteKit 製のおみくじアプリ" />
</svelte:head>

<section class="card">
	<h1>今日の運勢を占う</h1>
	<p class="lead">おみくじを引くと、結果が自動で記録に残ります。</p>

	<form
		method="POST"
		action="?/draw"
		use:enhance={() => {
			drawing = true;
			return async ({ update }) => {
				await update({ reset: false });
				drawing = false;
			};
		}}
	>
		<button type="submit" disabled={drawing}>
			{drawing ? '引いています…' : 'おみくじを引く'}
		</button>
	</form>

	{#if form?.result}
		<div class="result" style="--tone: {rankTone[form.result.rank] ?? 'var(--accent)'}">
			<p class="rank">{form.result.rank}</p>
			<p class="message">{form.result.message}</p>
			<dl>
				<div><dt>ラッキーカラー</dt><dd>{form.result.lucky.color}</dd></div>
				<div><dt>ラッキーアイテム</dt><dd>{form.result.lucky.item}</dd></div>
				<div><dt>ラッキーナンバー</dt><dd>{form.result.lucky.number}</dd></div>
			</dl>
			{#if !form.persisted}
				<p class="warn">
					※ 記録は一時保存です（Redis 未接続）。Upstash を設定すると永続化されます。
				</p>
			{/if}
		</div>
	{:else if data.lastDrawnAt}
		<p class="note">
			前回引いた日時: {new Date(data.lastDrawnAt).toLocaleString('ja-JP')}
		</p>
	{/if}

	<p class="note">
		<a href="/history">おみくじ記録を見る →</a>
	</p>
</section>

<style>
	.card {
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: 1rem;
		padding: 2rem 1.5rem;
		text-align: center;
	}

	h1 {
		margin: 0 0 0.25rem;
		font-size: 1.4rem;
	}

	.lead {
		margin: 0 0 1.75rem;
		color: var(--muted);
		font-size: 0.9rem;
	}

	button {
		font: inherit;
		font-weight: 700;
		padding: 0.85rem 2.5rem;
		border: none;
		border-radius: 999px;
		background: var(--accent);
		color: #fff;
		cursor: pointer;
	}

	button:disabled {
		opacity: 0.6;
		cursor: progress;
	}

	.result {
		margin-top: 2rem;
		padding-top: 1.5rem;
		border-top: 1px dashed var(--line);
	}

	.rank {
		margin: 0;
		font-size: 3rem;
		font-weight: 800;
		letter-spacing: 0.1em;
		color: var(--tone);
	}

	.message {
		margin: 0.5rem 0 1.5rem;
	}

	dl {
		display: grid;
		gap: 0.5rem;
		margin: 0;
		text-align: left;
		max-width: 20rem;
		margin-inline: auto;
	}

	dl > div {
		display: flex;
		justify-content: space-between;
		border-bottom: 1px solid var(--line);
		padding-bottom: 0.25rem;
	}

	dt {
		color: var(--muted);
		font-size: 0.85rem;
	}

	dd {
		margin: 0;
		font-weight: 600;
	}

	.warn {
		margin-top: 1.25rem;
		font-size: 0.75rem;
		color: var(--muted);
	}

	.note {
		margin-top: 1.5rem;
		font-size: 0.85rem;
		color: var(--muted);
	}

	.note a {
		color: var(--accent);
	}
</style>
