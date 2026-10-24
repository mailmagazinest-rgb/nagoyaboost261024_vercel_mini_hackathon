import type { LayoutServerLoad } from './$types';

// SSR で動かす（プリレンダリングしない）
export const ssr = true;
export const prerender = false;

export const load: LayoutServerLoad = async ({ locals }) => {
	return { userId: locals.userId };
};
