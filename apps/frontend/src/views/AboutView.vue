<template>
  <section class="about-view">
    <h2>About This Demo</h2>
    <p>
      This monorepo showcases a modern Vue 3 frontend powered by Vite and Pinia, alongside an Express backend API with
      modular routing. It is intended to serve as a quickstart template for full-stack applications.
    </p>

    <ul>
      <li><strong>Frontend:</strong> Vue 3, Vue Router, Pinia, Axios</li>
      <li><strong>Backend:</strong> Express, Helmet, CORS, Morgan</li>
      <li><strong>Tooling:</strong> TypeScript, npm workspaces</li>
    </ul>
  </section>
</template>

<style scoped>
.about-view {
  max-width: 640px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: #fff;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
}

ul {
  margin: 0;
  padding-left: 1.25rem;
}

li + li {
  margin-top: 0.5rem;
}
</style>
