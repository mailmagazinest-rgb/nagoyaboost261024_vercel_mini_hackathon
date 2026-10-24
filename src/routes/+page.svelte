<script lang="ts">
	import { onMount } from 'svelte';

	const cities = {
		nagoya: ['名古屋市', 35.1815, 136.9066],
		toyota: ['豊田市', 35.083, 137.156],
		okazaki: ['岡崎市', 34.955, 137.173],
		toyohashi: ['豊橋市', 34.770, 137.391],
		ichinomiya: ['一宮市', 35.303, 136.803],
		nishio: ['西尾市', 34.862, 137.062],
		handa: ['半田市', 34.894, 136.938],
		gamagori: ['蒲郡市', 34.826, 137.219],
		shinshiro: ['新城市', 34.9, 137.498]
	} as const;

	type CityKey = keyof typeof cities;
	type ForecastResponse = {
		current: {
			temperature_2m: number | null;
			relative_humidity_2m: number | null;
			apparent_temperature: number | null;
			precipitation: number | null;
			weather_code: number;
			wind_speed_10m: number | null;
			is_day: number;
		};
		hourly: {
			time: string[];
			temperature_2m: Array<number | null>;
			precipitation_probability: Array<number | null>;
			weather_code: number[];
			is_day: number[];
		};
		daily: {
			temperature_2m_max: Array<number | null>;
			temperature_2m_min: Array<number | null>;
			precipitation_probability_max: Array<number | null>;
			sunrise: string[];
			sunset: string[];
		};
	};
	type HourView = {
		time: string;
		condition: string;
		icon: string;
		temperature: number | null;
		precipitation: number | null;
	};

	let city = $state<CityKey>('nagoya');
	let forecast = $state<ForecastResponse | null>(null);
	let hourly = $state<HourView[]>([]);
	let loading = $state(true);
	let errorMessage = $state('');
	let forecastDate = $state('今日の天気');
	let clock = $state('日本時間');
	let updatedAt = $state('更新日時：--');
	let controller: AbortController | undefined;

	const jDate = (date: Date) =>
		new Intl.DateTimeFormat('ja-JP', {
			timeZone: 'Asia/Tokyo',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			weekday: 'long'
		}).format(date);

	const jTime = (date: Date) =>
		new Intl.DateTimeFormat('ja-JP', {
			timeZone: 'Asia/Tokyo',
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		}).format(date);

	function describe(code: number, day = true): [string, string] {
		if (code === 0) return ['快晴', day ? '☀️' : '🌙'];
		if (code === 1) return ['晴れ', day ? '🌤️' : '🌙'];
		if (code === 2) return ['晴れ時々くもり', day ? '⛅' : '☁️'];
		if (code === 3) return ['くもり', '☁️'];
		if ([45, 48].includes(code)) return ['霧', '🌫️'];
		if ([51, 53, 55, 56, 57].includes(code)) return ['霧雨', '🌦️'];
		if ([61, 63, 65, 66, 67].includes(code)) return ['雨', '🌧️'];
		if ([71, 73, 75, 77, 85, 86].includes(code)) return ['雪', '🌨️'];
		if ([80, 81, 82].includes(code)) return ['にわか雨', '🌦️'];
		if ([95, 96, 99].includes(code)) return ['雷雨', '⛈️'];
		return ['天気不明', '🌤️'];
	}

	function round(value: number | null, unit = '') {
		return value === null ? '--' : Math.round(value) + unit;
	}

	function formatHour(time: string) {
		return time.slice(11, 16);
	}

	function tip(precipitation: number | null, high: number | null, wind: number | null) {
		const advice: string[] = [];
		if ((precipitation ?? 0) >= 60) {
			advice.push('雨が降る可能性が高いため、傘を持って出かけましょう。');
		} else if ((precipitation ?? 0) >= 30) {
			advice.push('にわか雨に備えて、折りたたみ傘があると安心です。');
		} else {
			advice.push('降水確率は比較的低めです。');
		}
		if (high !== null && high >= 30) {
			advice.push('日中は暑くなりそうです。こまめに水分補給を。');
		} else if (high !== null && high <= 15) {
			advice.push('気温が低めです。羽織れるものを用意しましょう。');
		}
		if (wind !== null && wind >= 30) {
			advice.push('風が強いため、屋外での活動には注意してください。');
		}
		return advice.join(' ');
	}

	async function loadForecast() {
		const [, latitude, longitude] = cities[city];
		controller?.abort();
		const request = new AbortController();
		controller = request;
		loading = true;
		errorMessage = '';
		forecast = null;
		hourly = [];

		const params = new URLSearchParams({
			latitude: String(latitude),
			longitude: String(longitude),
			timezone: 'Asia/Tokyo',
			forecast_days: '1',
			current:
				'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,is_day',
			hourly: 'temperature_2m,precipitation_probability,weather_code,is_day',
			daily:
				'temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset'
		});

		try {
			const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
				signal: request.signal,
				cache: 'no-store'
			});
			if (!response.ok) throw new Error(`HTTP ${response.status}`);

			const data = (await response.json()) as ForecastResponse;
			if (!data.current || !data.hourly || !data.daily) {
				throw new Error('必要なデータを取得できませんでした');
			}
			if (controller !== request) return;

			const now = new Date();
			forecast = data;
			forecastDate = `${jDate(now)} の予報`;
			clock = `${jTime(now)} JST`;
			updatedAt = `確認日時：${jDate(now)} ${jTime(now)}（日本時間）`;

			const currentHour = Number(
				new Intl.DateTimeFormat('en-GB', {
					timeZone: 'Asia/Tokyo',
					hour: '2-digit',
					hourCycle: 'h23'
				}).format(now)
			);
			let startIndex = data.hourly.time.findIndex(
				(time) => Number(time.slice(11, 13)) >= currentHour
			);
			if (startIndex < 0) startIndex = 0;

			hourly = data.hourly.time
				.map((time, index) => ({
					time,
					condition: describe(data.hourly.weather_code[index], data.hourly.is_day[index] === 1)[0],
					icon: describe(data.hourly.weather_code[index], data.hourly.is_day[index] === 1)[1],
					temperature: data.hourly.temperature_2m[index],
					precipitation: data.hourly.precipitation_probability[index]
				}))
				.filter((_, index) => index >= startIndex);
		} catch (reason) {
			if (reason instanceof Error && reason.name === 'AbortError') return;
			const detail = reason instanceof Error ? reason.message : String(reason);
			errorMessage = `天気情報を取得できませんでした。インターネット接続を確認して、再度お試しください。（${detail}）`;
		} finally {
			if (controller === request) loading = false;
		}
	}

	function changeCity(event: Event) {
		city = (event.currentTarget as HTMLSelectElement).value as CityKey;
		void loadForecast();
	}

	onMount(() => {
		void loadForecast();
		return () => controller?.abort();
	});
</script>

<svelte:head>
	<title>愛知の空 | 今日の天気</title>
	<meta name="description" content="愛知県内9地域の今日の天気と時間ごとの予報を確認できます。" />
	<meta name="theme-color" content="#102b48" />
</svelte:head>

<main class="wrap">
	<header class="top">
		<div>
			<div class="brand">☀ 愛知の空 <span style="font-weight: 400">|</span> 天気予報</div>
			<div class="muted">今日のお出かけを、もっと快適に。</div>
		</div>
		<div class="tag" aria-label="現在の時刻">{clock}</div>
	</header>

	<section class="hero" class:loading aria-label="現在の天気">
		<div class="selectrow">
			<div>
				<div class="hero-meta">{forecastDate}</div>
				<h1>{cities[city][0]}</h1>
			</div>
			<label>
				<span class="muted location-label">地域を選択</span>
				<select aria-label="愛知県内の地域" value={city} onchange={changeCity}>
					<option value="nagoya">名古屋市</option>
					<option value="toyota">豊田市</option>
					<option value="okazaki">岡崎市</option>
					<option value="toyohashi">豊橋市</option>
					<option value="ichinomiya">一宮市</option>
					<option value="nishio">西尾市</option>
					<option value="handa">半田市</option>
					<option value="gamagori">蒲郡市</option>
					<option value="shinshiro">新城市</option>
				</select>
			</label>
		</div>

		{#if forecast}
			<div class="large">
				<div class="weather-emoji">{describe(forecast.current.weather_code, forecast.current.is_day === 1)[1]}</div>
				<div>
					<div class="temp">{round(forecast.current.temperature_2m, '°')}</div>
					<div class="weather-text">{describe(forecast.current.weather_code, forecast.current.is_day === 1)[0]}</div>
					<div class="hero-meta">
						体感温度 {round(forecast.current.apparent_temperature, '°')} ・ 現在の天気
					</div>
				</div>
			</div>
		{:else}
			<div class="large" aria-live="polite">
				<div class="weather-emoji">☁️</div>
				<div>
					<div class="temp">--°</div>
					<div class="weather-text">{loading ? '予報を取得中…' : '取得できませんでした'}</div>
					<div class="hero-meta">最新の天気情報を読み込みます</div>
				</div>
			</div>
		{/if}

		<div class="stats">
			<div class="stat">
				<div class="muted">🌡 最高 / 最低</div>
				<strong>
					{forecast ? round(forecast.daily.temperature_2m_max[0], '°') : '--°'}
					/
					{forecast ? round(forecast.daily.temperature_2m_min[0], '°') : '--°'}
				</strong>
			</div>
			<div class="stat">
				<div class="muted">☂ 今日の降水確率</div>
				<strong>
					{forecast ? round(forecast.daily.precipitation_probability_max[0], '%') : '--%'}
				</strong>
			</div>
			<div class="stat">
				<div class="muted">💨 風速</div>
				<strong>{forecast ? round(forecast.current.wind_speed_10m, ' km/h') : '-- km/h'}</strong>
			</div>
		</div>
	</section>

	{#if errorMessage}
		<div class="err" role="alert">{errorMessage}</div>
	{/if}

	<div class="cards">
		<section class="card">
			<h2>時間ごとの天気 <span class="muted section-note">（今日）</span></h2>
			<div class="hourly" aria-live="polite">
				{#if hourly.length > 0}
					{#each hourly as hour, index (hour.time)}
						<div class="hour">
							<div class="muted">{index === 0 ? '今から' : hour.time.slice(11, 16)}</div>
							<div class="ico" title={hour.condition}>{hour.icon}</div>
							<b>{round(hour.temperature, '°')}</b>
							<div class="rain">☂ {round(hour.precipitation, '%')}</div>
						</div>
					{/each}
				{:else}
					<div class="muted">{loading ? '天気データを取得中です…' : 'データを表示できません'}</div>
				{/if}
			</div>
		</section>

		<section class="card">
			<h2>今日のポイント</h2>
			<div class="detail">
				<div><span>☂ 現在の降水量</span><strong>{forecast ? round(forecast.current.precipitation, ' mm') : '-- mm'}</strong></div>
				<div><span>💧 湿度</span><strong>{forecast ? round(forecast.current.relative_humidity_2m, '%') : '--%'}</strong></div>
				<div><span>🌅 日の出</span><strong>{forecast ? forecast.daily.sunrise[0].slice(11, 16) : '--:--'}</strong></div>
				<div><span>🌇 日の入り</span><strong>{forecast ? forecast.daily.sunset[0].slice(11, 16) : '--:--'}</strong></div>
			</div>
			<div class="advice">
				{forecast
					? tip(
							forecast.daily.precipitation_probability_max[0],
							forecast.daily.temperature_2m_max[0],
							forecast.current.wind_speed_10m
						)
					: '予報をもとに、お出かけのヒントを表示します。'}
			</div>
		</section>
	</div>

	<footer class="foot">
		<div>
			<div>{updatedAt}</div>
			<div>データ提供: <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a>（数値予報モデル）</div>
			<div>
				※地域の代表地点の予報です。警報・注意報は
				<a href="https://www.jma.go.jp/bosai/" target="_blank" rel="noopener">気象庁</a>でご確認ください。
			</div>
		</div>
		<button class="refresh" type="button" onclick={() => void loadForecast()} disabled={loading}>
			{loading ? '読み込み中…' : '↻ 最新情報に更新'}
		</button>
	</footer>
</main>
