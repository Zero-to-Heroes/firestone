import type { PlayerEntity } from './entity';

export class Player {
	Id: number = 0;
	AccountHi: string = '';
	AccountLo: string = '';
	PlayerId: number = 0;
	Name: string = '';
	Rank: string = '';
	LegendRank: string = '';
	CardID: string = '';
	IsMainPlayer: boolean = false;

	static from(entity: PlayerEntity): Player {
		const player = new Player();
		player.Id = entity.Id;
		player.AccountHi = entity.AccountHi;
		player.AccountLo = entity.AccountLo;
		player.PlayerId = entity.PlayerId;
		player.Name = entity.Name;
		player.Rank = entity.Rank;
		player.LegendRank = entity.LegendRank;
		player.IsMainPlayer = entity.IsMainPlayer;
		return player;
	}
}
