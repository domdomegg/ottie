import config from './config';

const useAnalytics = config.analytics.enabled && navigator.doNotTrack !== '1';
const streamId = Math.random().toString(36).slice(2);

export const a = useAnalytics
	? (data: unknown) => {
		void fetch(config.analytics.url, {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify({project: 'cs310', streamId, data}),
		});
	}
	: () => {/* noop */};

const debounce = <T extends (...args: unknown[]) => unknown>(fn: T, delayInMiliseconds: number): T => {
	let timeout: NodeJS.Timeout | undefined;
	return ((...args: unknown[]) => {
		if (timeout) {
			clearTimeout(timeout);
		}

		timeout = setTimeout(() => {
			timeout = undefined;
			fn(...args);
		}, delayInMiliseconds);
	}) as any as T;
};

export const b = debounce(a, 1000);

export default a;
