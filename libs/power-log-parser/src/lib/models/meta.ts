import { GameData } from './game-data';

export class MetaData extends GameData {
	Data: number = 0;
	Entity: number = 0;
	Info: number = 0;
	Meta: number = 0;
	MetaInfo: Info[] = [];
}

export class Info extends GameData {
	Index: number = 0;
	Id: number = 0;
	Entity: number = 0;
}

export class Choices extends GameData {
	Id: number = 0;
	Max: number = 0;
	Min: number = 0;
	PlayerId: number = 0;
	Source: number = 0;
	TaskList: number = 0;
	Type: number = 0;
	ChoiceList: Choice[] = [];
}

export class Choice extends GameData {
	Entity: number = 0;
	Index: number = 0;
}

export class SendChoices extends GameData {
	Choices: Choice[] = [];
	Entity: number = 0;
	Type: number = 0;
}

export class Options extends GameData {
	Id: number = 0;
	OptionList: Option[] = [];
}

export class Option extends GameData {
	Index: number = 0;
	Type: number = 0;
	Entity: number = 0;
	Error: number = 0;
	OptionItems: OptionItem[] = [];
}

export abstract class OptionItem extends GameData {
	Index: number = 0;
	Entity: number = 0;
}

export class SubOption extends OptionItem {
	Targets: Target[] = [];
}

export class Target extends OptionItem {}

export class SendOption extends GameData {
	OptionIndex: number = 0;
	Position: number = 0;
	SubOption: number = -1;
	Target: number = 0;
}
