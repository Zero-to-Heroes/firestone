export class Logger {
	static Log: (msg1: any, msg2: any) => void = (msg1, msg2) => {
		console.log(msg1 + ', ' + msg2);
	};
}
