<script lang="ts">
  import type {PageProps} from './$types'
  import type {AgendaItem} from '$lib/sanity/queries'
  import {urlFor} from '$lib/sanity/image'

  const {data}: PageProps = $props()

  function formatTime(dateStr: string) {
    const d = new Date(dateStr)
    const h = d.getHours()
    const m = d.getMinutes()
    if (h === 0 && m === 0) return null
    return d.toLocaleTimeString('nl-NL', {hour: '2-digit', minute: '2-digit'})
  }

  function groupByMonth(events: AgendaItem[]) {
    const groups: {label: string; items: AgendaItem[]}[] = []
    for (const event of events) {
      const label = new Date(event.date).toLocaleDateString('nl-NL', {month: 'long', year: 'numeric'})
      const last = groups[groups.length - 1]
      if (last && last.label === label) {
        last.items.push(event)
      } else {
        groups.push({label, items: [event]})
      }
    }
    return groups
  }

  const grouped = $derived(groupByMonth(data.events))
</script>

<section class="agenda">
  <h1>Agenda</h1>

  {#if data.events.length === 0}
    <p class="empty">Er staan momenteel geen evenementen gepland.</p>
  {:else}
    {#each grouped as group}
      <div class="month-group">
        <h2 class="month-label">{group.label}</h2>
        <ul class="event-list">
          {#each group.items as event (event._id)}
            <li class="event-card">
              {#if event.image}
                <img
                  class="event-image"
                  src={urlFor(event.image).width(600).format('webp').url()}
                  alt={event.title}
                />
              {/if}
              <div class="event-body">
              <div class="event-date-block">
                <span class="event-day">{new Date(event.date).getDate()}</span>
                <span class="event-weekday">{new Date(event.date).toLocaleDateString('nl-NL', {weekday: 'short'})}</span>
              </div>
              <div class="event-content">
                <h3 class="event-title">{event.title}</h3>
                <div class="event-meta">
                  {#if formatTime(event.date)}
                    <span class="meta-item">
                      <span class="meta-icon" aria-hidden="true">🕐</span>
                      {formatTime(event.date)}{event.endDate && formatTime(event.endDate) ? ` – ${formatTime(event.endDate)}` : ''}
                    </span>
                  {/if}
                  {#if event.location}
                    <span class="meta-item">
                      <span class="meta-icon" aria-hidden="true">📍</span>
                      {event.location}
                    </span>
                  {/if}
                </div>
                {#if event.description}
                  <p class="event-description">{event.description}</p>
                {/if}
                {#if event.link}
                  <a class="event-link" href={event.link} target="_blank" rel="noopener noreferrer">
                    {event.linkLabel || 'Meer info'}
                  </a>
                {/if}
              </div>
              </div>
            </li>
          {/each}
        </ul>
      </div>
    {/each}
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

  .month-group {
    margin-bottom: var(--space-5, 2.5rem);
  }

  .month-label {
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #6b7280;
    margin-bottom: var(--space-3, 1rem);
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .event-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
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

  .event-image {
    width: 100%;
    height: 200px;
    object-fit: cover;
    display: block;
  }

  .event-body {
    display: flex;
    gap: 1rem;
    padding: 1rem;
  }

  .event-date-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    min-width: 2.5rem;
    padding-top: 2px;
  }

  .event-day {
    font-size: 1.5rem;
    font-weight: 800;
    line-height: 1;
  }

  .event-weekday {
    font-size: 0.7rem;
    text-transform: uppercase;
    color: #6b7280;
    letter-spacing: 0.04em;
  }

  .event-content {
    flex: 1;
    min-width: 0;
  }

  .event-title {
    font-size: 1rem;
    font-weight: 700;
    margin: 0 0 0.4rem;
  }

  .event-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.85rem;
    color: #4b5563;
  }

  .meta-icon {
    font-size: 0.8rem;
  }

  .event-description {
    font-size: 0.875rem;
    color: #374151;
    margin: 0 0 0.5rem;
    line-height: 1.5;
  }

  .event-link {
    display: inline-block;
    font-size: 0.85rem;
    font-weight: 600;
    color: #000;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .event-link:hover {
    color: #374151;
  }

  .empty {
    color: #6b7280;
    font-style: italic;
  }
</style>
