import {writable} from "svelte/store";
import {supabase} from "$lib/database";

export const github_star_count = writable(0)

export const updateGithubStarCount = async () => {
    const {data, error} = await supabase
        .from("github_stars")
        .select("*")
        .eq("id", "athena_v2")
        .single();

    if (error) {
        console.error(error);
        return;
    }

    if (data) {
        const last_updated = new Date(data.updated_at);
        const now = new Date();
        const diff = now.getTime() - last_updated.getTime();
        const diff_hours = diff / (1000 * 60 * 60);
        if (diff_hours < 24) {
            github_star_count.set(data.stars);
            return;
        }
    }

    const response = await fetch("https://api.github.com/repos/ImGajeed76/athena_v2");
    const json: {
        stargazers_count: number
    } = await response.json();
    github_star_count.set(json.stargazers_count);

    const {error: update_error} = await supabase
        .from("github_stars")
        .update({
            stars: json.stargazers_count,
            updated_at: new Date().toISOString()
        })
        .eq("id", "athena_v2");

    if (update_error) {
        console.error(update_error);
    }
}

export function formatStars(stars: number) {
    if (!stars) return 0;
    if (stars < 1000) return stars;
    if (stars < 1000000) return `${Math.floor(stars / 1000)}k`;
    return `${Math.floor(stars / 1000000)}m`;
}