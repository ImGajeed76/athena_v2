<script lang="ts">
    // Props
    import {writable} from "svelte/store";

    /** Exposes parent props to this component. */
    export let parent: any;

    // Stores
    import {getModalStore} from '@skeletonlabs/skeleton';

    const modalStore = getModalStore();

    const cardText = writable("");
    const cardSeparator = writable(":");
    const lineSeparator = writable(";");

    // We've created a custom submit function to pass the response and close the modal.
    function onFormSubmit(): void {
        const values = [];
        const definitions = [];
        const lines = $cardText.split($lineSeparator);
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const parts = line.split($cardSeparator);
            if (parts.length === 2) {
                values.push(parts[0].trim());
                definitions.push(parts[1].trim());
            }
        }
        if ($modalStore[0].response) $modalStore[0].response({values, definitions});
        modalStore.close();
    }

    // Base Classes
    const cBase = 'card p-4 w-96 shadow-xl space-y-4';
    const cHeader = 'text-2xl font-bold';
</script>

<!-- @component This example creates a simple form modal. -->

{#if $modalStore[0]}
    <div class="modal-example-form {cBase}">
        <header class={cHeader}>Import your cards!</header>
        <!-- Enable for debugging: -->

        <div class="my-5">
            <p class="label">Paste your cards here:</p>
            <textarea class="textarea" placeholder="hello: hallo;" bind:value={$cardText}></textarea>

            <div class="mt-5">
                <p class="label">Between values and definitions:</p>
                <input class="input" type="text" bind:value={$cardSeparator}>
            </div>
            <div class="mt-5">
                <p class="label">Between cards:</p>
                <input class="input" type="text" bind:value={$lineSeparator}>
            </div>
        </div>

        <!-- prettier-ignore -->
        <footer class="modal-footer {parent.regionFooter}">
            <button class="btn {parent.buttonNeutral}" on:click={parent.onClose}>{parent.buttonTextCancel}</button>
            <button id="submit"
                    class="btn {parent.buttonPositive}"
                    on:click={onFormSubmit}>Import
            </button>
        </footer>
    </div>
{/if}