<script lang="ts">
    import {page} from "$app/stores";
    import Error404 from "../modules/error_pages/Error404.svelte";
</script>

<div class="h-full">
    {#if $page.status === 404}
        <Error404/>
    {:else if $page.error}
        <h1>{$page.status}: {$page.error.message}</h1>
    {:else}
        <h1>Something went wrong...</h1>
    {/if}
</div>