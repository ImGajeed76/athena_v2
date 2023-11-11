<script lang="ts">

    import {writable} from "svelte/store";
    import type {Trainer} from "$lib/cards";
    import {onMount} from "svelte";
    import {Card, deleteSet, getSet} from "$lib/cards";
    import {page} from "$app/stores";
    import {getUsername, loggedIn, currentUser} from "$lib/database";
    import {getModalStore, ProgressBar, ProgressRadial} from "@skeletonlabs/skeleton";
    import type {ModalSettings} from "@skeletonlabs/skeleton";
    import {goto} from "$app/navigation";

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
                }
            }
        }, 1000)

        loggedIn.subscribe(async (loggedIn) => {
            if (loggedIn && $loading) {
                const new_set = await getSet($page.params.id)
                if (new_set.data) {
                    set.set(new_set.data)
                    loading.set(false)
                }
            }
        })
    })

    set.subscribe((set) => {
        if (set && set.trainer) {
            const levelZero: Card[] = []
            for (const card of set.trainer.cards) {
                if (card.value_streak + card.definition_streak <= 0 && !set.trainer.learned_deck.find((learnedCard) => learnedCard.value === card.value && learnedCard.definition === card.definition)) {
                    levelZero.push(card)
                }
            }

            const levelOne: Card[] = []
            for (const card of set.trainer.cards) {
                if (card.value_streak + card.definition_streak <= 2 && !set.trainer.learned_deck.find((learnedCard) => learnedCard.value === card.value && learnedCard.definition === card.definition) && !levelZero.includes(card as Card)) {
                    levelOne.push(card)
                }
            }

            const levelTwo: Card[] = []
            for (const card of set.trainer.cards) {
                if (!levelZero.includes(card as Card) && !levelOne.includes(card as Card)) {
                    levelTwo.push(card)
                }
            }

            console.log(set.trainer.learned_deck)
            sortedCards.set([levelZero, levelOne, levelTwo])
        }
    })

    sortedCards.subscribe((cards) => {
        console.log(cards)
    })

    async function deleteThisSet() {
        const modal: ModalSettings = {
            type: 'prompt',
            // Data
            title: 'Confirm Deletion',
            body: `Are you sure you want to delete this set? This action cannot be undone. Type "${$set.title}" to confirm.`,
            // Populates the input value and attributes
            value: '',
            valueAttr: { type: 'text', minlength: $set.title.length, maxlength: $set.title.length, required: true },
            // Returns the updated response value
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
</script>

{#if $loading}
    <div class="w-full h-full grid items-center justify-around">
        <ProgressRadial size="large"/>
    </div>
{:else if $set}
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
{/if}