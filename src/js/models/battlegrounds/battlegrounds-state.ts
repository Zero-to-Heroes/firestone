import { BattlegroundsHero } from './battlegrounds-hero';
import { BattlegroundsPlayer } from './battlegrounds-player';

export class BattlegroundsState {
	readonly players: readonly BattlegroundsPlayer[] = [];
	readonly displayedPlayerCardId: string;
	readonly heroSelection: readonly BattlegroundsHero[] = [];
	readonly displayedHero: BattlegroundsHero;

	public static create(): BattlegroundsState {
		return new BattlegroundsState();
	}

	public update(newValue: BattlegroundsState): BattlegroundsState {
		return Object.assign(new BattlegroundsState(), this, newValue);
	}

	public getPlayer(cardId: string): BattlegroundsPlayer {
		return this.players.find(player => player.cardId === cardId) || BattlegroundsPlayer.create(cardId);
	}

	public updatePlayer(player: BattlegroundsPlayer): BattlegroundsState {
		const newPlayers: readonly BattlegroundsPlayer[] = [
			player,
			...this.players.filter(pl => pl.cardId !== player.cardId),
		].sort((a, b) => a.leaderboardPlace - b.leaderboardPlace);
		return Object.assign(new BattlegroundsState(), this, {
			players: newPlayers,
		} as BattlegroundsState);
	}
}
