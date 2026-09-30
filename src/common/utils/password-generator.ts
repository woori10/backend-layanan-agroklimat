export function generatePasswordFromName(nama: string): string {
    const firstName = nama.trim().split(' ')[0];
    const capitalizedName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
    const randomDigits = Math.floor(100 + Math.random() * 900); // 3 digit: 100-999
    return `${capitalizedName}${randomDigits}`;
}

export function generatePasswordFromRole(role: string): string {
    const roleCapitalized = role
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join('');
    const randomDigits = Math.floor(100 + Math.random() * 900); // 3 digit: 100-999
    return `${roleCapitalized}${randomDigits}`;
}

export function generateUsernameFromName(nama: string): string {
    return nama
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s_-]/g, '')
        .replace(/[\s-]+/g, '_')
        .replace(/^_+|_+$/g, '');
}