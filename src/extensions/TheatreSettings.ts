import type { AnyTheatreStyle } from "../types/TheatreStyle";

export default class TheatreSettings {
	static NAMESPACE = "theatre";

	// keys
	static REMOVE_LABEL_SHEET_HEADER = "removeLabelSheetHeader";
	static SUPPRESS_OPACITY = "suppressOpacity";
	static SHIFT_PAUSE_ICON = "shiftPauseIcon";
	static THEATRE_IMAGE_SIZE = "theatreImageSize";
	static GM_ONLY = "gmOnly";
	static NARRATOR_HEIGHT = "theatreNarratorHeight";
	static THEATRE_STYLE = "theatreStyle";

	// default values
	static THEATRE_IMAGE_SIZE_DEFAULT = 400;
	static TEXT_DECAY_MIN = "textDecayMin";
	static TEXT_DECAY_RATE = "textDecayRate";
	static MOTD_NEW_INFO = "string";

	static getNameLocalizationKey(name: string): string {
		return "Theatre.UI.Settings" + "." + name;
	}

	static getHintLocalizationKey(name: string): string {
		return this.getNameLocalizationKey(name) + "Hint";
	}

	static get<T>(key: string): T {
		return <T>game.settings.get(this.NAMESPACE, key);
	}

	static set<T>(key: string, value: T): void {
		game.settings.set<string, string, T>(this.NAMESPACE, key, value);
	}

	static getRemoteLabelSheetHeader(): boolean {
		return this.get(TheatreSettings.REMOVE_LABEL_SHEET_HEADER);
	}

	static getTheatreImageSize(): string {
		return this.get(TheatreSettings.THEATRE_IMAGE_SIZE);
	}

	static getTheatreStyle(): AnyTheatreStyle {
		return this.get(TheatreSettings.THEATRE_STYLE);
	}

	static getNarratorHeight(): string {
		return this.get(this.NARRATOR_HEIGHT);
	}

	static getTextDecayMin(): number {
		return this.get<number>(this.TEXT_DECAY_MIN) * 1000;
	}

	static getTextDecayRate(): number {
		return this.get<number>(this.TEXT_DECAY_RATE) * 1000;
	}

	static getMotdNewInfo() {
		return this.get(this.MOTD_NEW_INFO);
	}

	static getTitleFont(): string {
		return "Riffic";
	}

	static getAutoDecay(): boolean {
		return true;
	}

	static getSuppressOpacity(): any {
		return this.get<number>(this.SUPPRESS_OPACITY);
	}
}
