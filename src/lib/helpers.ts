import ShortUniqueId from "short-unique-id";

export function getRandomFloat() {
    let buffer = new Uint32Array(1);
    window.crypto.getRandomValues(buffer);
    return buffer[0] / (0xFFFFFFFF + 1);
}

export async function generateRandomPassword(length = 16): Promise<string> {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ23456789!@#$%^&*()+}{[]?><'";
    let password = "";
    for (let i = 0; i < length; i++) {
        password += chars[Math.floor(getRandomFloat() * chars.length)];
    }

    if (!/[A-Z]/.test(password)) return await generateRandomPassword(length);
    if (!/[a-z]/.test(password)) return await generateRandomPassword(length);
    if (!/\d/.test(password)) return await generateRandomPassword(length);
    if (!/[!@#$%^&*()+}{[\]?><'"]/.test(password)) return await generateRandomPassword(length);

    return password;
}

export function copy(object: any) {
    return JSON.parse(JSON.stringify(object));
}

export function shortUUID() {
    const { randomUUID } = new ShortUniqueId({length: 10});
    return randomUUID();
}

export function numberToBase64(num: number) {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let base64 = "";
    while (num > 0) {
        base64 += chars[num % 64];
        num = Math.floor(num / 64);
    }
    return base64;
}