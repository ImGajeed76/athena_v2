<script lang="ts">

    import {writable} from "svelte/store";
    import {onMount} from "svelte";
    import {createNewSet, getSetPreviews} from "$lib/cards";
    import {ProgressRadial} from "@skeletonlabs/skeleton";
    import {goto} from "$app/navigation";
    import {getUsername, loggedIn, currentUser} from "$lib/database";

    const set_previews = writable<{
        title: string;
        short_uuid: string;
        length: number;
        author: string;
    }[]>([]);

    const loading = writable(true);

    onMount(() => {
        setTimeout(async () => {
            if ($loggedIn && $loading) {
                const response = await getSetPreviews();
                if (response) {
                    set_previews.set(response)
                    loading.set(false);
                }
            }
        }, 1000);

        loggedIn.subscribe(async (value) => {
            if (value && $loading) {
                const response = await getSetPreviews();
                if (response) {
                    set_previews.set(response)
                    loading.set(false);
                }
            }
        })
    })

    async function createNew() {
        await goto("/cards/" + await createNewSet());
    }
</script>

{#if $loading}
    <div class="w-full h-full grid items-center justify-around">
        <ProgressRadial size="large"/>
    </div>
{:else}
    {#if $set_previews.length > 0}

        <div class="w-full max-w-7xl px-10 m-auto pt-10 pb-2">
            <p class="text-xl">Your sets:</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 w-full max-w-7xl px-10 m-auto mb-5">
            {#each $set_previews as preview}
                <div class="p-2 w-full h-full">
                    <button class="rounded-md text-left w-full h-full shadow-lg hover:shadow-2xl duration-200 p-5 bg-surface-300 hover:bg-primary-100"
                            on:click={() => goto("/cards/" + preview.short_uuid)}>
                        <p class="font-bold text-gray-700">{preview.title}</p>
                        <p class="text-gray-500">{preview.length} cards</p>
                        <br>
                        {#await getUsername(preview.author)}
                            <p class="text-gray-500">{preview.author}</p>
                        {:then username}
                            <p class="text-gray-500">{username}</p>
                        {:catch error}
                            <p class="text-gray-500">{preview.author}</p>
                        {/await}
                    </button>
                </div>
            {/each}
        </div>
    {:else}
        <div class="w-full flex justify-center mb-5 mt-10">
            <span class="h5">You have not created any sets yet. Create your first one down below!</span>
        </div>
    {/if}
    <div class="w-full flex flex-row justify-center">
        <button class="mr-2 btn variant-filled-primary btn-3d-primary" on:click={createNew}>
            New
        </button>
        <a href="/cards/find" class="ml-2 btn variant-filled-secondary btn-3d-secondary">
            Find
        </a>
    </div>
{/if}