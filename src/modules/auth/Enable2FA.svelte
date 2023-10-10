<script lang="ts">
    import {get2FA_ID_OrCreateOne, save2FAid} from "$lib/database";
    import {writable} from "svelte/store";
    import {ProgressBar} from "@skeletonlabs/skeleton";
    import VerifyWith2FA from "../modals/VerifyWith2FA.svelte";

    let enable2faWindow = false;
    let qrCode = '';
    let uri = '';
    let id = '';

    const message = writable({
        text: '',
        style: '',
    })
    const loading = writable(false);

    async function enable2fa() {
        $loading = true;

        const {data, error} = await get2FA_ID_OrCreateOne();

        $loading = false;

        if (error || !data) {
            console.log(error);
            $message = {
                text: error?.message || 'Something went wrong',
                style: 'text-red-500',
            }
            return;
        }

        if (!data.totp) {
            console.log('2FA already enabled');
            $message = {
                text: '2FA already enabled',
                style: 'text-red-500',
            }
            return;
        }

        enable2faWindow = true;
        qrCode = data.totp.qr_code;
        uri = data.totp.uri;
        id = data.id;
    }

    async function activate2FA() {
        $loading = true;
        const {error: saveError} = await save2FAid();
        $loading = false;

        if (saveError) {
            console.log(saveError);
            $message = {
                text: saveError.message,
                style: 'text-red-500',
            }
            return;
        }

        $message = {
            text: '2FA enabled',
            style: 'text-green-500',
        }
    }
</script>

<div class="w-fit h-fit pl2">
    {#if !enable2faWindow}
        <button class="btn variant-ghost-secondary" on:mouseup={enable2fa}>
            Enable 2FA
        </button>
    {:else}
        <div class="grid grid-cols-[auto_1fr]">
            <img src={qrCode} alt={uri} class="shadow-stance rounded-md">
            <div class="ml-5 grid items-center">
                <div>
                    <VerifyWith2FA id={id} afterVerify={activate2FA} message={message} loading={loading}>Activate
                    </VerifyWith2FA>
                </div>
            </div>
        </div>
    {/if}

    {#if $loading}
        <ProgressBar class="mt-2" meter="bg-primary-400"></ProgressBar>
    {/if}

    {#if $message.text !== ''}
        <p class="{$message.style} mt-2 text-center">{$message.text}</p>
    {/if}
</div>