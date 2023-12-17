<script lang="ts">
    import {writable} from "svelte/store";
    import {get2FA_ID_OrCreateOne, supabase} from "$lib/database";
    import {onMount} from "svelte";

    export let id = "";

    const isMobile = writable(false);

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

    const buttonActive = writable(false);
    let code = writable<string>();

    function onInput() {
        code.set($code1 + $code2 + $code3 + $code4 + $code5 + $code6)

        if ($code.length === 6) {
            buttonActive.set(true);
        } else {
            buttonActive.set(false);
        }
    }

    export let message = writable({
        text: '',
        style: '',
    })
    export let loading = writable(false);
    export let verified = writable(false);

    async function verify() {
        $verified = false;

        if ($code.length !== 6) {
            $message = {
                text: 'Invalid code',
                style: 'text-red-500',
            }
            return;
        }

        $loading = true;

        if (id === "") {
            const {data, error} = await get2FA_ID_OrCreateOne();

            if (error || !data) {
                console.log(error);
                $message = {
                    text: error?.message || 'Something went wrong',
                    style: 'text-red-500',
                }
                return;
            }

            id = data.id;
        }

        const {error: challengeError} = await supabase.auth.mfa.challengeAndVerify({
            factorId: id,
            code: $code,
        })

        if (challengeError) {
            console.log(challengeError);
            $message = {
                text: challengeError.message,
                style: 'text-red-500',
            }
            $loading = false;
            return;
        }

        $loading = false;
        $verified = true;
        afterVerify();
    }

    onMount(() => {
        if ("maxTouchPoints" in navigator) {
            isMobile.set(navigator.maxTouchPoints > 0);

            if (navigator.maxTouchPoints > 0) {
                const inputElements = document.querySelectorAll("input");
                inputElements.forEach((element) => {
                    element.setAttribute("type", "number");
                })
            }

            console.log(navigator.maxTouchPoints)
        }
    })

    export let afterVerify: () => void = () => {};
</script>

<div class="w-fit h-fit">
    <div class="flex">
        <div class="p-2">
            <input name="totp" id="totp" class="input h-12 text-4xl p-1 w-8" type="text" maxlength="6" placeholder="1"
                   bind:this={code1Element} bind:value={$code1} on:input={onInput} on:keydown={onInput}/>
        </div>
        <div class="p-2">
            <input class="input h-12 text-4xl p-1 w-8" type="text" maxlength="1" placeholder="2"
                   bind:this={code2Element} bind:value={$code2} on:input={onInput} on:keydown={onInput}/>
        </div>
        <div class="p-2">
            <input class="input h-12 text-4xl p-1 w-8" type="text" maxlength="1" placeholder="3"
                   bind:this={code3Element} bind:value={$code3} on:input={onInput} on:keydown={onInput}/>
        </div>
        <div class="p-2">
            <input class="input h-12 text-4xl p-1 w-8" type="text" maxlength="1" placeholder="4"
                   bind:this={code4Element} bind:value={$code4} on:input={onInput} on:keydown={onInput}/>
        </div>
        <div class="p-2">
            <input class="input h-12 text-4xl p-1 w-8" type="text" maxlength="1" placeholder="5"
                   bind:this={code5Element} bind:value={$code5} on:input={onInput} on:keydown={onInput}/>
        </div>
        <div class="p-2">
            <input class="input h-12 text-4xl p-1 w-8" type="text" maxlength="1" placeholder="6"
                   bind:this={code6Element} bind:value={$code6} on:input={onInput} on:keydown={onInput}/>
        </div>
    </div>
    <div class="px-2">
        <button class="btn variant-filled-primary w-full {$verified ? 'bg-success-500' : ''}"
                disabled={!$buttonActive || $verified} on:click={verify}>
            <slot>Verify</slot>
            {#if $verified}
                <svg class="ml-2 animate-bounce" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
                    <path fill="#fff" d="m9.585.52.929.68c.153.112.331.186.518.215l1.138.175a2.678 2.678 0 0 1 2.24 2.24l.174 1.139c.029.187.103.365.215.518l.68.928a2.677 2.677 0 0 1 0 3.17l-.68.928a1.174 1.174 0 0 0-.215.518l-.175 1.138a2.678 2.678 0 0 1-2.241 2.241l-1.138.175a1.17 1.17 0 0 0-.518.215l-.928.68a2.677 2.677 0 0 1-3.17 0l-.928-.68a1.174 1.174 0 0 0-.518-.215L3.83 14.41a2.678 2.678 0 0 1-2.24-2.24l-.175-1.138a1.17 1.17 0 0 0-.215-.518l-.68-.928a2.677 2.677 0 0 1 0-3.17l.68-.928c.112-.153.186-.331.215-.518l.175-1.14a2.678 2.678 0 0 1 2.24-2.24l1.139-.175c.187-.029.365-.103.518-.215l.928-.68a2.677 2.677 0 0 1 3.17 0ZM7.303 1.728l-.927.68a2.67 2.67 0 0 1-1.18.489l-1.137.174a1.179 1.179 0 0 0-.987.987l-.174 1.136a2.677 2.677 0 0 1-.489 1.18l-.68.928a1.18 1.18 0 0 0 0 1.394l.68.927c.256.348.424.753.489 1.18l.174 1.137c.078.509.478.909.987.987l1.136.174a2.67 2.67 0 0 1 1.18.489l.928.68c.414.305.979.305 1.394 0l.927-.68a2.67 2.67 0 0 1 1.18-.489l1.137-.174a1.18 1.18 0 0 0 .987-.987l.174-1.136a2.67 2.67 0 0 1 .489-1.18l.68-.928a1.176 1.176 0 0 0 0-1.394l-.68-.927a2.686 2.686 0 0 1-.489-1.18l-.174-1.137a1.179 1.179 0 0 0-.987-.987l-1.136-.174a2.677 2.677 0 0 1-1.18-.489l-.928-.68a1.176 1.176 0 0 0-1.394 0ZM11.28 6.78l-3.75 3.75a.75.75 0 0 1-1.06 0L4.72 8.78a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L7 8.94l3.22-3.22a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042Z"></path>
                </svg>
            {/if}
        </button>
    </div>
</div>