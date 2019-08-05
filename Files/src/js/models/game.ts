export class Game {
	readonly fullLogs: string;
	readonly matchInfo: any;
	readonly gameMode: any;

	public findPlayerFromName(name: string) {
		console.log('finding player from name', this.matchInfo, name);
		if (!this.matchInfo || !this.matchInfo.LocalPlayer || !this.matchInfo.OpposingPlayer) {
			return null;
		}
		if (this.matchInfo.LocalPlayer.Name === name) {
			return this.matchInfo.LocalPlayer;
		}
		if (this.matchInfo.OpposingPlayer.Name === name) {
			return this.matchInfo.OpposingPlayer;
		}
		return null;
	}
}
