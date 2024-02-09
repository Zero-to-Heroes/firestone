export interface ParsingStructure {
	currentTurn: number;

	entities: {
		[entityId: string]: {
			entityId: number;
			cardId: string;
			tribe: number;
			controller: number;
			zone: number;
			zonePosition: number;
			cardType: number;
			atk: number;
			health: number;
			divineShield: boolean;
			poisonous: boolean;
			taunt: boolean;
			reborn: boolean;
			creatorEntityId: number;
			creatorDBId: number;
			topDeck: boolean;
			transformedFromCard: number;
		};
	};
}
