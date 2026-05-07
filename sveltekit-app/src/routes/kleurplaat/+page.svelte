<script lang="ts">
  import PaintCanvas from '$lib/components/PaintCanvas.svelte'

  const sheets = [
    {id: 'kibbeling', label: 'Bakje Kibbeling', src: '/kleurplaten/kibbeling.png'},
    {id: 'domtoren', label: 'Domtoren', src: '/kleurplaten/domtoren.png'},
  ]

  let activeSheet = sheets[0]
</script>

<svelte:head>
  <title>Kleurplaat — Kibbeling Wereldwijd</title>
</svelte:head>

<main>
  <h1>Kleurplaat</h1>
  <p class="intro">Kies een kleurplaat en ga aan de slag met je kwast!</p>

  <div class="sheet-picker">
    {#each sheets as sheet}
      <button
        class="sheet-btn"
        class:active={activeSheet.id === sheet.id}
        on:click={() => (activeSheet = sheet)}
      >
        {sheet.label}
      </button>
    {/each}
  </div>

  <PaintCanvas coloringSheetSrc={activeSheet.src} roomId={activeSheet.id} />
</main>

<style>
  main {
    max-width: 860px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }

  h1 {
    font-size: 2rem;
    margin-bottom: 0.25rem;
  }

  .intro {
    color: #555;
    margin-bottom: 1.5rem;
  }

  .sheet-picker {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 12px;
  }

  .sheet-btn {
    padding: 6px 14px;
    background: #d4d0c8;
    border: 2px solid transparent;
    border-top-color: #fff;
    border-left-color: #fff;
    border-bottom-color: #808080;
    border-right-color: #808080;
    cursor: pointer;
    font-size: 13px;
  }

  .sheet-btn.active {
    border-top-color: #808080;
    border-left-color: #808080;
    border-bottom-color: #fff;
    border-right-color: #fff;
    background: #c0bdb5;
    font-weight: bold;
  }
</style>
