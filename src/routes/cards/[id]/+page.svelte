<script lang="ts">

    import {writable} from "svelte/store";
    import type {Trainer} from "$lib/cards";
    import {onMount} from "svelte";
    import {Card, deleteSet, getSet, updateSetPrivacy} from "$lib/cards";
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
            valueAttr: {type: 'text', minlength: $set.title.length, maxlength: $set.title.length, required: true},
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
                {#if $currentUser && $set.authors.includes($currentUser.email || "")}
                    <button class="btn mt-1" on:click={togglePrivate}>
                        {#if $set.private}
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path d="M4 4a4 4 0 0 1 8 0v2h.25c.966 0 1.75.784 1.75 1.75v5.5A1.75 1.75 0 0 1 12.25 15h-8.5A1.75 1.75 0 0 1 2 13.25v-5.5C2 6.784 2.784 6 3.75 6H4Zm8.25 3.5h-8.5a.25.25 0 0 0-.25.25v5.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-5.5a.25.25 0 0 0-.25-.25ZM10.5 6V4a2.5 2.5 0 1 0-5 0v2Z"></path></svg>
                        {:else}
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM5.78 8.75a9.64 9.64 0 0 0 1.363 4.177c.255.426.542.832.857 1.215.245-.296.551-.705.857-1.215A9.64 9.64 0 0 0 10.22 8.75Zm4.44-1.5a9.64 9.64 0 0 0-1.363-4.177c-.307-.51-.612-.919-.857-1.215a9.927 9.927 0 0 0-.857 1.215A9.64 9.64 0 0 0 5.78 7.25Zm-5.944 1.5H1.543a6.507 6.507 0 0 0 4.666 5.5c-.123-.181-.24-.365-.352-.552-.715-1.192-1.437-2.874-1.581-4.948Zm-2.733-1.5h2.733c.144-2.074.866-3.756 1.58-4.948.12-.197.237-.381.353-.552a6.507 6.507 0 0 0-4.666 5.5Zm10.181 1.5c-.144 2.074-.866 3.756-1.58 4.948-.12.197-.237.381-.353.552a6.507 6.507 0 0 0 4.666-5.5Zm2.733-1.5a6.507 6.507 0 0 0-4.666-5.5c.123.181.24.365.353.552.714 1.192 1.436 2.874 1.58 4.948Z"></path></svg>
                        {/if}
                    </button>
                {/if}
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