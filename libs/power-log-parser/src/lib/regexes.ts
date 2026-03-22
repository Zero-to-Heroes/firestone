const Entity = `(GameEntity|UNKNOWN HUMAN PLAYER|\\[.+\\]|\\d+|.+)`;

export class Regexes {
	static EntityWithNameAndId = new RegExp(`\\[entityName=(.+) id=(\\d+) .*\\]`);
	static PowerlogLineRegex = new RegExp(`^D ([\\d:.]+) ([^(]+)\\(\\) - (.+)$`);
	static EntityRegex = new RegExp(`\\[.*\\s*id=(\\d+)\\s*.*\\]`);

	static ResetStartMatchRegex = new RegExp(`BLOCK_START BlockType=GAME_RESET Entity=${Entity}`);

	static ChoicesChoiceRegex = new RegExp(
		`id=(\\d+) Player=${Entity} TaskList=(\\d+)? ChoiceType=(\\w+) CountMin=(\\d+) CountMax=(\\d+)$`,
	);
	static ChoicesSourceRegex = new RegExp(`Source=${Entity}$`);
	static ChoicesEntitiesRegex = new RegExp(`Entities\\[(\\d+)\\]=(\\[.+\\])$`);
	static ChoicesWaitingForInput = new RegExp(`id=(\\d+) BEGIN$`);

	static GameEntityRegex = new RegExp(`GameEntity EntityID=(\\d+)`);
	static ActionCreategamePlayerRegex = new RegExp(
		`Player EntityID=(\\d+) PlayerID=(\\d+) GameAccountId=\\[hi=(\\d+) lo=(\\d+)\\]$`,
	);
	static ActionStartRegex = new RegExp(
		`BLOCK_START (?:SubType|BlockType)=(\\w+) Entity=${Entity} EffectCardId=(.*) EffectIndex=(-1|\\d+) Target=${Entity} SubOption=(-1|\\d+)(?: TriggerKeyword=(.*))?$`,
	);

	static PlayerNameAssignment = new RegExp(`PlayerID=(\\d+), PlayerName=(.+)`);

	static BuildNumber = new RegExp(`BuildNumber=(\\d+)`);
	static GameType = new RegExp(`GameType=(\\w+)`);
	static FormatType = new RegExp(`FormatType=(\\w+)`);
	static ScenarioID = new RegExp(`ScenarioID=(\\d+)`);

	static ActionMetadataRegex = new RegExp(`META_DATA - Meta=(\\w+) Data=${Entity} (?:Info|InfoCount)=(\\d+)`);
	static ActionMetaDataInfoRegex = new RegExp(`Info\\[(\\d+)\\] = ${Entity}`);

	static ActionChangeEntityRegex = new RegExp(`CHANGE_ENTITY - Updating Entity=${Entity} CardID=(\\w+)$`);
	static ActionShowEntityRegex = new RegExp(`SHOW_ENTITY - Updating Entity=${Entity} CardID=(\\w+)$`);
	static ActionHideEntityRegex = new RegExp(`HIDE_ENTITY - Entity=${Entity} tag=(\\w+) value=(\\w+)`);
	static ActionFullEntityUpdatingRegex = new RegExp(`FULL_ENTITY - Updating ${Entity} CardID=(\\w+)?$`);
	static ActionFullEntityCreatingRegex = new RegExp(`FULL_ENTITY - Creating ID=(\\d+) CardID=(\\w+)?$`);
	static SubSpellStartRegex = new RegExp(`SUB_SPELL_START - SpellPrefabGUID=(.+):.* Source=(\\d+).*$`);
	static SubSpellEndRegex = new RegExp(`SUB_SPELL_END.*$`);
	static SubSpellSourceRegex = new RegExp(`Source = ${Entity}$`);
	static SubSpellTargetsRegex = new RegExp(`Targets\\[\\d+\\] = ${Entity}$`);

	static ActionTagChangeRegex = new RegExp(
		`TAG_CHANGE Entity=${Entity} tag=(\\w+) value=(\\w+)( DEF CHANGE)?`,
	);
	static ActionTagRegex = new RegExp(`tag=(\\w+) value=(\\w+)`);

	static ActionShuffleDeckRegex = new RegExp(`SHUFFLE_DECK PlayerID=(\\d+)`);

	static EntitiesChosenRegex = new RegExp(`id=(\\d+) Player=${Entity} EntitiesCount=(\\d+)$`);
	static EntitiesChosenEntitiesRegex = new RegExp(`Entities\\[(\\d+)\\]=${Entity}$`);

	static OptionsEntityRegex = new RegExp(`id=(\\d+)$`);
	static OptionsOptionRegex = new RegExp(
		`option (\\d+) type=(\\w+) mainEntity=${Entity}? error=(.*) errorParam=(.*)$`,
	);
	static OptionsSuboptionRegex = new RegExp(
		`(subOption|target) (\\d+) entity=${Entity}? error=(.*) errorParam=(.*)$`,
	);

	static SendChoicesChoicetypeRegex = new RegExp(`id=(\\d+) ChoiceType=(.+)$`);
	static SendChoicesEntitiesRegex = new RegExp(`m_chosenEntities\\[(\\d+)\\]=(\\[.+\\])$`);

	static SendOptionRegex = new RegExp(
		`selectedOption=(\\d+) selectedSubOption=(-1|\\d+) selectedTarget=(\\d+) selectedPosition=(\\d+)`,
	);
}
