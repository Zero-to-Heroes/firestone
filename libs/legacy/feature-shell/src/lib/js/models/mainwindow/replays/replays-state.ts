export class ReplaysState {
	readonly isLoading: boolean = true;

	public update(base: ReplaysState): ReplaysState {
		return Object.assign(new ReplaysState(), this, base);
	}
}
