// src/lib/animationUtils.ts - GSAP Animation Utilities
import gsap from 'gsap';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.config({
    nullTargetWarn: false,
  });
}

// ============================================
// CORE ANIMATION UTILITIES
// ============================================

export const animations = {
  // Fade in from bottom with stagger
  fadeInUp: (elements: string | Element | Element[], options = {}) => {
    return gsap.fromTo(
      elements,
      {
        opacity: 0,
        y: 40,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.1,
        ...options,
      }
    );
  },

  // Fade in with scale
  fadeInScale: (elements: string | Element | Element[], options = {}) => {
    return gsap.fromTo(
      elements,
      {
        opacity: 0,
        scale: 0.9,
      },
      {
        opacity: 1,
        scale: 1,
        duration: 0.6,
        ease: 'back.out(1.7)',
        stagger: 0.08,
        ...options,
      }
    );
  },

  // Slide in from left
  slideInLeft: (elements: string | Element | Element[], options = {}) => {
    return gsap.fromTo(
      elements,
      {
        opacity: 0,
        x: -60,
      },
      {
        opacity: 1,
        x: 0,
        duration: 0.7,
        ease: 'power2.out',
        ...options,
      }
    );
  },

  // Slide in from right
  slideInRight: (elements: string | Element | Element[], options = {}) => {
    return gsap.fromTo(
      elements,
      {
        opacity: 0,
        x: 60,
      },
      {
        opacity: 1,
        x: 0,
        duration: 0.7,
        ease: 'power2.out',
        ...options,
      }
    );
  },

  // Text reveal character by character
  textReveal: (element: string | Element, options = {}) => {
    return gsap.fromTo(
      element,
      {
        opacity: 0,
        y: 20,
        rotateX: -90,
      },
      {
        opacity: 1,
        y: 0,
        rotateX: 0,
        duration: 0.8,
        ease: 'power3.out',
        ...options,
      }
    );
  },

  // Glow pulse effect
  glowPulse: (element: string | Element, color = 'rgba(99, 102, 241, 0.5)') => {
    return gsap.to(element, {
      boxShadow: `0 0 30px ${color}, 0 0 60px ${color}`,
      repeat: -1,
      yoyo: true,
      duration: 1.5,
      ease: 'power1.inOut',
    });
  },

  // Float animation
  float: (element: string | Element, options = {}) => {
    return gsap.to(element, {
      y: -10,
      repeat: -1,
      yoyo: true,
      duration: 2,
      ease: 'power1.inOut',
      ...options,
    });
  },

  // Rotate 3D
  rotate3D: (element: string | Element, options = {}) => {
    return gsap.to(element, {
      rotateY: 360,
      duration: 20,
      repeat: -1,
      ease: 'none',
      ...options,
    });
  },

  // Stagger cards entrance
  staggerCards: (cards: string | Element | Element[], options = {}) => {
    return gsap.fromTo(
      cards,
      {
        opacity: 0,
        y: 60,
        scale: 0.95,
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        ease: 'power3.out',
        stagger: {
          amount: 0.5,
          from: 'start',
        },
        ...options,
      }
    );
  },

  // Magnetic button effect
  magneticButton: (button: Element) => {
    const handleMouseMove = (e: MouseEvent) => {
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      gsap.to(button, {
        x: x * 0.3,
        y: y * 0.3,
        duration: 0.3,
        ease: 'power2.out',
      });
    };

    const handleMouseLeave = () => {
      gsap.to(button, {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: 'elastic.out(1, 0.3)',
      });
    };

    button.addEventListener('mousemove', handleMouseMove as EventListener);
    button.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      button.removeEventListener('mousemove', handleMouseMove as EventListener);
      button.removeEventListener('mouseleave', handleMouseLeave);
    };
  },

  // Page transition
  pageTransition: {
    enter: (element: string | Element) => {
      return gsap.fromTo(
        element,
        {
          opacity: 0,
          y: 30,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: 'power2.out',
        }
      );
    },
    exit: (element: string | Element) => {
      return gsap.to(element, {
        opacity: 0,
        y: -30,
        duration: 0.3,
        ease: 'power2.in',
      });
    },
  },

  // Counter animation for numbers
  countUp: (element: Element, endValue: number, options = {}) => {
    const obj = { value: 0 };
    return gsap.to(obj, {
      value: endValue,
      duration: 2,
      ease: 'power2.out',
      onUpdate: () => {
        element.textContent = Math.floor(obj.value).toLocaleString();
      },
      ...options,
    });
  },

  // Morphing background blobs
  morphBlob: (element: string | Element) => {
    return gsap.to(element, {
      borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
      repeat: -1,
      yoyo: true,
      duration: 8,
      ease: 'power1.inOut',
    });
  },

  // Shimmer loading effect
  shimmer: (element: string | Element) => {
    return gsap.fromTo(
      element,
      {
        backgroundPosition: '-200% 0',
      },
      {
        backgroundPosition: '200% 0',
        duration: 1.5,
        repeat: -1,
        ease: 'none',
      }
    );
  },

  // Bounce in
  bounceIn: (element: string | Element, options = {}) => {
    return gsap.fromTo(
      element,
      {
        opacity: 0,
        scale: 0.3,
      },
      {
        opacity: 1,
        scale: 1,
        duration: 0.6,
        ease: 'elastic.out(1, 0.5)',
        ...options,
      }
    );
  },

  // Typewriter effect
  typewriter: (element: Element, text: string, options = {}) => {
    let currentText = '';
    const chars = text.split('');
    const tl = gsap.timeline(options);

    chars.forEach((char) => {
      tl.to(
        {},
        {
          duration: 0.05,
          onComplete: () => {
            currentText += char;
            element.textContent = currentText;
          },
        }
      );
    });

    return tl;
  },
};

// ============================================
// SCROLL TRIGGER UTILITIES (without plugin)
// ============================================

export const createScrollObserver = (
  elements: NodeListOf<Element> | Element[],
  onEnter: (el: Element) => void,
  options = {}
) => {
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1,
    ...options,
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        onEnter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  elements.forEach((el) => observer.observe(el));

  return observer;
};

// ============================================
// PRESET CONFIGURATIONS
// ============================================

export const animationPresets = {
  fast: { duration: 0.3 },
  normal: { duration: 0.6 },
  slow: { duration: 1 },
  bouncy: { ease: 'elastic.out(1, 0.3)' },
  smooth: { ease: 'power2.out' },
  snappy: { ease: 'power4.out' },
};

// ============================================
// ANIMATION TIMELINE HELPERS
// ============================================

export const createTimeline = (options = {}) => {
  return gsap.timeline({
    paused: true,
    ...options,
  });
};

export const killAllAnimations = () => {
  gsap.killTweensOf('*');
};

export default animations;
