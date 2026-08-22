import type { Directive } from "vue";

export type ColorizeDirective = Directive<HTMLElement, { color?: string; durationMs?: number }>

declare module 'vue' {
    export interface GlobalDirectives {
        vColorize: ColorizeDirective
    }
}

const listeners = new WeakMap<HTMLElement, EventListener>();

export default {
    mounted: (el, binding) => {
        const prevColor = el.style.backgroundColor;

        const handler = () => {
            const { color, durationMs } =  { color: "green", durationMs: 1000, ...binding.value };

            el.style.backgroundColor = color;

            setTimeout(() => {
                el.style.backgroundColor = prevColor || "";
            }, durationMs);
        };

        el.addEventListener("click", handler);
        el.addEventListener("change", handler);

        listeners.set(el, handler);
    },
    unmounted: (el) => {
        const handler = listeners.get(el);

        if (handler) {
            el.removeEventListener("click", handler);
            el.removeEventListener("change", handler);
            listeners.delete(el);
        }
    }
} satisfies ColorizeDirective
