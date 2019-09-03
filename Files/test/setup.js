global.console = {
	log: jest.fn(), // console.log are ignored in tests
	warn: jest.fn(),
	info: jest.fn(),

	// Keep native behaviour for other methods, use those to print out things in your own tests, not `console.log`
	error: console.error,
	debug: console.debug,
};
