// A test - extract the information that should not be overridden by a "back" button to
// a specific state
export class NonNavigationState {
	readonly achievementActiveFilter: string;

	public static create(base: NonNavigationState): NonNavigationState {
		return Object.assign(new NonNavigationState(), base);
	}

	public update(base: NonNavigationState): NonNavigationState {
		return Object.assign(new NonNavigationState(), this, base);
	}
}
