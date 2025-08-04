import { Buffer } from 'buffer';
import 'cross-fetch/polyfill';

(window as any).global = window;

(window as any).process = {
	env: { DEBUG: undefined },
	version: 'v22.0.0', // Mock Node.js version
};

global.Buffer = global.Buffer || Buffer;
