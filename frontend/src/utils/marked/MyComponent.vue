<template>
  <div class="my-component">
    <h1>{{ title }}</h1>
    <p>{{ subtitle }}</p>

    <div class="btns">
      <t-button theme="default" v-for="button in buttons" :key="button?.label">
        {{ button?.label }}
      </t-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button as TButton } from 'tdesign-vue-next'

interface Props {
  title?: string
  subtitle?: string
  buttons?: Array<{ label: string }>
}

const { title, subtitle, buttons } = defineProps<Props>()
</script>

<style lang="css">
.my-component {
  padding: 10px;
  border: 2px solid #f90;

  .btns {
    display: flex;
    gap: 10px;
  }
}
</style>
