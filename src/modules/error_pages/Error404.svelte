<script lang="ts">
    import {onMount} from "svelte";
    import {goto} from "$app/navigation";

    let imageElement: HTMLImageElement;
    let imageSize: { width: number, height: number } = {
        width: 3582,
        height: 2048
    };

    let imageWidth: number;
    let imageHeight: number;
    let imageLeft: number;
    let imageTop: number;

    let inBookBounds: boolean = false;

    function recalculateObjectCoverSizeAndPosition() {
        const containerWidth = window.innerWidth;
        const containerHeight = window.innerHeight;

        const containerAspectRatio = containerWidth / containerHeight;
        const imageAspectRatio = imageSize.width / imageSize.height;

        let result = {
            width: 0,
            height: 0,
            x: 0,
            y: 0
        };

        if (containerAspectRatio > imageAspectRatio) {
            result.width = containerWidth;
            result.height = containerWidth / imageAspectRatio;
            result.y = (containerHeight - result.height);
        } else {
            result.height = containerHeight;
            result.width = containerHeight * imageAspectRatio;
            result.x = (containerWidth - result.width) / 2;
        }

        imageWidth = result.width;
        imageHeight = result.height;
        imageLeft = result.x;
        imageTop = result.y;
    }


    function screenPointToImagePoint(x: number, y: number): { x: number, y: number } {
        const virtualImageWidth = imageSize.width;
        const virtualImageHeight = imageSize.height;

        const relativeCoords = {
            x: x - imageLeft,
            y: y - imageTop
        }

        return {
            x: relativeCoords.x / imageWidth * virtualImageWidth,
            y: relativeCoords.y / imageHeight * virtualImageHeight
        };
    }

    onMount(() => {
        setTimeout(() => {
            recalculateObjectCoverSizeAndPosition();
        }, 100);

        window.addEventListener("resize", () => {
            recalculateObjectCoverSizeAndPosition();
        });

        imageElement.addEventListener("mousemove", (event) => {
            const x = event.offsetX;
            const y = event.offsetY;

            const point = screenPointToImagePoint(x, y);

            const bookBounds = [819, 841, 848, 969]
            inBookBounds = point.x > bookBounds[0] && point.x < bookBounds[2] && point.y > bookBounds[1] && point.y < bookBounds[3]

            if (inBookBounds) {
                imageElement.style.cursor = "pointer";
                imageElement.src = "/athena_404_page_book_out.png";
            } else {
                imageElement.style.cursor = "default";
                imageElement.src = "/athena_404_page.png";
            }
        });

        imageElement.addEventListener("click", () => {
            if (inBookBounds) {
                imageElement.removeEventListener("mousemove", () => {
                });
                imageElement.removeEventListener("click", () => {
                });
                window.removeEventListener("resize", () => {
                });
                goto("/ee/L7zb6X");
            }
        });
    });
</script>


<img src="/athena_404_page_book_out.png" alt="Cached Background" class="sr-only">

<div class="w-screen h-screen fixed top-0 left-0">
    <img bind:this={imageElement} src="/athena_404_page.png" alt="Background"
         class="w-full h-full object-cover object-bottom">
</div>
