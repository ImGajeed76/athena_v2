import {writable} from "svelte/store";

export const github_star_count = writable(0)

export const updateGithubStarCount = async () => {
    const response = await fetch("https://api.github.com/repos/ImGajeed76/athena_v2");
    const json: {
        stargazers_count: number
    } = await response.json();
    github_star_count.set(json.stargazers_count);
}

export function formatStars(stars: number) {
    if (stars < 1000) return stars;
    if (stars < 1000000) return `${Math.floor(stars / 1000)}k`;
    return `${Math.floor(stars / 1000000)}m`;
}