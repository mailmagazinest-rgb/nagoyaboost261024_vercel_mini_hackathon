<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const formatDate = (iso: string) =>
		new Date(iso).toLocaleString('ja-JP', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
</script>

<svelte:head>
	<title>おみくじ記録</title>
</svelte:head>

<h1>おみくじ記録</h1>

{#if !data.storageReady}
	<p class="banner">
		Redis（Upstash）が未接続のため、記録は一時的にしか保持されません。環境変数
		<code>KV_REST_API_URL</code> / <code>KV_REST_API_TOKEN</code> を設定すると永続化されます。
	</p>
{/if}

{#if data.records.length === 0}
	<p class="empty">まだ記録がありません。<a href="/">おみくじを引く</a></p>
{:else}
	<ul>
		{#each data.records as record (record.id)}
			<li>
				<span class="rank">{record.rank}</span>
				<div class="body">
					<p class="message">{record.message}</p>
					<p class="meta">
						{formatDate(record.drawnAt)} ・ {record.luckyColor} / {record.luckyItem} / {record.luckyNumber}
					</p>
				</div>
			</li>
		{/each}
	</ul>
{/if}

<style>
	h1 {
		font-size: 1.2rem;
		margin: 0 0 1rem;
	}

	.banner {
		background: var(--surface);
		border: 1px solid var(--line);
		border-left: 3px solid var(--accent);
		border-radius: 0.5rem;
		padding: 0.75rem 1rem;
		font-size: 0.8rem;
		color: var(--muted);
	}

	.banner code {
		font-size: 0.75rem;
	}

	.empty {
		color: var(--muted);
	}

	ul {
		list-style: none;
		padding: 0;
		margin: 1rem 0 0;
		display: grid;
		gap: 0.75rem;
	}

	li {
		display: flex;
		gap: 1rem;
		align-items: flex-start;
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: 0.75rem;
		padding: 0.9rem 1rem;
	}

	.rank {
		font-weight: 800;
		font-size: 1.1rem;
		min-width: 3.5rem;
		color: var(--accent);
	}

	.body {
		flex: 1;
		min-width: 0;
	}

	.message {
		margin: 0;
		font-size: 0.9rem;
	}

	.meta {
		margin: 0.35rem 0 0;
		font-size: 0.75rem;
		color: var(--muted);
	}
</style>
