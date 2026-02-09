<script lang="ts">
    // Props
    import {writable} from "svelte/store";

    /** Exposes parent props to this component. */
    export let parent: any;

    // Stores
    import {getModalStore} from '@skeletonlabs/skeleton';
    import {ArraysToCards, exportCards} from "$lib/cards";
    import {onMount} from "svelte";

    const modalStore = getModalStore();

    let values: string[] = [];
    let definitions: string[] = [];

    const cardText = writable("");
    const cardSeparator = writable(":");
    const lineSeparator = writable(";");

    cardSeparator.subscribe(() => {
        $cardText = exportCards(ArraysToCards(values, definitions), $cardSeparator, $lineSeparator);
    });

    lineSeparator.subscribe(() => {
        $cardText = exportCards(ArraysToCards(values, definitions), $cardSeparator, $lineSeparator);
    })

    onMount(() => {
        values = $modalStore[0].meta.values;
        definitions = $modalStore[0].meta.definitions;
        $cardText = exportCards(ArraysToCards(values, definitions), $cardSeparator, $lineSeparator);
    })

    // We've created a custom submit function to pass the response and close the modal.
    function onFormSubmit(): void {
        navigator.clipboard.writeText($cardText);
        if ($modalStore[0].response) $modalStore[0].response(null);
        modalStore.close();
    }

    function onClose(): void {
        if ($modalStore[0].response) $modalStore[0].response(null);
        modalStore.close();
    }

    // Base Classes
    const cBase = 'card p-4 w-96 shadow-xl space-y-4';
    const cHeader = 'text-2xl font-bold';
</script>

<!-- @component This example creates a simple form modal. -->

{#if $modalStore[0]}
    <div class="modal-example-form {cBase}">
        <header class={cHeader}>Export your cards!</header>
        <!-- Enable for debugging: -->

        <div class="my-5">
            <div class="">
                <p class="label">Between values and definitions:</p>
                <input class="input" type="text" bind:value={$cardSeparator}>
            </div>
            <div class="mt-5">
                <p class="label">Between cards:</p>
                <input class="input" type="text" bind:value={$lineSeparator}>
            </div>

            <textarea class="textarea mt-5" bind:value={$cardText}></textarea>
        </div>

        <!-- prettier-ignore -->
        <footer class="modal-footer {parent.regionFooter}">
            <button class="btn {parent.buttonNeutral}" on:click={onClose}>{parent.buttonTextCancel}</button>
            <button id="submit"
                    class="btn {parent.buttonPositive}"
                    on:click={onFormSubmit}>Copy
            </button>
        </footer>
    </div>
{/if}