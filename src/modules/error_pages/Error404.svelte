<script lang="ts">
import ImportCards from "../modals/ImportCards.svelte";
</script>

<div class="absolute w-screen h-screen top-0 left-0 p-5 grid grid-cols-1 lg:grid-cols-2 items-center">
    <div class="w-full">
        <div class="m-auto w-fit">
            <h1 class="text-6xl" style="line-height: 1.2">404</h1>
            <h2 class="text-2xl" style="line-height: 1.2">You reached a unknown territory!</h2>
            <hr class="my-5 h-[2px] bg-black">
            <p class="text-lg" style="line-height: 1.4">The page you are looking for does not exist. <br>
                You can now either just press the buttons below to get back or <br>
                you could solve a fun little maze on the right to find your exit.</p>
            <div class="flex-row flex mt-5">
                <button class="btn variant-filled-secondary btn-3d-secondary mr-3">Home</button>
                <button class="btn variant-filled-primary btn-3d-primary">Back</button>
            </div>
        </div>
    </div>
    <div class="lg:h-full h-0 w-full p-20 flex items-center invisible lg:visible">
        <div class="shadow-stance overflow-hidden rounded-md h-fit">
            <img src="/404-image.png" alt="404">
        </div>
    </div>
</div>