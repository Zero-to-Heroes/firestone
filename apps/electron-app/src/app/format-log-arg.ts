/** Compact JSON below this length; larger objects are pretty-printed for readability. */
export const COMPACT_LOG_THRESHOLD = 500;

export const formatLogArg = (arg: unknown, replacer?: (string | number)[] | null): string => {
	if (arg === null || arg === undefined) {
		return String(arg);
	}
	if (arg instanceof Error) {
		return `${arg.name}: ${arg.message}\n${arg.stack || ''}`;
	}
	if (typeof arg === 'object') {
		try {
			const compact = JSON.stringify(arg, replacer ?? undefined);
			if (compact.length <= COMPACT_LOG_THRESHOLD) {
				return compact;
			}
			return JSON.stringify(arg, replacer ?? undefined, 2);
		} catch (e) {
			return String(arg);
		}
	}
	return String(arg);
};
