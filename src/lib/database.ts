import {createClient} from "@supabase/supabase-js";
import {PUBLIC_SUPABASE_KEY, PUBLIC_SUPABASE_URL} from "$env/static/public";
import {get, writable} from "svelte/store";

export const loggedIn = writable(false);
export const currentUser = writable<null | {
    email: string | undefined;
    uid: string;
    created_at: Date;
    username: string | null;
    short_username: string | null;
    avatar_url: string | null;
}>(null);
export const setupComplete = writable(true);

export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_KEY);
//supabase.auth.refreshSession().then(onMount);
onMount();

function onMount() {
    console.log("Supabase mounted");
    supabase.auth.onAuthStateChange((event, session) => {
        loggedIn.set(session !== null);
        updateCurrentUser();
    });
}

export function signUpWithEmail(email: string, password: string) {
    return supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: window.location.origin + "/",
            data: {
                username: null,
                avatar_url: null,
            }
        }
    })
}

export function loginWithGitHub() {
    return supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
            redirectTo: window.location.origin + "/",
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

async function updateCurrentUser() {
    if (!loggedIn) currentUser.set(null);

    const {data, error} = await supabase.auth.getUser();
    if (error || !data.user) {
        console.error(error);
        return;
    }

    let username = data.user.user_metadata!.user_name || null;
    if (username === null) {
        setupComplete.set(false);
    }
    username = username || data.user.email!.split("@")[0] || null;
    const short_username = username ? username.match(/[A-Z]/g)?.slice(0, 2).join("") || username.slice(0, 2).toUpperCase() : null;


    currentUser.set({
        email: data.user.email,
        uid: data.user.id,
        created_at: new Date(data.user.created_at),
        username: username,
        short_username: short_username,
        avatar_url: data.user.user_metadata!.avatar_url || null,
    });

}

