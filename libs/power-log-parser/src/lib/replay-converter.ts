import {
	HearthstoneReplay,
	Game,
	GameData,
	Action,
	ShowEntity,
	HideEntity,
	ChangeEntity,
	ShuffleDeck,
	ChosenEntities,
	Tag,
	TagChange,
	FullEntity,
	GameEntity,
	PlayerEntity,
	MetaData,
	Info,
	Choices,
	Choice,
	SendChoices,
	Options,
	Option,
	SubOption,
	Target,
	SendOption,
} from './models';

function escapeXml(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

function a(name: string, value: string | number | boolean): string {
	return ` ${name}="${escapeXml(String(value))}"`;
}

function ts(data: { TimeStamp: string }): string {
	return data.TimeStamp ? a('ts', data.TimeStamp) : '';
}

function serializeTag(tag: Tag): string {
	return `<Tag${a('tag', tag.Name)}${a('value', tag.Value)} />`;
}

function serializeTags(tags: readonly Tag[]): string {
	return tags.map(serializeTag).join('');
}

function serializeGameData(data: GameData): string {
	if (data instanceof Action) return serializeAction(data);
	if (data instanceof FullEntity) return serializeFullEntity(data);
	if (data instanceof GameEntity) return serializeGameEntity(data);
	if (data instanceof PlayerEntity) return serializePlayerEntity(data);
	if (data instanceof ShowEntity) return serializeShowEntity(data);
	if (data instanceof ChangeEntity) return serializeChangeEntity(data);
	if (data instanceof HideEntity) return serializeHideEntity(data);
	if (data instanceof TagChange) return serializeTagChange(data);
	if (data instanceof ShuffleDeck) return serializeShuffleDeck(data);
	if (data instanceof ChosenEntities) return serializeChosenEntities(data);
	if (data instanceof MetaData) return serializeMetaData(data);
	if (data instanceof Choices) return serializeChoices(data);
	if (data instanceof SendChoices) return serializeSendChoices(data);
	if (data instanceof Options) return serializeOptions(data);
	if (data instanceof SendOption) return serializeSendOption(data);
	return '';
}

function serializeDataList(items: readonly GameData[]): string {
	return items.map(serializeGameData).join('');
}

function serializeAction(action: Action): string {
	let attrs = ts(action);
	attrs += a('entity', action.Entity);
	if (action.Index !== -1) attrs += a('index', action.Index);
	if (action.EffectIndex !== -1) attrs += a('effectIndex', action.EffectIndex);
	if (action.Target !== 0) attrs += a('target', action.Target);
	attrs += a('type', action.Type);
	attrs += a('subOption', action.SubOption);
	attrs += a('triggerKeyword', action.TriggerKeyword);
	const children = serializeDataList(action.Data);
	return children ? `<Block${attrs}>${children}</Block>` : `<Block${attrs} />`;
}

function serializeFullEntity(entity: FullEntity): string {
	let attrs = ts(entity);
	attrs += a('id', entity.Id);
	if (entity.CardId) attrs += a('cardID', entity.CardId);
	const tags = serializeTags(entity.Tags);
	return tags ? `<FullEntity${attrs}>${tags}</FullEntity>` : `<FullEntity${attrs} />`;
}

function serializeGameEntity(entity: GameEntity): string {
	let attrs = ts(entity);
	attrs += a('id', entity.Id);
	const tags = serializeTags(entity.Tags);
	return tags ? `<GameEntity${attrs}>${tags}</GameEntity>` : `<GameEntity${attrs} />`;
}

function serializePlayerEntity(entity: PlayerEntity): string {
	let attrs = ts(entity);
	attrs += a('id', entity.Id);
	attrs += a('accountHi', entity.AccountHi);
	attrs += a('accountLo', entity.AccountLo);
	attrs += a('playerID', entity.PlayerId);
	attrs += a('name', entity.Name);
	if (entity.Rank) attrs += a('rank', entity.Rank);
	if (entity.LegendRank) attrs += a('legendRank', entity.LegendRank);
	if (entity.Cardback) attrs += a('cardback', entity.Cardback);
	attrs += a('isMainPlayer', entity.IsMainPlayer);
	const tags = serializeTags(entity.Tags);
	return tags ? `<Player${attrs}>${tags}</Player>` : `<Player${attrs} />`;
}

function serializeShowEntity(entity: ShowEntity): string {
	let attrs = ts(entity);
	attrs += a('cardID', entity.CardId);
	attrs += a('entity', entity.Entity);
	const tags = serializeTags(entity.Tags);
	return tags ? `<ShowEntity${attrs}>${tags}</ShowEntity>` : `<ShowEntity${attrs} />`;
}

function serializeChangeEntity(entity: ChangeEntity): string {
	let attrs = ts(entity);
	attrs += a('cardID', entity.CardId);
	attrs += a('entity', entity.Entity);
	const tags = serializeTags(entity.Tags);
	return tags ? `<ChangeEntity${attrs}>${tags}</ChangeEntity>` : `<ChangeEntity${attrs} />`;
}

function serializeHideEntity(entity: HideEntity): string {
	return `<HideEntity${ts(entity)}${a('entity', entity.Entity)}${a('zone', entity.Zone)} />`;
}

function serializeTagChange(tc: TagChange): string {
	let attrs = ts(tc);
	attrs += a('entity', tc.Entity);
	attrs += a('tag', tc.Name);
	attrs += a('value', tc.Value);
	if (tc.DefChange) attrs += a('defChange', tc.DefChange);
	return `<TagChange${attrs} />`;
}

function serializeShuffleDeck(sd: ShuffleDeck): string {
	return `<ShuffleDeck${ts(sd)}${a('entity', sd.Entity)}${a('playerId', sd.PlayerId)} />`;
}

function serializeChosenEntities(ce: ChosenEntities): string {
	let attrs = ts(ce);
	attrs += a('entity', ce.Entity);
	attrs += a('playerID', ce.PlayerId);
	attrs += a('count', ce.Count);
	const choices = ce.Choices.map(serializeChoice).join('');
	return choices ? `<ChosenEntities${attrs}>${choices}</ChosenEntities>` : `<ChosenEntities${attrs} />`;
}

function serializeMetaData(md: MetaData): string {
	let attrs = ts(md);
	attrs += a('data', md.Data);
	attrs += a('entity', md.Entity);
	attrs += a('info', md.Info);
	attrs += a('meta', md.Meta);
	const infos = md.MetaInfo.map(serializeInfo).join('');
	return infos ? `<MetaData${attrs}>${infos}</MetaData>` : `<MetaData${attrs} />`;
}

function serializeInfo(info: Info): string {
	return `<Info${ts(info)}${a('index', info.Index)}${a('id', info.Id)}${a('entity', info.Entity)} />`;
}

function serializeChoices(choices: Choices): string {
	let attrs = ts(choices);
	attrs += a('id', choices.Id);
	attrs += a('max', choices.Max);
	attrs += a('min', choices.Min);
	attrs += a('playerID', choices.PlayerId);
	attrs += a('source', choices.Source);
	attrs += a('taskList', choices.TaskList);
	attrs += a('type', choices.Type);
	const list = choices.ChoiceList.map(serializeChoice).join('');
	return list ? `<Choices${attrs}>${list}</Choices>` : `<Choices${attrs} />`;
}

function serializeChoice(choice: Choice): string {
	return `<Choice${ts(choice)}${a('entity', choice.Entity)}${a('index', choice.Index)} />`;
}

function serializeSendChoices(sc: SendChoices): string {
	let attrs = ts(sc);
	attrs += a('entity', sc.Entity);
	attrs += a('type', sc.Type);
	const choices = sc.Choices.map(serializeChoice).join('');
	return choices ? `<SendChoices${attrs}>${choices}</SendChoices>` : `<SendChoices${attrs} />`;
}

function serializeOptions(options: Options): string {
	let attrs = ts(options);
	attrs += a('id', options.Id);
	const list = options.OptionList.map(serializeOption).join('');
	return list ? `<Options${attrs}>${list}</Options>` : `<Options${attrs} />`;
}

function serializeOption(option: Option): string {
	let attrs = ts(option);
	attrs += a('index', option.Index);
	attrs += a('type', option.Type);
	attrs += a('entity', option.Entity);
	attrs += a('error', option.Error);
	const items = option.OptionItems.map(serializeOptionItem).join('');
	return items ? `<Option${attrs}>${items}</Option>` : `<Option${attrs} />`;
}

function serializeOptionItem(item: SubOption | Target): string {
	if (item instanceof SubOption) {
		let attrs = ts(item);
		attrs += a('index', item.Index);
		attrs += a('entity', item.Entity);
		const targets = item.Targets.map(serializeTarget).join('');
		return targets ? `<SubOption${attrs}>${targets}</SubOption>` : `<SubOption${attrs} />`;
	}
	return serializeTarget(item as Target);
}

function serializeTarget(target: Target): string {
	return `<Target${ts(target)}${a('index', target.Index)}${a('entity', target.Entity)} />`;
}

function serializeSendOption(so: SendOption): string {
	let attrs = ts(so);
	attrs += a('option', so.OptionIndex);
	attrs += a('position', so.Position);
	if (so.SubOption !== -1) attrs += a('suboption', so.SubOption);
	attrs += a('target', so.Target);
	return `<SendOption${attrs} />`;
}

function serializeGame(game: Game): string {
	let attrs = '';
	if (game.TimeStamp) attrs += a('ts', game.TimeStamp);
	attrs += a('buildNumber', game.BuildNumber);
	attrs += a('type', game.Type);
	attrs += a('gameType', game.GameType);
	attrs += a('formatType', game.FormatType);
	attrs += a('scenarioID', game.ScenarioID);
	attrs += a('gameSeed', game.GameSeed);
	const children = serializeDataList(game.Data);
	return children ? `<Game${attrs}>${children}</Game>` : `<Game${attrs} />`;
}

export function xmlFromReplay(replay: HearthstoneReplay): string {
	const header = '<?xml version="1.0" encoding="utf-8"?>';
	let attrs = '';
	if (replay.Build) attrs += a('build', replay.Build);
	if (replay.Version) attrs += a('version', replay.Version);
	const games = replay.Games.map(serializeGame).join('');
	return `${header}<HSReplay${attrs}>${games}</HSReplay>`;
}
