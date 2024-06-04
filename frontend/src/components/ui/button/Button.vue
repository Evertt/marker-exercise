<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { Primitive, type PrimitiveProps } from 'radix-vue'
import { type ButtonVariants, buttonVariants } from '.'
import { cn } from '@/lib/utils'
import type { JsonObject } from 'type-fest'
import { computed } from 'vue'

type Props = PrimitiveProps & {
  variant?: ButtonVariants['variant']
  size?: ButtonVariants['size']
  class?: HTMLAttributes['class']
  action?: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: JsonObject
}

const props = withDefaults(defineProps<Props>(), {
  as: 'button',
  method: 'GET'
})

const formMethod = computed(() => (['GET', 'POST'].includes(props.method) ? props.method : 'POST'))
const hasCustomMethod = computed(() => props.method !== formMethod.value)
const action = computed(() =>
  hasCustomMethod.value ? props.action?.replace(/$/, `?_method=${props.method}`) : props.action
)
</script>

<template>
  <form v-if="props.action" :method="formMethod" :action="action" class="contents">
    <Primitive
      :as="as"
      :as-child="asChild"
      :class="cn(buttonVariants({ variant, size }), props.class)"
    >
      <template v-if="props.data">
        <input
          v-for="key in Object.keys(props.data)"
          :key="key"
          :name="key"
          :value="`${props.data[key] ?? ''}`"
          type="hidden"
        />
      </template>
      <input type="hidden" name="_method" :value="props.method" />
      <slot />
    </Primitive>
  </form>

  <Primitive
    v-else
    :as="as"
    :as-child="asChild"
    :class="cn(buttonVariants({ variant, size }), props.class)"
  >
    <slot />
  </Primitive>
</template>
