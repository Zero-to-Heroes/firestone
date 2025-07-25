import { Buffer } from 'buffer';
import 'cross-fetch/polyfill';

(window as any).global = window;

(window as any).process = {
	env: { DEBUG: undefined },
};

global.Buffer = global.Buffer || Buffer;

// Ensure fetch is properly bound to avoid "Illegal invocation" error
if (typeof window !== 'undefined' && window.fetch) {
	const originalFetch = window.fetch;
	window.fetch = function (...args) {
		return originalFetch.apply(window, args);
	};
}
