<script lang="ts">
    import {writable} from "svelte/store";
    import type {AutocompleteOption} from "@skeletonlabs/skeleton";
    import {Autocomplete} from "@skeletonlabs/skeleton";
    import {getAvatar, supabase} from "$lib/database";

    export let users = writable<{
        username: string,
        email: string
    }[]>([]);

    let dbUsers: AutocompleteOption<string>[] = [];

    let input = '';

    async function updateDBUsers() {
        const {data, error} = await supabase
            .from("users")
            .select("*")
            .or(`username.ilike.%${input}%, email.ilike.%${input}%`)
            .limit(10);

        if (error || !data) {
            console.error(error);
            return;
        }

        const newData: AutocompleteOption<string>[] = [];

        for (const user of data) {
            const avatar = await getAvatar(user.avatar);
            newData.push({
                label: `<img class="w-10 mr-2 rounded-full" src="${avatar}">` + user.username,
                value: user.email,
                keywords: user.email + "," + user.username
            })
        }

        dbUsers = newData;

        console.log(data)
    }

    function onSelection(event: CustomEvent<AutocompleteOption<string>>): void {
        users.update((u) => {
            const keywords = event.detail.keywords!.split(",")
            const user = {
                username: keywords[1],
                email: keywords[0]
            }

            if (u.filter(e => e.email === user.email).length === 0) u.push(user);
            return u;
        })

        input = '';
        const inputElement = document.getElementById("input")!;
        inputElement.focus();
    }

</script>

<div class="w-fit h-fit max-w-lg">
    {#each $users as user}
        <button class="chip btn variant-ghost hover:variant-ghost-error m-1 ml-0"
                on:click={() => {
                users.update((u) => {
                    return u.filter(element => element.email !== user.email)
                })
            }}
        >
            {user.username}
            <svg class="ml-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path
                    d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"></path></svg>
        </button>
    {/each}

    <input id="input" class="input my-2 w-full" type="search" name="demo" bind:value={input} placeholder="Search..." on:input={updateDBUsers}/>

    {#if input !== ""}
        <div class="card w-full max-h-48 p-4 overflow-y-auto" tabindex="-1">
            <Autocomplete bind:input={input} options={dbUsers} on:selection={onSelection}/>
        </div>
    {/if}

    <img class="w-12 rounded-full" src="">
</div>