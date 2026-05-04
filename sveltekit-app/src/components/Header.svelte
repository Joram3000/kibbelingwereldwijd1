<script lang="ts">
</script>

<header class="header">
  <a class="header__title" href="/">Smikkeling wereldwijd</a>
  <nav class="header__nav">
    <a href="/gastenboek">Gastenboek</a>
    <a href="/agenda">Agenda</a>
    <a href="/grabbeltom">Grabbeltom</a>
  </nav>
</header>

<style>
  .header__nav {
    display: flex;
    align-items: center;
  }

  .header__nav a {
    font-size: var(--font-size-2, 0.875rem);
    font-weight: 600;
    text-decoration: none;
    color: var(--black);
  }

  .header__nav a:hover {
    text-decoration: underline;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 0 var(--space-1);
    border-bottom: 1px solid #ced2d9;
    z-index: 10;
    background: var(--white);
    position: fixed;
    left: 0;
    right: 0;
    top: 0;
  }

  .header .header__title {
    font-weight: 800;
    font-size: var(--font-size-5);
    line-height: var(--line-height-1);
    padding-left: var(--space-2);
    margin: var(--space-3) 0;
    text-decoration: none;
    color: var(--black);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  @media (min-width: 575px) {
    .header {
      position: unset;
      border-bottom: none;
      margin: var(--space-3) 0;
      padding: var(--space-2) 0;
      background: unset;
    }

    .header .header__title {
      margin: var(--space-3) 0 var(--space-2);
      font-size: var(--font-size-8);
      text-align: center;
      width: 100%;
    }
  }
</style>
