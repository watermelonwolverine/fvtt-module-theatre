import type EmotionDefinition from "./EmotionDefinition";
import type { Position } from "./Position";

export class InsertData {
	insertid: string;
	position: Position;
	emotions: EmotionDefinition;
	sortidx: number;
}

export default class ResyncData {
	narrator: boolean;
	insertdata: InsertData[];
	targetid: string;
}
