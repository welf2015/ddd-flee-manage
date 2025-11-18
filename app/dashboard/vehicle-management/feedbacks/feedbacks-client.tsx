'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Truck, Smartphone } from 'lucide-react'
import TruckFeedbackTab from '@/components/feedbacks/truck-feedback-tab'
import AppFeedbackTab from '@/components/feedbacks/app-feedback-tab'
import FeedbackStats from '@/components/feedbacks/feedback-stats'

export default function FeedbacksClient({ initialRatings }: any) {
  const [activeTab, setActiveTab] = useState('trucks')
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Feedback & Ratings</h1>
        <p className="text-muted-foreground mt-1">
          Monitor customer feedback from truck deliveries and mobile app
        </p>
      </div>

      <FeedbackStats ratings={initialRatings} />

      <Card className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="trucks" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Truck Deliveries
            </TabsTrigger>
            <TabsTrigger value="app" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Mobile App
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="trucks" className="mt-6">
            <TruckFeedbackTab initialRatings={initialRatings} />
          </TabsContent>
          
          <TabsContent value="app" className="mt-6">
            <AppFeedbackTab />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}
