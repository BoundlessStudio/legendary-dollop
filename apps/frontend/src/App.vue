<template>
  <div class="app-shell">
    <header class="app-header">
      <h1>Legendary Dollop</h1>
      <nav>
        <RouterLink to="/">Dashboard</RouterLink>
        <RouterLink to="/websocket-test">WebSocket Test</RouterLink>
        <RouterLink to="/about">About</RouterLink>
      </nav>
    </header>

    <main class="app-main">
      <RouterView />
    </main>

    <footer class="app-footer">
      <p>Demo monorepo showcasing Vue + Express integration.</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: linear-gradient(120deg, #42b883, #35495e);
  color: #fff;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
}

.app-header nav {
  display: flex;
  gap: 1rem;
}

.app-header a {
  color: inherit;
  text-decoration: none;
  font-weight: 600;
}

.app-header a.router-link-active {
  border-bottom: 2px solid rgba(255, 255, 255, 0.8);
}

.app-main {
  flex: 1;
  padding: 2rem;
  background-color: #f7f9fb;
}

.app-footer {
  background-color: #f0f3f7;
  color: #555;
  text-align: center;
  padding: 1rem;
  font-size: 0.875rem;
}
</style>
