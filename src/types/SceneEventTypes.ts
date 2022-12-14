export type AnySceneEventType =
	| "enterscene"
	| "exitscene"
	| "positionupdate"
	| "push"
	| "swap"
	| "move"
	| "emote"
	| "addtexture"
	| "addalltextures"
	| "stage"
	| "narrator"
	| "decaytext"
	| "renderinsert";

export class SceneEventTypes {
	/** an insert was injected remotely */
	static enterscene: AnySceneEventType = "enterscene";
	/** an insert was removed remotely */
	static exitscene: AnySceneEventType = "exitscene";
	/** an insert was moved removely */
	static positionupdate: AnySceneEventType = "positionupdate";
	/** an insert was pushed removely */
	static push: AnySceneEventType = "push";
	/** an insert was swapped remotely */
	static swap: AnySceneEventType = "swap";
	static move: AnySceneEventType = "move";
	/** the narrator bar was activated remotely */
	static emote: AnySceneEventType = "emote";
	/** a texture asset was added remotely */
	static addtexture: AnySceneEventType = "addtexture";
	/** a group of textures were added remotely */
	static addalltextures: AnySceneEventType = "addalltextures";
	/** an insert's assets were staged remotely */
	static stage: AnySceneEventType = "stage";
	/** the narrator bar was activated remotely */
	static narrator: AnySceneEventType = "narrator";
	/** an insert's text was decayed remotely */
	static decaytext: AnySceneEventType = "decaytext";
	/** an insert is requesting to be rendered immeidately remotely */
	static renderinsert: AnySceneEventType = "renderinsert";
}
