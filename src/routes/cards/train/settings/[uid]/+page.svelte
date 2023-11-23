<script lang="ts">
    import {get, writable} from "svelte/store";
    import {getSet, saveProgress, saveSet, temporaryTrainers, Trainer} from "$lib/cards";
    import {onMount} from "svelte";
    import {currentUser, getUsername, loggedIn} from "$lib/database";
    import {page} from "$app/stores";
    import {goto} from "$app/navigation";
    import {ProgressRadial, SlideToggle} from "@skeletonlabs/skeleton";

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
    const changesMade = writable<boolean>(false)
    let originalSet = "";

    onMount(() => {
        setTimeout(async () => {
            if ($loading) {
                const new_set = await getSet($page.params.uid, true)
                if (new_set.data) {
                    originalSet = JSON.stringify(new_set.data)
                    set.set(new_set.data)
                    loading.set(false)
                }
                if (new_set.error && new_set.error.code === "PGRST116") {
                    await goto("/cards")
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
                if (new_set.error && new_set.error.code === "PGRST116") {
                    await goto("/cards")
                }
            }
        })
    })

    async function saveChanges() {
        if ($set) {
            if (!$loggedIn) {
                temporaryTrainers[$set.set_uuid] = $set.trainer;
                originalSet = JSON.stringify($set)
                changesMade.set(false)
                $set.values = $set.values.map((value) => value)
                return
            }
            await saveProgress($set.progress_uuid, $set.trainer)
            originalSet = JSON.stringify($set)
            changesMade.set(false)
            $set.values = $set.values.map((value) => value)
        }
    }

    set.subscribe((set) => {
        changesMade.set(originalSet !== JSON.stringify(set))
    })
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
        <a href="/cards/train/{$set.set_uuid}" class="flex flex-row items-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
                <path d="M7.78 12.53a.75.75 0 0 1-1.06 0L2.47 8.28a.75.75 0 0 1 0-1.06l4.25-4.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042L4.81 7h7.44a.75.75 0 0 1 0 1.5H4.81l2.97 2.97a.75.75 0 0 1 0 1.06Z"></path>
            </svg>
            Back to Training
        </a>

        <div class="mt-5 flex flex-row justify-between items-center">
            <div>
                <p class="text-4xl">{$set.title}</p>
                <p class="text-xl">Training Settings</p>
            </div>
        </div>

        <div class="h-20"></div>

        <div>
            <p class="text-3xl">General</p>

            <div class="h-5"></div>

            <div class="mb-7">
                <div class="flex flex-row items-center justify-between">
                    <p class="text-xl">Side to learn</p>
                    <select class="select w-min" bind:value={$set.trainer.side_to_learn}>
                        <option value="both">Both</option>
                        <option value="values">Values</option>
                        <option value="definitions">Definitions</option>
                    </select>
                </div>
                <p>Select which side you want to learn.</p>
            </div>

            <div class="h-10"></div>

            <p class="text-3xl">Text Correction</p>

            <div class="h-5"></div>

            <div class="mb-7">
                <div class="flex flex-row items-center justify-between">
                    <p class="text-xl">Only require one option as answer</p>
                    <SlideToggle name="one-option" bind:checked={$set.trainer.settings.allow_partial_answers}
                                 active="bg-primary-500" size="sm"/>
                </div>
                <p>For example if the answer is "educate, education" only "educate" or "education" is required</p>
            </div>

            <div class="mb-7">
                <div class="flex flex-row items-center justify-between">
                    <p class="text-xl">Case sensitive</p>
                    <SlideToggle name="synonyms" bind:checked={$set.trainer.settings.case_sensitive}
                                 active="bg-primary-500" size="sm"/>
                </div>
                <p>For example if the answer is "educate" only "educate" is accepted, not "Educate" or "EDUCATE"</p>
            </div>
        </div>
    </div>
{/if}