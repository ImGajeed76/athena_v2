export function generateRandomPassword(length = 16) {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()+}{[]?><'";
    let password = "";
    for (let i = 0; i < length; i++) {
        password += chars[Math.floor(Math.random() * chars.length)];
    }

    if (!/[A-Z]/.test(password)) return generateRandomPassword(length);
    if (!/[a-z]/.test(password)) return generateRandomPassword(length);
    if (!/[0-9]/.test(password)) return generateRandomPassword(length);
    if (!/[!@#$%^&*()+}{[\]?><'"]/.test(password)) return generateRandomPassword(length);

    return password;
}

export function copy(object: any) {
    return JSON.parse(JSON.stringify(object));
}