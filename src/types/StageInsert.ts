import Portrait from "./Portrait";

export default class StageInsert {
    /** Id of the image, usually theatre-<actorId> */
    imgId: string;
    // contains label and portraitContainer
    // sits right on top the textBox
    dockContainer: PIXI.Container;
    name: string;
    emote: string;
    textFlyin: string;
    textStanding: string;
    textFont: string;
    textSize: number;
    textColor: string;
    portrait: Portrait;
    label: PIXI.Text;
    typingBubble: PIXI.Sprite;
    exitOrientation: "left" | "right";
    nameOrientation: "left" | "right";
    optAlign: string;
    tweens: unknown;
    order: number;
    renderOrder: number;
    /** If this dock is in the process of being deleted */
    deleting?: boolean;
    meta: {}
}