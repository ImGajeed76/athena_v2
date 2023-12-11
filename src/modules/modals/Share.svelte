<script lang="ts">
    // Props
    import {writable} from "svelte/store";

    /** Exposes parent props to this component. */
    export let parent: any;

    // Stores
    import {getModalStore} from '@skeletonlabs/skeleton';
    import {ArraysToCards, exportCards} from "$lib/cards";
    import {onMount} from "svelte";
    import QRCode from "../other/QRCode.svelte";

    const modalStore = getModalStore();

    let url = "";

    const cardText = writable("");
    const cardSeparator = writable(":");
    const lineSeparator = writable(";");

    onMount(() => {
        url = $modalStore[0].meta.url;
    })

    // We've created a custom submit function to pass the response and close the modal.
    function onFormSubmit(): void {
        navigator.clipboard.writeText(url);
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
        <header class={cHeader}>Share</header>
        <!-- Enable for debugging: -->

        <div class="my-5">
            <p class="text-lg mb-5">Thank you for sharing! 🌷</p>
            <div class="w-full flex justify-around mb-5">
                {#if url}
                    <QRCode content={url}/>
                {/if}
            </div>
        </div>

        <!-- prettier-ignore -->
        <footer class="modal-footer {parent.regionFooter}">
            <button class="btn {parent.buttonNeutral}" on:click={onClose}>{parent.buttonTextCancel}</button>
            <button id="submit"
                    class="btn {parent.buttonPositive}"
                    on:click={onFormSubmit}>Copy URL
            </button>
        </footer>
    </div>
{/if}