<script setup>
import { withBase } from 'vitepress'

const files = import.meta.glob('/config/pipeline/functions/*.md', { eager: true });

const links = Object.keys(files).map((path) => {
  return {
    path: withBase(path.replace(/\.md$/, '')),
    title: files[path].__pageData.title || path.split('/').pop().replace(/\.md$/, ''),
  };
});
</script>

<template>
  <ul>
    <li v-for="link in links" :key="link.path">
      <a :href="link.path">{{ link.title }}</a>
    </li>
  </ul>
</template>
