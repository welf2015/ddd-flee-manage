'use client'

import { Smartphone, TrendingUp, MessageSquare } from 'lucide-react'

export default function AppFeedbackTab() {
  return (
    <div className="text-center py-12 space-y-6">
      <div className="flex justify-center">
        <div className="rounded-full bg-muted p-6">
          <Smartphone className="h-12 w-12 text-muted-foreground" />
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-2xl font-bold">Mobile App Coming Soon</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Customer feedback from the mobile app will appear here once integrated.
          This will include app ratings, feature requests, and user experience feedback.
        </p>
      </div>
      
      <div className="grid gap-4 max-w-2xl mx-auto mt-8">
        <div className="border rounded-lg p-4 flex items-center gap-4">
          <div className="rounded-full bg-blue-500/10 p-3">
            <TrendingUp className="h-6 w-6 text-blue-600" />
          </div>
          <div className="text-left">
            <p className="font-medium">App Performance Metrics</p>
            <p className="text-sm text-muted-foreground">
              Track app usage, load times, and user engagement
            </p>
          </div>
        </div>
        
        <div className="border rounded-lg p-4 flex items-center gap-4">
          <div className="rounded-full bg-purple-500/10 p-3">
            <MessageSquare className="h-6 w-6 text-purple-600" />
          </div>
          <div className="text-left">
            <p className="font-medium">User Feedback & Reviews</p>
            <p className="text-sm text-muted-foreground">
              Collect and respond to customer reviews and suggestions
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
