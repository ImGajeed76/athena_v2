import {get} from "svelte/store";
import {currentUser, loggedIn, supabase} from "$lib/database";
import type {PostgrestError} from "@supabase/supabase-js";
import {shortUUID} from "$lib/helpers";

export enum Code {
    NotLoggedIn = "NotLoggedIn",
    NoEmail = "NoEmail",
    NoGroup = "NoGroup",
    Success = "Success",
    UnknownError = "UnknownError"
}

export class Group {
    short_uuid: string = "";
    created_at: Date = new Date();
    admin: string = "";
    title: string = "";
    description: string = "";
    users: string[] = [];

    loaded: boolean = false;

    constructor(short_uuid: string, autoLoad: boolean);
    constructor(short_uuid: string, admin: string, title: string, description: string, users: string[], created_at?: Date);

    constructor(...args: any[]) {
        if (args.length === 2) {
            this.short_uuid = args[0];
            if (args[1]) {
                this.load(args[0]).then((r) => {
                    this.loaded = r === Code.Success;
                });
            }
        } else if (args.length === 5 || args.length === 6) {
            this.short_uuid = args[0];
            this.admin = args[1];
            this.title = args[2];
            this.description = args[3];
            this.users = args[4];
            this.created_at = args[5] ?? new Date();
            this.loaded = true;
        }
    }


    copy(): Group {
        return new Group(this.short_uuid, this.admin, this.title, this.description, this.users, this.created_at);
    }

    async checkLoggedIn(): Promise<Code> {
        if (!get(loggedIn)) {
            console.log("Not logged in")
            return Code.NotLoggedIn;
        }

        const currentEmail = get(currentUser)?.email;
        if (!currentEmail) {
            console.log("No email")
            return Code.NoEmail;
        }

        return Code.Success;
    }

    async load(short_uuid?: string): Promise<Code> {
        const check = await this.checkLoggedIn();
        if (check !== Code.Success) return check;

        if (!short_uuid) short_uuid = this.short_uuid;

        const {data: group, error} = await supabase
            .from("groups")
            .select("*")
            .eq("short_uuid", short_uuid)
            .single();

        if (error) {
            switch (error.code) {
                case "PGRST116":
                    console.log("No group found");
                    return Code.NoGroup;
                default:
                    console.error(error);
                    return Code.UnknownError;
            }
        }

        if (!group) {
            console.log("No group found");
            return Code.NoGroup;
        }

        this.short_uuid = group.short_uuid;
        this.admin = group.admin;
        this.title = group.title;
        this.description = group.description;
        this.users = group.users;

        return Code.Success;
    }

    async addUser(name: string): Promise<Code> {
        const check = await this.checkLoggedIn();
        if (check !== Code.Success) return check;

        const {data: group, error} = await supabase
            .from("groups")
            .update({
                users: [...this.users, name]
            })
            .eq("short_uuid", this.short_uuid);

        if (error) {
            switch (error.code) {
                case "PGRST116":
                    console.log("No group found");
                    return Code.NoGroup;
                default:
                    console.error(error);
                    return Code.UnknownError;
            }
        }

        this.users = [...this.users, name];

        return Code.Success;
    }

    async removeUser(name: string): Promise<Code> {
        const check = await this.checkLoggedIn();
        if (check !== Code.Success) return check;

        const {data: group, error} = await supabase
            .from("groups")
            .update({
                users: this.users.filter(user => user !== name)
            })
            .eq("short_uuid", this.short_uuid);

        if (error) {
            switch (error.code) {
                case "PGRST116":
                    console.log("No group found");
                    return Code.NoGroup;
                default:
                    console.error(error);
                    return Code.UnknownError;
            }
        }

        this.users = this.users.filter(user => user !== name);

        return Code.Success;
    }

    async save(): Promise<Code> {
        const check = await this.checkLoggedIn();
        if (check !== Code.Success) return check;

        const {data: group, error} = await supabase
            .from("groups")
            .update({
                title: this.title,
                description: this.description,
                users: this.users
            })
            .eq("short_uuid", this.short_uuid);

        if (error) {
            switch (error.code) {
                case "PGRST116":
                    console.log("No group found");
                    return Code.NoGroup;
                default:
                    console.error(error);
                    return Code.UnknownError;
            }
        }

        return Code.Success;
    }
}

export async function getGroupPreviews(): Promise<{
    data: {
        title: string;
        description: string;
        short_uuid: string;
    }[] | null;
    error: PostgrestError | null | {
        message: string;
        details: string;
    };
}> {
    if (!get(loggedIn)) {
        console.log("Not logged in")
        return {
            data: null, error: {
                message: "Not logged in",
                details: "You must be logged in to view your groups"
            }
        };
    }

    const currentEmail = get(currentUser)?.email;
    if (!currentEmail) {
        console.log("No email")
        return {
            data: null, error: {
                message: "No email",
                details: "You must be logged in to view your groups"
            }
        };
    }

    const {data: groups, error} = await supabase
        .from("groups")
        .select("short_uuid, title, description")
        .eq("admin", currentEmail);

    if (error) {
        console.error(error);
        return {data: null, error};
    }

    return {data: groups, error: null};
}

export async function createNewGroup(): Promise<string> {
    if (!get(loggedIn)) {
        console.log("Not logged in")
        return "";
    }

    const currentEmail = get(currentUser)?.email;
    if (!currentEmail) {
        console.log("No email")
        return "";
    }

    const short_uuid = shortUUID();

    const {data: group, error} = await supabase
        .from("groups")
        .insert({
            short_uuid,
            admin: currentEmail,
            title: "New Group",
            description: "A new group",
            users: []
        });

    if (error) {
        console.error(error);
        return "";
    }

    return short_uuid;
}