<script lang="ts">
  const {name, message, date}: {name: string; message: string; date: Date} = $props()
</script>

<article class="entry">
  <header class="entry__header">
    <strong class="entry__name">{name}</strong>
    <time class="entry__date" datetime={date.toISOString()}>
      {date.toLocaleDateString('nl-NL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })}
    </time>
  </header>
  <p class="entry__message">{message}</p>
</article>

<style>
  .entry {
    padding: var(--space-3, 1rem);
    border: 1px solid red;
    border-radius: 8px;
    backdrop-filter: blur(232px);
    background: rgba(255, 255, 255, 0.8);
  }

  .entry__header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: var(--space-2, 0.5rem);
    margin-bottom: var(--space-2, 0.5rem);
    flex-wrap: wrap;
  }

  .entry__name {
    font-size: 1rem;
  }

  .entry__date {
    font-size: 0.8rem;
    color: #6b7280;
  }

  .entry__message {
    margin: 0;
    line-height: 1.6;
    white-space: pre-wrap;
  }
</style>
