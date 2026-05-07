<script lang="ts">
  import {enhance} from '$app/forms'
  import GuestbookEntry from '../../components/GuestbookEntry.svelte'
  import type {PageProps} from './$types'
  import {visualLength, MESSAGE_MAX} from '$lib/utils/message'

  const {data, form}: PageProps = $props()

  let submitting = $state(false)
  let formEl: HTMLFormElement | null = null
  let textareaEl: HTMLTextAreaElement | null = null
  // svelte-ignore state_referenced_locally
  let message = $state(form?.message ?? '')
  let pickerOpen = $state(false)

  const visLen = $derived(visualLength(message))
  const overLimit = $derived(visLen > MESSAGE_MAX)

  function insertText(text: string) {
    if (!textareaEl) return
    const start = textareaEl.selectionStart ?? message.length
    const end = textareaEl.selectionEnd ?? message.length
    message = message.slice(0, start) + text + message.slice(end)
    setTimeout(() => {
      textareaEl?.focus()
      const pos = start + text.length
      textareaEl?.setSelectionRange(pos, pos)
    })
  }
</script>

<svelte:window
  on:click={(e) => {
    if (pickerOpen && !(e.target as Element).closest('.emoji-area')) {
      pickerOpen = false
    }
  }}
/>

<section class="gastenboek">
  <h1>Gastenboek</h1>

  <p>Schrijf een leuk berichtje en vergeet niet om glipla's toe te voegen anders telt het niet.</p>

  <form
    bind:this={formEl}
    method="POST"
    use:enhance={() => {
      submitting = true
      return async ({update}) => {
        await update()
        submitting = false
        if (!form?.error) {
          formEl?.reset()
          message = ''
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
        type="text"
        name="name"
        value={form?.name ?? ''}
        maxlength="100"
        required
        placeholder="Jouw naam"
      />
    </label>

    <label>
      E-mail
      <input
        type="email"
        name="email"
        value={form?.email ?? ''}
        required
        placeholder="jouw@email.nl"
      />
    </label>

    <label>
      Bericht
      <div class="emoji-area">
        <textarea
          bind:this={textareaEl}
          bind:value={message}
          name="message"
          required
          placeholder="Schrijf hier je bericht..."
          rows="4"
        ></textarea>
        <span class="char-count" class:over={overLimit}>{visLen}/{MESSAGE_MAX}</span>
        <div class="emoji-toolbar">
          <button
            type="button"
            class="emoji-toggle"
            aria-label="Emoji's invoegen"
            onclick={() => (pickerOpen = !pickerOpen)}
          >
            😊
          </button>
          {#if pickerOpen}
            <div class="emoji-picker" role="dialog" aria-label="Kies een emoji">
              {#each data.emojis as { emoji, label, imageUrl }}
                <button
                  type="button"
                  class="emoji-option"
                  title={label}
                  aria-label={label}
                  onclick={() => {
                    insertText(imageUrl ? `〔${label}〕` : (emoji ?? label))
                    pickerOpen = false
                  }}
                >
                  {#if imageUrl}
                    <img src={imageUrl} alt={label} class="emoji-img" />
                  {:else}
                    {emoji}
                  {/if}
                </button>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    </label>

    <button type="submit" disabled={submitting || overLimit}>
      {submitting ? 'Versturen...' : 'Plaatsen'}
    </button>
  </form>

  <div class="entries">
    {#if data.entries.length === 0}
      <p class="empty">Nog geen berichten. Wees de eerste!</p>
    {:else}
      {#each data.entries as entry (entry._id)}
        <GuestbookEntry
          name={entry.name}
          message={entry.message}
          date={new Date(entry._createdAt)}
          emojis={data.emojis}
        />
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

  .char-count {
    align-self: flex-end;
    font-size: 0.75rem;
    color: #9ca3af;
  }

  .char-count.over {
    color: #dc2626;
    font-weight: 600;
  }

  .emoji-area {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .emoji-toolbar {
    position: relative;
    align-self: flex-start;
  }

  .emoji-toggle {
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 4px 8px;
    font-size: 1.1rem;
    cursor: pointer;
    line-height: 1;
  }

  .emoji-toggle:hover {
    background: #e5e7eb;
  }

  .emoji-picker {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    z-index: 10;
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    padding: 8px;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    width: 220px;
  }

  .emoji-option {
    background: none;
    border: none;
    font-size: 1.4rem;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .emoji-option:hover {
    background: #f3f4f6;
  }

  .emoji-img {
    width: 28px;
    height: 28px;
    object-fit: contain;
    display: block;
  }

  button[type='submit'] {
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

  button[type='submit']:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  button[type='submit']:not(:disabled):hover {
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
</style>
