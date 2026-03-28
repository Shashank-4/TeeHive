import jwt from "jsonwebtoken";

export enum KeyType {
    ACCESS_TOKEN = "ACCESS_TOKEN",
    REFRESH_TOKEN = "REFRESH_TOKEN",
}

const getSecret = (keyType: KeyType): string => {
    if (keyType === KeyType.ACCESS_TOKEN) {
        if (!process.env.ACCESS_TOKEN_SECRET)
            throw new Error("ACCESS_TOKEN_SECRET is not defined");
        return process.env.ACCESS_TOKEN_SECRET;
    }
    if (!process.env.REFRESH_TOKEN_SECRET)
        throw new Error("REFRESH_TOKEN_SECRET is not defined");
    return process.env.REFRESH_TOKEN_SECRET;
};

export const signJwt = (
    payload: object,
    keyType: KeyType,
    options?: jwt.SignOptions
) => {
    const secret = getSecret(keyType);
    return jwt.sign(payload, secret, {
        ...(options && options),
        algorithm: "HS256",
    });
};

export const verifyJwt = <T>(token: string, keyType: KeyType): T | null => {
    try {
        const secret = getSecret(keyType);
        return jwt.verify(token, secret) as T;
    } catch (error) {
        return null;
    }
};
