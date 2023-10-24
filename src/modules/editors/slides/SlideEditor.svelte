<script lang="ts">
    import {writable} from "svelte/store";
    import type {Slides} from "$lib/slides";

    export let slides = writable<Slides>()
    export let currentSlide = writable(0)
</script>

{#if $slides.slides[$currentSlide]}
    <div class="grid grid-rows-[auto_1fr] w-full h-full">
        <h2 class="text-center h2 mb-[40%]">{$slides.slides[$currentSlide].text}</h2>
        <div class="w-full h-full">
            {#if $slides.slides[$currentSlide].type === "input" }
                <div class="h-full">
                    {#if $slides.slides[$currentSlide].options.type === "select"}
                        <div class="w-full h-full grid grid-cols-2 p-1 pb-0">
                            <div class="w-full h-full px-1">
                                {#if $slides.slides[$currentSlide].options[0]}
                                    <div class="flex items-center bg-success-400 rounded-md w-full h-full p-3">
                                        <input class="checkbox bg-[#00000033] border-none" type="checkbox" bind:checked={$slides.slides[$currentSlide].options[0].value} />
                                        <input type="text" class="input bg-[#00000033] text-white border-none ml-2 w-full variant-ghost" bind:value={$slides.slides[$currentSlide].options[0].label}>
                                    </div>
                                {:else}
                                    <div class="bg-surface-600 outline-dashed outline-1 rounded-md w-full h-full p-3">
                                        <button class="text-center w-full h-full" on:click={() => {
                                            $slides.slides[$currentSlide].options[0] = {
                                                text: "Option 1",
                                                correct: false
                                            }
                                        }}>Add Options</button>
                                    </div>
                                {/if}
                            </div>
                            <div class="w-full h-full px-1">
                                {#if $slides.slides[$currentSlide].options[1]}
                                    <div class="flex items-center bg-warning-400 rounded-md w-full h-full p-3">
                                        <input class="checkbox bg-[#00000033] border-none" type="checkbox" bind:checked={$slides.slides[$currentSlide].options[1].value} />
                                        <input type="text" class="input bg-[#00000033] text-white border-none ml-2 w-full variant-ghost" bind:value={$slides.slides[$currentSlide].options[1].label}>
                                    </div>
                                {:else}
                                    <div class="bg-surface-600 outline-dashed outline-1 rounded-md w-full h-full p-3">
                                        <button class="text-center w-full h-full" on:click={() => {
                                            $slides.slides[$currentSlide].options[1] = {
                                                text: "Option 1",
                                                correct: false
                                            }
                                        }}>Add Options</button>
                                    </div>
                                {/if}
                            </div>
                            <div class="w-full h-full px-1 pt-2">
                                {#if $slides.slides[$currentSlide].options[2]}
                                    <div class="flex items-center bg-error-400 rounded-md w-full h-full p-3">
                                        <input class="checkbox bg-[#00000033] border-none" type="checkbox" bind:checked={$slides.slides[$currentSlide].options[2].value} />
                                        <input type="text" class="input bg-[#00000033] text-white border-none ml-2 w-full variant-ghost" bind:value={$slides.slides[$currentSlide].options[2].label}>
                                    </div>
                                {:else}
                                    <div class="bg-surface-600 outline-dashed outline-1 rounded-md w-full h-full p-3">
                                        <button class="text-center w-full h-full" on:click={() => {
                                            $slides.slides[$currentSlide].options[2] = {
                                                text: "Option 1",
                                                correct: false
                                            }
                                        }}>Add Options</button>
                                    </div>
                                {/if}
                            </div>
                            <div class="w-full h-full px-1 pt-2">
                                {#if $slides.slides[$currentSlide].options[3]}
                                    <div class="flex items-center bg-blue-400 rounded-md w-full h-full p-3">
                                        <input class="checkbox bg-[#00000033] border-none" type="checkbox" bind:checked={$slides.slides[$currentSlide].options[3].value} />
                                        <input type="text" class="input bg-[#00000033] text-white border-none ml-2 w-full variant-ghost" bind:value={$slides.slides[$currentSlide].options[3].label}>
                                    </div>
                                {:else}
                                    <div class="bg-surface-600 outline-dashed outline-1 rounded-md w-full h-full p-3">
                                        <button class="text-center w-full h-full" on:click={() => {
                                            $slides.slides[$currentSlide].options[3] = {
                                                text: "Option 1",
                                                correct: false
                                            }
                                        }}>Add Options</button>
                                    </div>
                                {/if}
                            </div>
                        </div>
                    {:else}
                        <div class="w-full h-1/3 grid grid-cols-2 p-1 pb-0">
                            <div class="w-full h-full px-1">
                                <div class="bg-surface-600 rounded-md w-full h-full">a</div>
                            </div>
                            <div class="w-full h-full px-1">
                                <div class="bg-surface-600 rounded-md w-full h-full">a</div>
                            </div>
                        </div>
                    {/if}
                </div>
            {:else}
                <div>
                    lol
                </div>
            {/if}
        </div>
    </div>
{/if}