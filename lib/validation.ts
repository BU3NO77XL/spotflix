// Form validation utilities

export interface ValidationResult {
    isValid: boolean;
    error?: string;
}

export const validateEmail = (email: string): ValidationResult => {
    if (!email) {
        return { isValid: false, error: 'Email é obrigatório' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { isValid: false, error: 'Email inválido' };
    }

    return { isValid: true };
};

export const validatePassword = (password: string): ValidationResult => {
    if (!password) {
        return { isValid: false, error: 'Senha é obrigatória' };
    }

    if (password.length < 6) {
        return { isValid: false, error: 'Senha deve ter pelo menos 6 caracteres' };
    }

    if (!/[A-Za-z]/.test(password)) {
        return { isValid: false, error: 'Senha deve conter pelo menos uma letra' };
    }

    if (!/[0-9]/.test(password)) {
        return { isValid: false, error: 'Senha deve conter pelo menos um número' };
    }

    return { isValid: true };
};

export const validateName = (name: string): ValidationResult => {
    if (!name) {
        return { isValid: false, error: 'Nome é obrigatório' };
    }

    if (name.length < 2) {
        return { isValid: false, error: 'Nome deve ter pelo menos 2 caracteres' };
    }

    if (name.length > 50) {
        return { isValid: false, error: 'Nome deve ter no máximo 50 caracteres' };
    }

    return { isValid: true };
};

export const validatePasswordMatch = (password: string, confirmPassword: string): ValidationResult => {
    if (password !== confirmPassword) {
        return { isValid: false, error: 'As senhas não coincidem' };
    }

    return { isValid: true };
};
