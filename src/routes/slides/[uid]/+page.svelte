<script lang="ts">
    import {writable} from "svelte/store";
    import type {Slides} from "$lib/slides";
    import {emptySlide, getSlides, updateSlides} from "$lib/slides";
    import {onMount} from "svelte";
    import {currentUser} from "$lib/database";
    import {page} from "$app/stores";
    import {ProgressRadial} from "@skeletonlabs/skeleton";
    import SlideEditor from "../../../modules/editors/slides/SlideEditor.svelte";

    const slides = writable<Slides | null>(null)
    const loaded = writable(false)

    onMount(() => {
        currentUser.subscribe(async () => {
            if ($slides) return;

            const uid = $page.params.uid;
            slides.set(await getSlides(uid));
            setTimeout(() => {
                loaded.set(true);
            }, 1000)
        })
    })

    async function saveSlides() {
        if (!$slides) return;
        await updateSlides($slides);
        slides.set(await getSlides($slides.uid));
    }

    async function addSlide() {
        if (!$slides) return;

        $slides.slides.push(emptySlide());
        await saveSlides();
    }

    slides.subscribe(async () => {
        if (!$slides) return;
        if (!document) return;

        let slidePreviews = [];

        await new Promise(resolve => {
            function awaitSlidePreviews() {
                slidePreviews = document.querySelectorAll(".slide-preview");
                if (slidePreviews.length !== $slides.slides.length || slidePreviews.length === 0) {
                    setTimeout(awaitSlidePreviews, 100);
                } else {
                    resolve();
                }
            }

            awaitSlidePreviews()
        });

        const parent = slidePreviews[0].parentElement;

        let possibleMouseDown = false;
        let mouseDown = false;
        let selectedSlide = null;
        let startLeft = 0;
        let startTop = 0;
        let originalLeft = 0;
        let originalTop = 0;
        let currentPositionOffset = 0;

        parent.onmousedown = (e: MouseEvent) => {
            let target = e.target as HTMLElement;
            while (target) {
                if (target.classList.contains("slide-preview")) {
                    selectedSlide = target;
                    break;
                }
                target = target.parentElement;
            }
            possibleMouseDown = true;

            const index = Array.from(slidePreviews).indexOf(selectedSlide);
            currentSlide.set(index);

            setTimeout(() => {
                if (!possibleMouseDown) return;
                if (!selectedSlide) return;
                mouseDown = true;
                startLeft = e.clientX;
                startTop = e.clientY;
                originalLeft = selectedSlide.clientLeft;
                originalTop = selectedSlide.clientTop;
                document.body.style.cursor = "grabbing";
                selectedSlide.style.cursor = "grabbing";
            }, 300)
        }

        document.onmouseup = () => {
            possibleMouseDown = false;
            if (!mouseDown) return;
            mouseDown = false;
            document.body.style.cursor = "default";
            if (!selectedSlide) return;

            selectedSlide.style.left = "0px";
            selectedSlide.style.top = (selectedSlide.offsetHeight + 16) * currentPositionOffset + "px";

            updateSlideOrder();
            selectedSlide = null;
        }

        function updateSlideOrder() {
            if (!$slides) return;
            if (!slidePreviews) return;

            const sortedSlidePreviews = Array.from(slidePreviews).sort((a, b) => {
                return a.offsetTop - b.offsetTop;
            });

            const newSlides = [];
            for (const slidePreview of sortedSlidePreviews) {
                const uid = slidePreview.id;
                const slide = $slides.slides.find(slide => slide.uid === uid);
                if (!slide) continue;
                newSlides.push(slide);
            }

            setTimeout(() => {
                $slides.slides = [];
                setTimeout(() => {
                    $slides.slides = newSlides;
                }, 1)
            }, 110)
        }

        document.onmousemove = (e: MouseEvent) => {
            if (!mouseDown) return;
            if (!selectedSlide) return;

            requestAnimationFrame(() => {
                if (!selectedSlide) return;

                const left = originalLeft + (e.clientX - startLeft);
                const top = originalTop + (e.clientY - startTop);

                selectedSlide.style.left = `${left}px`;
                selectedSlide.style.top = `${top}px`;
            });

            const slideIndex = Array.from(slidePreviews).indexOf(selectedSlide);
            if (slideIndex === -1) return;

            for (let i = 0; i < slidePreviews.length; i++) {
                if (i === slideIndex) continue;

                const otherTop = slidePreviews[i].offsetTop;
                const currentTop = selectedSlide.offsetTop;
                if (otherTop < currentTop && slideIndex < i) {
                    slidePreviews[i].style.top = -slidePreviews[slideIndex].offsetHeight - 16 + "px";
                    currentPositionOffset = Math.max(currentPositionOffset, i - slideIndex);
                } else if (otherTop > currentTop && slideIndex > i) {
                    slidePreviews[i].style.top = slidePreviews[slideIndex].offsetHeight + 16 + "px";
                    currentPositionOffset = Math.min(currentPositionOffset, i - slideIndex);
                } else {
                    slidePreviews[i].style.top = "0px";
                }
            }
        }
    })

    const currentSlide = writable(0);
    currentSlide.subscribe(() => console.log($currentSlide))

    slides.subscribe(() => console.log($slides))
</script>

{#if $slides}
    <div class="w-full h-full overflow-hidden grid grid-rows-[auto_1fr] p-3">
        <div class="w-full h-full shadow-stance p-3 rounded-md justify-between flex">
            <input type="text" class="input variant-ghost w-fit text-xl" bind:value={$slides.title}>
            <div>
                <button class="btn variant-filled-secondary">
                    Play
                </button>
            </div>
        </div>
        <div class="w-full h-full grid grid-cols-[auto_1fr_auto] pt-3">
            <div class="w-full h-full shadow-stance rounded-md flex p-1 flex-col">
                <div class="w-full h-full p-2 rounded-md">
                    {#each $slides.slides as slide}
                        <button id="{slide.uid}"
                                style="transition: all 100ms"
                                class="slide-preview relative z-10 w-52 h-32 mb-4 rounded-md bg-surface-500 flex flex-col justify-between hover:scale-105 duration-200 cursor-pointer">
                            <p class="text-center mt-2 mx-auto">{slide.text}</p>
                            <div class="w-full h-14">
                                {#if slide.options.type === "select"}
                                    <div class="w-full h-12 grid grid-cols-2 p-1 pb-0">
                                        <div class="w-full h-full px-1">
                                            <div class="bg-surface-600 rounded-md w-full h-full"></div>
                                        </div>
                                        <div class="w-full h-full px-1">
                                            <div class="bg-surface-600 rounded-md w-full h-full"></div>
                                        </div>
                                        <div class="w-full h-full px-1 pt-1">
                                            <div class="bg-surface-600 rounded-md w-full h-full"></div>
                                        </div>
                                        <div class="w-full h-full px-1 pt-1">
                                            <div class="bg-surface-600 rounded-md w-full h-full"></div>
                                        </div>
                                    </div>
                                {:else}
                                    <div class="w-full h-12 grid grid-cols-2 p-1 pb-0">
                                        <div class="w-full h-full px-1">
                                            <div class="bg-surface-600 rounded-md w-full h-full"></div>
                                        </div>
                                        <div class="w-full h-full px-1">
                                            <div class="bg-surface-600 rounded-md w-full h-full"></div>
                                        </div>
                                    </div>
                                {/if}
                            </div>
                        </button>
                    {/each}
                </div>
                <button class="w-52 btn btn-sm variant-filled-primary mx-auto my-3"
                        on:click={addSlide}
                >
                    Add slide
                </button>
            </div>
            <div class="w-full h-full px-3">
                <div class="w-full h-full rounded-md bg-surface-300 p-5">
                    <SlideEditor slides={slides} currentSlide={currentSlide}/>
                </div>
            </div>
            <div class="w-full h-full shadow-stance rounded-md p-3">
                preferences
            </div>
        </div>
    </div>
{:else if $loaded}
    <div class="w-full h-full grid items-center justify-center">
        <div>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="50" height="50" class="w-52 h-28">
                <path fill="#f22c5d"
                      d="M20.347 3.653a3.936 3.936 0 0 0-5.567 0l-1.75 1.75a.75.75 0 0 1-1.06-1.06l1.75-1.75a5.436 5.436 0 0 1 7.688 7.687l-1.564 1.564a.75.75 0 0 1-1.06-1.06l1.563-1.564a3.936 3.936 0 0 0 0-5.567ZM9.786 12.369a.75.75 0 0 1 1.053.125c.096.122.2.24.314.353 1.348 1.348 3.386 1.587 4.89.658l-3.922-2.858a.745.745 0 0 1-.057-.037c-1.419-1.013-3.454-.787-4.784.543L3.653 14.78a3.936 3.936 0 0 0 5.567 5.567l3-3a.75.75 0 1 1 1.06 1.06l-3 3a5.436 5.436 0 1 1-7.688-7.687l3.628-3.628a5.517 5.517 0 0 1 3.014-1.547l-7.05-5.136a.75.75 0 0 1 .883-1.213l20.25 14.75a.75.75 0 0 1-.884 1.213l-5.109-3.722c-2.155 1.709-5.278 1.425-7.232-.53a5.491 5.491 0 0 1-.431-.485.75.75 0 0 1 .125-1.053Z"></path>
            </svg>
            <p class="text-center mt-5">Slides not found</p>
        </div>
    </div>
{:else}
    <div class="w-full h-full grid items-center justify-center">
        <div>
            <ProgressRadial/>
            <p class="text-center mt-5">Loading ...</p>
        </div>
    </div>
{/if}