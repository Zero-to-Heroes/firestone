import { GameTag } from '@firestone-hs/reference-data';
import type { GameState } from './game-state';

export class PlayerReport {
	TotalHealth: number = 0;
	DamageTaken: number = 0;
	ArmorLeft: number = 0;

	static buildPlayerReport(state: GameState, id: number): PlayerReport {
		const playerState = state.GetPlayerHeroEntity(id)!;
		const report = new PlayerReport();
		report.TotalHealth = playerState.GetTag(GameTag.HEALTH);
		report.DamageTaken = playerState.GetTag(GameTag.DAMAGE, 0);
		report.ArmorLeft = playerState.GetTag(GameTag.ARMOR, 0);
		return report;
	}
}
