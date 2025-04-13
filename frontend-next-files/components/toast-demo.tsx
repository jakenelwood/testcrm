"use client"

import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export function ToastDemo() {
  const { toast } = useToast()

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold">Toast Examples</h2>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => {
            toast({
              title: "Default Toast",
              description: "This is a default toast notification",
            })
          }}
        >
          Show Toast
        </Button>
        
        <Button
          variant="default"
          onClick={() => {
            toast({
              variant: "default",
              title: "Success Toast",
              description: "Your data has been saved successfully!",
            })
          }}
        >
          Success
        </Button>
        
        <Button
          variant="destructive"
          onClick={() => {
            toast({
              variant: "destructive",
              title: "Error Toast",
              description: "There was an error performing this action.",
            })
          }}
        >
          Error
        </Button>
        
        <Button
          variant="outline"
          onClick={() => {
            toast({
              title: "Toast with Action",
              description: "This toast has an action button",
              action: (
                <Button variant="outline" size="sm">
                  Undo
                </Button>
              ),
            })
          }}
        >
          With Action
        </Button>
      </div>
    </div>
  )
} 