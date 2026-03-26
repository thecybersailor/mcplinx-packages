import { describe, expect, it } from 'vitest'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  Textarea,
} from '../index'

describe('ui-vue exports', () => {
  it('exports shared shadcn-vue primitives', () => {
    expect(Button).toBeTruthy()
    expect(Card).toBeTruthy()
    expect(CardContent).toBeTruthy()
    expect(CardHeader).toBeTruthy()
    expect(CardTitle).toBeTruthy()
    expect(Input).toBeTruthy()
    expect(Label).toBeTruthy()
    expect(Select).toBeTruthy()
    expect(SelectContent).toBeTruthy()
    expect(SelectItem).toBeTruthy()
    expect(SelectTrigger).toBeTruthy()
    expect(SelectValue).toBeTruthy()
    expect(Sheet).toBeTruthy()
    expect(SheetContent).toBeTruthy()
    expect(Textarea).toBeTruthy()
  })
})
