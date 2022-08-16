import EmotionDefinition from "../types/EmotionDefinition";

export class Position {
    x: number;
    y: number;
    mirror: boolean;
}
export class SceneEvent { };

class SingleTargetEvent extends SceneEvent {
    insertid: string;
}

class DoubleTargetEvent extends SceneEvent {
    insertid1: string;
    insertid2: string;
}

export class PositionUpdateEvent extends SingleTargetEvent {
    position: Position;
}

export class ExitSceneEvent extends SingleTargetEvent { }

export class PushEvent extends SingleTargetEvent {
    tofront: boolean;
}

export class EnterSceneEvent extends SingleTargetEvent {
    emotions: EmotionDefinition;
    isleft: boolean;
}
export class EmoteEvent extends SingleTargetEvent {
    emotions: EmotionDefinition;
}

export class AddTextureEvent extends SingleTargetEvent {
    emote: string;
    imgsrc: string;
    resname: string;

}

export class AddAllTexturesEvent extends SingleTargetEvent {
    emote: string;
    imgsrcs: string[];
    eresname: string;
}

export class DecayTextEvent extends SingleTargetEvent { }

export class StageEvent extends SingleTargetEvent { }

export class RenderInsertEvent extends SingleTargetEvent { }

export class SwapEvent extends DoubleTargetEvent { }

export class MoveEvent extends DoubleTargetEvent { }

export class NarratorEvent extends SceneEvent {
    active: boolean;
}