<script setup>
import SiteHeader from '../components/SiteHeader.vue'
import HeroCarousel from '../components/HeroCarousel.vue'
import MenuCards from '../components/MenuCards.vue'
import CategoriesSection from '../components/CategoriesSection.vue'
import SiteFooter from '../components/SiteFooter.vue'
</script>

<template>
  <SiteHeader />
  <main>
    <HeroCarousel />
    <MenuCards />
    <CategoriesSection />
  </main>
  <SiteFooter />
</template>
