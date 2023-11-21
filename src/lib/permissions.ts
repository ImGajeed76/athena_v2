import {get, writable} from "svelte/store";
import {currentUser, supabase} from "$lib/database";

export type Permissions = {
    allow_card_saving: boolean,
    show_allow_card_saving: boolean
}

export const permissions = writable<Permissions>({
    allow_card_saving: false,
    show_allow_card_saving: true
})

export const permissions_loaded = writable(false);

export async function loadPermissions(): Promise<{ data: any, error: null } | { data: null, error: any }> {
    const currentUserData = get(currentUser)
    if (!currentUserData) {
        return {
            data: null,
            error: "No user data"
        }
    }

    if (!currentUserData.email) {
        return {
            data: null,
            error: "No user email"
        }
    }

    const {data: permission_data, error: fetch_error} = await supabase
        .from("permissions")
        .select("allow_card_saving, show_allow_card_saving")
        .eq("email", currentUserData.email)
        .single();

    if (fetch_error && fetch_error.code !== "PGRST116") {
        console.error(fetch_error);
        return {
            data: null,
            error: fetch_error
        }
    } else if (fetch_error) {
        const {error: insert_error} = await supabase
            .from("permissions")
            .insert({
                email: currentUserData.email,
                ...get(permissions)
            });

        if (insert_error) {
            console.error(insert_error)
            return {
                data: null,
                error: insert_error
            }
        }

        permissions_loaded.set(true);
        return {
            data: get(permissions),
            error: null
        }
    }

    permissions.set({...(permission_data as Permissions)});
    permissions_loaded.set(true);
    return {
        data: get(permissions),
        error: null
    }
}

export async function updatePermission(permission_name: string, value: boolean): Promise<{ data: any, error: null } | {
    data: null,
    error: any
}> {
    const currentUserData = get(currentUser)
    if (!currentUserData) {
        return {
            data: null,
            error: "No user data"
        }
    }

    if (!currentUserData.email) {
        return {
            data: null,
            error: "No user email"
        }
    }

    const show_permission_name = "show_" + permission_name;

    const new_permissions: Record<string, boolean> = {};
    new_permissions[permission_name] = value;
    new_permissions[show_permission_name] = false;

    const {error: update_error} = await supabase
        .from("permissions")
        .update(new_permissions)
        .eq("email", currentUserData.email);

    if (update_error) {
        console.error(update_error)
        return {
            data: null,
            error: update_error
        }
    }

    return {
        data: "success",
        error: null
    }
}
