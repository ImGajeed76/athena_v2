<script lang="ts">
    import {get, writable} from "svelte/store";
    import type {Trainer} from "$lib/cards";
    import {onMount} from "svelte";
    import {getSet, saveSet, updateSetPrivacy} from "$lib/cards";
    import {page} from "$app/stores";
    import {getUsername, loggedIn, currentUser} from "$lib/database";
    import {ProgressRadial} from "@skeletonlabs/skeleton";
    import {goto} from "$app/navigation";

    const set = writable<{
        set_uuid: string,
        progress_uuid: string,
        title: string,
        authors: string[],
        private: boolean,
        values: string[],
        definitions: string[],
        trainer: Trainer,
    }>()

    let originalSet = "";

    const loading = writable<boolean>(true)

    const authorUserName = writable<string>("")

    const changesMade = writable<boolean>(false)

    onMount(() => {
        setTimeout(async () => {
            if ($loggedIn && $loading) {
                const new_set = await getSet($page.params.uid)
                if (new_set.data) {
                    originalSet = JSON.stringify(new_set.data)
                    set.set(new_set.data)
                    loading.set(false)
                }
            }
        }, 1000)

        loggedIn.subscribe(async (loggedIn) => {
            if (loggedIn && $loading) {
                const new_set = await getSet($page.params.uid)
                if (new_set.data) {
                    originalSet = JSON.stringify(new_set.data)
                    set.set(new_set.data)
                    loading.set(false)
                }
            }
        })
    })

    async function addCard() {
        if ($set) {
            $set.values.push("value")
            $set.definitions.push("definition")
            $set.values = $set.values
        }
    }

    async function saveChanges() {
        if ($set) {
            await saveSet($set.set_uuid, $set.title, $set.values, $set.definitions, $set.private)
            originalSet = JSON.stringify($set)
            changesMade.set(false)
        }
    }

    set.subscribe((set) => {
        if (set && set.authors.length > 0 && $authorUserName === "") {
            getUsername(set.authors[0]).then((username) => {
                authorUserName.set(username)
            })
        }

        const currentEmail = get(currentUser)?.email;
        if (currentEmail) {
            if (!set.authors.includes(currentEmail)) {
                goto("/cards")
            }
        }

        changesMade.set(originalSet !== JSON.stringify(set))
    })

    async function removeCard(index: number) {
        if ($set) {
            $set.values.splice(index, 1)
            $set.definitions.splice(index, 1)
            $set.values = $set.values
        }
    }

    async function togglePrivate() {
        $set.private = !$set.private;
        await updateSetPrivacy($set.set_uuid, $set.private);
    }
</script>

{#if $loading}
    <div class="w-full h-full grid items-center justify-around">
        <ProgressRadial size="large"/>
    </div>
{:else if $set}
    <div class="absolute w-full bottom-0">
        <div class="mx-auto max-w-2xl w-full h-fit z-10 rounded-md">
            <div class="shadow-2xl ease-in-out transition-all {!$changesMade ? 'opacity-0 invisible mb-0' : 'opacity-100 mb-10'} bg-white py-2 px-5 rounded-md flex flex-row items-center justify-between">
                <p class="text-lg">Don't forget to save your changes!</p>
                <button class="btn variant-ghost-error hover:variant-filled-error"
                        on:click={saveChanges}>
                    Save changes
                </button>
            </div>
        </div>
    </div>

    <div class="w-full h-full max-w-4xl xl:max-w-6xl p-5 pt-10 m-auto">
        <div class="mb-5 flex flex-row justify-between">
            <a href="/cards/{$set.set_uuid}" class="flex flex-row items-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
                    <path d="M7.78 12.53a.75.75 0 0 1-1.06 0L2.47 8.28a.75.75 0 0 1 0-1.06l4.25-4.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042L4.81 7h7.44a.75.75 0 0 1 0 1.5H4.81l2.97 2.97a.75.75 0 0 1 0 1.06Z"></path>
                </svg>
                Back to Set
            </a>
            <button class="btn mt-1" on:click={togglePrivate}>
                {#if $set.private}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path d="M4 4a4 4 0 0 1 8 0v2h.25c.966 0 1.75.784 1.75 1.75v5.5A1.75 1.75 0 0 1 12.25 15h-8.5A1.75 1.75 0 0 1 2 13.25v-5.5C2 6.784 2.784 6 3.75 6H4Zm8.25 3.5h-8.5a.25.25 0 0 0-.25.25v5.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-5.5a.25.25 0 0 0-.25-.25ZM10.5 6V4a2.5 2.5 0 1 0-5 0v2Z"></path></svg>
                {:else}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM5.78 8.75a9.64 9.64 0 0 0 1.363 4.177c.255.426.542.832.857 1.215.245-.296.551-.705.857-1.215A9.64 9.64 0 0 0 10.22 8.75Zm4.44-1.5a9.64 9.64 0 0 0-1.363-4.177c-.307-.51-.612-.919-.857-1.215a9.927 9.927 0 0 0-.857 1.215A9.64 9.64 0 0 0 5.78 7.25Zm-5.944 1.5H1.543a6.507 6.507 0 0 0 4.666 5.5c-.123-.181-.24-.365-.352-.552-.715-1.192-1.437-2.874-1.581-4.948Zm-2.733-1.5h2.733c.144-2.074.866-3.756 1.58-4.948.12-.197.237-.381.353-.552a6.507 6.507 0 0 0-4.666 5.5Zm10.181 1.5c-.144 2.074-.866 3.756-1.58 4.948-.12.197-.237.381-.353.552a6.507 6.507 0 0 0 4.666-5.5Zm2.733-1.5a6.507 6.507 0 0 0-4.666-5.5c.123.181.24.365.353.552.714 1.192 1.436 2.874 1.58 4.948Z"></path></svg>
                {/if}
            </button>
        </div>

        <div>
            <input class="text-4xl input" bind:value={$set.title}>
        </div>

        <div class="h-14"></div>

        {#each $set.values as value, index}
            <div class="bg-surface-300 outline outline-1 outline-surface-400 shadow-lg hover:shadow-xl rounded-md duration-200 mb-5">
                <div class="flex flex-row justify-between items-center">
                    <p class="p-5">{index + 1}</p>
                    <div class="p-3">
                        <button class="hover:bg-error-200 p-2 rounded-md btn-3d-transparent duration-200" on:click={() => removeCard(index)}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
                                <path d="M11 1.75V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.492.149l-.66 6.6A1.748 1.748 0 0 1 10.595 15h-5.19a1.75 1.75 0 0 1-1.741-1.575l-.66-6.6a.75.75 0 1 1 1.492-.15ZM6.5 1.75V3h3V1.75a.25.25 0 0 0-.25-.25h-2.5a.25.25 0 0 0-.25.25Z"></path>
                            </svg>
                        </button>
                    </div>
                </div>
                <hr class="bg-surface-400 h-[2px]">
                <div class="p-5 grid grid-cols-2">
                    <div class="pr-2">
                        <input class="input" bind:value={value}>
                    </div>
                    <div class="pl-2">
                        <input class="input" bind:value={$set.definitions[$set.values.indexOf(value)]}>
                    </div>
                </div>
            </div>
        {/each}

        <div class="h-20"></div>

        <div class="w-full flex justify-around">
            <button class="btn variant-filled-primary btn-3d-primary" on:click={addCard}>Add Card</button>
        </div>

        <div class="h-32"></div>
    </div>
{/if}