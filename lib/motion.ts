export const easeOutQuint = [0.22, 1, 0.36, 1] as const;

export const fadeIn = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.4, ease: easeOutQuint },
};

export const slideUpFade = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 8 },
    transition: { duration: 0.45, ease: easeOutQuint },
};

export const overlayFade = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3, ease: easeOutQuint },
};

export const movieModalContent = {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 12 },
    transition: { duration: 0.45, ease: easeOutQuint },
};

export const imageReveal = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.6, ease: easeOutQuint },
};

export const staggerContainer = {
    animate: { transition: { staggerChildren: 0.06 } },
};
