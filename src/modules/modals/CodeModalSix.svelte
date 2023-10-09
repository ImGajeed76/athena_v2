<script lang="ts">
    // Props
    import {writable} from "svelte/store";

    /** Exposes parent props to this component. */
    export let parent: any;

    // Stores
    import {getModalStore} from '@skeletonlabs/skeleton';

    const modalStore = getModalStore();

    let code1Element: HTMLInputElement;
    const code1 = writable<string>();
    code1.subscribe((value) => {
        if (!code1Element) return;

        if (isNaN(parseInt(value))) {
            code1.set("")
            return;
        }

        if (value.length > 0) {
            code2Element.focus()
        }

        if (value.length > 1) {
            code2.set(value.substring(1))
            code1.set(value.substring(0, 1))
        }
    })

    let code2Element: HTMLInputElement;
    const code2 = writable<string>();
    code2.subscribe((value) => {
        if (!code2Element) return;

        if (isNaN(parseInt(value))) {
            code2.set("")
            return;
        }

        if (value.length > 0) {
            code3Element.focus()
        }

        if (value.length > 1) {
            code3.set(value.substring(1))
            code2.set(value.substring(0, 1))
        }
    })

    let code3Element: HTMLInputElement;
    const code3 = writable<string>();
    code3.subscribe((value) => {
        if (!code3Element) return;

        if (isNaN(parseInt(value))) {
            code3.set("")
            return;
        }

        if (value.length > 0) {
            code4Element.focus()
        }

        if (value.length > 1) {
            code4.set(value.substring(1))
            code3.set(value.substring(0, 1))
        }
    })

    let code4Element: HTMLInputElement;
    const code4 = writable<string>();
    code4.subscribe((value) => {
        if (!code4Element) return;

        if (isNaN(parseInt(value))) {
            code4.set("")
            return;
        }

        if (value.length > 0) {
            code5Element.focus()
        }

        if (value.length > 1) {
            code5.set(value.substring(1))
            code4.set(value.substring(0, 1))
        }
    })

    let code5Element: HTMLInputElement;
    const code5 = writable<string>();
    code5.subscribe((value) => {
        if (!code5Element) return;

        if (isNaN(parseInt(value))) {
            code5.set("")
            return;
        }

        if (value.length > 0) {
            code6Element.focus()
        }

        if (value.length > 1) {
            code6.set(value.substring(1))
            code5.set(value.substring(0, 1))
        }
    })

    let code6Element: HTMLInputElement;
    const code6 = writable<string>();
    code6.subscribe((value) => {
        if (!code6Element) return;

        if (isNaN(parseInt(value))) {
            code6.set("")
            return;
        }

        if (value.length > 0) {
            const submitButton = document.getElementById("submit");
            if (submitButton) {
                submitButton.focus()
            }
        }
    })

    // We've created a custom submit function to pass the response and close the modal.
    function onFormSubmit(): void {
        const returnData = $code1 + $code2 + $code3 + $code4 + $code5 + $code6;
        if (returnData.length !== 6) return;
        if ($modalStore[0].response) $modalStore[0].response(returnData);
        modalStore.close();
    }

    // Base Classes
    const cBase = 'card p-4 w-96 shadow-xl space-y-4';
    const cHeader = 'text-2xl font-bold';
</script>

<!-- @component This example creates a simple form modal. -->

{#if $modalStore[0]}
    <div class="modal-example-form {cBase}">
        <header class={cHeader}>{$modalStore[0].title ?? '(title missing)'}</header>
        <article>{$modalStore[0].body ?? '(body missing)'}</article>
        <!-- Enable for debugging: -->

        <div class="w-full grid grid-cols-6">
            <div class="p-2">
                <input class="input h-24 text-6xl p-1 w-12" type="text" maxlength="6" placeholder="1" bind:this={code1Element} bind:value={$code1} />
            </div>
            <div class="p-2">
                <input class="input h-24 text-6xl p-1 w-12" type="text" maxlength="1" placeholder="2" bind:this={code2Element} bind:value={$code2} />
            </div>
            <div class="p-2">
                <input class="input h-24 text-6xl p-1 w-12" type="text" maxlength="1" placeholder="3" bind:this={code3Element} bind:value={$code3} />
            </div>
            <div class="p-2">
                <input class="input h-24 text-6xl p-1 w-12" type="text" maxlength="1" placeholder="4" bind:this={code4Element} bind:value={$code4} />
            </div>
            <div class="p-2">
                <input class="input h-24 text-6xl p-1 w-12" type="text" maxlength="1" placeholder="5" bind:this={code5Element} bind:value={$code5} />
            </div>
            <div class="p-2">
                <input class="input h-24 text-6xl p-1 w-12" type="text" maxlength="1" placeholder="6" bind:this={code6Element} bind:value={$code6} />
            </div>
        </div>

        <!-- prettier-ignore -->
        <footer class="modal-footer {parent.regionFooter}">
            <button class="btn {parent.buttonNeutral}" on:click={parent.onClose}>{parent.buttonTextCancel}</button>
            <button id="submit" class="btn outline-0 variant-ghost-primary text-black focus:variant-filled-primary hover:variant-filled-primary {parent.buttonPositive}" on:click={onFormSubmit}>Submit</button>
        </footer>
    </div>
{/if}