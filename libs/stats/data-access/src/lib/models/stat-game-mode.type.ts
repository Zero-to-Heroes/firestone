import { GameType } from '@firestone-hs/reference-data';

export type StatGameModeType =
	| 'unknown'
	| 'arena'
	| 'arena-draft'
	| 'casual'
	| 'friendly'
	| 'practice'
	| 'ranked'
	| 'tutorial'
	| 'tavern-brawl'
	| 'battlegrounds'
	| 'battlegrounds-friendly'
	| 'duels'
	| 'mercenaries-ai-vs-ai'
	| 'mercenaries-pve'
	| 'mercenaries-pve-coop'
	| 'mercenaries-pvp'
	| 'mercenaries-friendly'
	| 'paid-duels';

export const toGameTypeEnum = (gameType: StatGameModeType): GameType => {
	switch (gameType) {
		case 'unknown':
			return GameType.GT_UNKNOWN;
		case 'practice':
			return GameType.GT_VS_AI;
		case 'friendly':
			return GameType.GT_VS_FRIEND;
		case 'tutorial':
			return GameType.GT_TUTORIAL;
		case 'arena':
			return GameType.GT_ARENA;
		case 'ranked':
			return GameType.GT_RANKED;
		case 'casual':
			return GameType.GT_CASUAL;
		case 'tavern-brawl':
			return GameType.GT_TAVERNBRAWL;
		case 'battlegrounds':
			return GameType.GT_BATTLEGROUNDS;
		case 'battlegrounds-friendly':
			return GameType.GT_BATTLEGROUNDS_FRIENDLY;
		case 'mercenaries-ai-vs-ai':
			return GameType.GT_MERCENARIES_AI_VS_AI;
		case 'mercenaries-friendly':
			return GameType.GT_MERCENARIES_FRIENDLY;
		case 'mercenaries-pve':
			return GameType.GT_MERCENARIES_PVE;
		case 'mercenaries-pvp':
			return GameType.GT_MERCENARIES_PVP;
		case 'mercenaries-pve-coop':
			return GameType.GT_MERCENARIES_PVE_COOP;
		case 'duels':
			return GameType.GT_PVPDR;
		case 'paid-duels':
			return GameType.GT_PVPDR_PAID;
		default:
			console.warn('unsupported game type', gameType);
			return GameType.GT_UNKNOWN;
	}
};

export const toGameType = (gameType: GameType): StatGameModeType => {
	switch (gameType) {
		case GameType.GT_UNKNOWN:
			return 'unknown';
		case GameType.GT_VS_AI:
			return 'practice';
		case GameType.GT_VS_FRIEND:
			return 'friendly';
		case GameType.GT_TUTORIAL:
			return 'tutorial';
		case GameType.GT_ARENA:
			return 'arena';
		case GameType.GT_RANKED:
			return 'ranked';
		case GameType.GT_CASUAL:
			return 'casual';
		case GameType.GT_TAVERNBRAWL:
		case GameType.GT_TB_1P_VS_AI:
		case GameType.GT_TB_2P_COOP:
		case GameType.GT_FSG_BRAWL_VS_FRIEND:
		case GameType.GT_FSG_BRAWL:
		case GameType.GT_FSG_BRAWL_1P_VS_AI:
		case GameType.GT_FSG_BRAWL_2P_COOP:
			return 'tavern-brawl';
		case GameType.GT_BATTLEGROUNDS:
			return 'battlegrounds';
		case GameType.GT_BATTLEGROUNDS_FRIENDLY:
		case GameType.GT_BATTLEGROUNDS_AI_VS_AI:
		case GameType.GT_BATTLEGROUNDS_PLAYER_VS_AI:
			return 'battlegrounds-friendly';
		case GameType.GT_MERCENARIES_AI_VS_AI:
			return 'mercenaries-ai-vs-ai';
		case GameType.GT_MERCENARIES_FRIENDLY:
			return 'mercenaries-friendly';
		case GameType.GT_MERCENARIES_PVE:
			return 'mercenaries-pve';
		case GameType.GT_MERCENARIES_PVP:
			return 'mercenaries-pvp';
		case GameType.GT_MERCENARIES_PVE_COOP:
			return 'mercenaries-pve-coop';
		case GameType.GT_PVPDR:
			return 'duels';
		case GameType.GT_PVPDR_PAID:
			return 'paid-duels';
		default:
			console.warn('unsupported game type', gameType);
			return 'unknown';
	}
};
