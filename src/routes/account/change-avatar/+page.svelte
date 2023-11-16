<script lang="ts">
    import {FileDropzone, getToastStore, ProgressBar, Toast} from "@skeletonlabs/skeleton";
    import {writable} from "svelte/store";
    import {copy} from "$lib/helpers";
    import {clearCash, uploadAvatar} from "$lib/database";
    import {goto} from "$app/navigation";
    import {onMount} from "svelte";

    const toastStore = getToastStore();

    let files: FileList;
    const accepted = ["image/jpeg", "image/jpg", "image/png"]

    let cropArea = writable<HTMLElement | null>(null);
    let image_url = writable("");
    let image_type = "";

    let distance: number;
    let position: {
        left: number,
        top: number
    };

    const enableCropping = () => {
        if (!$cropArea) return;

        let mouseDown = false;

        const corner1 = document.getElementById("corner-1");
        const corner2 = document.getElementById("corner-2");
        const corner3 = document.getElementById("corner-3");
        const corner4 = document.getElementById("corner-4");

        const circle = document.getElementById("circle");

        const image_preview = document.getElementById("image_preview");

        if (!corner1 || !corner2 || !corner3 || !corner4 || !circle || !image_preview) {
            console.log("corners not found");
            return;
        }

        const imageWidth = image_preview.clientWidth;
        const imageHeight = image_preview.clientHeight;

        distance = Math.min(imageWidth, imageHeight);
        position = {
            top: imageHeight / 2 - distance / 2,
            left: imageWidth / 2 - distance / 2,
        }

        let old_position = copy(position);
        let old_distance = copy(distance);

        let drag_start_pos = {
            x: 0,
            y: 0
        }

        function renderCircle() {
            if (!corner1 || !corner2 || !corner3 || !corner4 || !circle) {
                console.log("corners not found");
                return;
            }

            corner1.style.left = position.left + "px";
            corner1.style.top = position.top + "px";
            corner2.style.left = position.left + distance + "px";
            corner2.style.top = position.top + "px";
            corner3.style.left = position.left + "px";
            corner3.style.top = position.top + distance + "px";
            corner4.style.left = position.left + distance + "px";
            corner4.style.top = position.top + distance + "px";

            circle.style.backgroundImage = `radial-gradient(circle at ${position.left + distance / 2}px ${position.top + distance / 2}px, transparent ${distance / 2 - 2}px, rgba(0, 0, 0, 0.5) ${distance / 2}px)`
        }

        renderCircle();

        let target: null | EventTarget = null;

        function onDown(e: MouseEvent | TouchEvent) {
            if (e instanceof TouchEvent) {
                drag_start_pos = {
                    x: e.touches[0].clientX,
                    y: e.touches[0].clientY
                }
            }

            if (e instanceof MouseEvent) {
                drag_start_pos = {
                    x: e.x,
                    y: e.y
                }
            }

            target = e.target;
            mouseDown = true;
        }

        function onUp() {
            mouseDown = false;
            target = null;
            old_position = copy(position);
            old_distance = copy(distance);
        }

        $cropArea.addEventListener("mousedown", onDown);
        document.addEventListener("mouseup", onUp);

        $cropArea.addEventListener("touchstart", onDown);
        document.addEventListener("touchend", onUp);

        function onMove(e: MouseEvent | TouchEvent) {
            if (!mouseDown) return;
            if (!target) return;
            if (!$cropArea) return;

            let mousePos;

            if (e instanceof MouseEvent) {
                mousePos = {x: e.x, y: e.y};
            } else {
                mousePos = {x: e.touches[0].clientX, y: e.touches[0].clientY};
            }

            const diff = {
                x: mousePos.x - drag_start_pos.x,
                y: mousePos.y - drag_start_pos.y
            }

            if (target === corner1) {
                distance = old_distance - Math.max(diff.x, diff.y);
                position.left = old_position.left + diff.x;
                position.top = old_position.top + diff.y;
            }

            if (target === corner2) {
                distance = old_distance - Math.max(diff.x * -1, diff.y);
                if (distance > 50) position.top = old_position.top + diff.y;
            }

            if (target === corner3) {
                distance = old_distance - Math.max(diff.x, diff.y * -1);
                position.left = old_position.left + diff.x;
            }

            if (target === corner4) {
                distance = old_distance - Math.max(diff.x * -1, diff.y * -1);
            }

            if (target === circle) {
                position.left = old_position.left + diff.x;
                position.top = old_position.top + diff.y;
            }

            distance = Math.max(Math.min(distance, Math.min(imageHeight, imageWidth)), 50);
            position.top = Math.max(Math.min(position.top, imageHeight - distance), 0);
            position.left = Math.max(Math.min(position.left, imageWidth - distance), 0);

            if (old_distance !== distance || old_position.left !== position.left || old_position.top !== position.top) {
                renderCircle();
            }
        }

        $cropArea.addEventListener("mousemove", onMove);
        $cropArea.addEventListener("touchmove", onMove);
    };

    const loading = writable(false);

    async function save() {
        if (!$cropArea) return;

        $loading = true;

        const image = new Image();
        image.crossOrigin = "*";
        image.src = $image_url;

        await new Promise(resolve => {
            image.onload = () => {
                resolve("")
            }
        });

        const factor = image.width / $cropArea.clientWidth;

        distance *= factor;
        position = {
            left: position.left * factor,
            top: position.top * factor
        }

        const canvas = document.createElement('canvas');
        canvas.width = distance;
        canvas.height = distance;

        const ctx = canvas.getContext('2d');
        if (!ctx) return console.error("no cty found");
        ctx.drawImage(image, position.left, position.top, distance, distance, 0, 0, distance, distance);

        const crop_image_url = canvas.toDataURL(image_type);
        const base64 = crop_image_url.replace(/^data:image\/?[A-z]*;base64,/, '');

        const {data, error} = await uploadAvatar(base64, image_type);
        console.log(data, error)

        $loading = false;
        window.location.href = "/account";
    }

    function onChangeHandler(e: Event): void {
        if (files.length === 0) return;

        const file = files[0];
        if (!accepted.includes(file.type)) {
            toastStore.trigger({
                message: "File type not supported! (jpeg/jpg/png)",
                background: "variant-filled-error",
                hideDismiss: true,
                timeout: 5000,
            })
            return;
        }
        const filesize = ((file.size/1024)/1024); // MB
        if (filesize > 1) {
            toastStore.trigger({
                message: "Image to big. (max 1MB)",
                background: "variant-filled-error",
                hideDismiss: true,
                timeout: 5000,
            })
            return;
        }

        image_type = file.type;

        const reader = new FileReader();

        reader.addEventListener("load", () => {
            $image_url = reader.result as string;
            setTimeout(() => {
                enableCropping();
            }, 200)
        });

        reader.readAsDataURL(file);
    }

    onMount(() => {
        setTimeout(() => {
            enableCropping()
        }, 100)
    })
</script>

<Toast/>

<div class="w-full h-full grid items-center">
    <div class="m-auto w-fit max-w-4xl p-5 md:shadow-stance rounded-md">
        {#if $image_url === ''}
            <FileDropzone name="files" bind:files={files} on:change={onChangeHandler} accept=".png,.jpg,.jpeg"
                          multiple={false}>
                <svelte:fragment slot="lead">
                    <div class="grid justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="60" height="60">
                            <path d="M4 20.25V18a.75.75 0 0 1 1.5 0v2.25c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V18a.75.75 0 0 1 1.5 0v2.25A1.75 1.75 0 0 1 18.25 22H5.75A1.75 1.75 0 0 1 4 20.25Z"></path>
                            <path d="M5.22 9.53a.749.749 0 0 1 0-1.06l6.25-6.25a.749.749 0 0 1 1.06 0l6.25 6.25a.749.749 0 1 1-1.06 1.06l-4.97-4.969V16.75a.75.75 0 0 1-1.5 0V4.561L6.28 9.53a.749.749 0 0 1-1.06 0Z"></path>
                        </svg>
                    </div>
                </svelte:fragment>
                <svelte:fragment slot="message"><p class="h3">Select your new Avatar</p></svelte:fragment>
                <svelte:fragment slot="meta">Supported file types: jpg, jpeg, png</svelte:fragment>
            </FileDropzone>
        {:else}
            <h2 class="h3 mb-3">Crop your new profile picture</h2>
            <div class="grid h-fit">
                <div class="relative max-h-96 h-fit w-fit">
                    <img id="image_preview" src={$image_url} alt="avatar" class="h-full max-h-96 rounded-md">
                    <div bind:this={$cropArea} class="absolute w-full h-full top-0 left-0 rounded-md">
                        <div id="circle" class="absolute z-10 w-full h-full rounded-md"></div>
                        <div id="corner-1"
                             class="absolute bg-white h-3 w-3 rounded-full outline outline-1 outline-gray-600 cursor-nw-resize z-10"
                             style="translate: -50% -50%"></div>
                        <div id="corner-2"
                             class="absolute bg-white h-3 w-3 rounded-full outline outline-1 outline-gray-600 cursor-ne-resize z-10"
                             style="translate: -50% -50%"></div>
                        <div id="corner-3"
                             class="absolute bg-white h-3 w-3 rounded-full outline outline-1 outline-gray-600 cursor-sw-resize z-10"
                             style="translate: -50% -50%"></div>
                        <div id="corner-4"
                             class="absolute bg-white h-3 w-3 rounded-full outline outline-1 outline-gray-600 cursor-se-resize z-10"
                             style="translate: -50% -50%"></div>
                    </div>
                </div>
                <div class="pt-5 w-full">
                    <button class="btn variant-ghost-error w-full mb-2" on:click={() => {image_url.set("")}} disabled={$loading}>Cancel</button>
                    <button class="btn variant-filled-primary w-full" on:click={save} disabled={$loading}>Save</button>
                    {#if $loading}
                        <ProgressBar class="mt-1" meter="bg-primary-400"/>
                    {/if}
                </div>
            </div>
        {/if}
    </div>
</div>