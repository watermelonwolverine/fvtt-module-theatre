export interface RiggingResource {
	name: string;
	path: string;
}

export interface Animation {
	name: string;
	syntax: string;
}

export interface AnimationRigging {
	animations: Animation[];
	resources?: RiggingResource[];
}

export interface EmoteDefinition {
	name: string;
	fatype: string;
	faname: string;
	label: string;
	rigging: AnimationRigging;
	image?: string;
	insert?: string;
}

export interface EmoteDictionary {
	[key: string]: EmoteDefinition;
}
