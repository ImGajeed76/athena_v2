<script lang="ts">
    import {onMount} from "svelte";
    import QRCode from "qrcode";

    export let content: string = "";
    export let correctionLevel: "L" | "M" | "Q" | "H" = "M";
    let codeImage = "";

    onMount(async () => {
        codeImage = await QRCode.toDataURL(content, {
            errorCorrectionLevel: correctionLevel,
            margin: 1,
            width: 256,
            color: {
                dark: "#000000",
                light: "#ffffff00"
            }
        });
    })
</script>

<img src="{codeImage}" alt="QR Code">