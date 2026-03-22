import {
	CardClass,
	CardRarity,
	CardType,
	Faction,
	GameTag,
	Mulligan,
	PlayState,
	Race,
	Step,
	Zone,
} from '@firestone-hs/reference-data';
import { GameEntity, PlayerEntity, Tag } from './models';
import { Regexes } from './regexes';
import type { CombinedState } from './state/combined-state';
import type { ParserState } from './state/parser-state';

const tagEnumTypes: Map<GameTag, Record<string, number>> = new Map([
	[GameTag.CARDTYPE, CardType as any],
	[GameTag.CLASS, CardClass as any],
	[GameTag.FACTION, Faction as any],
	[GameTag.PLAYSTATE, PlayState as any],
	[GameTag.RARITY, CardRarity as any],
	[GameTag.MULLIGAN_STATE, Mulligan as any],
	[GameTag.NEXT_STEP, Step as any],
	[GameTag.STEP, Step as any],
	[GameTag.CARDRACE, Race as any],
	[GameTag.ZONE, Zone as any],
]);

export const innkeeperNames = [
	'The Innkeeper', 'Aubergiste', 'Gastwirt',
	'El tabernero', 'Locandiere', '酒場のオヤジ', '여관주인', 'Karczmarz',
	'O Estalajadeiro', 'Хозяин таверны', 'เจ้าของโรงแรม', '旅店老板', '旅店老闆',
];

export const bobTavernNames = [
	'Bartender Bob', "Bob's Tavern", 'Bobs Gasthaus', 'Taberna de Bob',
	'Taverne de Bob', 'Locanda di Bob', 'ボブの酒場', '밥의 선술집',
	'Karczma Boba', 'Taverna do Bob', 'Таверна Боба', 'โรงเตี๊ยมของบ็อบ',
	'鲍勃的酒馆', '鮑伯的旅店',
];

export const mercBotNames = ['QuirkyTurtle', 'CrazyCat', '华丽之虎', '隱祕束褲'];

export class Helper {
	private State: CombinedState;
	private static playerIdCache: Map<string, number> = new Map();

	constructor(state: CombinedState) {
		this.State = state;
	}

	NewGame(): void {
		Helper.playerIdCache.clear();
	}

	ParseEntity(data: string): number {
		if (!data) return 0;

		let match: RegExpExecArray | null = null;
		if (data.includes('id=') && data.includes('[')) {
			match = Regexes.EntityRegex.exec(data);
		}
		if (match) return parseInt(match[1], 10);

		if (data === 'GameEntity') {
			const gameEntity = this.State.GSState.CurrentGame.Data.find(
				(d) => d instanceof GameEntity,
			) as GameEntity | undefined;
			return gameEntity?.Id ?? 0;
		}

		const numeric = parseInt(data, 10);
		if (!isNaN(numeric)) return numeric;

		return this.GetPlayerIdFromName(data);
	}

	GetPlayerIdFromName(data: string): number {
		const cached = Helper.playerIdCache.get(data.toLowerCase());
		if (cached != null) return cached;

		const state = this.State.GSState;
		let validPlayers = state.getPlayers().slice();
		const initialValidPlayers = validPlayers.slice();

		const grouped = new Map<string, PlayerEntity[]>();
		for (const p of validPlayers) {
			const name = p.Name ?? '';
			if (!grouped.has(name)) grouped.set(name, []);
			grouped.get(name)!.push(p);
		}
		for (const [name, group] of grouped) {
			if (group.length > 1) {
				validPlayers = validPlayers.filter((p) => p.Name !== name);
			}
		}
		if (validPlayers.length < 2) {
			validPlayers = initialValidPlayers;
		}

		const firstPlayer = validPlayers.find((x) => x.Id === state.FirstPlayerEntityId);
		if (!firstPlayer) throw new Error('Could not find first player ' + data);

		const secondPlayer = validPlayers.find((x) => x.Id !== state.FirstPlayerEntityId);
		if (!secondPlayer) throw new Error('Could not find second player ' + data);

		let result = -1;

		if (firstPlayer.Name === data) {
			result = firstPlayer.Id;
		} else if (secondPlayer.Name === data) {
			result = secondPlayer.Id;
		} else if (!firstPlayer.Name) {
			if (firstPlayer.AccountHi === '0' && firstPlayer.AccountLo === '0' && state.IsBattlegrounds()) {
				firstPlayer.Name = 'Bartender Bob';
			} else {
				firstPlayer.Name = data;
			}
			firstPlayer.InitialName = innkeeperNames.includes(data)
				? innkeeperNames[0]
				: bobTavernNames.includes(data)
					? bobTavernNames[0]
					: mercBotNames.includes(data)
						? mercBotNames[0]
						: data;
			result = firstPlayer.Id;
		} else if (firstPlayer.Name.includes(data)) {
			result = firstPlayer.Id;
		} else if (data != null && data.includes(firstPlayer.Name)) {
			result = firstPlayer.Id;
		} else if (!secondPlayer.Name) {
			secondPlayer.Name = data;
			secondPlayer.InitialName = innkeeperNames.includes(data)
				? innkeeperNames[0]
				: bobTavernNames.includes(data)
					? bobTavernNames[0]
					: mercBotNames.includes(data)
						? mercBotNames[0]
						: data;
			result = secondPlayer.Id;
		} else if (secondPlayer.Name.includes(data)) {
			result = secondPlayer.Id;
		} else if (data != null && data.includes(secondPlayer.Name)) {
			result = secondPlayer.Id;
		} else if (
			firstPlayer.Name === 'UNKNOWN HUMAN PLAYER' ||
			innkeeperNames.map((x) => x.toLowerCase()).includes(firstPlayer.Name.toLowerCase()) ||
			innkeeperNames.map((x) => x.toLowerCase()).includes((firstPlayer.InitialName ?? '').toLowerCase()) ||
			bobTavernNames.map((x) => x.toLowerCase()).includes(firstPlayer.Name.toLowerCase()) ||
			bobTavernNames.map((x) => x.toLowerCase()).includes((firstPlayer.InitialName ?? '').toLowerCase()) ||
			mercBotNames.map((x) => x.toLowerCase()).includes(firstPlayer.Name.toLowerCase()) ||
			mercBotNames.map((x) => x.toLowerCase()).includes((firstPlayer.InitialName ?? '').toLowerCase())
		) {
			firstPlayer.Name = data;
			result = firstPlayer.Id;
		} else if (
			secondPlayer.Name === 'UNKNOWN HUMAN PLAYER' ||
			innkeeperNames.map((x) => x.toLowerCase()).includes(secondPlayer.Name.toLowerCase()) ||
			innkeeperNames.map((x) => x.toLowerCase()).includes((secondPlayer.InitialName ?? '').toLowerCase()) ||
			bobTavernNames.map((x) => x.toLowerCase()).includes(secondPlayer.Name.toLowerCase()) ||
			bobTavernNames.map((x) => x.toLowerCase()).includes((secondPlayer.InitialName ?? '').toLowerCase()) ||
			mercBotNames.map((x) => x.toLowerCase()).includes(secondPlayer.Name.toLowerCase()) ||
			mercBotNames.map((x) => x.toLowerCase()).includes((secondPlayer.InitialName ?? '').toLowerCase())
		) {
			secondPlayer.Name = data;
			result = secondPlayer.Id;
		} else {
			const idFromState = state.GameState.PlayerIdFromEntityName(data);
			if (idFromState !== 0) {
				result = idFromState;
			} else if (data === 'UNKNOWN HUMAN PLAYER') {
				result = firstPlayer.Id;
			} else if (state.IsBattlegrounds()) {
				const bob =
					firstPlayer.AccountHi === '0'
						? firstPlayer
						: secondPlayer.AccountHi === '0'
							? secondPlayer
							: null;
				if (bob != null) {
					result = bob.Id;
				}
			}
		}

		if (result === -1) {
			throw new Error(
				'Could not get id from player name: ' +
					data +
					' // ' +
					firstPlayer.Name +
					' // ' +
					firstPlayer.InitialName +
					' // ' +
					secondPlayer.Name +
					' // ' +
					secondPlayer.InitialName,
			);
		}

		Helper.playerIdCache.set(data.toLowerCase(), result);
		return result;
	}

	SetName(state: ParserState, playerId: number, playerName: string): void {
		const players = state.getPlayers();
		let oldName: string | null = null;
		for (const entity of players) {
			if (entity.PlayerId === playerId && playerName !== entity.Name) {
				oldName = entity.Name;
				entity.Name = playerName;
			}
		}

		for (const entity of players) {
			if (entity.PlayerId !== playerId) {
				if (playerName === entity.Name) {
					entity.Name = '';
				} else if (oldName != null) {
					entity.Name = oldName;
				}
			}
		}
	}

	ParseTag(tagName: string, value: string): Tag {
		const tag = new Tag();
		tag.Name = this.ParseEnum(GameTag, tagName);

		const tagType = tagEnumTypes.get(tag.Name as GameTag);
		if (tagType) {
			tag.Value = this.ParseEnumFromObject(tagType, value);
		} else {
			const numericValue = parseInt(value, 10);
			if (!isNaN(numericValue)) {
				tag.Value = numericValue;
			} else {
				throw new Error(`Unhandled tag value: ${tagName}=${value}`);
			}
		}
		return tag;
	}

	ParseEnum(enumType: Record<string, any>, tag: string): number {
		if (enumType[tag] !== undefined) {
			return enumType[tag];
		}
		const numeric = parseInt(tag, 10);
		if (!isNaN(numeric)) return numeric;
		return -1;
	}

	private ParseEnumFromObject(enumObj: Record<string, any>, tag: string): number {
		if (enumObj[tag] !== undefined) {
			return enumObj[tag];
		}
		const numeric = parseInt(tag, 10);
		if (!isNaN(numeric)) return numeric;
		return -1;
	}
}
