import type { Handle } from '@sveltejs/kit';

const USER_COOKIE = 'omikuji_uid';
const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * 匿名ユーザーIDを Cookie で発行し、locals に載せる。
 * おみくじ記録を「誰の記録か」で束ねるためのキーになる。
 */
export const handle: Handle = async ({ event, resolve }) => {
	let userId = event.cookies.get(USER_COOKIE);

	if (!userId) {
		userId = crypto.randomUUID();
		event.cookies.set(USER_COOKIE, userId, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: !event.url.hostname.includes('localhost'),
			maxAge: ONE_YEAR
		});
	}

	event.locals.userId = userId;
	return resolve(event);
};
