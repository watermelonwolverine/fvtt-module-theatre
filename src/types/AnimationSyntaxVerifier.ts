
export type PropDef = {
    name: string;
    initial: string;
    final: string;
}

export type TweenParams = {
    resName: string,
    duration: number,
    advOptions: { [key: string]: string }
    props: PropDef[]
}

export class AnimationSyntaxVerifier {
    /**
         * Return an array of tween params if the syntax is correct,
         * else return an empty array if any tweens in the syntax
         * are flag as incorrect. 
         *
         * @param str (String) : The syntax to verify
         *
         * @return (Array[Object]) : The array of verified tween params, or null
         */
    static verifyAnimationSyntax(str: string): TweenParams[] {

        if (!str || typeof (str) != "string") {
            throw "IllegalArgumentException: " + str;
        }

        let tweenParams: TweenParams[] = [];

        try {
            const sections = str.split('|');
            const resName = sections[0];

            let verifyTarget = (...args: any[]) => {
                // TODO verify each property
                return true;
            }

            for (let sdx = 1; sdx < sections.length; ++sdx) {
                let parts = sections[sdx].split(';');
                let idx = 0;

                const duration = Number(parts[idx]) || 1;

                let advOptionsStr: string;
                const advOptions: { [key: string]: string } = {};

                if (/\([^\)\(]*\)/g.test(parts[++idx])) {
                    advOptionsStr = parts[idx];
                    idx++;
                }
                if (advOptions) {
                    advOptionsStr = advOptionsStr.replace(/[\(\)]/g, "");
                    let advParts = advOptionsStr.split(',');
                    for (let advPart of advParts) {
                        let components = advPart.split(':');
                        if (components.length != 2) throw "component properties definition : " + advPart + " is incorrect";
                        let advPropName = components[0].trim();
                        let advPropValue = components[1].trim();
                        advOptions[advPropName] = advPropValue;
                    }
                }

                const targets: string[] = [];
                const propDefs: PropDef[] = [];
                for (idx; idx < parts.length; ++idx)
                    targets.push(parts[idx]);

                for (let target of targets) {
                    let components = target.split(':');
                    if (components.length != 2) throw "component properties definition : " + target + " is incorrect";
                    let propName = components[0];
                    let scomps = components[1].split(',');
                    if (scomps.length != 2) throw "component properties definition : " + target + " is incorrect";
                    let init = scomps[0];
                    let fin = scomps[1];
                    if (verifyTarget(propName, init, fin)) {
                        let propDef = { name: propName, initial: init, final: fin };
                        propDefs.push(propDef);
                    } else
                        throw "component properties definition : " + target + " is incorrect";
                }
                tweenParams.push({
                    resName: resName,
                    duration: duration,
                    advOptions: advOptions,
                    props: propDefs
                });
            }
        } catch (e) {
            console.warn("BAD ANIMATION SYNTAX: %s", e);
            return tweenParams;
        }

        return tweenParams;
    }
}