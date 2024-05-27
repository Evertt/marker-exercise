<script lang="ts" setup>
import { z } from 'zod'
import { AutoForm } from '@/components/ui/auto-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

enum FeedbackType {
  bug = 'Bug',
  suggestion = 'Suggestion'
}

const formSchema = z.object({
  name: z.string().min(3).max(32).describe('Name'),
  email: z.string().email().describe('Email'),
  type: z.nativeEnum(FeedbackType).describe('Type'),
  message: z.string().min(8).describe('Message')
})
</script>

<template>
  <Card class="mx-auto min-w-max w-1/2 max-w-3xl">
    <CardHeader>
      <CardTitle class="text-2xl"> Add new feedback </CardTitle>
    </CardHeader>
    <CardContent>
      <AutoForm
        class="space-y-6 [&>:not(:has(textarea))]:max-w-xs"
        :schema="formSchema"
        :field-config="{
          type: {
            inputProps: { placeholder: 'Select type' }
          },
          message: {
            component: 'textarea'
          }
        }"
      >
        <div class="mt-4 flex justify-end gap-2 space-y-2">
          <Button type="reset" variant="secondary"> Discard </Button>
          <Button type="submit" class="w-max"> Send Feedback </Button>
        </div>
      </AutoForm>
    </CardContent>
  </Card>
</template>
