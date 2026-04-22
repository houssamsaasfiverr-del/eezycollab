// src/hooks/useGSAP.ts - React Hook for GSAP animations
import { useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import animations, { createScrollObserver } from '../lib/animationUtils';

// ============================================
// MAIN GSAP HOOK
// ============================================

export const useGSAP = () => {
    const timelineRef = useRef<gsap.core.Timeline | null>(null);

    // Create a new timeline
    const createTimeline = useCallback((options = {}) => {
        timelineRef.current = gsap.timeline({ paused: true, ...options });
        return timelineRef.current;
    }, []);

    // Play timeline
    const play = useCallback(() => {
        timelineRef.current?.play();
    }, []);

    // Pause timeline
    const pause = useCallback(() => {
        timelineRef.current?.pause();
    }, []);

    // Reverse timeline
    const reverse = useCallback(() => {
        timelineRef.current?.reverse();
    }, []);

    // Kill all animations on unmount
    useEffect(() => {
        return () => {
            timelineRef.current?.kill();
        };
    }, []);

    return {
        gsap,
        timeline: timelineRef.current,
        createTimeline,
        play,
        pause,
        reverse,
        animations,
    };
};

// ============================================
// ANIMATION ON MOUNT HOOK
// ============================================

export const useAnimateOnMount = (
    ref: React.RefObject<HTMLElement>,
    animationType: keyof typeof animations = 'fadeInUp',
    options = {}
) => {
    useEffect(() => {
        if (!ref.current) return;

        const animation = animations[animationType];
        if (typeof animation === 'function') {
            const tween = (animation as (...args: any[]) => any)(ref.current, options);
            return () => {
                if (typeof tween === 'function') {
                    tween();
                } else {
                    tween?.kill?.();
                }
            };
        }
    }, [ref, animationType, options]);
};

// ============================================
// SCROLL ANIMATION HOOK
// ============================================

export const useScrollAnimation = (
    ref: React.RefObject<HTMLElement>,
    animationType: keyof typeof animations = 'fadeInUp',
    options = {}
) => {
    useEffect(() => {
        if (!ref.current) return;

        const element = ref.current;
        gsap.set(element, { opacity: 0, y: 40 });

        const observer = createScrollObserver([element], (el) => {
            const animation = animations[animationType];
            if (typeof animation === 'function') {
                (animation as (...args: any[]) => any)(el, options);
            }
        });

        return () => {
            observer.disconnect();
        };
    }, [ref, animationType, options]);
};

// ============================================
// MAGNETIC BUTTON HOOK
// ============================================

export const useMagneticButton = (ref: React.RefObject<HTMLElement>) => {
    useEffect(() => {
        if (!ref.current) return;

        const button = ref.current;
        let cleanup: (() => void) | undefined;

        cleanup = animations.magneticButton(button);

        return () => {
            cleanup?.();
        };
    }, [ref]);
};

// ============================================
// STAGGER CHILDREN HOOK
// ============================================

export const useStaggerChildren = (
    containerRef: React.RefObject<HTMLElement>,
    childSelector: string,
    options = {}
) => {
    useEffect(() => {
        if (!containerRef.current) return;

        const children = containerRef.current.querySelectorAll(childSelector);
        if (children.length === 0) return;

        const tween = animations.staggerCards(Array.from(children), options);

        return () => {
            tween?.kill?.();
        };
    }, [containerRef, childSelector, options]);
};

// ============================================
// HOVER ANIMATION HOOK
// ============================================

export const useHoverAnimation = (
    ref: React.RefObject<HTMLElement>,
    scaleAmount = 1.05,
    duration = 0.3
) => {
    useEffect(() => {
        if (!ref.current) return;

        const element = ref.current;

        const handleMouseEnter = () => {
            gsap.to(element, {
                scale: scaleAmount,
                duration,
                ease: 'power2.out',
            });
        };

        const handleMouseLeave = () => {
            gsap.to(element, {
                scale: 1,
                duration,
                ease: 'power2.out',
            });
        };

        element.addEventListener('mouseenter', handleMouseEnter);
        element.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            element.removeEventListener('mouseenter', handleMouseEnter);
            element.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [ref, scaleAmount, duration]);
};

// ============================================
// FLOATING ANIMATION HOOK
// ============================================

export const useFloatAnimation = (
    ref: React.RefObject<HTMLElement>,
    options = {}
) => {
    useEffect(() => {
        if (!ref.current) return;

        const tween = animations.float(ref.current, options);

        return () => {
            tween?.kill?.();
        };
    }, [ref, options]);
};

// ============================================
// COUNTER ANIMATION HOOK
// ============================================

export const useCounterAnimation = (
    ref: React.RefObject<HTMLElement>,
    endValue: number,
    options = {}
) => {
    useEffect(() => {
        if (!ref.current) return;

        const element = ref.current;
        const tween = animations.countUp(element, endValue, options);

        return () => {
            tween?.kill?.();
        };
    }, [ref, endValue, options]);
};

export default useGSAP;
