export const formatLogArg = (arg: unknown, replacer?: (string | number)[] | null): string => {
	if (arg === null || arg === undefined) {
		return String(arg);
	}
	if (arg instanceof Error) {
		return `${arg.name}: ${arg.message}\n${arg.stack || ''}`;
	}
	if (typeof arg === 'object') {
		try {
			return JSON.stringify(arg, replacer ?? undefined);
		} catch (e) {
			return String(arg);
		}
	}
	return String(arg);
};
