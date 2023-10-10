<script>
    import {ProgressBar} from "@skeletonlabs/skeleton";
    import {writable} from "svelte/store";
    import {unenroll} from "$lib/database";

    const message = writable({
        text: '',
        style: '',
    })
    const loading = writable(false);

    async function disable() {
        const {error} = await unenroll();

        if (error) {
            message.set({
                text: error.message,
                style: 'text-error-500',
            })
            return;
        }

        message.set({
            text: '2FA disabled',
            style: 'text-success-500',
        })

        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }
</script>

<div class="w-fit h-fit pl-2">
    <button class="btn variant-ghost-error" on:click={disable}>
        Disable 2FA
    </button>

    {#if $loading}
        <ProgressBar class="mt-2" meter="bg-primary-400"></ProgressBar>
    {/if}

    {#if $message.text !== ''}
        <p class="{$message.style} mt-2 text-center">{$message.text}</p>
    {/if}
</div>