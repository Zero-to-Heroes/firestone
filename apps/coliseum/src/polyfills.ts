import { Buffer } from 'buffer';
import 'cross-fetch/polyfill';

(window as any).global = window;

(window as any).process = {
	env: { DEBUG: undefined },
};

global.Buffer = global.Buffer || Buffer;
