<script lang="ts">

    import {writable} from "svelte/store";
    import {getUsername, loggedIn} from "$lib/database";
    import {getSetSearchPreviews} from "$lib/cards";
    import {goto} from "$app/navigation";
    import {getModalStore, getToastStore} from "@skeletonlabs/skeleton";
    import {onMount} from "svelte";
    import {page} from "$app/stores";

    const set_previews = writable<{
        title: string;
        short_uuid: string;
        length: number;
        author: string;
    }[]>([]);

    let last_created_at = "";

    const search = writable<string>("");

    const toastStore = getToastStore();

    onMount(() => {
        setTimeout(() => {
            if (!$loggedIn) {
                goto('/login?redirect=' + encodeURIComponent($page.route.id || "/"));
            }
        }, 2000)
    })

    search.subscribe(async (value) => {
        if ($loggedIn) {
            const response = await getSetSearchPreviews(value);
            if (response) {
                set_previews.set(response.previews)
                last_created_at = response.last_created_at;
            }
        }
    })

    function loadMore() {
        if ($loggedIn) {
            const lengthBefore = $set_previews.length;
            getSetSearchPreviews($search, last_created_at).then((response) => {
                if (response) {
                    for (const preview of response.previews) {
                        if (!$set_previews.find((p) => p.short_uuid === preview.short_uuid)) {
                            $set_previews.push(preview);
                        }
                    }
                    last_created_at = response.last_created_at;
                    $set_previews = [...$set_previews];
                }

                if ($set_previews.length === lengthBefore) {
                    toastStore.trigger({
                        message: "No more sets to load",
                        background: "bg-error-500",
                        classes: "text-white",
                        timeout: 2000,
                        hideDismiss: true
                    })
                }
            })
        }
    }

</script>

<div class="w-full h-full p-5 pt-32">
    <div class="w-full flex mb-10">
        <input class="input max-w-3xl mx-auto text-xl h-fit" placeholder="Search for title, username, email or uuid..." bind:value={$search}>
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

    <div class="w-full flex">
        <button class="btn variant-filled-primary btn-3d-primary mx-auto" on:click={loadMore}>Load more</button>
    </div>
</div>