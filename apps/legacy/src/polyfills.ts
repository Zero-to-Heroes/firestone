import { Buffer } from 'buffer';

(window as any).global = window;

(window as any).process = {
	env: { DEBUG: undefined },
	version: 'v22.0.0', // Mock Node.js version
};
// (window as any).vm = {
// 	createContext: () => ({}),
// 	runInContext: (code: string, context: any) => {
// 		return eval(code);
// 	},
// };

global.Buffer = global.Buffer || Buffer;
