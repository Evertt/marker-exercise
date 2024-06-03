<script lang="ts" setup>
import { AutoForm } from '@/components/ui/auto-form'
import { DependencyType } from '@/components/ui/auto-form/interface'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { feedbackSchema, newFeedbackSchema } from '$shared/zod'
import env from "@/env"

const router = useRouter()

async function onSubmit(data: any) {
  const resp = await fetch(`${env.VITE_API_URL}/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })

  if (!resp.ok) {
    console.error(resp)
    alert('Failed to send feedback')
    return
  }

  const json = await resp.json()
  const newModel = feedbackSchema.parse(json)
  router.push({ name: '//[id]', params: { id: newModel._id }})
}
</script>

<template>
  <div class="flex h-full">
    <Card class="self-center mx-auto min-w-max w-1/2 max-w-3xl">
      <CardHeader>
        <CardTitle class="text-2xl"> Add new feedback </CardTitle>
      </CardHeader>
      <CardContent>
        <AutoForm
          class="space-y-6 [&>:not(:has(textarea))]:max-w-xs"
          @submit="onSubmit"
          :schema="newFeedbackSchema"
          :dependencies="[
            {
              sourceField: '_id',
              targetField: '_id',
              type: DependencyType.HIDES,
              when: () => true
            },
            {
              sourceField: 'createdAt',
              targetField: 'createdAt',
              type: DependencyType.HIDES,
              when: () => true
            },
            {
              sourceField: 'updatedAt',
              targetField: 'updatedAt',
              type: DependencyType.HIDES,
              when: () => true
            }
          ]"
          :field-config="{
            type: {
              inputProps: { placeholder: 'Select type' }
            },
            message: {
              component: 'textarea'
            }
          }"
        >
          <div class="mt-4 flex justify-end gap-2 space-y-2 !max-w-none">
            <Button type="reset" variant="secondary"> Discard </Button>
            <Button type="submit" class="w-max"> Send Feedback </Button>
          </div>
        </AutoForm>
      </CardContent>
    </Card>
  </div>
</template>
