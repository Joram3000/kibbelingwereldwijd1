<script lang="ts">
  import type {PageProps} from './$types'
  import type {AgendaItem} from '$lib/sanity/queries'
  import {urlFor} from '$lib/sanity/image'

  const {data}: PageProps = $props()
</script>

<section class="agenda">
  <h1>Agenda</h1>

  {#if data.events.length === 0}
    <p class="empty">Er zijn momenteel geen vacatures beschikbaar.</p>
  {:else}
    <ul>
      <li class="event-card">
        <h3>Vacature 1</h3>
        <p>HinkelCoach</p>
        <p>Eentje die echt de benen uit de mouwen wil steken</p>
        <p>marktconform salaris</p>
      </li>
      <li class="event-card">
        <h3>Kantoortijger</h3>
        <p>Grom jij ook van excelsheets</p>
        <p>Laptop en hoodie van de zaak</p>
      </li>
    </ul>
  {/if}
</section>

<style>
  .agenda {
    max-width: 680px;
    margin: 0 auto;
    padding: 0 var(--space-2);
  }

  h1 {
    font-size: var(--font-size-6, 2rem);
    font-weight: 800;
    margin-bottom: var(--space-5, 2.5rem);
  }

  .event-card {
    display: flex;
    flex-direction: column;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #fff;
    overflow: hidden;
    transition: border-color 0.15s;
  }

  .event-card:hover {
    border-color: #9ca3af;
  }

  .empty {
    color: #6b7280;
    font-style: italic;
  }
</style>
