export class Achievement {

	setId: string;
	id: string;
	icon: string;
	order: number;
	name: string;
	title: string;
	htmlTooltip: string;

	completed: boolean;

	constructor(id: string, setId: string) {
		this.id = id;
		this.setId = setId;
	}

}
