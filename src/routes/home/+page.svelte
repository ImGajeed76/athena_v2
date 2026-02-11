<script lang="ts">
    import {writable} from "svelte/store";
    import {onMount} from "svelte";
    import {getSetPreviews} from "$lib/cards";
    import {ProgressRadial} from "@skeletonlabs/skeleton";
    import {goto} from "$app/navigation";
    import {getUsername, loggedIn} from "$lib/database";

    const cards_set_previews = writable<{
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
                    cards_set_previews.set(response)
                    loading.set(false);
                }
            }
        }, 1000);

        loggedIn.subscribe(async (value) => {
            if (value && $loading) {
                const response = await getSetPreviews();
                if (response) {
                    cards_set_previews.set(response)
                    loading.set(false);
                }
            }
        })
    })

    let scrollContainer: HTMLDivElement;
    const leftVisible = writable(false);
    const rightVisible = writable(true);

    function scrollRight() {
        scrollContainer.scrollBy({left: 400, behavior: 'smooth'}); // Adjust the value '200' as needed
        leftVisible.set(true);
        setTimeout(() => {
            if (scrollContainer.scrollLeft + scrollContainer.clientWidth >= scrollContainer.scrollWidth) {
                rightVisible.set(false);
            }
        }, 500);
    }

    function scrollLeft() {
        scrollContainer.scrollBy({left: -400, behavior: 'smooth'}); // Adjust the value '200' as needed
        rightVisible.set(true);
        setTimeout(() => {
            if (scrollContainer.scrollLeft === 0) {
                leftVisible.set(false);
            }
        }, 500);
    }
</script>

<style>
    .no-scrollbar::-webkit-scrollbar {
        display: none;
    }

    .no-scrollbar {
        -ms-overflow-style: none; /* IE and Edge */
        scrollbar-width: none; /* Firefox */
    }
</style>

{#if $loading}
    <div class="w-full h-full grid items-center justify-around">
        <ProgressRadial size="large"/>
    </div>
{:else}
    <div class="w-full h-full pt-16 pb-5">
        {#if $cards_set_previews.length > 0}
            <div class="w-full max-w-7xl m-auto pt-10 pb-2">
                <p class="text-2xl">Recent card sets:</p>
            </div>

            <div class="w-full max-w-7xl m-auto relative">
                <div class="flex overflow-x-auto no-scrollbar pb-5" bind:this={scrollContainer}>
                    {#each $cards_set_previews as preview}
                        <div class="p-2 w-80 h-40 flex-none">
                            <button class="rounded-md text-left w-full h-full shadow-lg duration-200 p-5 bg-surface-300 hover:bg-primary-100"
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
                    <div class="absolute top-0 right-0 bottom-0 w-32 items-center flex pb-5 {$rightVisible ? 'opacity-100' : 'opacity-0'} duration-200"
                         style="background: linear-gradient(to left, #fbfbfb, transparent)">
                        <button class="absolute right-0 hover:bg-primary-300 rounded-full p-2 duration-200 active:translate-y-1 outline-0 border-0"
                                on:click={scrollRight}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="24" height="24">
                                <path d="M8.22 2.97a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l2.97-2.97H3.75a.75.75 0 0 1 0-1.5h7.44L8.22 4.03a.75.75 0 0 1 0-1.06Z"></path>
                            </svg>
                        </button>
                    </div>
                    <div class="absolute top-0 left-0 bottom-0 w-32 items-center flex pb-5 {$leftVisible ? 'opacity-100' : 'opacity-0'} duration-200"
                         style="background: linear-gradient(to right, #fbfbfb, transparent)">
                        <button class="absolute left-0 hover:bg-primary-300 rounded-full p-2 duration-200 active:translate-y-1 outline-0 border-0"
                                on:click={scrollLeft}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="24" height="24">
                                <path d="M7.78 12.53a.75.75 0 0 1-1.06 0L2.47 8.28a.75.75 0 0 1 0-1.06l4.25-4.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042L4.81 7h7.44a.75.75 0 0 1 0 1.5H4.81l2.97 2.97a.75.75 0 0 1 0 1.06Z"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        {/if}
    </div>
{/if}