<script lang="ts">
  import {enhance} from '$app/forms'
  import type {PageProps} from './$types'

  const {data, form}: PageProps = $props()

  let submitting = $state(false)
  let nameEl = $state<HTMLInputElement | null>(null)
</script>

<section class="gastenboek">
  <h1>Gastenboek</h1>

  <form
    method="POST"
    use:enhance={() => {
      submitting = true
      return async ({update}) => {
        await update()
        submitting = false
        if (!form?.error) {
          nameEl?.form?.reset()
        }
      }
    }}
    class="form"
  >
    {#if form?.error}
      <p class="error">{form.error}</p>
    {/if}
    {#if form?.success}
      <p class="success">Je bericht is geplaatst!</p>
    {/if}

    <label>
      Naam
      <input
        bind:this={nameEl}
        type="text"
        name="name"
        value={form?.name ?? ''}
        maxlength="100"
        required
        placeholder="Jouw naam"
      />
    </label>

    <label>
      Bericht
      <textarea
        name="message"
        maxlength="1000"
        required
        placeholder="Schrijf hier je bericht..."
        rows="4"
      >{form?.message ?? ''}</textarea>
    </label>

    <button type="submit" disabled={submitting}>
      {submitting ? 'Versturen...' : 'Plaatsen'}
    </button>
  </form>

  <div class="entries">
    {#if data.entries.length === 0}
      <p class="empty">Nog geen berichten. Wees de eerste!</p>
    {:else}
      {#each data.entries as entry (entry._id)}
        <article class="entry">
          <header class="entry__header">
            <strong class="entry__name">{entry.name}</strong>
            <time class="entry__date" datetime={entry._createdAt}>
              {new Date(entry._createdAt).toLocaleDateString('nl-NL', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </time>
          </header>
          <p class="entry__message">{entry.message}</p>
        </article>
      {/each}
    {/if}
  </div>
</section>

<style>
  .gastenboek {
    max-width: 600px;
    margin: 0 auto;
    padding: 0 var(--space-2);
  }

  h1 {
    font-size: var(--font-size-6, 2rem);
    font-weight: 800;
    margin-bottom: var(--space-4, 2rem);
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: var(--space-3, 1rem);
    margin-bottom: var(--space-5, 2.5rem);
    padding: var(--space-4, 1.5rem);
    border: 1px solid #ced2d9;
    border-radius: 8px;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-weight: 600;
    font-size: 0.9rem;
  }

  input,
  textarea {
    font-family: inherit;
    font-size: 1rem;
    padding: 8px 12px;
    border: 1px solid #ced2d9;
    border-radius: 4px;
    width: 100%;
    box-sizing: border-box;
  }

  input:focus,
  textarea:focus {
    outline: 2px solid #0070f3;
    outline-offset: 0;
    border-color: transparent;
  }

  textarea {
    resize: vertical;
  }

  button {
    align-self: flex-start;
    padding: 10px 24px;
    background: #000;
    color: #fff;
    font-weight: 700;
    font-size: 0.9rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  button:not(:disabled):hover {
    background: #333;
  }

  .error {
    color: #dc2626;
    font-size: 0.875rem;
    margin: 0;
  }

  .success {
    color: #16a34a;
    font-size: 0.875rem;
    margin: 0;
  }

  .entries {
    display: flex;
    flex-direction: column;
    gap: var(--space-3, 1rem);
  }

  .empty {
    color: #6b7280;
    font-style: italic;
  }

  .entry {
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
