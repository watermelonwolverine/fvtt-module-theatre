export default class StageInsert {
    /** Id of the image, usually theatre-<actorId> */
    imgId: string;
    dockContainer: PIXI.Container;
    name: string;
    emote: string;
    textFlyin: string;
    textStanding: string;
    textFont: string;
    textSize: number;
    textColor: string;
    portraitContainer: PIXI.Container;
    portrait: PIXI.Sprite;
    label: PIXI.Text;
    typingBubble: PIXI.Sprite;
    exitOrientation: "left" | "right";
    nameOrientation: "left" | "right";
    mirrored: boolean;
    optAlign: string;
    tweens: unknown;
    order: number;
    renderOrder: number;
    /** If this dock is in the process of being deleted */
    deleting?: boolean;
    meta: {}
}