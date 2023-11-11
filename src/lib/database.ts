import {createClient} from "@supabase/supabase-js";
import type {AMREntry, AuthenticatorAssuranceLevels, UserResponse, AuthError} from "@supabase/supabase-js";
import {PUBLIC_SUPABASE_KEY, PUBLIC_SUPABASE_URL, PUBLIC_IN_PROD} from "$env/static/public";
import {get, writable} from "svelte/store";
import {decode} from 'base64-arraybuffer';
import {page} from "$app/stores";

export const loggedIn = writable(false);
export const currentUser = writable<null | {
    email: string | undefined,
    uid: string,
    created_at: Date,
    username: string | null,
    short_username: string | null,
    avatar_url: string | null,
    aal: {
        currentLevel: AuthenticatorAssuranceLevels | null,
        nextLevel: AuthenticatorAssuranceLevels | null,
        currentAuthenticationMethods: AMREntry[]
    }
}>(null);

let currentUserData: null | {
    uid: string,
    email: string,
    created_at: Date,
    meta_data: any
} = null

export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_KEY);

if (PUBLIC_IN_PROD === "true") supabase.auth.refreshSession().then(onMount);
else onMount();

function onMount() {
    supabase.auth.onAuthStateChange((event, session) => {
        loggedIn.set(session !== null);
        updateCurrentUser();
    });
}

// -------- AUTH -------

export function signUpWithEmail(email: string, password: string) {
    return supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: window.location.origin,
        }
    })
}

export function loginWithGitHub(redirect: string = "") {
    return supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
            redirectTo: window.location.origin + redirect,
        }
    });
}

export function loginWithEmail(email: string, password: string) {
    return supabase.auth.signInWithPassword({
        email,
        password,
    });
}

export async function logout() {
    await supabase.auth.signOut();
    loggedIn.set(false);
    window.location.reload();
}

export function sendPasswordResetEmail(email: string) {
    return supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/auth/reset-password",
    });
}

export function resendOTP(
    options:
        { type: "signup", email: string } |
        { type: "sms", phone: string } |
        { type: "email_change", email: string } |
        { type: "phone_change", phone: string }
) {
    return supabase.auth.resend(options);
}

let mfa_id: string | null = null;

export async function get2FA_ID_OrCreateOne(): Promise<{
    data: {
        id: string,
        totp: {
            qr_code: string,
            secret: string,
            uri: string,
        } | null,
    } | null,
    error: AuthError | null,
}> {
    if (!get(loggedIn)) {
        currentUser.set(null);
        return {data: null, error: null};
    }

    const {data: userData, error: userError} = await get2FAid();

    if (userData) {
        return {data: userData, error: null};
    }

    const {data: mfaData, error: mfaError} = await supabase.auth.mfa.enroll({
        factorType: "totp",
    });

    if (mfaError || !mfaData) {
        console.error(mfaError);
        return {data: null, error: mfaError};
    }

    mfa_id = mfaData.id;

    return {data: {id: mfaData.id, totp: mfaData.totp}, error: null};
}

export async function get2FAid() {
    if (!get(loggedIn)) {
        currentUser.set(null);
        return {data: null, error: null};
    }

    const {data: userData, error: userError} = await supabase.auth.getUser();
    if (userError || !userData.user) {
        console.error(userError);
        return {data: null, error: userError};
    }

    if (userData.user.user_metadata.mfa_id) {
        return {data: {id: userData.user.user_metadata.mfa_id, totp: null}, error: null};
    }

    return {data: null, error: null};
}

export function save2FAid() {
    return supabase.auth.updateUser({
        data: {
            mfa_id: mfa_id,
        }
    });
}

export async function unenroll(): Promise<{
    data: { id: string } | null,
    error: AuthError | null,
}> {
    const {data: mfaData, error: mfaError} = await get2FA_ID_OrCreateOne();

    if (mfaError || !mfaData) {
        console.error(mfaError);
        return {data: null, error: mfaError};
    }

    const id = mfa_id ? mfa_id : mfaData.id;

    const unenroleResponse = await supabase.auth.mfa.unenroll({
        factorId: id,
    });

    await supabase.auth.updateUser({
        data: {
            mfa_id: null,
        }
    })

    await updateCurrentUser();

    return unenroleResponse;
}

// ------- User Data -------


// Update Local Data
async function updateCurrentUser() {
    if (!get(loggedIn)) {
        currentUser.set(null);
        return;
    }

    const {data: userData, error: userError} = await supabase.auth.getUser();
    if (userError || !userData.user) {
        console.error(userError);
        return;
    }

    currentUserData = {
        email: userData.user.email || "",
        uid: userData.user.id,
        created_at: new Date(userData.user.created_at),
        meta_data: userData.user.user_metadata
    }

    await maybeCreateUserRow();

    const {data: aalData, error: aalError} = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aalError || !aalData) {
        console.error(aalError);
        return;
    }

    let username = await getUsername();
    username = username || currentUserData.email.split("@")[0];
    const short_username = username.match(/[A-Z]/g)?.slice(0, 2).join("") || username.slice(0, 2).toUpperCase();

    currentUser.set({
        email: userData.user.email,
        uid: userData.user.id,
        created_at: new Date(userData.user.created_at),
        username: username,
        short_username: short_username,
        avatar_url: null,
        aal: aalData,
    });

    const avatar = await getAvatar();

    currentUser.update(user => {
        if (!user) return user;
        user.avatar_url = avatar;
        return user;
    })
}

export async function getUsername(email?: string) {
    if (!currentUserData) return "";

    const {data, error} = await supabase
        .from("users")
        .select("username")
        .eq("email", email || currentUserData.email)
        .single();

    if (error) {
        console.error(error)
        return "";
    }

    if (data.username === "" && currentUserData.meta_data.username) {
        return currentUserData.meta_data.username;
    }

    return data.username as string
}

let imageCash: Record<string, string> = {};
export async function getAvatar(avatar_url?: string): Promise<string | null> {
    if (!currentUserData) return null;

    let url = "";

    if (!avatar_url) {
        const {data: fetchData, error: fetchError} = await supabase
            .from("users")
            .select("avatar")
            .eq("email", currentUserData.email)
            .single();

        if (fetchError) {
            console.error(fetchError);
            return null;
        }

        url = fetchData.avatar as string;
    } else {
        url = avatar_url;
    }


    if (!url && currentUserData.meta_data.avatar_url) {
        url = currentUserData.meta_data.avatar_url;
    } else if (!url) {
        return null;
    }

    if (!url.startsWith("db:")) return url;

    if (imageCash[url]) {
        console.log("cash")
        return imageCash[url];
    }
    console.log("download")

    const fileUrl = url.slice(3);

    const {data, error} = await supabase
        .storage
        .from('avatars')
        .download(fileUrl);

    if (error || !data) {
        console.error(error)
        return null;
    }

    const reader = new FileReader();
    let dataUrl = "";
    const promise = new Promise(resolve => {
        reader.onload = () => {
            dataUrl = reader.result as string;
            resolve('')
        }
    })

    reader.readAsDataURL(data);
    await promise;

    imageCash[url] = dataUrl;

    return dataUrl;
}

// Update DB Data

export async function maybeCreateUserRow() {
    if (!currentUserData) return;

    const {error: fetchError} = await supabase
        .from("users")
        .select("email")
        .eq("email", currentUserData.email)
        .single();

    if (fetchError && fetchError.code !== "PGRST116") {
        console.error(fetchError);
        return;
    } else if (fetchError) {
        const {error: insertError} = await supabase
            .from("users")
            .insert({
                email: currentUserData.email,
                username: currentUserData.email.split("@")[0],
            })

        if (insertError) {
            console.error(insertError)
        }
    }
}

export async function updateUsername(username: string) {
    if (!currentUserData) return;

    const {error} = await supabase
        .from("users")
        .update({username})
        .eq("email", currentUserData.email);

    if (error) {
        console.error(error);
    }

    await updateCurrentUser();
}

export async function updateEmail(email: string) {
    await supabase.auth.updateUser({
        email: email,
    });

    await updateCurrentUser();
}

export async function uploadAvatar(base64: string, contentType: string): Promise<{ data: any, error: null } | { data: null, error: any } | UserResponse> {
    if (!currentUserData) {
        return {
            data: null,
            error: null
        };
    }

    const folder = `${currentUserData.uid}/avatar`;

    const uploadResponse = await supabase
        .storage
        .from('avatars')
        .upload(folder, decode(base64), {
            contentType,
            upsert: true
        })

    if (uploadResponse.error) {
        return uploadResponse
    }

    const imagePath = 'db:' + uploadResponse.data.path;

    return supabase
        .from("users")
        .update({avatar: imagePath})
        .eq("email", currentUserData.email);
}
