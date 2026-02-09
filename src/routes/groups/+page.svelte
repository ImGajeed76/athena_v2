<script lang="ts">
    import {writable} from "svelte/store";
    import {onMount} from "svelte";
    import {ProgressRadial} from "@skeletonlabs/skeleton";
    import {goto} from "$app/navigation";
    import {loggedIn} from "$lib/database";
    import {createNewGroup, getGroupPreviews} from "$lib/groups";

    const group_previews = writable<{
        title: string;
        description: string;
        short_uuid: string;
    }[]>([]);

    const loading = writable(true);

    onMount(() => {
        setTimeout(async () => {
            if ($loggedIn && $loading) {
                const response = await getGroupPreviews();
                if (!response.error && response.data) {
                    $group_previews = response.data;
                    $loading = false;
                }
            }
        }, 1000);

        loggedIn.subscribe(async (value) => {
            if (value && $loading) {
                const response = await getGroupPreviews();
                if (!response.error && response.data) {
                    $group_previews = response.data;
                    $loading = false;
                }
            }
        })
    })

    async function createNew() {
        await goto("/groups/edit/" + await createNewGroup());
    }
</script>

{#if $loading}
    <div class="w-full h-full grid items-center justify-around">
        <ProgressRadial size="large"/>
    </div>
{:else}
    <div class="w-full h-full pt-16 pb-5">
        {#if $group_previews.length > 0}
            <div class="w-full max-w-7xl px-10 m-auto pt-10 pb-2">
                <p class="text-xl">Your groups:</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 w-full max-w-7xl px-10 m-auto mb-5">
                {#each $group_previews as preview}
                    <div class="p-2 w-full h-full">
                        <button class="rounded-md text-left w-full h-full shadow-lg hover:shadow-2xl duration-200 p-5 bg-surface-300 hover:bg-primary-100"
                                on:click={() => goto("/groups/" + preview.short_uuid)}>
                            <p class="font-bold text-gray-700">{preview.title}</p>
                            <p class="text-gray-500">{preview.description}</p>
                        </button>
                    </div>
                {/each}
            </div>
        {:else}
            <div class="w-full flex justify-center mb-5 mt-10">
                <span class="h5">You have not created any groups yet. Create your first one down below!</span>
            </div>
        {/if}
        <div class="w-full flex flex-row justify-center">
            <button class="mr-2 btn variant-filled-primary btn-3d-primary" on:click={createNew}>
                New
            </button>
        </div>
    </div>
{/if}