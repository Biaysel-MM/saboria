<script setup>
import SiteHeader from '../components/SiteHeader.vue'
import HeroCarousel from '../components/HeroCarousel.vue'
import MenuCards from '../components/MenuCards.vue'
import CategoriesSection from '../components/CategoriesSection.vue'
import SiteFooter from '../components/SiteFooter.vue'
import ReviewsModal from '../components/ReviewsModal.vue'
import ToastHost from '../components/admin/ToastHost.vue'
import ConfirmModal from '../components/admin/ConfirmModal.vue'
</script>

<template>
  <SiteHeader />
  <main>
    <HeroCarousel />
    <MenuCards />
    <CategoriesSection />
  </main>
  <SiteFooter />

  <!-- reseñas + avisos del sitio público -->
  <ReviewsModal />
  <ConfirmModal />
  <ToastHost />
</template>
