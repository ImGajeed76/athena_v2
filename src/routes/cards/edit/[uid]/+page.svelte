<script lang="ts">
    import {get, writable} from "svelte/store";
    import type {Trainer} from "$lib/cards";
    import {getSet, getSuggestions, saveSet, updateSetPrivacy} from "$lib/cards";
    import {onMount} from "svelte";
    import {page} from "$app/stores";
    import {currentUser, getUsername, loggedIn} from "$lib/database";
    import type {ModalComponent, ModalSettings} from "@skeletonlabs/skeleton";
    import {getModalStore, ProgressRadial, RadioGroup, RadioItem} from "@skeletonlabs/skeleton";
    import {goto} from "$app/navigation";
    import ImportCards from "../../../../modules/modals/ImportCards.svelte";
    import ExportCards from "../../../../modules/modals/ExportCards.svelte";

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

    const modalStore = getModalStore();

    onMount(() => {
        setTimeout(() => {
            if (!$loggedIn) {
                goto('/login?redirect=' + encodeURIComponent($page.route.id || "/"));
            }
        }, 2000)

        setTimeout(async () => {
            if ($loggedIn && $loading) {
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

        const currentHref = window.location.href;

        const onKeydown = async (event: KeyboardEvent) => {
            if (window.location.href !== currentHref) {
                window.removeEventListener("keydown", onKeydown)
            }

            if (event.key === "s" && (event.ctrlKey || event.metaKey)) {
                event.preventDefault()
                await saveChanges()
            }

            let valueInputs: NodeListOf<HTMLInputElement> = document.querySelectorAll(".value-input")
            let definitionInputs: NodeListOf<HTMLInputElement> = document.querySelectorAll(".definition-input")

            if (event.key === "Backspace") {
                const valueIndex = Array.from(valueInputs).indexOf(event.target as HTMLInputElement)
                if (valueIndex > 0 && valueInputs[valueIndex].value === "" && definitionInputs[valueIndex].value === "") {
                    event.preventDefault()
                    await removeCard(valueIndex)
                    valueInputs = document.querySelectorAll(".value-input")
                    definitionInputs = document.querySelectorAll(".definition-input")
                    definitionInputs[valueIndex - 1].focus()
                }

                const definitionIndex = Array.from(definitionInputs).indexOf(event.target as HTMLInputElement)
                if (definitionIndex > 0 && definitionInputs[definitionIndex].value === "") {
                    event.preventDefault()
                    valueInputs = document.querySelectorAll(".value-input")
                    definitionInputs = document.querySelectorAll(".definition-input")
                    valueInputs[definitionIndex].focus()
                }
            }

            if ((event.key === "Enter" || event.key === "Tab") && !event.shiftKey) {
                event.preventDefault()
                if (event.target === definitionInputs[definitionInputs.length - 1]) {
                    await addCard()
                    valueInputs = document.querySelectorAll(".value-input")
                    definitionInputs = document.querySelectorAll(".definition-input")
                    valueInputs[valueInputs.length - 1].focus()
                }
                if (definitionInputs.length > 0 && Array.from(definitionInputs).includes(event.target as HTMLInputElement)) {
                    const index = Array.from(definitionInputs).indexOf(event.target as HTMLInputElement)
                    valueInputs = document.querySelectorAll(".value-input")
                    definitionInputs = document.querySelectorAll(".definition-input")
                    valueInputs[index + 1].focus()
                }
                if (valueInputs.length > 0 && Array.from(valueInputs).includes(event.target as HTMLInputElement)) {
                    const index = Array.from(valueInputs).indexOf(event.target as HTMLInputElement)
                    valueInputs = document.querySelectorAll(".value-input")
                    definitionInputs = document.querySelectorAll(".definition-input")
                    definitionInputs[index].focus()
                }
                if (event.target === document.getElementById("title-input")) {
                    valueInputs = document.querySelectorAll(".value-input")
                    definitionInputs = document.querySelectorAll(".definition-input")
                    if (valueInputs.length > 0) valueInputs[0].focus()
                    else {
                        await addCard()
                        valueInputs = document.querySelectorAll(".value-input")
                        definitionInputs = document.querySelectorAll(".definition-input")
                        valueInputs[0].focus()
                    }
                }
            }

            if (event.key === "Tab" && event.shiftKey) {
                event.preventDefault()
                if (definitionInputs.length > 0 && Array.from(definitionInputs).includes(event.target as HTMLInputElement)) {
                    const index = Array.from(definitionInputs).indexOf(event.target as HTMLInputElement)
                    valueInputs = document.querySelectorAll(".value-input")
                    definitionInputs = document.querySelectorAll(".definition-input")
                    valueInputs[index].focus()
                }
                if (valueInputs.length > 0 && Array.from(valueInputs).includes(event.target as HTMLInputElement)) {
                    const index = Array.from(valueInputs).indexOf(event.target as HTMLInputElement)
                    valueInputs = document.querySelectorAll(".value-input")
                    definitionInputs = document.querySelectorAll(".definition-input")
                    if (index > 0) definitionInputs[index - 1].focus()
                    else document.getElementById("title-input")?.focus()
                }
            }
        }

        document.addEventListener("keydown", onKeydown)

        function mouseDown(event: MouseEvent) {
            if (window.location.href !== currentHref) {
                document.removeEventListener("mousedown", mouseDown)
            }

            const suggestionBox = document.getElementsByClassName("suggestion-box")[0]
            const target = event.target as HTMLElement

            if (suggestionBox && target && !suggestionBox.contains(target) && !target.classList.contains("definition-input")) {
                isDefinition.set(false)
            }
        }

        document.addEventListener("mousedown", mouseDown)
    })

    async function addCard() {
        if ($set) {
            $set.values.push("")
            $set.definitions.push("")
            $set.values = $set.values

            // smoothly scroll to bottom
            const page = document.getElementById("page");
            setTimeout(() => {
                if (page) {
                    page.scrollTo({
                        top: page.scrollHeight,
                        behavior: "smooth"
                    })
                }
            }, 100)
        }
    }

    async function saveChanges() {
        if ($set) {
            for (let i = 0; i < $set.values.length; i++) {
                if ($set.values[i] === "" && $set.definitions[i] === "") {
                    $set.values.splice(i, 1)
                    $set.definitions.splice(i, 1)
                    i--
                }
            }

            await saveSet($set.set_uuid, $set.title, $set.values, $set.definitions, $set.private)
            originalSet = JSON.stringify($set)
            changesMade.set(false)
            $set.values = $set.values.map((value) => value)
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
            if (set && !set.authors.includes(currentEmail)) {
                goto("/cards")
            }
        }

        if (originalSet !== "" && JSON.parse(originalSet).private === set.private) {
            changesMade.set(originalSet !== JSON.stringify(set))
        }
    })

    async function removeCard(index: number) {
        if ($set) {
            $set.values.splice(index, 1)
            $set.definitions.splice(index, 1)
            $set.values = $set.values.map((value) => value)
        }
    }

    async function togglePrivate() {
        await updateSetPrivacy($set.set_uuid, $set.private);
        await saveChanges()
    }

    async function importSet() {
        const modalComponent: ModalComponent = {ref: ImportCards};
        const modal: ModalSettings = {
            type: "component",
            component: modalComponent,
            response: ({values, definitions}) => {
                if (values === undefined || definitions === undefined) return;

                if ($set) {
                    $set.values = $set.values.concat(values)
                    $set.definitions = $set.definitions.concat(definitions)
                    $set.values = $set.values.map((value) => value)
                }
            }
        };
        modalStore.trigger(modal);
    }

    async function exportSet() {
        if (!$set) return;
        if (!$set.values) return;
        if (!$set.definitions) return;

        const modalComponent: ModalComponent = {ref: ExportCards};
        const modal: ModalSettings = {
            type: "component",
            component: modalComponent,
            meta: {
                values: $set.values,
                definitions: $set.definitions
            },
            response: () => {
            }
        };
        modalStore.trigger(modal);
    }

    const selectedIndex = writable<number>(0)
    const isDefinition = writable<boolean>(false)
    const suggestions = writable<string[]>([])
    const rawSuggestions = writable<string[]>([])

    function onBlur(index: number) {
        selectedIndex.set(index)
        isDefinition.set(false)
    }

    function onFocus(index: number) {
        selectedIndex.set(index)
        isDefinition.set(true)
    }

    set.subscribe(updateSuggestions)
    isDefinition.subscribe(fetchSuggestions)
    selectedIndex.subscribe(fetchSuggestions)
    rawSuggestions.subscribe(updateSuggestions)

    async function fetchSuggestions() {
        if ($set) {
            const value = $set.values[$selectedIndex];
            let fetchedSuggestions = await getSuggestions(value);
            rawSuggestions.set(fetchedSuggestions)
        }
    }

    async function updateSuggestions() {
        if ($set) {
            let fetchedSuggestions = $rawSuggestions;
            const definition = $set.definitions[$selectedIndex];
            if (definition !== undefined) {
                fetchedSuggestions = fetchedSuggestions.filter((suggestion) => {
                    return suggestion.toLowerCase().includes(definition.toLowerCase())
                })
                suggestions.set(fetchedSuggestions)
            }
        }
    }

    function selectSuggestion(suggestion: string) {
        console.log(suggestion)
        if ($set) {
            if ($isDefinition && $selectedIndex < $set.definitions.length) {
                $set.definitions[$selectedIndex] = suggestion
                $set.values = $set.values.map((value) => value)
                isDefinition.set(false)
            }
        }
    }
</script>

{#if $loading}
    <div class="w-full h-full grid items-center justify-around">
        <ProgressRadial size="large"/>
    </div>
{:else if $set}
    <div class="w-full h-full pt-16">
        <div class="absolute w-full bottom-0 z-50">
            <div class="mx-auto max-w-2xl w-full h-fit rounded-md">
                <div class="shadow-2xl ease-in-out transition-all {!$changesMade ? 'opacity-0 invisible lg:mb-0 -mb-10' : 'opacity-100 lg:mb-10 mb-0'} bg-white py-2 px-5 rounded-md flex flex-row items-center justify-between">
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
                <RadioGroup active="variant-filled-primary" hover="hover:variant-soft-primary">
                    <RadioItem bind:group={$set.private} name="justify" value={false} on:click={togglePrivate}>Public
                    </RadioItem>
                    <RadioItem bind:group={$set.private} name="justify" value={true} on:click={togglePrivate}>Private
                    </RadioItem>
                </RadioGroup>
            </div>

            <div>
                <div class="flex flex-row mb-2 ml-2">
                    <button class="mr-3" on:click={importSet}>Import</button>
                    <button class="mr-3" on:click={exportSet}>Export</button>
                </div>
                <input id="title-input" class="text-4xl input" bind:value={$set.title}>
            </div>

            <div class="h-14"></div>

            {#each $set.values as value, index}
                <div class="bg-surface-300 outline outline-1 outline-surface-400 shadow-lg hover:shadow-xl rounded-md duration-200 mb-5">
                    <div class="flex flex-row justify-between items-center">
                        <p class="p-5">{index + 1}</p>
                        <div class="p-3">
                            <button class="hover:bg-error-200 p-2 rounded-md btn-3d-transparent duration-200"
                                    on:click={() => removeCard(index)}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
                                    <path d="M11 1.75V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.492.149l-.66 6.6A1.748 1.748 0 0 1 10.595 15h-5.19a1.75 1.75 0 0 1-1.741-1.575l-.66-6.6a.75.75 0 1 1 1.492-.15ZM6.5 1.75V3h3V1.75a.25.25 0 0 0-.25-.25h-2.5a.25.25 0 0 0-.25.25Z"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <hr class="bg-surface-400 h-[2px]">
                    <div class="p-5 grid grid-cols-2">
                        <div class="pr-2">
                            <input class="value-input input" bind:value={value} placeholder="value"
                                   on:focus={() => onBlur(index)}>
                        </div>
                        <div class="pl-2 relative z-0">
                            <input class="definition-input input" on:focus={() => onFocus(index)}
                                   bind:value={$set.definitions[$set.values.indexOf(value)]} placeholder="definition">
                            {#if $isDefinition && $selectedIndex === index && $suggestions.length > 0}
                                <div class="suggestion-box absolute top-10 left-1 p-3 w-full z-20">
                                    <div class="w-full h-full outline outline-1 bg-white outline-surface-500 p-3 rounded-md shadow-2xl">
                                        {#each $suggestions as suggestion}
                                            <button class="btn w-full flex justify-start hover:variant-ghost-primary"
                                                    on:click={() => selectSuggestion(suggestion)}>
                                                {suggestion}
                                            </button>
                                        {/each}
                                    </div>
                                </div>
                            {/if}
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
    </div>
{/if}