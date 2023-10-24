import {shortUUID} from "$lib/helpers";
import {currentUser, supabase} from "$lib/database";
import {get} from "svelte/store";


export type SlideOptions = {
    type: "select",
    0: {
        label: string;
        value: boolean;
    } | undefined,
    1: {
        label: string;
        value: boolean;
    } | undefined,
    2: {
        label: string;
        value: boolean;
    } | undefined,
    3: {
        label: string;
        value: boolean;
    } | undefined,
} | {
    type: "boolean",
    value: boolean;
}

export type Slide = {
    type: "input",
    uid: string,
    text: string,
    reference: string,
    options: SlideOptions,
    solve_time: number,
} | {
    type: "info",
    uid: string,
    text: string,
    reference: string,
    view_time: number,
}

export type Slides = {
    uid: string,
    title: string,
    slides: Slide[],
    editors: string[],
    viewers: string[],
    private: boolean,
    created_at: Date,
    modified_at: Date,
}

export function emptySlides(): Slides {
    return {
        uid: shortUUID(),
        title: "Untitled",
        slides: [],
        editors: [get(currentUser)?.email ?? ""],
        viewers: [],
        private: true,
        created_at: new Date(),
        modified_at: new Date(),
    }
}

export function emptySlide(): Slide {
    return {
        type: "input",
        uid: shortUUID(),
        text: "New Slide",
        reference: "",
        options: {
            type: "select",
            0: undefined,
            1: undefined,
            2: undefined,
            3: undefined,
        },
        solve_time: 20,
    }
}

export async function getAllSlides(): Promise<{
    uid: string,
    title: string,
    modified_at: string,
}[]> {
    const user = get(currentUser);
    if (!user) return [];

    const {data, error} = await supabase
        .from("slides")
        .select("uid, title, modified_at")
        .contains("editors", [user.email]);

    if (error || !data) {
        console.error(error);
        return [];
    }

    return data ?? [];
}


export async function getSlides(uid: string): Promise<Slides | null> {
    const user = get(currentUser);
    if (!user) return null;

    const {data, error} = await supabase
        .from("slides")
        .select("*")
        .eq("uid", uid)
        .contains("editors", [user.email])
        .single();

    if (error || !data) {
        console.error(error);
        return null;
    }

    return {
        uid: data.uid,
        title: data.title,
        slides: data.slides,
        editors: data.editors,
        viewers: data.viewers,
        private: data.private,
        created_at: new Date(data.created_at),
        modified_at: new Date(data.modified_at),
    };
}

export async function updateSlides(slides: Slides) {
    const user = get(currentUser);
    if (!user || !user.email) return;

    if (!slides.editors.includes(user.email)) slides.editors.push(user.email);

    const {error} = await supabase
        .from("slides")
        .update(slides)
        .eq("uid", slides.uid);

    if (error) {
        console.error(error);
        return;
    }
}

export async function insertNewSlides(slides: Slides) {
    const user = get(currentUser);
    if (!user || !user.email) return;

    if (!slides.editors.includes(user.email)) slides.editors.push(user.email);

    const {error} = await supabase
        .from("slides")
        .insert(slides);

    if (error) {
        console.error(error);
        return;
    }
}