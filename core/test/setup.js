let error = console.error;
console.error = function(message) {
	error.apply(console, [...arguments, new Error().stack]); // keep default behaviour, but log the stack trace
};

global.console = {
	log: jest.fn(), // console.log are ignored in tests
	warn: jest.fn(),
	info: jest.fn(),

	// Keep native behaviour for other methods, use those to print out things in your own tests, not `console.log`
	error: console.error,
	debug: console.debug,
};

let isConsoleError;

beforeEach(() => {
	isConsoleError = false;
	jest.spyOn(global.console, 'error').mockImplementation((...args) => {
		isConsoleError = true;
		// Optional: I've found that jest spits out the errors anyways
		console.debug(...args);
	});
});

afterEach(() => {
	if (isConsoleError) {
		throw new Error('Console warnings and errors are not allowed', isConsoleError);
	}
});

jest.setTimeout(30000); // in milliseconds
