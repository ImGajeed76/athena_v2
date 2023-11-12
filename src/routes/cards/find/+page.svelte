<script lang="ts">

    import {writable} from "svelte/store";
    import {getUsername, loggedIn} from "$lib/database";
    import {getSetSearchPreviews} from "$lib/cards";
    import {goto} from "$app/navigation";

    const set_previews = writable<{
        title: string;
        short_uuid: string;
        length: number;
        author: string;
    }[]>([]);

    const search = writable<string>("");

    search.subscribe(async (value) => {
        if ($loggedIn) {
            const response = await getSetSearchPreviews(value);
            if (response) {
                set_previews.set(response)
            }
        }
    })

</script>

<div class="w-full h-full grid items-center p-5">
    <div class="w-full max-w-3xl m-auto shadow-stance rounded-md p-5">
        <input class="input" placeholder="Search for title or uuid..." bind:value={$search}>

        <div class="pt-5">
            {#each $set_previews as preview}
                <div class="mb-2">
                    <button class="rounded-md text-left w-full h-full shadow-lg hover:shadow-2xl duration-200 p-5 bg-surface-300 hover:bg-primary-100 flex flex-row justify-between items-end"
                            on:click={() => goto("/cards/" + preview.short_uuid)}>
                        <div>
                            <p class="font-bold text-gray-700">{preview.title}</p>
                            <p class="text-gray-500">{preview.length} cards</p>
                        </div>
                        <div>
                            {#await getUsername(preview.author)}
                                <p class="text-gray-500"></p>
                            {:then username}
                                <p class="text-gray-500">{username}</p>
                            {:catch error}
                                <p class="text-gray-500">Unknown</p>
                            {/await}
                        </div>
                    </button>
                </div>
            {/each}
        </div>
    </div>
</div>