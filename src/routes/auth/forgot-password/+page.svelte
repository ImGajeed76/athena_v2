<script lang="ts">
    import {writable} from "svelte/store";
    import {sendPasswordResetEmail} from "$lib/database";
    import {ProgressBar} from "@skeletonlabs/skeleton";

    const email = writable("");

    const message = writable({
        text: "",
        style: ""
    });
    const loading = writable(false);

    const state = writable<"send" | "resend">("send");

    async function submit() {
        $message = {
            text: "",
            style: ""
        }

        if (!$email) {
            $message = {
                text: "Please provide a Email",
                style: "text-error-500"
            }
            return;
        }

        $loading = true;

        const {error} = await sendPasswordResetEmail($email);

        $loading = false;

        if (error) {
            $message = {
                text: error.message,
                style: "text-error-500"
            }
            return;
        }

        $message = {
            text: "Email send successfully!",
            style: "text-success-500"
        }
        $state = "resend";
    }

    async function resend() {

    }
</script>

<div class="w-full h-full grid items-center">
    <div class="max-w-2xl w-full m-auto h-fit shadow-stance p-5">
        <h2 class="h3">Reset Password</h2>
        <p class="mb-5">Forgot your password? No problem, we got you!</p>

        <form class="grid grid-cols-[1fr_auto] mb-2" on:submit={submit}>
            <label class="label mr-2">
                <span class="ml-1">Email</span>
                <input class="input" type="email" placeholder="Email" bind:value={$email}/>
            </label>

            {#if $state === "send"}
                <button type="submit" class="btn w-28 variant-filled-primary h-fit mt-auto">
                    Send
                </button>
            {:else}
                <div class="h-fit mt-auto">
                    <button type="submit" class="btn w-28 variant-ghost-primary ">
                        Resend
                    </button>
                    <a type="button" class="btn w-28 variant-filled-primary" href="/login">
                        Login
                    </a>
                </div>
            {/if}
        </form>

        {#if $loading}
            <ProgressBar class="mt-2" meter="bg-primary-400" track="bg-surface-400"/>
        {/if}

        {#if $message.text !== ""}
            <p class="text-center mt-2 {$message.style}">{$message.text}</p>
        {/if}
    </div>
</div>