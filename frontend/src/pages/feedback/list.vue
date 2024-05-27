<script lang="ts" setup></script>

<template>
  <div class="grid grid-cols-[400px_1fr] grid-rows-1">
    <div>Sidebar</div>
    <div>
      <RouterView v-slot="{ Component }">
        <template v-if="Component">
          <Transition mode="out-in">
            <KeepAlive>
              <Suspense>
                <!-- main content -->
                <component :is="Component"></component>

                <!-- loading state -->
                <template #fallback> Loading... </template>
              </Suspense>
            </KeepAlive>
          </Transition>
        </template>
      </RouterView>
    </div>
  </div>
</template>
