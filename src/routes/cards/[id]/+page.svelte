<script lang="ts">

    import {writable} from "svelte/store";
    import type {Trainer} from "$lib/cards";
    import {onMount} from "svelte";
    import {Card, deleteSet, getSet, saveCardsForSuggestions, updateSetPrivacy} from "$lib/cards";
    import {page} from "$app/stores";
    import {getUsername, loggedIn, currentUser} from "$lib/database";
    import {getModalStore, type ModalComponent, ProgressBar, ProgressRadial} from "@skeletonlabs/skeleton";
    import type {ModalSettings} from "@skeletonlabs/skeleton";
    import {goto} from "$app/navigation";
    import {permissions_loaded} from "$lib/permissions";
    import ExportCards from "../../../modules/modals/ExportCards.svelte";
    import Share from "../../../modules/modals/Share.svelte";

    const modalStore = getModalStore();

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

    const loading = writable<boolean>(true)

    const sortedCards = writable<Card[][]>([[], [], []])

    onMount(() => {
        setTimeout(async () => {
            if ($loggedIn && $loading) {
                const new_set = await getSet($page.params.id)
                if (new_set.data) {
                    set.set(new_set.data)
                    loading.set(false)
                    await saveCardsForSuggestions($set.values, $set.definitions, $set.authors);
                }
                if (new_set.error && new_set.error.code === "PGRST116") {
                    await goto("/cards")
                }
            }
        }, 1000)

        loggedIn.subscribe(async (loggedIn) => {
            if (loggedIn && $loading) {
                const new_set = await getSet($page.params.id)
                if (new_set.data) {
                    set.set(new_set.data)
                    loading.set(false)
                    await saveCardsForSuggestions($set.values, $set.definitions, $set.authors);
                }
                if (new_set.error && new_set.error.code === "PGRST116") {
                    await goto("/cards")
                }
            }
        })

        permissions_loaded.subscribe(async () => {
            if ($set) {
                await saveCardsForSuggestions($set.values, $set.definitions, $set.authors);
            }
        })
    })

    set.subscribe((set) => {
        if (set && set.trainer) {
            const allCards = [...set.trainer.learned_deck, ...set.trainer.unlearned_deck, ...set.trainer.current_deck, ...set.trainer.repetition_deck]

            const levelZero: Card[] = []
            for (const card of allCards) {
                if (card.value_streak === 0 && card.definition_streak === 0) {
                    levelZero.push(card)
                }
            }

            const levelOne: Card[] = []
            for (const card of allCards) {
                if (!levelZero.includes(card as Card) && !set.trainer.learned_deck.includes(card as Card)) {
                    levelOne.push(card)
                }
            }

            const levelTwo: Card[] = []
            for (const card of allCards) {
                if (!levelZero.includes(card as Card) && !levelOne.includes(card as Card)) {
                    levelTwo.push(card)
                }
            }

            console.log(set.trainer.learned_deck)
            sortedCards.set([levelZero, levelOne, levelTwo])
        }
    })

    async function deleteThisSet() {
        const modal: ModalSettings = {
            type: 'prompt',
            title: 'Confirm Deletion',
            body: `Are you sure you want to delete this set? This action cannot be undone. Type "${$set.title}" to confirm.`,
            value: '',
            valueAttr: {type: 'text', minlength: $set.title.length, maxlength: $set.title.length, required: true},
            response: async (r: string) => {
                if (r === $set.title) {
                    await deleteSet($set.set_uuid)
                    await goto("/cards")
                } else {
                    return false
                }
            },
        };
        modalStore.trigger(modal);
    }

    function share() {
        const modalComponent: ModalComponent = {ref: Share};
        const modal: ModalSettings = {
            type: "component",
            component: modalComponent,
            meta: {
                url: window.location.href,
            },
            response: () => {
            }
        };
        modalStore.trigger(modal);
    }
</script>

{#if $loading}
    <div class="w-full h-full grid items-center justify-around">
        <ProgressRadial size="large"/>
    </div>
{:else if $set}
    <div class="w-full h-full pt-16">
        <div class="w-full h-full max-w-4xl xl:max-w-6xl p-5 pt-10 m-auto">
            <div class="flex flex-row justify-between items-center">
                <div>
                    <p class="text-4xl">{$set.title}</p>
                    {#await getUsername($set.authors[0])}
                        <p class="text-xl">Created by ...</p>
                    {:then username}
                        <p class="text-xl">Created by {username}</p>
                    {:catch error}
                        <p class="text-xl">Created by {$set.authors[0]}</p>
                    {/await}
                </div>

                <div class="flex flex-row items-center">
                    {#if !$set.private}
                        <button class="btn" on:click={share}>
                            <span class="relative translate-x-14 opacity-0 hover:opacity-100 duration-200 hover:translate-x-5 w-20">Share</span>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                                <path d="M5.5 9.75v10.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V9.75a.25.25 0 0 0-.25-.25h-2.5a.75.75 0 0 1 0-1.5h2.5c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0 1 18.25 22H5.75A1.75 1.75 0 0 1 4 20.25V9.75C4 8.784 4.784 8 5.75 8h2.5a.75.75 0 0 1 0 1.5h-2.5a.25.25 0 0 0-.25.25Zm7.03-8.53 3.25 3.25a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215l-1.97-1.97v10.69a.75.75 0 0 1-1.5 0V3.56L9.28 5.53a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l3.25-3.25a.75.75 0 0 1 1.06 0Z"></path>
                            </svg>
                        </button>
                    {/if}
                    {#if $currentUser && $set.authors.includes($currentUser.email || "")}
                        <button class="btn variant-filled-secondary btn-3d-secondary mr-2"
                                on:click={() => goto("/cards/edit/" + $set.set_uuid)}>Edit
                        </button>
                    {/if}
                    <button class="btn variant-filled-primary btn-3d-primary"
                            on:click={() => goto("/cards/train/" + $set.set_uuid)}>Train
                    </button>
                </div>
            </div>

            <div class="h-20"></div>

            {#if $set.values.length > 0}
                <p>Set completed to {$set.trainer.learn_percentage}%</p>
                <ProgressBar class="mb-5" value={$set.trainer.learn_percentage} max={100} size="large" meter="{
                $set.trainer.learn_percentage < 50 ? 'bg-error-400' : $set.trainer.learn_percentage < 75 ? 'bg-warning-400' : 'bg-success-400'
            }"/>

                <p class="text-xl mb-5">Cards in this Set ({$set.values.length})</p>

                {#if $sortedCards[2].length > 0}
                    <p class="text-xl mb-5 text-success-500">Learned ({$sortedCards[2].length})</p>
                    {#each $sortedCards[2] as card, index}
                        <div class="bg-surface-300 outline outline-1 outline-surface-400 shadow-lg hover:shadow-xl rounded-md duration-200 mb-5">
                            <div class="flex flex-row justify-between items-center">
                                <p class="p-5">{index + 1}</p>
                            </div>
                            <hr class="bg-surface-400 h-[2px]">
                            <div class="p-5 grid grid-cols-2">
                                <div class="pr-2">
                                    <p>{card.value}</p>
                                </div>
                                <div class="pl-2">
                                    <p>{card.definition}</p>
                                </div>
                            </div>
                        </div>
                    {/each}
                {/if}

                {#if $sortedCards[1].length > 0}
                    <p class="text-xl mb-5 text-warning-500">Learning ({$sortedCards[1].length})</p>
                    {#each $sortedCards[1] as card, index}
                        <div class="bg-surface-300 outline outline-1 outline-surface-400 shadow-lg hover:shadow-xl rounded-md duration-200 mb-5">
                            <div class="flex flex-row justify-between items-center">
                                <p class="p-5">{index + 1 + $sortedCards[2].length}</p>
                            </div>
                            <hr class="bg-surface-400 h-[2px]">
                            <div class="p-5 grid grid-cols-2">
                                <div class="pr-2">
                                    <p>{card.value}</p>
                                </div>
                                <div class="pl-2">
                                    <p>{card.definition}</p>
                                </div>
                            </div>
                        </div>
                    {/each}
                {/if}

                {#if $sortedCards[0].length > 0}
                    <p class="text-xl mb-5 text-error-500">Unlearned ({$sortedCards[0].length})</p>
                    {#each $sortedCards[0] as card, index}
                        <div class="bg-surface-300 outline outline-1 outline-surface-400 shadow-lg hover:shadow-xl rounded-md duration-200 mb-5">
                            <div class="flex flex-row justify-between items-center">
                                <p class="p-5">{index + 1 + $sortedCards[2].length + $sortedCards[1].length}</p>
                            </div>
                            <hr class="bg-surface-400 h-[2px]">
                            <div class="p-5 grid grid-cols-2">
                                <div class="pr-2">
                                    <p>{card.value}</p>
                                </div>
                                <div class="pl-2">
                                    <p>{card.definition}</p>
                                </div>
                            </div>
                        </div>
                    {/each}
                {/if}
            {/if}

            {#if $currentUser && $set.authors.includes($currentUser.email || "")}
                <div class="h-14"></div>
                <div class="w-full flex flex-row justify-around">
                    <button class="btn variant-filled-error btn-3d-error" on:click={deleteThisSet}>
                        Delete Set
                    </button>
                </div>
            {/if}

            <div class="h-14"></div>
        </div>
    </div>
{/if}