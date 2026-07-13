export function generatePasswordFromName(nama: string): string {
    const firstName = nama.trim().split(' ')[0];
    const capitalizedName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
    const randomDigits = Math.floor(100 + Math.random() * 900); // 3 digit: 100-999
    return `${capitalizedName}${randomDigits}`;
}