export class Achievement {

	setId: string;
	id: string;
	icon: string;
	order: number;
	difficulty: string;
	name: string;
	title: string;
	htmlTooltip: string;

	numberOfCompletions: number;

	constructor(id: string, setId: string) {
		this.id = id;
		this.setId = setId;
	}

}
