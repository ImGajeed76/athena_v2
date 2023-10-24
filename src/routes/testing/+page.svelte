<script>
    import {currentUser} from "$lib/database";
    import UserSearch from "../../modules/other/UserSearch.svelte";
</script>

<style>

</style>

<div class="container h-[200vh] mx-auto flex justify-center">
    <div class="space-y-5">
        <div>
            <button class="btn variant-filled-primary">Primary</button>
            <button class="btn variant-filled-secondary">Secondary</button>
            <button class="btn variant-filled-tertiary">Tertiary</button>
            <button class="btn variant-filled-success">Success</button>
            <button class="btn variant-filled-warning">Warning</button>
            <button class="btn variant-filled-error">Error</button>
        </div>
        <div class="w-full h-56 p-5 rounded-md shadow-stance-invert">
            <p>I Love this shadow</p>
        </div>
        <div class="w-full h-56 p-5 rounded-md shadow-stance duration-200">
            <p>I Love this shadow too</p>
        </div>

        <button class="btn btn-3d-primary variant-filled-primary">Press Me</button>
        <button class="btn btn-3d-error variant-filled-error">Press Me</button>
        <button class="btn btn-3d-secondary variant-filled-secondary">Press Me</button>
        <button class="btn btn-3d-success variant-filled-success">Press Me</button>

        <button class="btn btn-3d-transparent">
            Press Me
        </button>

        <UserSearch/>
    </div>
</div>

