<script lang="ts">
  interface Props {
    name: string
    message: string
    date: Date
  }

  const {name, message, date}: Props = $props()
</script>

<article class="container">
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
  .container {
    padding: var(--space-3, 1rem);
    border: 1px solid #ced2d9;
    border-radius: 8px;
  }

  .entry__header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: var(--space-2, 0.5rem);
    margin-bottom: 8px;
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
