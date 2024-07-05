<script>
    import {writable} from 'svelte/store';
    import AthenaPage from "../../../../modules/other/AthenaPage.svelte";

    const input = writable('');
</script>

<div class="h-screen w-full p-5 grid grid-cols-2 pt-20">
    <div class="mr-3 h-full pb-8">
        <textarea bind:value={$input} class="textarea h-full max-h-full" rows="4"
                  placeholder="Lorem ipsum dolor sit amet consectetur adipisicing elit."/>
    </div>

    <div class="ml-3 h-full overflow-auto px-1">
        <AthenaPage content={input}/>
    </div>
</div>