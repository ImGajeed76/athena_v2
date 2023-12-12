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

    randomNames(nameCount: number): {
        data: string[] | null;
        error: {
            code: string;
            message: string;
            details: string;
        } | null;
    } {
        if (nameCount > this.users.length) {
            return {
                data: null, error: {
                    code: "TooManyNames",
                    message: "Too many names requested",
                    details: "The number of names requested is greater than the number of users in the group"
                }
            };
        }

        if (nameCount < 1) {
            return {
                data: null, error: {
                    code: "TooFewNames",
                    message: "Too few names requested",
                    details: "The number of names requested is less than 1"
                }
            };
        }

        const returnedNames: string[] = [];
        const maxTries = 1000;

        for (let i = 0; i < nameCount; i++) {
            let name = "";
            for (let j = 0; j < maxTries; j++) {
                name = this.users[Math.floor(Math.random() * this.users.length)];
                if (!returnedNames.includes(name)) break;
            }
            returnedNames.push(name);
        }

        return {data: returnedNames, error: null};
    }

    randomGroupsBySize(groupSize: number): {
        data: string[][] | null;
        error: {
            code: string;
            message: string;
            details: string;
        } | null;
    } {
        if (groupSize > this.users.length) {
            return {
                data: null, error: {
                    code: "TooManyNames",
                    message: "Too many names requested",
                    details: "The number of names requested is greater than the number of users in the group"
                }
            };
        }

        if (groupSize < 1) {
            return {
                data: null, error: {
                    code: "TooFewNames",
                    message: "Too few names requested",
                    details: "The number of names requested is less than 1"
                }
            };
        }

        const groupCount = Math.ceil(this.users.length / groupSize);
        return this.randomGroupsByCount(groupCount);
    }

    randomGroupsByCount(groupCount: number): {
        data: string[][] | null;
        error: {
            code: string;
            message: string;
            details: string;
        } | null;
    } {
        if (groupCount > this.users.length) {
            return {
                data: null, error: {
                    code: "TooManyNames",
                    message: "Too many names requested",
                    details: "The number of names requested is greater than the number of users in the group"
                }
            };
        }

        if (groupCount < 1) {
            return {
                data: null, error: {
                    code: "TooFewNames",
                    message: "Too few names requested",
                    details: "The number of names requested is less than 1"
                }
            };
        }

        const returnedGroups: string[][] = [];
        const names = [...this.users];

        for (let i = names.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * i);
            const temp = names[i];
            names[i] = names[j];
            names[j] = temp;
        }

        for (let i = 0; i < groupCount; i++) {
            returnedGroups.push([]);
        }

        let i = 0;
        while (names.length > 0) {
            const nextName = names.pop();
            if (!nextName) break;
            returnedGroups[i].push(nextName);
            i = (i + 1) % groupCount;
        }

        return {data: returnedGroups, error: null};
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

export function getInitials(name: string): string {
    name = name.toUpperCase().replace(/[^\w\s]/g, ' ');
    const words = name.split(/\s+/);

    if (words.length === 1) {
        return name.substring(0, 2);
    }

    return words[0][0] + words[words.length - 1][0];
}