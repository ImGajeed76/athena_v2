<script lang="ts">
    import {writable} from "svelte/store";
    import {onMount} from "svelte";
    import {insertNewSlides, getAllSlides, emptySlides} from "$lib/slides";
    import {currentUser} from "$lib/database";
    import {goto} from "$app/navigation";

    const slides = writable<{
        uid: string,
        title: string,
        modified_at: Date,
    }[]>([]);

    onMount(() => {
        currentUser.subscribe(async () => {
            let allSlides = await getAllSlides();
            allSlides.forEach(slide => {
                slide.modified_at = new Date(slide.modified_at);
            });
            allSlides = allSlides.sort((a, b) => {
                if (a.modified_at > b.modified_at) return -1;
                if (a.modified_at < b.modified_at) return 1;
                return 0;
            });
            slides.set(allSlides);
        })
    })

    async function createNewSlides() {
        const newSlides = emptySlides();
        await insertNewSlides(newSlides);
        await goto(`/slides/${newSlides.uid}`)
    }
</script>

<div class="w-full h-full max-w-6xl p-5 m-auto">
    <h3 class="h3 text-center">Here you can see all your created slides:</h3>

    <div class="grid grid-cols-3 mt-5">
        {#each $slides as item}
            <div class="w-full h-60 p-5">
                <button class="w-full h-full overflow-hidden relative shadow-stance-down rounded-md hover:shadow-stance active:shadow-stance-down duration-200"
                        style="background-image: url('/slides_thumbnail.png'); background-size: cover; background-position: center; background-repeat: no-repeat;"
                        on:click={async () => await goto(`/slides/${item.uid}`)}
                >
                    <span class="w-full h-1/4 bg-surface-300 absolute bottom-0 left-0 shadow-stance-down">
                        <span class="h5">{item.title}</span>
                    </span>
                </button>
            </div>
        {/each}
    </div>
    {#if $slides.length === 0}
        <div class="w-full flex justify-center mb-2">
            <span class="h5">You have no slides yet. Create your first one down below!</span>
        </div>
    {/if}
    <div class="w-full flex justify-center">
        <button class="btn btn-3d-transparent m-auto hover:bg-primary-300" on:click={createNewSlides}>
            New
        </button>
    </div>
</div>