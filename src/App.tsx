import { Card } from '@/components/ui/card'

function App() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="p-8">
          <h1 className="text-4xl font-bold mb-4">Welcome to Spark</h1>
          <p className="text-muted-foreground">
            Your application is ready. Start building something amazing!
          </p>
        </Card>
      </div>
    </div>
  )
}

export default App
