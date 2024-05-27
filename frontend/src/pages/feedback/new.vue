<script lang="ts" setup>
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
</script>

<template>
  <Card class="mx-auto max-w-sm">
    <CardHeader>
      <CardTitle class="text-2xl"> Add new feedback </CardTitle>
      <!-- <CardDescription> Enter your email below to reset your password </CardDescription> -->
    </CardHeader>
    <CardContent>
      <div class="grid gap-4">
        <div class="grid gap-2">
          <Label for="name">Name</Label>
          <Input id="name" type="text" placeholder="John Doe" required />
        </div>
        <div class="grid gap-2">
          <Label for="email">Email</Label>
          <Input id="email" type="email" placeholder="john.doe@example.com" required />
        </div>
        <div class="grid gap-2">
          <Label for="type">Type</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select a fruit" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Fruits</SelectLabel>
                <SelectItem value="apple"> Apple </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div class="grid gap-2">
          <Label for="message">Message</Label>
          <Textarea id="message" placeholder="" required />
        </div>
        <Button type="submit" class="w-full"> Reset Password </Button>
      </div>
    </CardContent>
  </Card>
</template>
