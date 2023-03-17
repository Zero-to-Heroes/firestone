declare global {
	interface Promise<T> {
		/** Adds a timeout (in milliseconds) that will reject the promise when expired. */
		withTimeout(milliseconds: number, ...logInfo: any[]): Promise<T>;
	}
}

/** Adds a timeout (in milliseconds) that will reject the promise when expired. */
Promise.prototype.withTimeout = function (milliseconds, logInfo) {
	return new Promise((resolve, reject) => {
		const timeout = setTimeout(() => {
			console.error('Failed to resolve promise', milliseconds, logInfo);
			resolve(null);
		}, milliseconds);
		return this.then((value) => {
			clearTimeout(timeout);
			resolve(value);
		}).catch((exception) => {
			clearTimeout(timeout);
			reject(exception);
		});
	});
};

export {};

// export const promiseWithTimeout = <T>(promise: Promise<T>, millis: number, ...logInfo: any): Promise<T | null> => {
// 	return Promise.race([
// 		new Promise<null>((resolve) => {
// 			const timeout = setTimeout(() => {
// 				console.error('promise didnt resolve fast enough', millis, ...logInfo);
// 				clearTimeout(timeout);
// 				resolve(null);
// 			}, millis);
// 		}),
// 		promise,
// 	]);
// };
